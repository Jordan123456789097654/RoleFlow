"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  X,
  Plus,
  Send,
  Users,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

type Notice = {
  id: string;
  title: string;
  content: string;
  targetTeamId: string | null;
  createdAt: string;
};

type Props = {
  groupId: string;
  teams: Array<{ id: string; name: string }>;
  currentUserRole: string | null;
  onClose: () => void;
};

export function GroupNoticesModal({
  groupId,
  teams,
  currentUserRole,
  onClose,
}: Props) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showBroadcastForm, setShowBroadcastForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetTeamId, setTargetTeamId] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);

  const canBroadcast = currentUserRole === "OWNER" || currentUserRole === "MANAGER";

  const fetchNotices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/roster/notices?groupId=${groupId}`);
      if (!res.ok) throw new Error("Failed to load group notices");
      const data = await res.json();
      setNotices(data.notices || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [groupId]);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setBroadcasting(true);
    setError(null);
    try {
      const res = await fetch("/api/roster/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          title,
          content,
          targetTeamId: targetTeamId || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to broadcast notice");
      }

      setShowBroadcastForm(false);
      setTitle("");
      setContent("");
      setTargetTeamId("");
      fetchNotices();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBroadcasting(false);
    }
  };

  const getTeamName = (teamId: string | null) => {
    if (!teamId) return "Entire Staff Team";
    const t = teams.find((item) => item.id === teamId);
    return t ? `${t.name} Team` : "Specific Team";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0d0e15] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Staff Notices &amp; Bulletins
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Workflow 4.8 &bull; Targeted Team &amp; Group In-App Notices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-950/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Recent Group Announcements</span>
          {canBroadcast && !showBroadcastForm && (
            <button
              type="button"
              onClick={() => setShowBroadcastForm(true)}
              className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors shadow-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Broadcast Notice</span>
            </button>
          )}
        </div>

        {/* Broadcast Form */}
        {showBroadcastForm && (
          <form
            onSubmit={handleBroadcast}
            className="p-4 rounded-xl border border-violet-500/30 bg-violet-950/20 space-y-3 text-xs"
          >
            <div className="font-bold text-sm text-white">Broadcast New Notice</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notice Subject (e.g. Schedule Update)"
                required
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#151722] text-white"
              />

              <select
                value={targetTeamId}
                onChange={(e) => setTargetTeamId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#151722] text-white"
              >
                <option value="">Entire Staff Team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} Team Only
                  </option>
                ))}
              </select>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Notice message, instructions, or policy reminders..."
              rows={3}
              required
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#151722] text-white"
            />

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowBroadcastForm(false)}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={broadcasting}
                className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold inline-flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{broadcasting ? "Broadcasting..." : "Send Notice"}</span>
              </button>
            </div>
          </form>
        )}

        {/* Notices list */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading notices...</div>
        ) : notices.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs italic">
            No notices posted yet for this group.
          </div>
        ) : (
          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {notices.map((n) => (
              <div
                key={n.id}
                className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{n.title}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-violet-500/10 text-violet-300 border border-violet-500/20">
                    {getTeamName(n.targetTeamId)}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{n.content}</p>
                <div className="text-[10px] font-mono text-slate-500 pt-1">
                  Posted: {new Date(n.createdAt).toLocaleDateString()} at{" "}
                  {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
