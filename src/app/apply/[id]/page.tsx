"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Sparkles, CheckCircle2, AlertCircle, Save, User, Shield, HelpCircle, Clock, ExternalLink, Play, Github } from "lucide-react";

interface Question {
  id: string;
  label: string;
  description?: string | null;
  type: string;
  options?: string | null;
  required: boolean;
  order: number;
  conditionalParentId?: string | null;
  conditionalValue?: string | null;
  dependsOnQuestionId?: string | null;
  dependsOnAnswerValue?: string | null;
}

interface PositionData {
  id: string;
  title: string;
  department?: string | null;
  description: string;
  isOpen: boolean;
  timeLimitMinutes?: number | null;
  richMediaLinks?: boolean;
  guild: {
    id: string;
    name: string;
    icon?: string | null;
    isVerified?: boolean;
    enableRobloxAuth?: boolean;
    cooldownDays: number;
  };
  questions: Question[];
}

export default function ApplyPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [position, setPosition] = useState<PositionData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [applicantName, setApplicantName] = useState("");
  const [applicantDiscord, setApplicantDiscord] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [robloxUsername, setRobloxUsername] = useState("");
  const [robloxProfile, setRobloxProfile] = useState<{
    id: number;
    name: string;
    displayName: string;
    avatarUrl: string;
    profileUrl: string;
    devForumUrl: string;
  } | null>(null);
  const [robloxLoading, setRobloxLoading] = useState(false);
  const [robloxError, setRobloxError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null);
  const [timeExpired, setTimeExpired] = useState(false);

  // Storage key for auto-saving drafts
  const draftKey = `roleflow_draft_${params.id}`;
  const timerStartKey = `roleflow_timer_${params.id}`;

  useEffect(() => {
    async function loadPosition() {
      try {
        const res = await fetch(`/api/positions/${params.id}`);
        if (!res.ok) {
          setErrorMsg("Failed to load application form or position closed.");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setPosition(data);

        // Assessment countdown timer initialization
        if (data.timeLimitMinutes && data.timeLimitMinutes > 0) {
          const totalDuration = data.timeLimitMinutes * 60;
          let startTime = localStorage.getItem(timerStartKey);
          if (!startTime) {
            startTime = Date.now().toString();
            localStorage.setItem(timerStartKey, startTime);
          }
          const elapsed = Math.floor((Date.now() - parseInt(startTime, 10)) / 1000);
          const remaining = Math.max(0, totalDuration - elapsed);
          setTimeLeftSeconds(remaining);
          if (remaining <= 0) {
            setTimeExpired(true);
          }
        }

        // Fetch user session if logged in
        fetch("/api/user/settings")
          .then((r) => (r.ok ? r.json() : null))
          .then((u) => {
            if (u && u.username) {
              setCurrentUser(u);
              setApplicantName(u.username);
              if (u.robloxUsername && !robloxUsername) {
                setRobloxUsername(u.robloxUsername);
              }
            }
          })
          .catch(() => {});

        // Load saved draft from localStorage
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          try {
            const parsed = JSON.parse(savedDraft);
            setAnswers(parsed.answers || {});
            if (parsed.robloxUsername) setRobloxUsername(parsed.robloxUsername);
            if (parsed.applicantName) setApplicantName(parsed.applicantName);
            setLastSaved("Restored from draft");
          } catch (e) {
            console.error(e);
          }
        }
      } catch (err) {
        setErrorMsg("Network error loading position.");
      } finally {
        setLoading(false);
      }
    }

    loadPosition();
  }, [params.id, draftKey]);

  // Assessment countdown ticker
  useEffect(() => {
    if (timeLeftSeconds === null || timeLeftSeconds <= 0) return;

    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setTimeExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeftSeconds]);

  // Real-time auto-save to localStorage
  const handleAnswerChange = (questionId: string, val: string) => {
    if (timeExpired) return;
    const updated = { ...answers, [questionId]: val };
    setAnswers(updated);

    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          answers: updated,
          robloxUsername,
          savedAt: new Date().toISOString(),
        })
      );
      setLastSaved("Draft auto-saved");
    } catch (e) {
      // ignore quota errors
    }
  };

  const handleRobloxChange = (val: string) => {
    setRobloxUsername(val);
    setRobloxError(null);
    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          answers,
          robloxUsername: val,
          savedAt: new Date().toISOString(),
        })
      );
    } catch (e) {}

    // Debounced check against live Roblox API
    if (val.trim().length >= 3) {
      setRobloxLoading(true);
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/roblox/user?username=${encodeURIComponent(val.trim())}`);
          if (res.ok) {
            const data = await res.json();
            setRobloxProfile(data);
            setRobloxError(null);
          } else {
            setRobloxProfile(null);
            setRobloxError("Roblox username not found on Roblox.");
          }
        } catch (e) {
          setRobloxProfile(null);
        } finally {
          setRobloxLoading(false);
        }
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setRobloxProfile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/applications/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positionId: params.id,
          applicantName: applicantName.trim() || (currentUser?.username ?? ""),
          applicantDiscord: applicantDiscord.trim() || undefined,
          robloxUsername: position?.guild.enableRobloxAuth ? robloxUsername : undefined,
          answers,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        setErrorMsg(resData.error || "Failed to submit application.");
        setSubmitting(false);
        return;
      }

      // Clear draft on successful submission
      localStorage.removeItem(draftKey);
      localStorage.removeItem(timerStartKey);
      setSuccess(true);
    } catch (err) {
      setErrorMsg("Error submitting application. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-xs text-slate-400">Loading application form...</p>
      </div>
    );
  }

  if (errorMsg && !position) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white mb-2">Unable to Open Form</h2>
        <p className="text-xs text-slate-400 mb-6">{errorMsg}</p>
        <Link
          href="/browse"
          className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold"
        >
          Return to Directory
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-6 shadow-xl shadow-emerald-500/10">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Application Submitted!</h1>
        <p className="text-sm text-slate-300 leading-relaxed mb-8">
          Your application for <strong className="text-purple-300">{position?.title}</strong> has been received by the staff of <strong className="text-white">{position?.guild.name}</strong>.
          <br /><br />
          Staff have been alerted in Discord. You can track your application status anytime in your applicant dashboard.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/my-applications"
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 transition-all"
          >
            Track in My Applications
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/10 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (position && !position.isOpen) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4 text-amber-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Applications Closed</h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          The opening <strong className="text-white">{position.title}</strong> at {position.guild.name} is currently closed and not accepting new candidate submissions.
        </p>
        <Link
          href={`/c/${position.guild.id}`}
          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white transition-all shadow-md shadow-violet-600/30"
        >
          View Community Portal
        </Link>
      </div>
    );
  }

  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const renderRichMediaPreview = (url: string) => {
    if (!url || typeof url !== "string" || position?.richMediaLinks === false) return null;
    const trimmed = url.trim();
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return null;

    try {
      const parsedUrl = new URL(trimmed);
      const host = parsedUrl.hostname.toLowerCase();

      // YouTube preview
      if (host.includes("youtube.com") || host.includes("youtu.be")) {
        let videoId = "";
        if (host.includes("youtu.be")) {
          videoId = parsedUrl.pathname.slice(1);
        } else {
          videoId = parsedUrl.searchParams.get("v") || "";
        }
        if (videoId) {
          return (
            <div className="mt-2.5 p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-400">
                <Play className="w-3.5 h-3.5 fill-rose-400" />
                <span>YouTube Video Attachment</span>
              </div>
              <div className="relative aspect-video w-full max-w-md rounded-lg overflow-hidden border border-white/10 shadow-md">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>
          );
        }
      }

      // GitHub preview
      if (host.includes("github.com")) {
        const parts = parsedUrl.pathname.split("/").filter(Boolean);
        const repoOrUser = parts.join("/");
        return (
          <div className="mt-2 p-2.5 rounded-xl bg-surface border border-white/10 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Github className="w-4 h-4 text-white" />
              <span className="font-mono text-[11px] text-white font-medium">github.com/{repoOrUser}</span>
            </div>
            <a
              href={trimmed}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              Open Repo <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        );
      }

      // Roblox / DevForum preview
      if (host.includes("roblox.com")) {
        const isDevForum = host.includes("devforum.roblox.com");
        return (
          <div className="mt-2 p-2.5 rounded-xl bg-surface border border-white/10 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-600 flex items-center justify-center text-[9px] font-black text-white">R</div>
              <span className="text-[11px] text-slate-200 truncate max-w-xs font-mono">
                {isDevForum ? "DevForum Portfolio / Dev Thread" : "Roblox Experience / Profile / Asset"}
              </span>
            </div>
            <a
              href={trimmed}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              Verify Link <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        );
      }
    } catch (e) {
      return null;
    }

    return null;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Sticky Assessment Timer Header if timeLimitMinutes is set */}
      {position?.timeLimitMinutes && timeLeftSeconds !== null && (
        <div className={`sticky top-4 z-40 mb-6 p-4 rounded-2xl backdrop-blur-xl border flex items-center justify-between shadow-2xl transition-all ${
          timeExpired
            ? "bg-rose-950/80 border-rose-500/50 text-rose-300"
            : timeLeftSeconds < 120
            ? "bg-amber-950/80 border-amber-500/50 text-amber-300 animate-pulse"
            : "bg-surface/90 border-purple-500/30 text-purple-200"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${timeExpired ? "bg-rose-500/20 text-rose-400" : "bg-purple-500/20 text-purple-400"}`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold block">
                {timeExpired ? "Assessment Time Expired" : "Assessment Countdown Timer"}
              </span>
              <span className="text-[11px] text-slate-400">
                {timeExpired
                  ? "Your allowed time for this assessment has ended. Inputs are frozen."
                  : `This position requires completion within ${position.timeLimitMinutes} minutes.`}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-mono">Time Remaining</span>
            <span className={`text-lg font-black font-mono tracking-tight ${
              timeExpired ? "text-rose-400" : timeLeftSeconds < 120 ? "text-amber-400" : "text-white"
            }`}>
              {formatTimeRemaining(timeLeftSeconds)}
            </span>
          </div>
        </div>
      )}

      {/* Back button & draft autosave indicator */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href={`/c/${position?.guild.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to {position?.guild.name}
        </Link>

        {lastSaved && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
            <Save className="w-3 h-3 text-purple-400" />
            <span>{lastSaved}</span>
          </div>
        )}
      </div>

      {/* Form Container */}
      <div className="glass-panel rounded-3xl border border-white/10 p-6 sm:p-10 shadow-2xl">
        {/* Form Header */}
        <div className="border-b border-white/10 pb-6 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
              {position?.guild.name} • {position?.department || "Recruitment"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            Application for {position?.title}
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">
            {position?.description}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Applicant Discord Authentication */}
          {currentUser ? (
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-xs">
                  {currentUser.username?.[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block">{currentUser.username}</span>
                  <span className="text-[10px] text-slate-400">Authenticated Discord Applicant</span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Connected
              </span>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
                  <Shield className="w-4 h-4 text-purple-400" />
                  Discord Login Required
                </h4>
                <p className="text-[11px] text-slate-400">
                  Please connect with Discord so the community staff can verify your identity and notify you of review updates.
                </p>
              </div>
              <a
                href="/api/auth/login"
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shrink-0 transition-all shadow-md shadow-purple-600/30"
              >
                Log In with Discord
              </a>
            </div>
          )}

          {/* Optional Roblox Account Verification */}
          {position?.guild.enableRobloxAuth && (
            <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 space-y-3">
              <label className="block text-xs font-bold text-white flex items-center justify-between">
                <span>Roblox Identity Verification <span className="text-rose-400">*</span></span>
                <span className="text-[10px] text-purple-400 font-normal">Required by community</span>
              </label>
              
              <div className="relative">
                <input
                  type="text"
                  required
                  value={robloxUsername}
                  onChange={(e) => handleRobloxChange(e.target.value)}
                  placeholder="Enter your exact Roblox username (e.g. Builderman)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 pr-24"
                />
                {robloxLoading && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-purple-400 flex items-center gap-1 font-mono">
                    <span className="w-2.5 h-2.5 rounded-full border border-purple-400 border-t-transparent animate-spin" />
                    Checking...
                  </span>
                )}
              </div>

              {/* Live Roblox Card */}
              {robloxProfile && (
                <div className="p-3 rounded-xl bg-surface/90 border border-emerald-500/30 flex items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <img
                      src={robloxProfile.avatarUrl}
                      alt={robloxProfile.name}
                      className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{robloxProfile.displayName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">(@{robloxProfile.name})</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <span className="text-[10px] text-slate-400 block font-mono">ID: {robloxProfile.id}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={robloxProfile.profileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-slate-300 border border-white/10 transition-colors"
                    >
                      Roblox Profile ↗
                    </a>
                    <a
                      href={robloxProfile.devForumUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-[10px] text-purple-300 border border-purple-500/20 transition-colors"
                    >
                      DevForum ↗
                    </a>
                  </div>
                </div>
              )}

              {robloxError && !robloxLoading && (
                <p className="text-[11px] text-rose-400 font-medium">{robloxError}</p>
              )}

              <p className="text-[11px] text-slate-400">
                Staff will verify your avatar, experience, and Roblox profile alongside your application.
              </p>
            </div>
          )}

          {/* Dynamic Questionnaire Questions */}
          {position?.questions.map((q, idx) => {
            // Check conditional dependency (supports dependsOnQuestionId or conditionalParentId)
            const parentQId = q.dependsOnQuestionId || q.conditionalParentId;
            const expectedVal = q.dependsOnAnswerValue || q.conditionalValue;

            if (parentQId && expectedVal) {
              const parentVal = answers[parentQId];
              if (parentVal !== expectedVal) {
                return null; // Condition not met; hide question
              }
            }

            const val = answers[q.id] || "";
            let optionsList: string[] = [];
            if (q.options) {
              try {
                optionsList = JSON.parse(q.options);
              } catch (e) {
                optionsList = q.options.split(",").map((o) => o.trim());
              }
            }

            return (
              <div key={q.id} className="space-y-1.5 pt-2 animate-fadeIn">
                <label className="block text-xs font-semibold text-slate-200">
                  <span className="text-purple-400 mr-1.5 font-mono">{idx + 1}.</span>
                  {q.label}
                  {q.required && <span className="text-rose-400 ml-1">*</span>}
                  {(q.dependsOnQuestionId || q.conditionalParentId) && (
                    <span className="ml-2 text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      Conditional
                    </span>
                  )}
                </label>

                {q.description && (
                  <p className="text-[11px] text-slate-400 mb-1 leading-relaxed">
                    {q.description}
                  </p>
                )}

                {/* TEXT input */}
                {q.type === "TEXT" && (
                  <>
                    <input
                      type="text"
                      disabled={timeExpired}
                      required={q.required}
                      value={val}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      placeholder="Your answer..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 disabled:opacity-50"
                    />
                    {renderRichMediaPreview(val)}
                  </>
                )}

                {/* PARAGRAPH input */}
                {q.type === "PARAGRAPH" && (
                  <textarea
                    rows={4}
                    disabled={timeExpired}
                    required={q.required}
                    value={val}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder="Type your detailed response here..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-y disabled:opacity-50"
                  />
                )}

                {/* PORTFOLIO input */}
                {q.type === "PORTFOLIO" && (
                  <>
                    <input
                      type="url"
                      disabled={timeExpired}
                      required={q.required}
                      value={val}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      placeholder="https://talent.roblox.com/... or https://github.com/..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono disabled:opacity-50"
                    />
                    {renderRichMediaPreview(val)}
                  </>
                )}

                {/* FILE / Attachment input */}
                {q.type === "FILE" && (
                  <>
                    <input
                      type="url"
                      disabled={timeExpired}
                      required={q.required}
                      value={val}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      placeholder="Paste image/asset link (e.g. https://imgur.com/... or Google Drive link)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono disabled:opacity-50"
                    />
                    {renderRichMediaPreview(val)}
                  </>
                )}

                {/* SELECT dropdown */}
                {q.type === "SELECT" && (
                  <select
                    disabled={timeExpired}
                    required={q.required}
                    value={val}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
                  >
                    <option value="">Select an option...</option>
                    {optionsList.map((opt) => (
                      <option key={opt} value={opt} className="bg-surface text-white">
                        {opt}
                      </option>
                    ))}
                  </select>
                )}

                {/* CHECKBOX */}
                {q.type === "CHECKBOX" && (
                  <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={timeExpired}
                      required={q.required}
                      checked={val === "true"}
                      onChange={(e) => handleAnswerChange(q.id, e.target.checked ? "true" : "")}
                      className="w-4 h-4 rounded bg-surface border-white/20 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
                    />
                    <span className="text-xs text-slate-300">I confirm and agree</span>
                  </label>
                )}

                {/* LINK */}
                {q.type === "LINK" && (
                  <>
                    <input
                      type="url"
                      disabled={timeExpired}
                      required={q.required}
                      value={val}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 disabled:opacity-50"
                    />
                    {renderRichMediaPreview(val)}
                  </>
                )}
              </div>
            );
          })}

          {/* Submission Action */}
          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-slate-500">
              By submitting, you agree to the community&apos;s rules and RoleFlow{" "}
              <Link href="/terms" className="text-purple-400 hover:underline">
                Terms
              </Link>.
            </p>

            {currentUser ? (
              <button
                type="submit"
                disabled={submitting || timeExpired}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {timeExpired
                    ? "Assessment Expired (Locked)"
                    : submitting
                    ? "Submitting Application..."
                    : "Submit Application"}
                </span>
              </button>
            ) : (
              <a
                href="/api/auth/login"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
              >
                <span>Connect with Discord to Apply</span>
              </a>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
