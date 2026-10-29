"use client";

import React, { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Message {
  id: string;
  senderName: string;
  senderRole: string;
  content: string;
  createdAt: string | Date;
}

interface ApplicantChatThreadProps {
  applicationId: string;
  initialMessages?: Message[];
}

export function ApplicantChatThread({
  applicationId,
  initialMessages = [],
}: ApplicantChatThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [isOpen, setIsOpen] = useState(initialMessages.length > 0);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setReplyText("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-line space-y-3">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-xs font-semibold text-accent hover:text-purple-200 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" />
          Staff Clarification Messages ({messages.length})
        </span>
        <span className="text-[11px] text-muted">{isOpen ? "Hide" : "View & Reply"}</span>
      </button>

      {isOpen && (
        <div className="p-3.5 rounded-xl bg-accent-soft border border-purple-500/20 space-y-3">
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <p className="text-xs text-muted italic">No messages from the reviewers yet.</p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-2.5 rounded-xl text-xs space-y-1 ${
                    m.senderRole === "STAFF"
                      ? "bg-purple-900/30 border border-purple-500/20 text-purple-700 dark:text-purple-200 mr-3"
                      : "bg-sunk border border-line text-ink-2 ml-3"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] text-ink">
                      {m.senderName} ({m.senderRole === "STAFF" ? "Reviewer" : "You"})
                    </span>
                    <span className="text-[10px] text-faint">{formatDate(m.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              placeholder="Reply to the staff team..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendReply();
                }
              }}
              className="flex-1 px-3 py-1.5 rounded-lg bg-background border border-line text-xs text-ink placeholder-faint focus:outline-none focus:border-accent"
            />
            <button
              type="button"
              disabled={sending || !replyText.trim()}
              onClick={handleSendReply}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Send className="w-3 h-3" />
              <span>{sending ? "..." : "Reply"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
