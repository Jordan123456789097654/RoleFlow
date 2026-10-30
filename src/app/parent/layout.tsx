import React from "react";
import { ParentHeader, ParentFooter } from "@/components/parent/ParentChrome";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#090a0f] text-slate-100 antialiased selection:bg-violet-600/40">
      <ParentHeader />
      <main className="flex-1">{children}</main>
      <ParentFooter />
    </div>
  );
}
