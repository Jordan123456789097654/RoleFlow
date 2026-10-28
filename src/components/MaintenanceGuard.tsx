"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Wrench, Shield, MessageCircle, RefreshCw, LifeBuoy } from "lucide-react";

interface MaintenanceGuardProps {
  isStaffOrAdmin: boolean;
  children: React.ReactNode;
}

export function MaintenanceGuard({ isStaffOrAdmin, children }: MaintenanceGuardProps) {
  const [maintenance, setMaintenance] = useState<{ enabled: boolean; message: string } | null>(null);

  useEffect(() => {
    async function checkMaintenance() {
      try {
        const res = await fetch("/api/admin/maintenance");
        if (res.ok) {
          const data = await res.json();
          setMaintenance(data);
        }
      } catch (e) {
        // Fallback: don't block on network error
      }
    }
    checkMaintenance();
  }, []);

  // If maintenance is enabled and visitor is not staff, show maintenance screen
  if (maintenance?.enabled && !isStaffOrAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center relative overflow-hidden z-50">
        <div className="ambient-glow" />
        <div className="fixed inset-0 bg-grid-pattern pointer-events-none opacity-40 z-0" />

        <div className="relative z-10 max-w-lg mx-auto glass-panel p-8 sm:p-12 rounded-3xl border border-amber-500/30 bg-surface/90 shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Wrench className="w-8 h-8 animate-bounce" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              PLATFORM UPGRADE IN PROGRESS
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Scheduled Maintenance</h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              {maintenance.message || "RoleFlow is currently undergoing scheduled platform maintenance. All submissions and data are secure."}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-400 space-y-1 text-left">
            <span className="font-semibold text-white block">Status Briefing:</span>
            <p>• Database integrity & application queues are fully preserved.</p>
            <p>• Verified Support Specialists and Site Administrators may bypass via Discord OAuth.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href="/api/auth/login"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Staff Login Bypass</span>
            </a>
            <a
              href="https://discord.gg/ZSGBbyEnWA"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Discord Status Server</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {maintenance?.enabled && isStaffOrAdmin && (
        <div className="w-full bg-amber-500/20 border-b border-amber-500/40 px-4 py-2 text-center text-xs text-amber-300 font-semibold flex items-center justify-center gap-2 z-50 sticky top-0 backdrop-blur-md">
          <Wrench className="w-3.5 h-3.5" />
          <span>MAINTENANCE MODE ACTIVE — Public visitors are seeing the maintenance screen. Staff override enabled.</span>
        </div>
      )}
      {children}
    </>
  );
}
