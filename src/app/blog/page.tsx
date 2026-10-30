import React from "react";
import Link from "next/link";
import { BLOG_POSTS } from "@/lib/parent-site";

export const metadata = {
  title: "Blog & Updates | RoleFlow",
  description: "Product updates, announcements, and engineering notes from the RoleFlow team.",
};

export default function BlogPage() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Header */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-300">
            News &amp; Updates
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            The RoleFlow Blog
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
            Stay up to date with the latest product launches, architecture deep dives, and community spotlights.
          </p>
        </div>

        {/* Posts */}
        <div className="mt-16 space-y-8">
          {BLOG_POSTS.map((post) => (
            <article
              key={post.slug}
              className="group rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm transition-all hover:border-violet-500/40 hover:bg-white/[0.05]"
            >
              <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
                <time>{post.date}</time>
                <span>&bull;</span>
                <span>{post.readTime}</span>
              </div>

              <h2 className="mt-3 text-2xl font-bold text-white transition-colors group-hover:text-violet-300">
                {post.title}
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
                {post.excerpt}
              </p>

              <div className="mt-6 flex items-center justify-between">
                <span className="inline-flex items-center text-sm font-semibold text-violet-400 group-hover:text-violet-300">
                  Read full article &rarr;
                </span>
              </div>
            </article>
          ))}
        </div>

        {/* Newsletter Callout */}
        <div className="mt-16 rounded-2xl border border-white/10 bg-gradient-to-r from-violet-950/40 via-purple-900/20 to-slate-900/40 p-8 text-center sm:p-12">
          <h3 className="text-xl font-bold text-white">Subscribe to monthly product notes</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">
            One monthly email covering major platform updates, new tool releases, and community highlights. Opt-in only, one-click unsubscribe.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/#newsletter"
              className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
            >
              Subscribe on Homepage &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
