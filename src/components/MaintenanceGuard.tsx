"use client";

import React, { useState, useEffect } from "react";
import { Wrench } from "lucide-react";

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
      } catch {
        // Fallback: don't block on network error
      }
    }
    checkMaintenance();
  }, []);

  // If maintenance is enabled and visitor is not staff, show maintenance screen
  if (maintenance?.enabled && !isStaffOrAdmin) {
    return (
      <div className="page-wrap flex min-h-screen flex-col items-center justify-center py-16 text-center">
        <div className="max-w-xl">
          <Wrench className="mx-auto mb-8 h-8 w-8 text-accent" />
          <p className="eyebrow mb-4">Scheduled maintenance</p>
          <h1 className="display-lg">We&apos;ll be right back.</h1>
          <p className="lede mx-auto mt-6">
            {maintenance.message || "RoleFlow is undergoing scheduled maintenance. Your submissions and data are safe."}
          </p>

          <dl className="mx-auto mt-10 max-w-md divide-y divide-line border-y border-line text-left text-[14px]">
            <div className="py-3">
              <dt className="font-medium text-ink">Your data is safe</dt>
              <dd className="mt-1 text-muted">Application queues and records are preserved.</dd>
            </div>
            <div className="py-3">
              <dt className="font-medium text-ink">Staff access</dt>
              <dd className="mt-1 text-muted">Support staff and site admins can still sign in during maintenance.</dd>
            </div>
          </dl>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="/api/auth/login" className="btn-primary">Staff sign in</a>
            <a href="https://discord.gg/tKPbCXbmr9" target="_blank" rel="noopener noreferrer" className="btn-ghost">
              Status on Discord ↗
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {maintenance?.enabled && isStaffOrAdmin && (
        <div className="sticky top-0 z-50 flex items-center justify-center gap-2 border-b border-gold bg-gold-soft px-4 py-2 text-center text-[13px] font-medium text-gold">
          <Wrench className="h-3.5 w-3.5" />
          <span>Maintenance mode is on. Public visitors see the maintenance screen; staff override is active.</span>
        </div>
      )}
      {children}
    </>
  );
}
