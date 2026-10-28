"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Briefcase,
  Bot,
  Shield,
  FileText,
  Sliders,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  MessageSquare,
  Sparkles,
  Star,
  Save,
  Plus,
  Trash2,
  ExternalLink,
  ChevronRight,
  UserX,
  Key,
  Download,
  Palette,
  Bell,
  HelpCircle,
  ListPlus,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import { FORM_TEMPLATES } from "@/lib/templates";

interface GuildData {
  id: string;
  name: string;
  icon?: string | null;
  banner?: string | null;
  useCustomBot: boolean;
  customBotToken?: string | null;
  logChannelId?: string | null;
  staffPingRoleId?: string | null;
  embedColor?: string | null;
  cooldownDays: number;
  enableRobloxAuth: boolean;
  enableBlindVoting: boolean;
  positions: Array<{
    id: string;
    title: string;
    department?: string | null;
    description: string;
    isOpen: boolean;
    acceptRoleId?: string | null;
    questions: Array<{
      id: string;
      label: string;
      description?: string | null;
      type: string;
      options?: string | null;
      required: boolean;
      order: number;
    }>;
    _count: { applications: true };
  }>;
  applications: Array<{
    id: string;
    status: string;
    decisionNote?: string | null;
    createdAt: string;
    user: {
      id: string;
      username: string;
      avatar?: string | null;
      robloxUsername?: string | null;
    };
    position: {
      id: string;
      title: string;
    };
    answers: Array<{
      question: { label: string };
      value: string;
    }>;
    reviews: Array<{
      id: string;
      reviewer: { username: string };
      comment: string;
      score?: number | null;
    }>;
  }>;
  blacklists: Array<{
    id: string;
    targetType: string;
    targetValue: string;
    reason?: string | null;
  }>;
}

export default function DashboardPage({ params }: { params: { guildId: string } }) {
  const [guild, setGuild] = useState<GuildData | null>(null);
  const [activeTab, setActiveTab] = useState<"applications" | "builder" | "bot" | "gating" | "templates">("applications");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewScore, setReviewScore] = useState<number>(5);

  // Bot Settings state
  const [botTokenInput, setBotTokenInput] = useState("");
  const [useCustomBotState, setUseCustomBotState] = useState(false);
  const [logChannelInput, setLogChannelInput] = useState("");
  const [staffPingRoleInput, setStaffPingRoleInput] = useState("");
  const [embedColorInput, setEmbedColorInput] = useState("#8B5CF6");

  // Gating & Policy state
  const [cooldownInput, setCooldownInput] = useState(7);
  const [robloxAuthToggle, setRobloxAuthToggle] = useState(false);
  const [blindVotingToggle, setBlindVotingToggle] = useState(false);
  const [newBlacklistVal, setNewBlacklistVal] = useState("");
  const [newBlacklistReason, setNewBlacklistReason] = useState("");

  // Visual Form Builder state
  const [selectedPosId, setSelectedPosId] = useState<string | null>(null);
  const [newPosModal, setNewPosModal] = useState(false);
  const [newPosTitle, setNewPosTitle] = useState("");
  const [newPosDept, setNewPosDept] = useState("Development");
  const [newPosDesc, setNewPosDesc] = useState("");
  const [newPosRole, setNewPosRole] = useState("");
  const [newQModal, setNewQModal] = useState(false);
  const [newQLabel, setNewQLabel] = useState("");
  const [newQType, setNewQType] = useState("TEXT");
  const [newQDesc, setNewQDesc] = useState("");
  const [newQOptions, setNewQOptions] = useState("");
  const [newQRequired, setNewQRequired] = useState(true);

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchGuildData();
  }, [params.guildId]);

  async function fetchGuildData() {
    try {
      const res = await fetch(`/api/guilds/${params.guildId}/dashboard`);
      if (res.ok) {
        const data = await res.json();
        setGuild(data);
        setUseCustomBotState(data.useCustomBot || false);
        setBotTokenInput(data.customBotToken || "");
        setLogChannelInput(data.logChannelId || "");
        setStaffPingRoleInput(data.staffPingRoleId || "");
        setEmbedColorInput(data.embedColor || "#8B5CF6");
        setCooldownInput(data.cooldownDays ?? 7);
        setRobloxAuthToggle(data.enableRobloxAuth || false);
        setBlindVotingToggle(data.enableBlindVoting || false);

        if (data.positions?.length > 0 && !selectedPosId) {
          setSelectedPosId(data.positions[0].id);
        }
        if (data.applications?.length > 0 && !selectedApp) {
          setSelectedApp(data.applications[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = async (appId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/applications/${appId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          decisionNote: decisionNote || undefined,
        }),
      });

      if (res.ok) {
        setActionSuccess(`Application updated to ${newStatus}`);
        setTimeout(() => setActionSuccess(null), 3000);
        fetchGuildData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddReview = async (appId: string) => {
    if (!reviewComment.trim()) return;
    try {
      const res = await fetch(`/api/applications/${appId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: reviewComment,
          score: reviewScore,
        }),
      });

      if (res.ok) {
        setReviewComment("");
        fetchGuildData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch(`/api/guilds/${params.guildId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          useCustomBot: useCustomBotState,
          customBotToken: botTokenInput,
          logChannelId: logChannelInput,
          staffPingRoleId: staffPingRoleInput,
          embedColor: embedColorInput,
          cooldownDays: Number(cooldownInput),
          enableRobloxAuth: robloxAuthToggle,
          enableBlindVoting: blindVotingToggle,
        }),
      });

      if (res.ok) {
        setActionSuccess("Settings saved successfully!");
        setTimeout(() => setActionSuccess(null), 3000);
        fetchGuildData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreatePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/positions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId: params.guildId,
          title: newPosTitle,
          department: newPosDept,
          description: newPosDesc,
          acceptRoleId: newPosRole || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewPosModal(false);
        setNewPosTitle("");
        setNewPosDesc("");
        setSelectedPosId(data.position.id);
        fetchGuildData();
      }
    } catch (e) {}
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPosId) return;
    try {
      const res = await fetch(`/api/positions/${selectedPosId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: newQLabel,
          description: newQDesc,
          type: newQType,
          options: newQOptions ? newQOptions.split(",").map((o) => o.trim()) : undefined,
          required: newQRequired,
        }),
      });
      if (res.ok) {
        setNewQModal(false);
        setNewQLabel("");
        setNewQDesc("");
        setNewQOptions("");
        fetchGuildData();
      }
    } catch (e) {}
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      const res = await fetch(`/api/positions/questions/${qId}`, { method: "DELETE" });
      if (res.ok) fetchGuildData();
    } catch (e) {}
  };

  const handleAddBlacklist = async () => {
    if (!newBlacklistVal.trim()) return;
    try {
      const res = await fetch(`/api/guilds/${params.guildId}/blacklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "DISCORD_ID",
          targetValue: newBlacklistVal,
          reason: newBlacklistReason,
        }),
      });
      if (res.ok) {
        setNewBlacklistVal("");
        setNewBlacklistReason("");
        fetchGuildData();
      }
    } catch (e) {}
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-xs text-slate-400">Loading community dashboard...</p>
      </div>
    );
  }

  if (!guild) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <h2 className="text-base font-bold text-white mb-2">Community Not Found</h2>
        <Link href="/" className="text-xs text-purple-400 hover:underline">
          Return Home
        </Link>
      </div>
    );
  }

  const filteredApps = guild.applications.filter((a) => {
    if (statusFilter === "ALL") return true;
    return a.status === statusFilter;
  });

  const activePosition = guild.positions.find((p) => p.id === selectedPosId) || guild.positions[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Community Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-surface-card border border-white/10 overflow-hidden shrink-0">
            {guild.icon ? (
              <img src={guild.icon} alt={guild.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-violet-600 flex items-center justify-center font-bold text-white">
                {guild.name.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{guild.name}</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Staff Dashboard
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {guild.applications.length} total applications • {guild.positions.length} openings
            </p>
          </div>
        </div>

        {/* Action success alert */}
        {actionSuccess && (
          <div className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-1.5 animate-fadeIn">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Action Buttons: Export CSV & Public Link */}
        <div className="flex items-center gap-2">
          <a
            href={`/api/guilds/${guild.id}/export`}
            download
            className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 flex items-center gap-1.5 transition-colors"
            title="Export all applications to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>

          <Link
            href={`/c/${guild.id}`}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/10 flex items-center gap-1"
          >
            <span>Public Page</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("applications")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeTab === "applications"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Review Applications ({guild.applications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("builder")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeTab === "builder"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Visual Form Builder</span>
        </button>

        <button
          onClick={() => setActiveTab("bot")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeTab === "bot"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Discord Bot & Alerts</span>
        </button>

        <button
          onClick={() => setActiveTab("gating")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeTab === "gating"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Gating, Cooldowns & Blacklist</span>
        </button>

        <button
          onClick={() => setActiveTab("templates")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeTab === "templates"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Form Templates</span>
        </button>
      </div>

      {/* TAB 1: APPLICATIONS REVIEW KANBAN */}
      {activeTab === "applications" && (
        <div className="space-y-6">
          {/* Status Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {["ALL", "PENDING", "UNDER_REVIEW", "INTERVIEW", "ACCEPTED", "REJECTED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                  statusFilter === st
                    ? "bg-white text-black border-white"
                    : "bg-surface border-white/5 text-slate-400 hover:text-white"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Applicant Cards List */}
            <div className="lg:col-span-5 space-y-3 max-h-[750px] overflow-y-auto pr-1">
              {filteredApps.length === 0 ? (
                <div className="p-8 text-center glass-panel rounded-2xl border border-white/5">
                  <p className="text-xs text-slate-400">No applications match this filter.</p>
                </div>
              ) : (
                filteredApps.map((app) => {
                  const isSelected = selectedApp?.id === app.id;
                  return (
                    <div
                      key={app.id}
                      onClick={() => setSelectedApp(app)}
                      className={`p-4 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? "bg-purple-950/30 border-purple-500/60 shadow-lg shadow-purple-500/10"
                          : "glass-panel border-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={app.user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                            alt={app.user.username}
                            className="w-8 h-8 rounded-full border border-white/10"
                          />
                          <div>
                            <span className="text-xs font-bold text-white block">
                              {app.user.username}
                            </span>
                            <span className="text-[10px] text-purple-300">
                              {app.position.title}
                            </span>
                          </div>
                        </div>
                        <StatusBadge status={app.status} size="sm" />
                      </div>

                      {app.user.robloxUsername && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mb-2">
                          <span>Roblox:</span>
                          <span className="text-slate-200 font-mono font-medium">
                            {app.user.robloxUsername}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-white/5">
                        <span>{formatDate(app.createdAt)}</span>
                        <span>{app.reviews.length} staff review{app.reviews.length === 1 ? "" : "s"}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Column: Full Application Detail View */}
            <div className="lg:col-span-7">
              {selectedApp ? (
                <div className="glass-panel rounded-2xl border border-white/10 p-6 space-y-6">
                  {/* Header Detail */}
                  <div className="flex items-start justify-between pb-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedApp.user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                        alt={selectedApp.user.username}
                        className="w-12 h-12 rounded-xl border border-white/10"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-white">
                            {selectedApp.user.username}
                          </h2>
                          <StatusBadge status={selectedApp.status} size="sm" />
                        </div>
                        <p className="text-xs text-slate-400">
                          Applying for <strong className="text-purple-300">{selectedApp.position.title}</strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Decision Buttons */}
                  <div className="p-4 rounded-xl bg-surface border border-white/5 space-y-3">
                    <span className="text-xs font-bold text-white block">
                      Change Application Status:
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleStatusChange(selectedApp.id, "UNDER_REVIEW")}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-colors"
                      >
                        Under Review
                      </button>

                      <button
                        onClick={() => handleStatusChange(selectedApp.id, "INTERVIEW")}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition-colors"
                      >
                        Schedule Interview (Creates Ticket)
                      </button>

                      <button
                        onClick={() => handleStatusChange(selectedApp.id, "ACCEPTED")}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30"
                      >
                        Accept Candidate
                      </button>

                      <button
                        onClick={() => handleStatusChange(selectedApp.id, "REJECTED")}
                        className="px-3.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-bold border border-rose-600/30 transition-colors"
                      >
                        Reject
                      </button>
                    </div>

                    <div className="pt-2">
                      <input
                        type="text"
                        placeholder="Optional feedback / decision note (included in applicant's notification)..."
                        value={decisionNote}
                        onChange={(e) => setDecisionNote(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Questionnaire Answers */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">
                      Application Answers
                    </h3>

                    {selectedApp.answers.map((ans: any, i: number) => (
                      <div key={i} className="p-3.5 rounded-xl bg-surface/70 border border-white/5 space-y-1">
                        <span className="text-xs font-semibold text-slate-300 block">
                          {ans.question.label}
                        </span>
                        <p className="text-xs text-slate-100 whitespace-pre-wrap leading-relaxed">
                          {ans.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Internal Staff Discussion & Blind Voting */}
                  <div className="pt-4 border-t border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Staff Reviews & Blind Voting
                      </h3>
                      {guild.enableBlindVoting && (
                        <span className="text-[10px] text-purple-400 font-mono">
                          Blind Mode Enabled
                        </span>
                      )}
                    </div>

                    {selectedApp.reviews.map((rev: any) => (
                      <div key={rev.id} className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">{rev.reviewer.username}</span>
                          {rev.score && (
                            <span className="flex items-center gap-1 text-amber-400">
                              <Star className="w-3 h-3 fill-amber-400" />
                              {rev.score}/5
                            </span>
                          )}
                        </div>
                        <p className="text-slate-300">{rev.comment}</p>
                      </div>
                    ))}

                    {/* Add Review */}
                    <div className="space-y-2 pt-2">
                      <textarea
                        rows={2}
                        placeholder="Add internal staff note..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-surface border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-400">Rating:</span>
                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setReviewScore(num)}
                              className={`p-1 rounded ${
                                reviewScore >= num ? "text-amber-400" : "text-slate-600"
                              }`}
                            >
                              <Star className="w-3.5 h-3.5 fill-current" />
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddReview(selectedApp.id)}
                          className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500"
                        >
                          Post Note
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-panel rounded-2xl border border-white/10 p-12 text-center">
                  <p className="text-xs text-slate-400">Select an application from the list to review.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VISUAL FORM BUILDER */}
      {activeTab === "builder" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Visual Form Builder & Openings</h2>
              <p className="text-xs text-slate-400">
                Design custom application questionnaires, questions types, and required fields.
              </p>
            </div>
            <button
              onClick={() => setNewPosModal(true)}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-violet-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Opening</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Position Picker */}
            <div className="lg:col-span-4 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Openings ({guild.positions.length})
              </span>
              {guild.positions.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPosId(p.id)}
                  className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                    activePosition?.id === p.id
                      ? "bg-purple-950/30 border-purple-500/60 shadow-md shadow-purple-500/10"
                      : "glass-panel border-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white truncate">{p.title}</span>
                    <span className="text-[10px] text-purple-300 font-mono">
                      {p.questions?.length || 0} questions
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block">{p.department}</span>
                </div>
              ))}
            </div>

            {/* Questions List & Editor */}
            <div className="lg:col-span-8">
              {activePosition ? (
                <div className="glass-panel rounded-2xl border border-white/10 p-6 space-y-6">
                  <div className="flex items-start justify-between pb-4 border-b border-white/10">
                    <div>
                      <h3 className="text-base font-bold text-white">{activePosition.title}</h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                        {activePosition.description}
                      </p>
                    </div>

                    <button
                      onClick={() => setNewQModal(true)}
                      className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Question</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {activePosition.questions?.length === 0 ? (
                      <div className="p-8 text-center bg-surface/50 rounded-xl border border-white/5">
                        <p className="text-xs text-slate-400">No questions added yet. Click &apos;Add Question&apos; above!</p>
                      </div>
                    ) : (
                      activePosition.questions.map((q, idx) => (
                        <div
                          key={q.id}
                          className="p-3.5 rounded-xl bg-surface border border-white/5 flex items-start justify-between gap-3 group hover:border-white/10 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-purple-400">{idx + 1}.</span>
                              <span className="text-xs font-bold text-white">{q.label}</span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/5 text-slate-300 border border-white/5">
                                {q.type}
                              </span>
                              {q.required && (
                                <span className="text-[10px] text-rose-400 font-semibold">Required</span>
                              )}
                            </div>
                            {q.description && (
                              <p className="text-[11px] text-slate-400 pl-4">{q.description}</p>
                            )}
                            {q.options && (
                              <p className="text-[10px] text-purple-300 pl-4 font-mono">Options: {q.options}</p>
                            )}
                          </div>

                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Modal: New Opening */}
          {newPosModal && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <form
                onSubmit={handleCreatePosition}
                className="glass-panel border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl"
              >
                <h3 className="text-base font-bold text-white">Create New Opening</h3>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium block">Position Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lead 3D Modeler"
                    value={newPosTitle}
                    onChange={(e) => setNewPosTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium block">Department</label>
                  <select
                    value={newPosDept}
                    onChange={(e) => setNewPosDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-white"
                  >
                    <option value="Development">Development</option>
                    <option value="Staff & Moderation">Staff & Moderation</option>
                    <option value="Design">Design</option>
                    <option value="Community">Community</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium block">Description & Requirements</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe the role..."
                    value={newPosDesc}
                    onChange={(e) => setNewPosDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium block">Discord Auto-Grant Role ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 119876543210987654"
                    value={newPosRole}
                    onChange={(e) => setNewPosRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-white"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setNewPosModal(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Modal: New Question */}
          {newQModal && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <form
                onSubmit={handleAddQuestion}
                className="glass-panel border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl"
              >
                <h3 className="text-base font-bold text-white">Add Question to Form</h3>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium block">Question Label / Prompt</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Link your DevForum portfolio"
                    value={newQLabel}
                    onChange={(e) => setNewQLabel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium block">Input Type</label>
                  <select
                    value={newQType}
                    onChange={(e) => setNewQType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-white"
                  >
                    <option value="TEXT">Short Text (Single line)</option>
                    <option value="PARAGRAPH">Paragraph (Multi-line detailed answer)</option>
                    <option value="SELECT">Select Dropdown (Choice options)</option>
                    <option value="CHECKBOX">Checkbox (Agreement / Confirmation)</option>
                    <option value="LINK">URL Link</option>
                    <option value="PORTFOLIO">Portfolio / Showcase Showcase</option>
                  </select>
                </div>

                {newQType === "SELECT" && (
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-300 font-medium block">Options (Comma-separated)</label>
                    <input
                      type="text"
                      placeholder="Option 1, Option 2, Option 3"
                      value={newQOptions}
                      onChange={(e) => setNewQOptions(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-white"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium block">Helper Description (Optional)</label>
                  <input
                    type="text"
                    placeholder="Clarification or tips for the applicant..."
                    value={newQDesc}
                    onChange={(e) => setNewQDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-white"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={newQRequired}
                    onChange={(e) => setNewQRequired(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600"
                  />
                  <span className="text-xs text-slate-300">Required question</span>
                </label>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setNewQModal(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold"
                  >
                    Add Question
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DISCORD INTEGRATION & HOSTED BOT */}
      {activeTab === "bot" && (
        <div className="max-w-2xl glass-panel rounded-2xl border border-white/10 p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-base font-bold text-white mb-1">
              Discord Bot & Integration Mode
            </h2>
            <p className="text-xs text-slate-400">
              Choose how your community wants to handle applications — pure web portal or automated via your own bot token.
            </p>
          </div>

          {/* Mode Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() => setUseCustomBotState(false)}
              className={`p-4 rounded-xl cursor-pointer border transition-all ${
                !useCustomBotState
                  ? "bg-purple-950/30 border-purple-500 shadow-md shadow-purple-500/10"
                  : "bg-surface/50 border-white/5 hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">Web-Only Mode</span>
                {!useCustomBotState && <CheckCircle className="w-4 h-4 text-purple-400" />}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                No Discord bot needed! Staff review, interview, and manage applicants entirely through the RoleFlow web dashboard.
              </p>
            </div>

            <div
              onClick={() => setUseCustomBotState(true)}
              className={`p-4 rounded-xl cursor-pointer border transition-all ${
                useCustomBotState
                  ? "bg-purple-950/30 border-purple-500 shadow-md shadow-purple-500/10"
                  : "bg-surface/50 border-white/5 hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">Hosted Bot Automation</span>
                {useCustomBotState && <CheckCircle className="w-4 h-4 text-purple-400" />}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                We host and dispatch your bot for you! Automatic staff channel embeds, role grants on accept, and applicant DMs.
              </p>
            </div>
          </div>

          {/* Token input & settings (if hosted bot enabled) */}
          {useCustomBotState && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5 p-4 rounded-xl bg-purple-950/20 border border-purple-500/20">
                <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-purple-400" />
                  Your Discord Bot Token
                </label>
                <input
                  type="password"
                  placeholder="Enter bot token from Discord Developer Portal..."
                  value={botTokenInput}
                  onChange={(e) => setBotTokenInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <p className="text-[10px] text-slate-400">
                  RoleFlow securely stores your token to dispatch embeds and grant roles on your server&apos;s behalf.
                </p>
              </div>

              {/* Staff Log Channel ID */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white">
                  Staff Alert Channel ID (#application-logs)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 119876543210987654"
                  value={logChannelInput}
                  onChange={(e) => setLogChannelInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Staff Ping Role */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-purple-400" />
                  Staff Ping Role ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1046538179399929957 (Pings this role on new applications)"
                  value={staffPingRoleInput}
                  onChange={(e) => setStaffPingRoleInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Custom Embed Color */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-purple-400" />
                  Discord Embed Hex Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={embedColorInput}
                    onChange={(e) => setEmbedColorInput(e.target.value)}
                    className="w-10 h-10 rounded-xl bg-transparent border border-white/10 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={embedColorInput}
                    onChange={(e) => setEmbedColorInput(e.target.value)}
                    placeholder="#8B5CF6"
                    className="w-32 px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-violet-600/30"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingSettings ? "Saving..." : "Save Integration Settings"}</span>
          </button>
        </div>
      )}

      {/* TAB 4: GATING, COOLDOWNS & BLACKLIST */}
      {activeTab === "gating" && (
        <div className="max-w-2xl space-y-6">
          <div className="glass-panel rounded-2xl border border-white/10 p-6 space-y-4">
            <h2 className="text-base font-bold text-white">Application Rules & Gating</h2>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white">
                Re-Application Cooldown (Days after Rejection)
              </label>
              <input
                type="number"
                min={0}
                max={90}
                value={cooldownInput}
                onChange={(e) => setCooldownInput(Number(e.target.value))}
                className="w-32 px-3.5 py-2 rounded-xl bg-surface border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
              />
              <p className="text-[10px] text-slate-400">
                Applicants rejected must wait this many days before re-applying. Set to 0 to disable.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div>
                <span className="text-xs font-bold text-white block">
                  Enforce Roblox Account Verification
                </span>
                <p className="text-[10px] text-slate-400">
                  Requires applicants to specify their Roblox username for avatar and studio portfolio checks.
                </p>
              </div>
              <input
                type="checkbox"
                checked={robloxAuthToggle}
                onChange={(e) => setRobloxAuthToggle(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div>
                <span className="text-xs font-bold text-white block">
                  Staff Blind Voting Mode
                </span>
                <p className="text-[10px] text-slate-400">
                  Hides other reviewers&apos; ratings until you submit your own review to prevent bias.
                </p>
              </div>
              <input
                type="checkbox"
                checked={blindVotingToggle}
                onChange={(e) => setBlindVotingToggle(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600"
              />
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
            >
              Save Gating Policies
            </button>
          </div>

          {/* Blacklist Management */}
          <div className="glass-panel rounded-2xl border border-white/10 p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UserX className="w-4 h-4 text-rose-400" />
              Community Anti-Troll Blacklist
            </h2>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Discord ID or Roblox username..."
                value={newBlacklistVal}
                onChange={(e) => setNewBlacklistVal(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <input
                type="text"
                placeholder="Reason tag..."
                value={newBlacklistReason}
                onChange={(e) => setNewBlacklistReason(e.target.value)}
                className="w-48 px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={handleAddBlacklist}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                Blacklist
              </button>
            </div>

            <div className="space-y-2 pt-2">
              {guild.blacklists.length === 0 ? (
                <p className="text-xs text-slate-500">No users currently blacklisted.</p>
              ) : (
                guild.blacklists.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-white/5 text-xs"
                  >
                    <span className="font-mono text-rose-300">{b.targetValue}</span>
                    <span className="text-slate-400">{b.reason || "No reason given"}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: 1-CLICK FORM TEMPLATES */}
      {activeTab === "templates" && (
        <div className="space-y-4">
          <div className="mb-4">
            <h2 className="text-base font-bold text-white">1-Click Starter Form Templates</h2>
            <p className="text-xs text-slate-400">
              Instantly create standard recruiting forms with pre-built questions for your community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FORM_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                className="glass-panel rounded-2xl border border-white/10 p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block mb-1">
                    {tmpl.category}
                  </span>
                  <h3 className="text-sm font-bold text-white mb-1.5">{tmpl.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    {tmpl.description}
                  </p>
                  <span className="text-[11px] text-slate-500">
                    {tmpl.defaultQuestions.length} pre-configured questions
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("builder");
                    setNewPosTitle(tmpl.name);
                    setNewPosDept(tmpl.category);
                    setNewPosDesc(tmpl.description);
                    setNewPosModal(true);
                  }}
                  className="w-full py-2 rounded-xl bg-white/5 hover:bg-purple-600 text-white text-xs font-semibold border border-white/10 hover:border-purple-500 transition-colors"
                >
                  Use Template
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
