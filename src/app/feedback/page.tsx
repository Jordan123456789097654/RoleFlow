"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bug,
  Lightbulb,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Clock,
  Filter,
  MessageSquare,
  Sparkles,
  Shield,
  Layers,
} from "lucide-react";

interface FeedbackItem {
  id: string;
  type: string;
  title: string;
  description: string;
  severity?: string | null;
  category?: string | null;
  status: string;
  authorName?: string | null;
  adminNotes?: string | null;
  createdAt: string;
}

export default function FeedbackPage() {
  const [activeTab, setActiveTab] = useState<"bugs" | "suggestions" | "submit">("bugs");
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Form State
  const [formType, setFormType] = useState<"BUG_REPORT" | "FEATURE_SUGGESTION">("BUG_REPORT");
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("UI");
  const [formSeverity, setFormSeverity] = useState("NORMAL");
  const [guestName, setGuestName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedback();
  }, []);

  async function fetchFeedback() {
    try {
      const res = await fetch("/api/feedback");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDesc.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formType,
          title: formTitle.trim(),
          description: formDesc.trim(),
          category: formCategory,
          severity: formSeverity,
          guestName: guestName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(
          formType === "BUG_REPORT"
            ? "Bug report submitted! Our support team has logged this issue."
            : "Feature suggestion submitted! Thank you for helping build RoleFlow."
        );
        setTimeout(() => setSuccessMsg(null), 5000);
        setFormTitle("");
        setFormDesc("");
        setActiveTab(formType === "BUG_REPORT" ? "bugs" : "suggestions");
        fetchFeedback();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const bugs = items.filter((i) => i.type === "BUG_REPORT");
  const suggestions = items.filter((i) => i.type === "FEATURE_SUGGESTION");
  const currentList = activeTab === "bugs" ? bugs : suggestions;
  const filteredList =
    statusFilter === "ALL"
      ? currentList
      : currentList.filter((i) => i.status === statusFilter);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to RoleFlow Home</span>
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Community Feedback & Bug Forum</h1>
          </div>
          <p className="text-xs text-slate-400">
            Report technical bugs, track platform resolution progress, or request new community features.
          </p>
        </div>

        <button
          onClick={() => setActiveTab("submit")}
          className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-600/30 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Feedback</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("bugs")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "bugs"
                ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Bug className="w-3.5 h-3.5" />
            <span>Bug Reports ({bugs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("suggestions")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "suggestions"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Feature Suggestions ({suggestions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("submit")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "submit"
                ? "bg-white/10 text-white border border-white/20"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Report / Proposal</span>
          </button>
        </div>

        {activeTab !== "submit" && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open (Awaiting Review)</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="DISMISSED">Dismissed</option>
            </select>
          </div>
        )}
      </div>

      {/* SUBMISSION FORM */}
      {activeTab === "submit" && (
        <form
          onSubmit={handleSubmit}
          className="glass-panel p-6 sm:p-8 rounded-2xl border border-purple-500/30 bg-purple-950/10 space-y-5 shadow-2xl max-w-3xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              {formType === "BUG_REPORT" ? <Bug className="w-5 h-5 text-rose-400" /> : <Lightbulb className="w-5 h-5 text-amber-400" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {formType === "BUG_REPORT" ? "File a Platform Bug Report" : "Submit a Feature Suggestion"}
              </h3>
              <p className="text-xs text-slate-400">
                Detailed submissions help our engineering team diagnose and ship fixes swiftly.
              </p>
            </div>
          </div>

          {/* Toggle Type */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setFormType("BUG_REPORT")}
              className={`p-3 rounded-xl border text-left transition-all ${
                formType === "BUG_REPORT"
                  ? "bg-rose-500/20 border-rose-500/40 text-white"
                  : "bg-black/30 border-white/5 text-slate-400 hover:border-white/10"
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs text-rose-300">
                <Bug className="w-4 h-4" />
                <span>Bug Report</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Something is broken, glitchy, or not working as expected.</p>
            </button>

            <button
              type="button"
              onClick={() => setFormType("FEATURE_SUGGESTION")}
              className={`p-3 rounded-xl border text-left transition-all ${
                formType === "FEATURE_SUGGESTION"
                  ? "bg-purple-500/20 border-purple-500/40 text-white"
                  : "bg-black/30 border-white/5 text-slate-400 hover:border-white/10"
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs text-purple-300">
                <Lightbulb className="w-4 h-4" />
                <span>Feature Suggestion</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Idea for a new capability, workflow, or integration.</p>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Headline Summary</label>
              <input
                type="text"
                required
                placeholder={formType === "BUG_REPORT" ? "e.g. Discord role not granted upon acceptance" : "e.g. Dark mode theme selector for forms"}
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="UI">UI / Interface & Layout</option>
                <option value="DISCORD_BOT">Discord Bot Automation</option>
                <option value="FORM_BUILDER">Form Builder & Logic</option>
                <option value="ROBLOX">Roblox Verification</option>
                <option value="PERMISSIONS">Staff Permissions</option>
                <option value="PERFORMANCE">Performance & Speed</option>
                <option value="OTHER">Other Platform Function</option>
              </select>
            </div>
          </div>

          {formType === "BUG_REPORT" && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Severity Level</label>
              <div className="grid grid-cols-4 gap-2">
                {["LOW", "NORMAL", "HIGH", "CRITICAL"].map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setFormSeverity(sev)}
                    className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                      formSeverity === sev
                        ? sev === "CRITICAL"
                          ? "bg-rose-600 text-white border-rose-500"
                          : sev === "HIGH"
                          ? "bg-amber-600 text-white border-amber-500"
                          : "bg-purple-600 text-white border-purple-500"
                        : "bg-black/30 border-white/5 text-slate-400 hover:border-white/10"
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Detailed Description {formType === "BUG_REPORT" && "& Steps to Reproduce"}
            </label>
            <textarea
              rows={4}
              required
              placeholder={
                formType === "BUG_REPORT"
                  ? "1. Navigate to Community Dashboard\n2. Clicked Approve on applicant #12\n3. Discord bot logged an error with code 50001"
                  : "Describe the use-case and how this feature would improve community management..."
              }
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500 resize-y"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Your Name / Discord Tag <span className="text-slate-500 font-normal">(Optional for follow-ups)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. jordan#0001"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-violet-600/30 flex items-center gap-2"
          >
            <span>{submitting ? "Submitting..." : `Submit ${formType === "BUG_REPORT" ? "Bug Report" : "Feature Suggestion"}`}</span>
          </button>
        </form>
      )}

      {/* LIST OF REPORTS */}
      {activeTab !== "submit" && (
        <div className="space-y-3">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-400">Loading feedback list...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="glass-panel p-12 rounded-2xl border border-white/10 text-center text-slate-400 text-xs space-y-2">
              <p>No {activeTab === "bugs" ? "bug reports" : "feature suggestions"} found in this view.</p>
              <button
                onClick={() => setActiveTab("submit")}
                className="text-purple-400 hover:underline font-bold"
              >
                Be the first to submit feedback →
              </button>
            </div>
          ) : (
            filteredList.map((item) => (
              <div
                key={item.id}
                className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-white/20 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        item.status === "RESOLVED"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : item.status === "UNDER_REVIEW"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : item.status === "DISMISSED"
                          ? "bg-slate-500/20 text-slate-300 border border-slate-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {item.status}
                    </span>

                    {item.severity && item.type === "BUG_REPORT" && (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          item.severity === "CRITICAL"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : item.severity === "HIGH"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-white/5 text-slate-400 border border-white/10"
                        }`}
                      >
                        {item.severity}
                      </span>
                    )}

                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-slate-400 border border-white/10">
                      {item.category || "GENERAL"}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono">
                    Reported by {item.authorName || "Member"} • {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {item.adminNotes && (
                  <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-purple-300 flex items-start gap-2">
                    <Shield className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block text-[11px]">Staff Developer Update:</span>
                      <p className="text-slate-300 text-xs">{item.adminNotes}</p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
