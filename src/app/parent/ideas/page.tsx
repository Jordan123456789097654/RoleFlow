import React from "react";
import { ParentIdeaForm } from "@/components/parent/ParentForms";

export const metadata = {
  title: "Suggest a Tool or Feature | RoleFlow",
  description: "Help shape the future of RoleFlow. Suggest and vote on new tools for Roblox and Discord communities.",
};

export default function IdeasPage() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* Header */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-300">
            Community Roadmap
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            What should we build next?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-300">
            RoleFlow is guided by community feedback. The next new product in our family is chosen directly by the community, aiming for launch within 3 months.
          </p>
        </div>

        {/* Form Container */}
        <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-md sm:p-12">
          <div className="mb-8 border-b border-white/10 pb-6 text-sm text-slate-300">
            <h2 className="text-lg font-bold text-white mb-2">Submit a Tool or Feature Proposal</h2>
            <p>
              Tell us about the workflows that slow down your community staff or Roblox group operations. What tools would save you hours each week?
            </p>
          </div>

          <ParentIdeaForm />
        </div>
      </div>
    </div>
  );
}
