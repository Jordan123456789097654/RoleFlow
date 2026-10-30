import React from "react";
import { CommunityIdeasBoard } from "@/components/parent/CommunityIdeasBoard";

export const metadata = {
  title: "Roadmap & Community Feature Requests | RoleFlow",
  description: "Upvote community suggestions and shape the next product in the RoleFlow family.",
};

export default function IdeasPage() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Header */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-300">
            Community-Driven Roadmap
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            What should we build next?
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
            RoleFlow is guided by community feedback. The first new product in our family is chosen directly by the community, aiming for launch within 3 months.
          </p>
        </div>

        {/* Interactive Upvoting Board */}
        <div className="mt-14">
          <CommunityIdeasBoard />
        </div>
      </div>
    </div>
  );
}
