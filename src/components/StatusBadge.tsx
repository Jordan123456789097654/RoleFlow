import React from "react";
import { cn } from "@/lib/utils";
import { Clock, Eye, MessageSquare, CheckCircle, XCircle } from "lucide-react";

interface StatusBadgeProps {
  status: "PENDING" | "UNDER_REVIEW" | "INTERVIEW" | "ACCEPTED" | "REJECTED" | string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, className, size = "md" }: StatusBadgeProps) {
  const configs = {
    PENDING: {
      label: "Pending Review",
      color: "bg-slate-500/10 text-slate-300 border-slate-500/30",
      icon: Clock,
      dotColor: "bg-slate-400",
    },
    UNDER_REVIEW: {
      label: "Under Review",
      color: "bg-amber-500/10 text-amber-300 border-amber-500/30",
      icon: Eye,
      dotColor: "bg-amber-400 animate-pulse",
    },
    INTERVIEW: {
      label: "Interview Scheduled",
      color: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
      icon: MessageSquare,
      dotColor: "bg-cyan-400 animate-pulse",
    },
    ACCEPTED: {
      label: "Accepted",
      color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
      icon: CheckCircle,
      dotColor: "bg-emerald-400",
    },
    REJECTED: {
      label: "Rejected",
      color: "bg-rose-500/10 text-rose-300 border-rose-500/30",
      icon: XCircle,
      dotColor: "bg-rose-400",
    },
  };

  const current = configs[status as keyof typeof configs] || configs.PENDING;
  const Icon = current.icon;

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3.5 py-1.5 text-sm gap-2 font-medium",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border transition-colors",
        current.color,
        sizeStyles[size],
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", current.dotColor)} />
      <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
      <span>{current.label}</span>
    </span>
  );
}
