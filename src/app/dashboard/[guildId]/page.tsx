"use client";

import OverviewPanel from "@/components/dashboard/OverviewPanel";
import SavedReplyPicker from "@/components/dashboard/SavedReplyPicker";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Upload,
  Tag,
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
  Server,
  CheckCircle2,
  Send,
  RefreshCw,
  Settings,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Pencil,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import { FORM_TEMPLATES } from "@/lib/templates";
const CSV_IMPORT_SAMPLE = `Username, RobloxUsername, Position, Status, Tags, Notes
JordanDev, JordanRBLX, Scripter, UNDER_REVIEW, Former Staff, Great portfolio submission
Alex, AlexBuilds, Modeler, PENDING, Trainee, Applied via Google Form`;

const JSON_IMPORT_SAMPLE = `[
  {
    "username": "JordanDev",
    "robloxUsername": "JordanRBLX",
    "positionTitle": "Scripter",
    "status": "UNDER_REVIEW",
    "tags": "Former Staff",
    "notes": "Great portfolio"
  }
]`;


interface GuildData {
  id: string;
  name: string;
  icon?: string | null;
  banner?: string | null;
  vanitySlug?: string | null;
  description?: string | null;
  tags?: string | null;
  useCustomBot: boolean;
  customBotToken?: string | null;
  logChannelId?: string | null;
  staffPingRoleId?: string | null;
  embedColor?: string | null;
  cooldownDays: number;
  requireInGuild?: boolean;
  minAccountAgeDays?: number;
  enableRobloxAuth: boolean;
  enableRobloxGroupCheck?: boolean;
  robloxGroupId?: string | null;
  robloxMinRank?: number;
  enableBlindVoting: boolean;
  votePassThreshold?: number;
  plan?: string;
  licenseKey?: string | null;
  licenseExpiresAt?: string | null;
  webhookUrl?: string | null;
  portalTheme?: string | null;
  portalAccentColor?: string | null;
  discordWidgetEnabled?: boolean;
  staffTeam?: Array<{
    id: string;
    userId: string;
    username?: string | null;
    roleTitle: string;
    permissions: string;
    createdAt: string;
  }>;
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
      conditionalParentId?: string | null;
      conditionalValue?: string | null;
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
    tags?: string | null;
    messages?: Array<{
      id: string;
      senderId: string;
      senderName: string;
      senderRole: string;
      content: string;
      createdAt: string;
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
  const [activeTab, setActiveTab] = useState<"overview" | "applications" | "builder" | "bot" | "staff" | "settings" | "gating" | "templates">("overview");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewScore, setReviewScore] = useState<number>(5);

  // Bulk selection & Multi-application review state
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [tagFilter, setTagFilter] = useState<string>("ALL");
  const [customTagInput, setCustomTagInput] = useState("");

  // In-App Clarification Thread
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newChatContent, setNewChatContent] = useState("");
  const [sendingChat, setSendingChat] = useState(false);

  // Portal Themes & Webhooks
  const [webhookUrlInput, setWebhookUrlInput] = useState("");
  const [portalThemeInput, setPortalThemeInput] = useState("obsidian");
  const [portalLayoutInput, setPortalLayoutInput] = useState("banner");
  const [portalAccentColorInput, setPortalAccentColorInput] = useState("#8B5CF6");
  const [discordWidgetToggle, setDiscordWidgetToggle] = useState(false);

  // Team & Granular Permissions
  const [staffList, setStaffList] = useState<any[]>([]);
  const [newStaffUserId, setNewStaffUserId] = useState("");
  const [newStaffUsername, setNewStaffUsername] = useState("");
  const [newStaffTitle, setNewStaffTitle] = useState("Reviewer");
  const [newStaffPerms, setNewStaffPerms] = useState("vote_only");
  const [addingStaff, setAddingStaff] = useState(false);

  // Community Admin Config state
  const [communityNameInput, setCommunityNameInput] = useState("");
  const [vanitySlugInput, setVanitySlugInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [bannerInput, setBannerInput] = useState("");
  const [iconInput, setIconInput] = useState("");
  const [requireInGuildToggle, setRequireInGuildToggle] = useState(false);
  const [minAccountAgeInput, setMinAccountAgeInput] = useState(0);

  // Bot Settings state
  const [botTokenInput, setBotTokenInput] = useState("");
  const [useCustomBotState, setUseCustomBotState] = useState(false);
  const [logChannelInput, setLogChannelInput] = useState("");
  const [staffPingRoleInput, setStaffPingRoleInput] = useState("");
  const [embedColorInput, setEmbedColorInput] = useState("#8B5CF6");

  // Gating & Policy state
  const [cooldownInput, setCooldownInput] = useState(7);
  const [robloxAuthToggle, setRobloxAuthToggle] = useState(false);
  const [robloxGroupCheckToggle, setRobloxGroupCheckToggle] = useState(false);
  const [robloxGroupIdInput, setRobloxGroupIdInput] = useState("");
  const [robloxMinRankInput, setRobloxMinRankInput] = useState(1);
  const [blindVotingToggle, setBlindVotingToggle] = useState(false);
  const [votePassThresholdInput, setVotePassThresholdInput] = useState(2);
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
  const [newQCondParent, setNewQCondParent] = useState("");
  const [newQCondVal, setNewQCondVal] = useState("");

  // Question & Opening Import state
  const [importQModal, setImportQModal] = useState(false);
  const [importQRawText, setImportQRawText] = useState("");
  const [importQFormat, setImportQFormat] = useState<"lines" | "json" | "csv">("lines");
  const [importingQ, setImportingQ] = useState(false);
  const [importQMsg, setImportQMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [importPosModal, setImportPosModal] = useState(false);
  const [importPosRawText, setImportPosRawText] = useState("");
  const [importingPos, setImportingPos] = useState(false);
  const [importPosMsg, setImportPosMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit Position / Application Opening state
  const [editPosModal, setEditPosModal] = useState(false);
  const [editPosTitle, setEditPosTitle] = useState("");
  const [editPosDept, setEditPosDept] = useState("");
  const [editPosDesc, setEditPosDesc] = useState("");
  const [editPosRole, setEditPosRole] = useState("");
  const [editPosIsOpen, setEditPosIsOpen] = useState(true);
  const [editPosIsPublic, setEditPosIsPublic] = useState(true);
  const [savingPosEdit, setSavingPosEdit] = useState(false);

  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Bot Management states
  const [verifyingBot, setVerifyingBot] = useState(false);
  const [botVerifiedInfo, setBotVerifiedInfo] = useState<any | null>(null);
  const [settingUpBot, setSettingUpBot] = useState(false);
  const [testingEmbed, setTestingEmbed] = useState(false);
  const [botFeedbackMsg, setBotFeedbackMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // License Key Redemption states
  const [guildLicenseInput, setGuildLicenseInput] = useState("");
  const [redeemingGuildLicense, setRedeemingGuildLicense] = useState(false);
  const [guildLicenseMsg, setGuildLicenseMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Application Import state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importRawText, setImportRawText] = useState("");
  const [importFormat, setImportFormat] = useState<"csv" | "json">("csv");
  const [importingData, setImportingData] = useState(false);
  const [importResultMsg, setImportResultMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchGuildData();
  }, [params.guildId]);

  useEffect(() => {
    if (selectedApp?.id) {
      handleFetchMessages(selectedApp.id);
    }
  }, [selectedApp?.id]);

  async function fetchGuildData() {
    try {
      const res = await fetch(`/api/guilds/${params.guildId}/dashboard`);
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      if (res.status === 401) {
        setUnauthorized(true);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setGuild(data);
        setCommunityNameInput(data.name || "");
        setVanitySlugInput(data.vanitySlug || "");
        setDescriptionInput(data.description || "");
        setTagsInput(data.tags || "");
        setBannerInput(data.banner || "");
        setIconInput(data.icon || "");
        setRequireInGuildToggle(data.requireInGuild || false);
        setMinAccountAgeInput(data.minAccountAgeDays || 0);

        setUseCustomBotState(data.useCustomBot || false);
        setBotTokenInput(data.customBotToken || "");
        setLogChannelInput(data.logChannelId || "");
        setStaffPingRoleInput(data.staffPingRoleId || "");
        setEmbedColorInput(data.embedColor || "#8B5CF6");
        setCooldownInput(data.cooldownDays ?? 7);
        setRobloxAuthToggle(data.enableRobloxAuth || false);
        setRobloxGroupCheckToggle(data.enableRobloxGroupCheck || false);
        setRobloxGroupIdInput(data.robloxGroupId || "");
        setRobloxMinRankInput(data.robloxMinRank || 1);
        setBlindVotingToggle(data.enableBlindVoting || false);
        setVotePassThresholdInput(data.votePassThreshold || 2);
        setWebhookUrlInput(data.webhookUrl || "");
        setPortalThemeInput(data.portalTheme || "obsidian");
        setPortalLayoutInput(data.portalLayout || "banner");
        setPortalAccentColorInput(data.portalAccentColor || "#8B5CF6");
        setDiscordWidgetToggle(data.discordWidgetEnabled || false);
        setStaffList(data.staffTeam || []);

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

  const handleRedeemGuildLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guildLicenseInput.trim() || !guild) return;
    setRedeemingGuildLicense(true);
    setGuildLicenseMsg(null);
    try {
      const res = await fetch("/api/licenses/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: guildLicenseInput.trim(),
          guildId: guild.id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGuildLicenseMsg({
          type: "success",
          text: data.message || `Upgraded to RoleFlow ${data.plan}!`,
        });
        setGuildLicenseInput("");
        fetchGuildData();
      } else {
        setGuildLicenseMsg({
          type: "error",
          text: data.error || "Failed to redeem license key.",
        });
      }
    } catch (err: any) {
      setGuildLicenseMsg({
        type: "error",
        text: err.message || "An unexpected error occurred during redemption.",
      });
    } finally {
      setRedeemingGuildLicense(false);
    }
  };

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

  const handleDeleteReview = async (appId: string, reviewId: string) => {
    if (!confirm("Delete this review note?")) return;
    try {
      const res = await fetch(`/api/applications/${appId}/reviews?reviewId=${reviewId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setActionSuccess("Review note deleted.");
        setTimeout(() => setActionSuccess(null), 3000);
        fetchGuildData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete review");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteApplication = async (appId: string) => {
    if (!confirm("Are you sure you want to permanently delete this application? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/applications/${appId}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedApp(null);
        setActionSuccess("Application deleted.");
        setTimeout(() => setActionSuccess(null), 3000);
        fetchGuildData();
      } else {
        alert("Failed to delete application.");
      }
    } catch (e) {
      alert("Error deleting application");
    }
  };

  const handleBulkAction = async (action: "ACCEPT" | "REJECT" | "TAG" | "DELETE", tag?: string) => {
    if (selectedAppIds.length === 0) return;
    setBulkProcessing(true);
    try {
      const res = await fetch("/api/applications/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId: params.guildId,
          applicationIds: selectedAppIds,
          action,
          tag,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        setActionSuccess(`Bulk action completed for ${result.processedCount} applications`);
        setTimeout(() => setActionSuccess(null), 3000);
        setSelectedAppIds([]);
        fetchGuildData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to execute bulk action");
      }
    } catch (e: any) {
      alert(e.message || "Bulk action failed");
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importRawText.trim()) return;
    setImportingData(true);
    setImportResultMsg(null);

    try {
      let applicationsToImport: any[] = [];

      if (importFormat === "json") {
        const parsed = JSON.parse(importRawText.trim());
        applicationsToImport = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        // Parse CSV
        const lines = importRawText.trim().split(/\r?\n/).filter(Boolean);
        if (lines.length === 0) throw new Error("CSV data is empty.");

        // Check if line 0 is headers
        const firstLine = lines[0].toLowerCase();
        let startIndex = 0;
        let headers = ["username", "robloxusername", "position", "status", "tags", "notes"];

        if (firstLine.includes("username") || firstLine.includes("discord") || firstLine.includes("applicant")) {
          headers = lines[0].split(",").map((h) => h.trim().replace(/^[\"\']|[\"\']$/g, "").toLowerCase());
          startIndex = 1;
        }

        for (let i = startIndex; i < lines.length; i++) {
          const values = lines[i].split(",").map((v) => v.trim().replace(/^[\"\']|[\"\']$/g, ""));
          if (values.length === 0 || !values[0]) continue;

          const appObj: Record<string, string> = {};
          headers.forEach((h, idx) => {
            if (values[idx] !== undefined) {
              appObj[h] = values[idx];
            }
          });

          applicationsToImport.push({
            username: appObj.username || appObj.discord || appObj.applicant || values[0],
            robloxUsername: appObj.robloxusername || appObj.roblox || values[1] || undefined,
            positionTitle: appObj.position || appObj.role || values[2] || undefined,
            status: appObj.status || values[3] || "PENDING",
            tags: appObj.tags || values[4] || "Imported",
            notes: appObj.notes || values[5] || undefined,
          });
        }
      }

      const res = await fetch(`/api/guilds/${params.guildId}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applications: applicationsToImport }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setImportResultMsg({ type: "success", text: data.message || `Imported ${data.importedCount} applications!` });
        setImportRawText("");
        fetchGuildData();
        setTimeout(() => {
          setImportModalOpen(false);
          setImportResultMsg(null);
        }, 1800);
      } else {
        setImportResultMsg({ type: "error", text: data.error || "Failed to import applications." });
      }
    } catch (err: any) {
      setImportResultMsg({ type: "error", text: err.message || "Failed to parse import data." });
    } finally {
      setImportingData(false);
    }
  };

  const handleExportSelectedCsv = () => {
    const targetApps = selectedAppIds.length > 0
      ? guild?.applications.filter((a: any) => selectedAppIds.includes(a.id)) || []
      : filteredApps;
    if (targetApps.length === 0) {
      alert("No applications to export.");
      return;
    }
    const headers = ["Application ID", "Applicant Discord", "Applicant Roblox", "Position", "Status", "Tags", "Date Submitted"];
    const rows = targetApps.map((a: any) => [
      `"${a.id}"`,
      `"${(a.user?.username || '').replace(/"/g, '""')}"`,
      `"${(a.user?.robloxUsername || '').replace(/"/g, '""')}"`,
      `"${(a.position?.title || '').replace(/"/g, '""')}"`,
      `"${a.status}"`,
      `"${(a.tags || '').replace(/"/g, '""')}"`,
      `"${new Date(a.createdAt).toISOString()}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${(guild?.name || 'community').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_applications.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleAppTag = async (appId: string, tag: string) => {
    try {
      const res = await fetch(`/api/applications/${appId}/tags`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag }),
      });
      if (res.ok) {
        const updated = await res.json();
        if (selectedApp && selectedApp.id === appId) {
          setSelectedApp({ ...selectedApp, tags: updated.tags.join(",") });
        }
        fetchGuildData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFetchMessages = async (appId: string) => {
    try {
      const res = await fetch(`/api/applications/${appId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setChatMessages(Array.isArray(data) ? data : data.messages || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (appId: string) => {
    if (!newChatContent.trim()) return;
    setSendingChat(true);
    try {
      const res = await fetch(`/api/applications/${appId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newChatContent.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [...prev, data.message]);
        setNewChatContent("");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to send message");
      }
    } catch (e: any) {
      alert(e.message || "Failed to send message");
    } finally {
      setSendingChat(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffUserId.trim()) return;
    setAddingStaff(true);
    try {
      const res = await fetch(`/api/guilds/${params.guildId}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: newStaffUserId.trim(),
          username: newStaffUsername.trim() || undefined,
          roleTitle: newStaffTitle.trim() || "Reviewer",
          permissions: newStaffPerms,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setStaffList((prev) => {
          const filtered = prev.filter((s) => s.userId !== data.staff.userId);
          return [...filtered, data.staff];
        });
        setNewStaffUserId("");
        setNewStaffUsername("");
        setActionSuccess("Staff member added with custom permissions!");
        setTimeout(() => setActionSuccess(null), 3000);
        fetchGuildData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to add staff member");
      }
    } catch (e: any) {
      alert(e.message || "Failed to add staff");
    } finally {
      setAddingStaff(false);
    }
  };

  const handleDeleteStaff = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return;
    try {
      const res = await fetch(`/api/guilds/${params.guildId}/staff?userId=${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setStaffList((prev) => prev.filter((s) => s.userId !== userId));
        setActionSuccess("Staff member removed.");
        setTimeout(() => setActionSuccess(null), 3000);
        fetchGuildData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to remove staff member");
      }
    } catch (e) {
      alert("Failed to remove staff");
    }
  };

  const openEditPositionModal = (pos: any) => {
    setEditPosTitle(pos.title || "");
    setEditPosDept(pos.department || "");
    setEditPosDesc(pos.description || "");
    setEditPosRole(pos.acceptRoleId || "");
    setEditPosIsOpen(pos.isOpen ?? true);
    setEditPosIsPublic(pos.isPublic ?? true);
    setEditPosModal(true);
  };

  const handleSavePositionEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePosition || !editPosTitle.trim()) return;
    setSavingPosEdit(true);
    try {
      const res = await fetch(`/api/positions/${activePosition.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editPosTitle.trim(),
          department: editPosDept.trim() || undefined,
          description: editPosDesc.trim() || undefined,
          acceptRoleId: editPosRole.trim() || null,
          isOpen: editPosIsOpen,
          isPublic: editPosIsPublic,
        }),
      });
      if (res.ok) {
        setEditPosModal(false);
        setActionSuccess("Application opening updated successfully!");
        setTimeout(() => setActionSuccess(null), 3000);
        fetchGuildData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update opening");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPosEdit(false);
    }
  };

  const handleTogglePositionOpen = async (posId: string, currentOpen: boolean) => {
    try {
      const res = await fetch(`/api/positions/${posId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOpen: !currentOpen }),
      });
      if (res.ok) {
        setActionSuccess(currentOpen ? "Opening closed to new applications." : "Opening reopened!");
        setTimeout(() => setActionSuccess(null), 3000);
        fetchGuildData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePosition = async (posId: string) => {
    if (!confirm("Are you sure you want to permanently delete this opening and all its questions?")) return;
    try {
      const res = await fetch(`/api/positions/${posId}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedPosId(null);
        setActionSuccess("Opening deleted.");
        setTimeout(() => setActionSuccess(null), 3000);
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
          name: communityNameInput,
          vanitySlug: vanitySlugInput,
          description: descriptionInput,
          tags: tagsInput,
          banner: bannerInput,
          icon: iconInput,
          requireInGuild: requireInGuildToggle,
          minAccountAgeDays: Number(minAccountAgeInput),
          useCustomBot: useCustomBotState,
          customBotToken: botTokenInput,
          logChannelId: logChannelInput,
          staffPingRoleId: staffPingRoleInput,
          embedColor: embedColorInput,
          cooldownDays: Number(cooldownInput),
          enableRobloxAuth: robloxAuthToggle,
          enableRobloxGroupCheck: robloxGroupCheckToggle,
          robloxGroupId: robloxGroupIdInput,
          robloxMinRank: Number(robloxMinRankInput),
          enableBlindVoting: blindVotingToggle,
          votePassThreshold: Number(votePassThresholdInput),
          webhookUrl: webhookUrlInput,
          portalTheme: portalThemeInput,
          portalLayout: portalLayoutInput,
          portalAccentColor: portalAccentColorInput,
          discordWidgetEnabled: discordWidgetToggle,
        }),
      });

      if (res.ok) {
        setActionSuccess("Settings saved successfully!");
        setTimeout(() => setActionSuccess(null), 3000);
        fetchGuildData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save settings");
      }
    } catch (e: any) {
      alert(e.message || "Error saving settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleImportQuestionsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importQRawText.trim() || !activePosition) return;
    setImportingQ(true);
    setImportQMsg(null);

    try {
      let questionsPayload: any[] = [];

      if (importQFormat === "json") {
        const parsed = JSON.parse(importQRawText.trim());
        questionsPayload = Array.isArray(parsed) ? parsed : parsed.questions || [parsed];
      } else if (importQFormat === "csv") {
        const lines = importQRawText.trim().split(/\r?\n/).filter(Boolean);
        const startIndex = lines[0].toLowerCase().includes("label") || lines[0].toLowerCase().includes("question") ? 1 : 0;
        for (let i = startIndex; i < lines.length; i++) {
          const parts = lines[i].split(",").map(p => p.trim().replace(/^[\"\']|[\"\']$/g, ""));
          if (!parts[0]) continue;
          questionsPayload.push({
            label: parts[0],
            type: parts[1] || "TEXT",
            required: parts[2] ? parts[2].toLowerCase() === "true" || parts[2] === "1" : true,
            options: parts[3] || undefined,
            description: parts[4] || undefined,
          });
        }
      } else {
        // "lines" format: 1 question per line (ideal for Google Forms / notepad paste)
        const lines = importQRawText.trim().split(/\r?\n/).filter(Boolean);
        for (const line of lines) {
          const clean = line.replace(/^\d+[\.\)]\s*/, "").trim();
          if (!clean) continue;
          const isParagraph = clean.toLowerCase().includes("why") || clean.toLowerCase().includes("tell us") || clean.toLowerCase().includes("describe") || clean.toLowerCase().includes("experience");
          questionsPayload.push({
            label: clean,
            type: isParagraph ? "PARAGRAPH" : "TEXT",
            required: true,
          });
        }
      }

      const res = await fetch(`/api/positions/${activePosition.id}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: questionsPayload }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setImportQMsg({ type: "success", text: data.message || `Imported ${data.count} questions!` });
        setImportQRawText("");
        fetchGuildData();
        setTimeout(() => {
          setImportQModal(false);
          setImportQMsg(null);
        }, 1500);
      } else {
        setImportQMsg({ type: "error", text: data.error || "Failed to import questions." });
      }
    } catch (err: any) {
      setImportQMsg({ type: "error", text: err.message || "Invalid question format." });
    } finally {
      setImportingQ(false);
    }
  };

  const handleExportFormJson = (pos: any) => {
    if (!pos) return;
    const formExport = {
      title: pos.title,
      department: pos.department,
      description: pos.description,
      questions: (pos.questions || []).map((q: any) => ({
        label: q.label,
        type: q.type,
        required: q.required,
        options: q.options || undefined,
        description: q.description || undefined,
      })),
    };
    const blob = new Blob([JSON.stringify(formExport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pos.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_form_template.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportOpeningSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importPosRawText.trim()) return;
    setImportingPos(true);
    setImportPosMsg(null);

    try {
      const parsed = JSON.parse(importPosRawText.trim());
      const res = await fetch("/api/positions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId: params.guildId,
          title: parsed.title || parsed.name || "Imported Opening",
          department: parsed.department || "General",
          description: parsed.description || "Imported application form.",
          acceptRoleId: parsed.acceptRoleId || undefined,
          questions: parsed.questions || [],
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setImportPosMsg({ type: "success", text: data.message || "Opening and questions imported!" });
        setImportPosRawText("");
        setSelectedPosId(data.position.id);
        fetchGuildData();
        setTimeout(() => {
          setImportPosModal(false);
          setImportPosMsg(null);
        }, 1500);
      } else {
        setImportPosMsg({ type: "error", text: data.error || "Failed to import opening." });
      }
    } catch (err: any) {
      setImportPosMsg({ type: "error", text: err.message || "Invalid JSON form structure." });
    } finally {
      setImportingPos(false);
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
          conditionalParentId: newQCondParent || undefined,
          conditionalValue: newQCondVal || undefined,
        }),
      });
      if (res.ok) {
        setNewQModal(false);
        setNewQLabel("");
        setNewQDesc("");
        setNewQOptions("");
        setNewQCondParent("");
        setNewQCondVal("");
        fetchGuildData();
      }
    } catch (e) {}
  };

  const handleMoveQuestion = async (qId: string, direction: "up" | "down") => {
    if (!activePosition) return;
    const sorted = [...activePosition.questions].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((q) => q.id === qId);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === sorted.length - 1) return;

    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    const currentQ = sorted[idx];
    const targetQ = sorted[targetIdx];

    try {
      await fetch(`/api/positions/${activePosition.id}/questions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: [
            { id: currentQ.id, order: targetQ.order },
            { id: targetQ.id, order: currentQ.order },
          ],
        }),
      });
      fetchGuildData();
    } catch (e) {
      console.error(e);
    }
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

  const [initLoading, setInitLoading] = useState(false);

  const handleAutoInit = async () => {
    setInitLoading(true);
    try {
      const res = await fetch("/api/guilds/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: params.guildId,
          name: params.guildId === "1565063649679122684" ? "RoleFlow Official" : `Community (${params.guildId})`,
          vanitySlug: params.guildId === "1565063649679122684" ? "roleflow" : undefined,
        }),
      });
      if (res.ok) {
        fetchGuildData();
      } else {
        const err = await res.json();
        alert(err.error || "Please log in first to initialize this server.");
      }
    } catch (e: any) {
      alert("Error initializing server");
    } finally {
      setInitLoading(false);
    }
  };

  const handleVerifyBot = async () => {
    if (!botTokenInput.trim()) {
      setBotFeedbackMsg({ text: "Please enter a bot token first.", error: true });
      return;
    }
    setVerifyingBot(true);
    setBotFeedbackMsg(null);
    try {
      const res = await fetch(`/api/guilds/${params.guildId}/bot/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken: botTokenInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setBotVerifiedInfo(data.bot);
        setBotFeedbackMsg({ text: `Connected: ${data.bot.username}#${data.bot.discriminator}` });
      } else {
        setBotFeedbackMsg({ text: data.error || "Invalid bot token", error: true });
      }
    } catch (e: any) {
      setBotFeedbackMsg({ text: e.message, error: true });
    } finally {
      setVerifyingBot(false);
    }
  };

  const handleAutoSetupChannels = async () => {
    setSettingUpBot(true);
    setBotFeedbackMsg(null);
    try {
      const res = await fetch(`/api/guilds/${params.guildId}/bot/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken: botTokenInput.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.logChannelId) setLogChannelInput(data.logChannelId);
        if (data.staffRoleId) setStaffPingRoleInput(data.staffRoleId);
        setBotFeedbackMsg({ text: "Channels (#applications-log) and Roles (@Staff Reviewer) created on Discord!" });
        fetchGuildData();
      } else {
        setBotFeedbackMsg({ text: data.error || "Failed to set up server channels", error: true });
      }
    } catch (e: any) {
      setBotFeedbackMsg({ text: e.message, error: true });
    } finally {
      setSettingUpBot(false);
    }
  };

  const handleSendTestEmbed = async () => {
    setTestingEmbed(true);
    setBotFeedbackMsg(null);
    try {
      const res = await fetch(`/api/guilds/${params.guildId}/bot/test-embed`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBotFeedbackMsg({ text: "Test embed successfully sent to your Discord channel!" });
      } else {
        setBotFeedbackMsg({ text: data.error || "Failed sending test embed", error: true });
      }
    } catch (e: any) {
      setBotFeedbackMsg({ text: e.message, error: true });
    } finally {
      setTestingEmbed(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-xs text-slate-400">Loading community dashboard...</p>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4 text-rose-400">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          You do not own or manage this community. Applicant data, review notes, and bot settings are private to authorized community staff.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white transition-all shadow-md shadow-violet-600/30"
          >
            Your Communities
          </Link>
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    );
  }

  if (!guild) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4 text-purple-400">
          <Server className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Community Not Initialized</h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Discord Server ID <span className="font-mono text-purple-300 font-semibold">{params.guildId}</span> is not registered on RoleFlow yet.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleAutoInit}
            disabled={initLoading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{initLoading ? "Initializing..." : "Initialize Community Now"}</span>
          </button>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition-colors text-center"
          >
            All Communities
          </Link>
        </div>
      </div>
    );
  }

  const filteredApps = guild.applications.filter((a) => {
    const matchesStatus = statusFilter === "ALL" || a.status === statusFilter;
    const matchesTag = tagFilter === "ALL" || (a.tags && a.tags.split(",").map((t) => t.trim()).includes(tagFilter));
    return matchesStatus && matchesTag;
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
          onClick={() => setActiveTab("overview")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors ${
            activeTab === "overview"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <span>Overview</span>
        </button>
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
          <span>Discord Bot</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
            SOON
          </span>
        </button>

        <button
          onClick={() => setActiveTab("staff")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeTab === "staff"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Team & Staff ({staffList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeTab === "settings"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Community Settings & Gating</span>
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
          {/* Status & Tag Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-white/5">
            <div className="flex items-center gap-2 overflow-x-auto">
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

            <div className="flex items-center gap-2">
              {/* Tag Filter */}
              <div className="flex items-center gap-1.5 bg-surface px-2.5 py-1 rounded-lg border border-white/10 text-xs">
                <span className="text-slate-400 text-[11px]">Tag:</span>
                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-slate-900 text-white">All Tags</option>
                  <option value="🔥 High Priority" className="bg-slate-900 text-amber-300">🔥 High Priority</option>
                  <option value="👀 Under Review" className="bg-slate-900 text-cyan-300">👀 Under Review</option>
                  <option value="⭐ Former Staff" className="bg-slate-900 text-purple-300">⭐ Former Staff</option>
                  <option value="🎨 Portfolio Check" className="bg-slate-900 text-emerald-300">🎨 Portfolio Check</option>
                  <option value="🌱 Trainee" className="bg-slate-900 text-blue-300">🌱 Trainee</option>
                </select>
              </div>

              {/* Select All Checkbox */}
              <button
                type="button"
                onClick={() => {
                  if (selectedAppIds.length === filteredApps.length) {
                    setSelectedAppIds([]);
                  } else {
                    setSelectedAppIds(filteredApps.map((a: any) => a.id));
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 border border-white/10 transition-colors"
              >
                {selectedAppIds.length === filteredApps.length && filteredApps.length > 0 ? "Deselect All" : "Select All"}
              </button>

              {/* Import CSV / JSON */}
              <button
                type="button"
                onClick={() => setImportModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Import applications from CSV or JSON"
              >
                <Upload className="w-3 h-3 text-purple-400" />
                <span>Import</span>
              </button>

              {/* Export CSV */}
              <button
                type="button"
                onClick={handleExportSelectedCsv}
                className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Export applications to CSV"
              >
                <Download className="w-3 h-3" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Applicant Cards List */}
            <div className={`lg:col-span-5 space-y-3 lg:max-h-[750px] lg:overflow-y-auto pr-1 ${selectedApp ? "hidden lg:block" : "block"}`}>
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
                      className={`p-4 rounded-xl cursor-pointer transition-all border relative ${
                        isSelected
                          ? "bg-purple-950/30 border-purple-500/60 shadow-lg shadow-purple-500/10"
                          : "glass-panel border-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={selectedAppIds.includes(app.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              setSelectedAppIds((prev) =>
                                prev.includes(app.id) ? prev.filter((id) => id !== app.id) : [...prev, app.id]
                              );
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1 w-4 h-4 rounded text-purple-600 bg-surface border-white/20 focus:ring-purple-500 cursor-pointer"
                          />
                          <img
                            src={app.user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                            alt={app.user.username}
                            className="w-8 h-8 rounded-full border border-white/10 shrink-0"
                          />
                          <div>
                            <span className="text-xs font-bold text-white block">
                              {app.user.username}
                            </span>
                            <span className="text-[10px] text-purple-300">
                              {app.position.title}
                            </span>
                            {app.tags && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {app.tags.split(",").map((t: string) => t.trim()).filter(Boolean).map((t: string) => (
                                  <span key={t} className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <StatusBadge status={app.status} size="sm" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteApplication(app.id);
                            }}
                            className="p-1 rounded-md hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Delete this application"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
            <div className={`lg:col-span-7 ${selectedApp ? "block" : "hidden lg:block"}`}>
              {selectedApp && (
                <button
                  type="button"
                  onClick={() => { setSelectedApp(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="lg:hidden mb-3 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200"
                >
                  ← Back to applications
                </button>
              )}
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

                      <button
                        onClick={() => handleDeleteApplication(selectedApp.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 transition-colors flex items-center gap-1.5 ml-auto"
                        title="Permanently delete this application"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Application</span>
                      </button>
                    </div>

                    <div className="pt-2">
                      <div className="pb-2"><SavedReplyPicker guildId={guild.id} type="REJECT" currentText={decisionNote} onPick={setDecisionNote} /></div>
                        <input
                        type="text"
                        placeholder="Optional feedback / decision note (included in applicant's notification)..."
                        value={decisionNote}
                        onChange={(e) => setDecisionNote(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Applicant Tags & Department Badging */}
                  <div className="p-4 rounded-xl bg-surface border border-white/5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-purple-400" />
                        Applicant Tags & Badges:
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {["🔥 High Priority", "👀 Under Review", "⭐ Former Staff", "🎨 Portfolio Check", "🌱 Trainee"].map((t) => {
                        const hasTag = selectedApp.tags && selectedApp.tags.split(",").map((x: string) => x.trim()).includes(t);
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => handleToggleAppTag(selectedApp.id, t)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                              hasTag
                                ? "bg-purple-600/30 text-purple-200 border-purple-500/50 shadow-sm shadow-purple-500/20"
                                : "bg-white/5 text-slate-400 border-white/5 hover:text-white hover:bg-white/10"
                            }`}
                          >
                            {t} {hasTag ? "✓" : "+"}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* In-App Applicant Messaging & Clarification Threads */}
                  <div className="p-4 rounded-xl bg-surface border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Clarification Thread with Applicant
                      </h3>
                      <span className="text-[10px] text-slate-400">In-App Chat</span>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {chatMessages.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-2">
                          No clarification questions asked yet. Send a message below to ask this applicant questions directly.
                        </p>
                      ) : (
                        chatMessages.map((m: any) => (
                          <div
                            key={m.id}
                            className={`p-3 rounded-xl text-xs space-y-1 ${
                              m.senderRole === "STAFF"
                                ? "bg-purple-950/30 border border-purple-500/20 text-purple-200 ml-4"
                                : "bg-white/5 border border-white/5 text-slate-200 mr-4"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[11px] text-white">
                                {m.senderName} ({m.senderRole === "STAFF" ? "Staff" : "Applicant"})
                              </span>
                              <span className="text-[10px] text-slate-500">{formatDate(m.createdAt)}</span>
                            </div>
                            <p className="whitespace-pre-wrap">{m.content}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <SavedReplyPicker guildId={guild.id} currentText={newChatContent} onPick={setNewChatContent} />
                      <input
                        type="text"
                        placeholder="Ask applicant a clarification question..."
                        value={newChatContent}
                        onChange={(e) => setNewChatContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(selectedApp.id);
                          }
                        }}
                        className="flex-1 px-3 py-2 rounded-xl bg-background border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                      <button
                        type="button"
                        disabled={sendingChat || !newChatContent.trim()}
                        onClick={() => handleSendMessage(selectedApp.id)}
                        className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </button>
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

                    {/* Quick Staff Voting Actions (Feature #3) */}
                    <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">Cast Staff Vote:</span>
                        <span className="text-[11px] font-mono font-bold text-purple-300">
                          {selectedApp.reviews.filter((r: any) => (r.score ?? 0) >= 4).length} / {guild.votePassThreshold || 2} Approvals Needed
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            await fetch(`/api/applications/${selectedApp.id}/reviews`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ score: 5, comment: "👍 Voted to Approve candidate." }),
                            });
                            fetchGuildData();
                          }}
                          className="flex-1 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all text-center"
                        >
                          👍 Vote to Approve (+1)
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await fetch(`/api/applications/${selectedApp.id}/reviews`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ score: 1, comment: "👎 Voted to Deny candidate." }),
                            });
                            fetchGuildData();
                          }}
                          className="flex-1 py-2 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all text-center"
                        >
                          👎 Vote to Deny (-1)
                        </button>
                      </div>
                    </div>

                    {selectedApp.reviews.map((rev: any) => (
                      <div key={rev.id} className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">{rev.reviewer.username}</span>
                          <div className="flex items-center gap-2">
                            {rev.score && (
                              <span className="flex items-center gap-1 text-amber-400">
                                <Star className="w-3 h-3 fill-amber-400" />
                                {rev.score}/5
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteReview(selectedApp.id, rev.id)}
                              className="p-1 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                              title="Delete review note"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
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

          {/* Floating Bulk Action Bar */}
          {selectedAppIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-xl border border-purple-500/40 shadow-2xl rounded-2xl px-6 py-3.5 flex items-center gap-3.5 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                  {selectedAppIds.length}
                </span>
                <span className="text-xs font-semibold text-white">selected</span>
              </div>

              <div className="h-4 w-px bg-white/20" />

              <button
                type="button"
                disabled={bulkProcessing}
                onClick={() => handleBulkAction("ACCEPT")}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30"
              >
                {bulkProcessing ? "Processing..." : "Batch Accept"}
              </button>

              <button
                type="button"
                disabled={bulkProcessing}
                onClick={() => handleBulkAction("REJECT")}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/30"
              >
                Batch Deny
              </button>

              <button
                type="button"
                disabled={bulkProcessing}
                onClick={() => {
                  if (confirm(`Are you sure you want to permanently delete all ${selectedAppIds.length} selected applications? This cannot be undone.`)) {
                    handleBulkAction("DELETE");
                  }
                }}
                className="px-3.5 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                title="Permanently delete selected applications"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Batch Delete</span>
              </button>

              <button
                type="button"
                onClick={handleExportSelectedCsv}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all flex items-center gap-1.5"
              >
                <Download className="w-3 h-3" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAppIds([])}
                className="text-xs text-slate-400 hover:text-white transition-colors ml-2"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: VISUAL FORM BUILDER */}
          {activeTab === "overview" && (
            <OverviewPanel guildId={guild.id} onOpenApplications={() => setActiveTab("applications")} />
          )}

          {activeTab === "staff" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h3 className="mb-1 text-lg font-bold text-white">Appoint Team Member</h3>
                <p className="mb-4 text-sm text-slate-400">Add staff by their Discord user ID. Only the community owner can manage the team.</p>
                <form onSubmit={handleAddStaff} className="grid gap-3 md:grid-cols-2">
                  <input value={newStaffUserId} onChange={(e) => setNewStaffUserId(e.target.value)} placeholder="Discord User ID (17-20 digits)" required className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-purple-500" />
                  <input value={newStaffUsername} onChange={(e) => setNewStaffUsername(e.target.value)} placeholder="Display name (optional)" className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-purple-500" />
                  <input value={newStaffTitle} onChange={(e) => setNewStaffTitle(e.target.value)} placeholder="Role title, e.g. Lead Recruiter" className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-purple-500" />
                  <select value={newStaffPerms} onChange={(e) => setNewStaffPerms(e.target.value)} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-purple-500">
                    <option value="view_only">View only</option>
                    <option value="vote_only">Vote only</option>
                    <option value="full_decision">Full decision (accept / reject)</option>
                    <option value="position_editor">Position editor</option>
                  </select>
                  <button type="submit" disabled={addingStaff || !newStaffUserId.trim()} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50 md:col-span-2">
                    {addingStaff ? "Adding..." : "Add staff member"}
                  </button>
                </form>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h3 className="mb-3 text-lg font-bold text-white">Current team ({staffList.length})</h3>
                {staffList.length === 0 ? (
                  <p className="text-sm text-slate-500">No staff yet.</p>
                ) : (
                  <ul>
                    {staffList.map((s: any) => (
                      <li key={s.userId} className="flex items-center justify-between border-b border-white/5 py-3">
                        <div>
                          <div className="font-medium text-white">{s.username || s.userId}</div>
                          <div className="text-xs text-slate-400">{s.roleTitle} · {s.permissions}</div>
                        </div>
                        <button onClick={() => handleDeleteStaff(s.userId)} className="text-xs text-rose-400 hover:text-rose-300">Remove</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

      {activeTab === "builder" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Visual Form Builder & Openings</h2>
              <p className="text-xs text-slate-400">
                Design custom application questionnaires, questions types, and required fields.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setImportPosModal(true)}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Import entire form or opening from JSON"
              >
                <Upload className="w-3.5 h-3.5 text-purple-400" />
                <span>Import Opening (JSON)</span>
              </button>

              <button
                onClick={() => setNewPosModal(true)}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-violet-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Opening</span>
              </button>
            </div>
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
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      p.isOpen ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                    }`}>
                      {p.isOpen ? "OPEN" : "CLOSED"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{p.department}</span>
                    <span className="text-[10px] text-purple-300 font-mono">
                      {p.questions?.length || 0} questions
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Questions List & Editor */}
            <div className="lg:col-span-8">
              {activePosition ? (
                <div className="glass-panel rounded-2xl border border-white/10 p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-white/10">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{activePosition.title}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          activePosition.isOpen ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        }`}>
                          {activePosition.isOpen ? "ACCEPTING APPLICATIONS" : "APPLICATIONS CLOSED"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                        {activePosition.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => openEditPositionModal(activePosition)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-colors shadow-sm"
                        title="Edit application name, department, description, and settings"
                      >
                        <Pencil className="w-3.5 h-3.5 text-purple-400" />
                        <span>Edit Opening</span>
                      </button>

                      <button
                        onClick={() => handleTogglePositionOpen(activePosition.id, activePosition.isOpen)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          activePosition.isOpen
                            ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30"
                            : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        {activePosition.isOpen ? "Close Opening" : "Re-open Opening"}
                      </button>

                      <button
                        onClick={() => setNewQModal(true)}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-600/30"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Question</span>
                      </button>

                      <button
                        onClick={() => handleDeletePosition(activePosition.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-white border border-red-500/20 transition-colors"
                        title="Delete this opening"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
                              {q.conditionalParentId && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                  Conditional
                                </span>
                              )}
                            </div>
                            {q.description && (
                              <p className="text-[11px] text-slate-400 pl-4">{q.description}</p>
                            )}
                            {q.options && (
                              <p className="text-[10px] text-purple-300 pl-4 font-mono">Options: {q.options}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveQuestion(q.id, "up")}
                              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-20"
                              title="Move Question Up"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === (activePosition.questions?.length ?? 1) - 1}
                              onClick={() => handleMoveQuestion(q.id, "down")}
                              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-20"
                              title="Move Question Down"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                              title="Delete question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
                    <option value="PORTFOLIO">Portfolio / Showcase Link</option>
                    <option value="FILE">File / Screenshot Asset URL</option>
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

                {/* Conditional Question Settings */}
                <div className="p-3 rounded-xl bg-surface/50 border border-white/5 space-y-2">
                  <label className="text-xs font-semibold text-purple-300 block">
                    Conditional Visibility (Optional)
                  </label>
                  <p className="text-[10px] text-slate-400">
                    Only display this question if a previous question is answered with a specific value.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Parent Question</label>
                      <select
                        value={newQCondParent}
                        onChange={(e) => setNewQCondParent(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-surface border border-white/10 text-[11px] text-white"
                      >
                        <option value="">None (Always Show)</option>
                        {activePosition?.questions.map((q, qIdx) => (
                          <option key={q.id} value={q.id}>
                            #{qIdx + 1} - {q.label.slice(0, 24)}...
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Trigger Answer</label>
                      <input
                        type="text"
                        placeholder="e.g. Yes"
                        value={newQCondVal}
                        onChange={(e) => setNewQCondVal(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-surface border border-white/10 text-[11px] text-white"
                      />
                    </div>
                  </div>
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
        <div className="max-w-3xl space-y-6 animate-fadeIn">
          {/* Coming Soon Notice Card */}
          <div className="glass-panel rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Discord Bot Dispatcher</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      COMING SOON
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Automated custom Discord bot token hosting, 1-click server channel creators, and automated role assigners are currently in development for RoleFlow v2.0.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Discord Integration is 100% Optional for Communities</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                You do not need a Discord server or bot to run your applications. You can manage, review, score, and interview candidates right through this RoleFlow dashboard.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("settings")}
                  className="px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/40 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-semibold transition-colors"
                >
                  Configure Discord Webhooks (Operational Now) →
                </button>
              </div>
            </div>
          </div>
        <div className="glass-panel rounded-2xl border border-white/10 p-6 sm:p-8 space-y-6 opacity-60 pointer-events-none">
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
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-purple-400" />
                    Your Discord Bot Token
                  </label>
                  <button
                    type="button"
                    onClick={handleVerifyBot}
                    disabled={verifyingBot}
                    className="text-[11px] text-purple-300 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${verifyingBot ? "animate-spin" : ""}`} />
                    <span>{verifyingBot ? "Verifying..." : "Verify Token"}</span>
                  </button>
                </div>
                <input
                  type="password"
                  placeholder="Enter bot token from Discord Developer Portal..."
                  value={botTokenInput}
                  onChange={(e) => setBotTokenInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                {botVerifiedInfo ? (
                  <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      🟢 Bot Online: <strong>{botVerifiedInfo.username}#{botVerifiedInfo.discriminator}</strong>
                    </span>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400">
                    RoleFlow securely stores your token to dispatch embeds and grant roles on your server&apos;s behalf.
                  </p>
                )}
              </div>

              {/* 1-Click Server Setup Box */}
              <div className="p-4 rounded-xl bg-surface/60 border border-surface-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    1-Click Discord Server Auto-Setup
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Creates <strong>#applications-log</strong> and <strong>@Staff Reviewer</strong> role on your Discord server automatically.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAutoSetupChannels}
                  disabled={settingUpBot}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold shrink-0 transition-all shadow-md shadow-purple-600/30 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{settingUpBot ? "Creating..." : "Auto-Setup Server"}</span>
                </button>
              </div>

              {botFeedbackMsg && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    botFeedbackMsg.error
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  }`}
                >
                  {botFeedbackMsg.error ? (
                    <XCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  )}
                  <span>{botFeedbackMsg.text}</span>
                </div>
              )}

              {/* Staff Log Channel ID */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-white">
                    Staff Alert Channel ID (#applications-log)
                  </label>
                  {logChannelInput && (
                    <button
                      type="button"
                      onClick={handleSendTestEmbed}
                      disabled={testingEmbed}
                      className="text-[11px] text-violet-300 hover:text-white flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      <span>{testingEmbed ? "Sending..." : "Send Test Embed"}</span>
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="e.g. 1565068094857154571"
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
        </div>
      )}

      {/* TAB 4: COMMUNITY SETTINGS, GATING & POLICIES */}
      {activeTab === "settings" && (
        <div className="max-w-3xl space-y-6">
          {/* License & Subscription Tier Card (Coming Soon) */}
          <div className="glass-panel rounded-2xl border border-purple-500/30 bg-purple-950/15 p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">Community Subscription Tier</h3>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      COMING SOON
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    License keys and paid subscription tiers are currently in development. Full functionality is unlocked for all communities during Open Beta!
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                RoleFlow Pro license keys will launch following the conclusion of the public beta.
              </span>
              <span className="font-semibold text-purple-400 text-[11px]">Beta Access Active</span>
            </div>
          </div>

          {/* General Community Info */}
          <div className="glass-panel rounded-2xl border border-white/10 p-6 sm:p-8 space-y-5">
            <div>
              <h2 className="text-base font-bold text-white mb-1">Community Profile & Branding</h2>
              <p className="text-xs text-slate-400">
                Configure your public applicant portal, vanity URL, and branding.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Community Name
                </label>
                <input
                  type="text"
                  value={communityNameInput}
                  onChange={(e) => setCommunityNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Custom Vanity URL
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-black/40 border border-r-0 border-white/10 rounded-l-xl text-[11px] text-slate-500 font-mono">
                    roleflow.site/c/
                  </span>
                  <input
                    type="text"
                    value={vanitySlugInput}
                    onChange={(e) => setVanitySlugInput(e.target.value)}
                    placeholder="my-server"
                    className="w-full px-3 py-2.5 rounded-r-xl bg-surface border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Community Description
              </label>
              <textarea
                rows={2}
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                placeholder="Describe your studio or gaming community..."
                className="w-full px-3.5 py-2 rounded-xl bg-surface border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Tags (Comma-separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Roblox, Studio, Moderation, Development"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Server Icon Image URL
                </label>
                <input
                  type="text"
                  value={iconInput}
                  onChange={(e) => setIconInput(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Banner Image URL
                </label>
                <input
                  type="text"
                  value={bannerInput}
                  onChange={(e) => setBannerInput(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Discord Webhooks for Audit Logs */}
          <div className="glass-panel rounded-2xl border border-white/10 p-6 sm:p-8 space-y-4">
            <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Bell className="w-4 h-4 text-purple-400" />
              Discord Audit Log Webhook
            </h2>
            <p className="text-xs text-slate-400">
              Receive instant Discord webhook embeds whenever an application is submitted, accepted, or rejected.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Discord Webhook URL
              </label>
              <input
                type="text"
                value={webhookUrlInput}
                onChange={(e) => setWebhookUrlInput(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Custom Community Portal Themes & Accents */}
          <div className="glass-panel rounded-2xl border border-white/10 p-6 sm:p-8 space-y-4">
            <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-400" />
              Public Portal Theme & Accents
            </h2>
            <p className="text-xs text-slate-400">
              Customize your community&apos;s public portal appearance (/c/[slug]).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Theme Preset
                </label>
                <select
                  value={portalThemeInput}
                  onChange={(e) => setPortalThemeInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="obsidian" className="bg-slate-900">Obsidian Dark (Default)</option>
                  <option value="cyberpunk" className="bg-slate-900">Cyberpunk Neon</option>
                  <option value="emerald" className="bg-slate-900">Emerald Forest</option>
                  <option value="royal" className="bg-slate-900">Royal Purple</option>
                  <option value="crimson" className="bg-slate-900">Crimson Glow</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Community Page Layout</label>
                <select
                  value={portalLayoutInput}
                  onChange={(e) => setPortalLayoutInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="banner" className="bg-slate-900">Banner-led (default)</option>
                  <option value="minimal" className="bg-slate-900">Minimal (no banner)</option>
                  <option value="cards" className="bg-slate-900">Card-led (openings in a grid)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Accent Hex Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={portalAccentColorInput}
                    onChange={(e) => setPortalAccentColorInput(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-white/10 bg-transparent cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={portalAccentColorInput}
                    onChange={(e) => setPortalAccentColorInput(e.target.value)}
                    placeholder="#8B5CF6"
                    className="flex-1 px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-white/5">
              <div>
                <span className="text-xs font-bold text-white block">
                  Discord Server Widget Embed
                </span>
                <p className="text-[10px] text-slate-400">
                  Embed live Discord member counts and voice channels directly on your public community portal.
                </p>
              </div>
              <input
                type="checkbox"
                checked={discordWidgetToggle}
                onChange={(e) => setDiscordWidgetToggle(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Application Rules & Gating Policies */}
          <div className="glass-panel rounded-2xl border border-white/10 p-6 sm:p-8 space-y-4">
            <h2 className="text-base font-bold text-white mb-1">Access Rules & Security Gating</h2>

            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div>
                <span className="text-xs font-bold text-white block">
                  Require Membership in Discord Server
                </span>
                <p className="text-[10px] text-slate-400">
                  Applicants must be joined to your Discord server before they are allowed to submit.
                </p>
              </div>
              <input
                type="checkbox"
                checked={requireInGuildToggle}
                onChange={(e) => setRequireInGuildToggle(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-white/5">
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
                className="w-4 h-4 rounded text-purple-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-white/5">
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
                className="w-4 h-4 rounded text-purple-600 cursor-pointer"
              />
            </div>

            {/* Blind Voting Threshold */}
            {blindVotingToggle && (
              <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-2">
                <label className="block text-xs font-bold text-purple-300">
                  Required Staff Approval Votes Threshold
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={votePassThresholdInput}
                  onChange={(e) => setVotePassThresholdInput(Number(e.target.value))}
                  className="w-32 px-3 py-1.5 rounded-lg bg-surface border border-white/10 text-xs text-white font-mono focus:border-purple-500"
                />
                <p className="text-[10px] text-slate-400">
                  Number of positive staff approval votes needed to pass a candidate.
                </p>
              </div>
            )}

            {/* Roblox Group Verification Gating (Feature #2) */}
            <div className="py-3 border-b border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Enforce Official Roblox Group Membership & Rank
                  </span>
                  <p className="text-[10px] text-slate-400">
                    Automatically verifies if the applicant is a member of your Roblox group with at least the required rank.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={robloxGroupCheckToggle}
                  onChange={(e) => setRobloxGroupCheckToggle(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 cursor-pointer"
                />
              </div>

              {robloxGroupCheckToggle && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-black/40 border border-purple-500/20">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Roblox Group ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 15928371"
                      value={robloxGroupIdInput}
                      onChange={(e) => setRobloxGroupIdInput(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-surface border border-white/10 text-xs text-white font-mono focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Minimum Required Rank (1-255)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={255}
                      value={robloxMinRankInput}
                      onChange={(e) => setRobloxMinRankInput(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-surface border border-white/10 text-xs text-white font-mono focus:border-purple-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white">
                  Re-Application Cooldown (Days)
                </label>
                <input
                  type="number"
                  min={0}
                  max={90}
                  value={cooldownInput}
                  onChange={(e) => setCooldownInput(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
                />
                <p className="text-[10px] text-slate-400">
                  Rejected applicants must wait this many days before re-applying. Set to 0 to disable.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white">
                  Minimum Discord Account Age (Days)
                </label>
                <input
                  type="number"
                  min={0}
                  max={365}
                  value={minAccountAgeInput}
                  onChange={(e) => setMinAccountAgeInput(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
                />
                <p className="text-[10px] text-slate-400">
                  Prevents freshly created alt accounts from submitting spam applications.
                </p>
              </div>
            </div>

            <div className="pt-3">
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-violet-600/30"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingSettings ? "Saving Settings..." : "Save Community Settings"}</span>
              </button>
            </div>
          </div>

          {/* Blacklist Management */}
          <div className="glass-panel rounded-2xl border border-white/10 p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UserX className="w-4 h-4 text-rose-400" />
              Community Anti-Troll Blacklist
            </h2>

            <div className="flex flex-col sm:flex-row gap-2">
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
                className="sm:w-48 px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={handleAddBlacklist}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shrink-0"
              >
                Add Blacklist
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
          {/* Modal: Import Applications (CSV / JSON) */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel border border-white/10 rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-purple-400" />
                <h3 className="text-base font-bold text-white">Import Applications</h3>
              </div>
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-semibold"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Import past candidate submissions, offline records, or external forms into your RoleFlow dashboard using CSV or JSON.
            </p>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setImportFormat("csv")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                      importFormat === "csv"
                        ? "bg-purple-600 text-white border-purple-500"
                        : "bg-surface border-white/10 text-slate-400"
                    }`}
                  >
                    CSV Format
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportFormat("json")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                      importFormat === "json"
                        ? "bg-purple-600 text-white border-purple-500"
                        : "bg-surface border-white/10 text-slate-400"
                    }`}
                  >
                    JSON Format
                  </button>
                </div>

                <label className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-purple-300 font-semibold cursor-pointer">
                  <span>Choose File</span>
                  <input
                    type="file"
                    accept={importFormat === "csv" ? ".csv,.txt" : ".json"}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const content = evt.target?.result as string;
                        if (content) setImportRawText(content);
                      };
                      reader.readAsText(file);
                    }}
                  />
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  {importFormat === "csv"
                    ? "Paste CSV rows (e.g. Username, RobloxUsername, Position, Status, Tags, Notes):"
                    : "Paste JSON array:"}
                </label>
                <textarea
                  rows={7}
                  required
                  value={importRawText}
                  onChange={(e) => setImportRawText(e.target.value)}
                  placeholder={importFormat === "csv" ? CSV_IMPORT_SAMPLE : JSON_IMPORT_SAMPLE}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              {importResultMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    importResultMsg.type === "success"
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                      : "bg-rose-500/15 border border-rose-500/30 text-rose-300"
                  }`}
                >
                  {importResultMsg.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>{importResultMsg.text}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importingData || !importRawText.trim()}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{importingData ? "Importing..." : "Start Import"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Import Questions in Bulk */}
      {importQModal && activePosition && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel border border-white/10 rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-purple-400" />
                <h3 className="text-base font-bold text-white">Import Questions into {activePosition.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setImportQModal(false)}
                className="text-slate-400 hover:text-white text-xs font-semibold"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Quickly paste questions from Google Forms, Discord, or notes. Questions will be automatically appended to this opening!
            </p>

            <form onSubmit={handleImportQuestionsSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setImportQFormat("lines")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                      importQFormat === "lines"
                        ? "bg-purple-600 text-white border-purple-500"
                        : "bg-surface border-white/10 text-slate-400"
                    }`}
                  >
                    1 Question Per Line
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportQFormat("json")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                      importQFormat === "json"
                        ? "bg-purple-600 text-white border-purple-500"
                        : "bg-surface border-white/10 text-slate-400"
                    }`}
                  >
                    JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportQFormat("csv")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                      importQFormat === "csv"
                        ? "bg-purple-600 text-white border-purple-500"
                        : "bg-surface border-white/10 text-slate-400"
                    }`}
                  >
                    CSV
                  </button>
                </div>

                <label className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-purple-300 font-semibold cursor-pointer">
                  <span>Load File</span>
                  <input
                    type="file"
                    accept=".txt,.csv,.json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const content = evt.target?.result as string;
                        if (content) setImportQRawText(content);
                      };
                      reader.readAsText(file);
                    }}
                  />
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  {importQFormat === "lines"
                    ? "Paste your list of questions (one per line):"
                    : importQFormat === "json"
                    ? 'Paste JSON array of questions (e.g. [{"label": "Age", "type": "NUMBER"}]):'
                    : "Paste CSV rows (Label, Type, Required, Options, Description):"}
                </label>
                <textarea
                  rows={7}
                  required
                  value={importQRawText}
                  onChange={(e) => setImportQRawText(e.target.value)}
                  placeholder={
                    importQFormat === "lines"
                      ? "What is your Discord username and tag?\nWhat is your Roblox profile URL?\nHow long have you been scripting in Luau?\nLink your portfolio or past game links.\nWhy do you want to join our studio?"
                      : importQFormat === "json"
                      ? '[\n  {\n    "label": "Roblox Profile URL",\n    "type": "TEXT",\n    "required": true\n  },\n  {\n    "label": "Why do you want to join?",\n    "type": "PARAGRAPH",\n    "required": true\n  }\n]'
                      : "Roblox Profile, TEXT, true\nWhy do you want to join?, PARAGRAPH, true\nYears of Experience, NUMBER, false"
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              {importQMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    importQMsg.type === "success"
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                      : "bg-rose-500/15 border border-rose-500/30 text-rose-300"
                  }`}
                >
                  {importQMsg.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>{importQMsg.text}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setImportQModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importingQ || !importQRawText.trim()}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{importingQ ? "Importing..." : "Import Questions"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Import Entire Opening & Form */}
      {importPosModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel border border-white/10 rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-purple-400" />
                <h3 className="text-base font-bold text-white">Import Entire Opening & Questions</h3>
              </div>
              <button
                type="button"
                onClick={() => setImportPosModal(false)}
                className="text-slate-400 hover:text-white text-xs font-semibold"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Import a full application opening along with all questionnaire questions from a saved RoleFlow template or JSON file.
            </p>

            <form onSubmit={handleImportOpeningSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">JSON Template Format:</span>
                <label className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-purple-300 font-semibold cursor-pointer">
                  <span>Load JSON File</span>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const content = evt.target?.result as string;
                        if (content) setImportPosRawText(content);
                      };
                      reader.readAsText(file);
                    }}
                  />
                </label>
              </div>

              <div>
                <textarea
                  rows={8}
                  required
                  value={importPosRawText}
                  onChange={(e) => setImportPosRawText(e.target.value)}
                  placeholder={`{\n  "title": "Lead Scripter",\n  "department": "Development",\n  "description": "We are seeking an experienced Luau gameplay programmer.",\n  "questions": [\n    { "label": "Roblox Profile Link", "type": "TEXT", "required": true },\n    { "label": "Describe your Luau framework experience", "type": "PARAGRAPH", "required": true }\n  ]\n}`}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              {importPosMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    importPosMsg.type === "success"
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                      : "bg-rose-500/15 border border-rose-500/30 text-rose-300"
                  }`}
                >
                  {importPosMsg.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>{importPosMsg.text}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setImportPosModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importingPos || !importPosRawText.trim()}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{importingPos ? "Importing..." : "Create Opening & Questions"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Opening / Position Modal */}
      {editPosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-surface border border-surface-border rounded-2xl shadow-2xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Edit Application Opening</h3>
                  <p className="text-[11px] text-slate-400">Modify application title, department, and requirements</p>
                </div>
              </div>
              <button
                onClick={() => setEditPosModal(false)}
                className="text-slate-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePositionEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Application Name / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Developer, Community Moderator"
                  value={editPosTitle}
                  onChange={(e) => setEditPosTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-surface-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Moderation, Development"
                    value={editPosDept}
                    onChange={(e) => setEditPosDept(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-surface-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Acceptance Discord Role ID
                  </label>
                  <input
                    type="text"
                    placeholder="Role ID (Optional)"
                    value={editPosRole}
                    onChange={(e) => setEditPosRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-surface-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Job Description & Candidate Criteria
                </label>
                <textarea
                  rows={4}
                  placeholder="Outline responsibilities, required qualifications, and expectations..."
                  value={editPosDesc}
                  onChange={(e) => setEditPosDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-surface-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-y"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editPosIsOpen}
                    onChange={(e) => setEditPosIsOpen(e.target.checked)}
                    className="w-4 h-4 rounded bg-surface border-white/20 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-xs text-slate-200 font-medium">Accepting New Applications (Open)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editPosIsPublic}
                    onChange={(e) => setEditPosIsPublic(e.target.checked)}
                    className="w-4 h-4 rounded bg-surface border-white/20 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-xs text-slate-200 font-medium">Display Publicly on Community Portal</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setEditPosModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPosEdit}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingPosEdit ? "Saving Changes..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}