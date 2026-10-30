import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOG_POSTS } from "@/lib/parent-site";
import { ArrowLeft, Clock, Calendar, User } from "lucide-react";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = BLOG_POSTS.find((p) => p.slug === params.slug);
  if (!post) return { title: "Post Not Found | RoleFlow" };
  return {
    title: `${post.title} | RoleFlow Blog`,
    description: post.excerpt,
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = BLOG_POSTS.find((p) => p.slug === params.slug);
  if (!post) notFound();

  return (
    <div className="py-16 sm:py-24 bg-[#08090d] text-slate-100 min-h-screen">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to all articles
        </Link>

        <article className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 shadow-2xl backdrop-blur-md sm:p-12">
          {/* Metadata pill header */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400 border-b border-white/10 pb-6">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-violet-400" />
              {post.date}
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-violet-400" />
              {post.readTime}
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-violet-400" />
              {post.author}
            </span>
          </div>

          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-5xl leading-tight">
            {post.title}
          </h1>

          <p className="mt-4 text-base sm:text-lg font-medium text-violet-300 leading-relaxed">
            {post.excerpt}
          </p>

          {/* Body paragraphs */}
          <div className="mt-10 space-y-6 text-sm leading-relaxed text-slate-300 sm:text-base border-t border-white/10 pt-8">
            {post.content.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
