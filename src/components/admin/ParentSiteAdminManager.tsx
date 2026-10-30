"use client";

import React, { useState, useEffect } from "react";
import { LockdownCountdownEditor } from "@/components/admin/LockdownCountdownEditor";
import { Product, BlogPost } from "@/lib/parent-site";
import { BLOG_TEMPLATES, BlogPostTemplate } from "@/lib/blog-templates";
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  RefreshCw,
  Clock,
  Sparkles,
  BookOpen,
  ExternalLink,
  Check,
  Send,
  Mail,
  FileText,
  ChevronDown,
} from "lucide-react";

const card = "rounded-2xl border border-line bg-surface p-5";

export function ParentSiteAdminManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [countdown, setCountdown] = useState<{ targetDate: string | null; label: string | null }>({
    targetDate: null,
    label: null,
  });
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blasting, setBlasting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // Edit / Add product state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);

  // Edit / Add blog post state
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [sendEmailBlast, setSendEmailBlast] = useState(true);
  const [blogForm, setBlogForm] = useState<{
    slug: string;
    title: string;
    excerpt: string;
    author: string;
    readTime: string;
    content: string;
  }>({
    slug: "",
    title: "",
    excerpt: "",
    author: "RoleFlow Engineering",
    readTime: "3 min read",
    content: "",
  });

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/parent-site");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setCountdown(data.countdown || { targetDate: null, label: null });
        setBlogPosts(data.blogPosts || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveProducts = async (updated: Product[]) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/parent-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_products", products: updated }),
      });
      const data = await res.json();
      if (res.ok) {
        setProducts(updated);
        setEditingProduct(null);
        setMessage({ ok: true, text: "Products lineup saved successfully!" });
      } else {
        setMessage({ ok: false, text: data.error || "Failed to save." });
      }
    } catch {
      setMessage({ ok: false, text: "Network error saving products." });
    } finally {
      setSaving(false);
    }
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    let updated: Product[];
    if (isNewProduct) {
      updated = [...products, editingProduct];
    } else {
      updated = products.map((p) => (p.id === editingProduct.id ? editingProduct : p));
    }
    handleSaveProducts(updated);
  };

  const handleDeleteProduct = (id: string) => {
    if (!confirm("Are you sure you want to remove this product?")) return;
    const updated = products.filter((p) => p.id !== id);
    handleSaveProducts(updated);
  };

  const handleSaveCountdown = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/parent-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_countdown", ...countdown }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ ok: true, text: "Countdown settings updated!" });
      } else {
        setMessage({ ok: false, text: data.error || "Failed to save countdown." });
      }
    } catch {
      setMessage({ ok: false, text: "Network error saving countdown." });
    } finally {
      setSaving(false);
    }
  };

  const handleApplyTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (!templateId) return;
    const tpl = BLOG_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;

    setBlogForm({
      slug: tpl.defaultSlug,
      title: tpl.defaultTitle,
      excerpt: tpl.defaultExcerpt,
      author: tpl.defaultAuthor,
      readTime: tpl.defaultReadTime,
      content: tpl.content,
    });
  };

  const handleSaveBlogPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/parent-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_blog_post",
          ...blogForm,
          sendEmail: sendEmailBlast,
          content: blogForm.content.split("\n\n").filter(Boolean),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowBlogModal(false);
        setBlogForm({ slug: "", title: "", excerpt: "", author: "RoleFlow Engineering", readTime: "3 min read", content: "" });
        setSelectedTemplate("");
        setMessage({ ok: true, text: data.message || "Blog post published successfully!" });
        fetchData();
      } else {
        setMessage({ ok: false, text: data.error || "Failed to publish post." });
      }
    } catch {
      setMessage({ ok: false, text: "Network error publishing post." });
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmailBlast = async (slug: string) => {
    if (!confirm(`Broadcast an email update for post "${slug}" to all opted-in newsletter subscribers?`)) return;
    setBlasting(slug);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/parent-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_blog_email", slug }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ ok: true, text: data.message || "Email blast dispatched!" });
      } else {
        setMessage({ ok: false, text: data.error || "Failed to send email blast." });
      }
    } catch {
      setMessage({ ok: false, text: "Network error sending email blast." });
    } finally {
      setBlasting(null);
    }
  };

  const handleDeleteBlogPost = async (slug: string) => {
    if (!confirm(`Are you sure you want to delete post "${slug}"?`)) return;
    try {
      const res = await fetch("/api/admin/parent-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_blog_post", slug }),
      });
      if (res.ok) {
        setMessage({ ok: true, text: "Blog post deleted." });
        fetchData();
      }
    } catch {}
  };

  if (loading) {
    return <div className="p-8 text-center text-xs font-mono text-muted">Loading parent site management suite...</div>;
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded-xl border p-4 text-xs font-semibold ${
            message.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-moss"
              : "border-rose-500/30 bg-rose-500/10 text-danger"
          }`}
        >
          {message.text}
        </div>
      )}

      <LockdownCountdownEditor />

      {/* Countdown Configuration */}
      <section className={card}>
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-accent" />
          <h3 className="text-sm font-bold text-ink">Product Launch Countdown</h3>
        </div>
        <p className="mt-1 text-xs text-muted">
          Displays an optional live ticking banner on the parent company homepage.
        </p>

        <form onSubmit={handleSaveCountdown} className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-ink mb-1">Banner Label</label>
            <input
              type="text"
              value={countdown.label || ""}
              onChange={(e) => setCountdown({ ...countdown, label: e.target.value })}
              placeholder="e.g. Next Product Early Access"
              className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1">Target Date &amp; Time (Local or ISO)</label>
            <input
              type="datetime-local"
              value={countdown.targetDate ? countdown.targetDate.slice(0, 16) : ""}
              onChange={(e) => setCountdown({ ...countdown, targetDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
              className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 sm:col-span-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-card shadow-purple-600/30 transition-colors hover:bg-purple-500 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Countdown"}
            </button>
            {countdown.targetDate && (
              <button
                type="button"
                onClick={() => {
                  setCountdown({ targetDate: null, label: null });
                  fetch("/api/admin/parent-site", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "save_countdown", targetDate: null, label: null }),
                  }).then(() => setMessage({ ok: true, text: "Countdown banner cleared." }));
                }}
                className="rounded-xl border border-line bg-paper px-4 py-2 text-xs font-medium text-danger hover:bg-danger/10"
              >
                Clear Countdown
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Product Catalog Management & Editing */}
      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-accent" />
              <h3 className="text-sm font-bold text-ink">Products Lineup</h3>
            </div>
            <p className="mt-1 text-xs text-muted">
              Add new products, edit descriptions &amp; badges, or update logos.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setIsNewProduct(true);
                setEditingProduct({
                  id: "",
                  name: "",
                  tagline: "",
                  description: "",
                  href: "",
                  badge: "Coming soon",
                  logoSolid: "/logo-pack/roster-by-roleflow-solid.png",
                  logoTransparent: "/logo-pack/roster-by-roleflow-transparent.png",
                });
              }}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow-card shadow-purple-600/30 transition-colors hover:bg-purple-500"
            >
              <Plus className="h-3.5 w-3.5" /> Add Product
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm("Reset products to the default ApplyHub & Roster configuration?")) {
                  fetch("/api/admin/parent-site", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "reset_products" }),
                  }).then(() => fetchData());
                }
              }}
              className="flex items-center gap-1.5 rounded-xl border border-line bg-paper px-3.5 py-2 text-xs font-medium text-ink hover:bg-surface"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Reset
            </button>
          </div>
        </div>

        {/* Product Cards List */}
        <div className="mt-5 space-y-3">
          {products.map((p, idx) => (
            <div
              key={p.id}
              className="flex flex-col gap-4 rounded-xl border border-line bg-paper p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-sm text-ink">{p.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      p.badge === "Live"
                        ? "bg-moss/20 text-moss border border-moss/30"
                        : "bg-gold/20 text-gold border border-gold/30"
                    }`}
                  >
                    {p.badge}
                  </span>
                </div>
                <p className="text-xs text-accent font-medium">{p.tagline}</p>
                <p className="text-xs text-muted max-w-xl">{p.description}</p>
                <p className="font-mono text-[10px] text-faint">URL: {p.href}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewProduct(false);
                    setEditingProduct({ ...p });
                  }}
                  className="rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:border-accent flex items-center gap-1"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextBadge = p.badge === "Live" ? "Coming soon" : "Live";
                    const updated = [...products];
                    updated[idx] = { ...p, badge: nextBadge };
                    handleSaveProducts(updated);
                  }}
                  className="rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:border-accent"
                >
                  Toggle Badge
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteProduct(p.id)}
                  className="rounded-xl border border-line bg-surface p-2 text-xs text-danger hover:bg-danger/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Edit / Add Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleProductSubmit}
            className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h4 className="text-base font-bold text-ink">
                {isNewProduct ? "Add New Product" : `Edit Product: ${editingProduct.name}`}
              </h4>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-muted hover:text-ink text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Product ID</label>
                <input
                  type="text"
                  required
                  disabled={!isNewProduct}
                  value={editingProduct.id}
                  onChange={(e) => setEditingProduct({ ...editingProduct, id: e.target.value })}
                  placeholder="e.g. roster"
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-accent focus:outline-none font-mono disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="e.g. Roster by RoleFlow"
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1">Tagline</label>
              <input
                type="text"
                required
                value={editingProduct.tagline}
                onChange={(e) => setEditingProduct({ ...editingProduct, tagline: e.target.value })}
                placeholder="e.g. Staff and member management for Roblox groups."
                className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1">Description</label>
              <textarea
                required
                rows={3}
                value={editingProduct.description}
                onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                placeholder="Detailed overview of what the tool does..."
                className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-accent focus:outline-none"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Target URL or Anchor</label>
                <input
                  type="text"
                  required
                  value={editingProduct.href}
                  onChange={(e) => setEditingProduct({ ...editingProduct, href: e.target.value })}
                  placeholder="https://applyhub.roleflow.site or #notify"
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-accent focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">Status Badge</label>
                <select
                  value={editingProduct.badge}
                  onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value as "Live" | "Coming soon" })}
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-accent focus:outline-none"
                >
                  <option value="Live">Live</option>
                  <option value="Coming soon">Coming soon</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1">Solid Logo Asset URL</label>
              <input
                type="text"
                value={editingProduct.logoSolid}
                onChange={(e) => setEditingProduct({ ...editingProduct, logoSolid: e.target.value })}
                className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-accent focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1">Transparent Logo Asset URL</label>
              <input
                type="text"
                value={editingProduct.logoTransparent}
                onChange={(e) => setEditingProduct({ ...editingProduct, logoTransparent: e.target.value })}
                className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-accent focus:outline-none font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="rounded-xl border border-line bg-paper px-4 py-2 text-xs font-medium text-ink hover:bg-surface"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-card shadow-purple-600/30 hover:bg-purple-500 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Product"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Blog & Announcements Management */}
      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-accent" />
              <h3 className="text-sm font-bold text-ink">Blog &amp; Announcements</h3>
            </div>
            <p className="mt-1 text-xs text-muted">
              Publish news, release notes, and engineering stories. Automatically email your subscribers.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedTemplate("");
              setShowBlogModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow-card shadow-purple-600/30 transition-colors hover:bg-purple-500"
          >
            <Plus className="h-3.5 w-3.5" /> New Post
          </button>
        </div>

        {/* Existing Blog Posts List */}
        <div className="mt-5 space-y-3">
          {blogPosts.map((post) => (
            <div
              key={post.slug}
              className="flex flex-col gap-4 rounded-xl border border-line bg-paper p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-ink">{post.title}</span>
                  <span className="rounded-full bg-surface border border-line px-2 py-0.5 text-[10px] text-faint font-mono">
                    /{post.slug}
                  </span>
                </div>
                <p className="text-xs text-muted max-w-xl">{post.excerpt}</p>
                <div className="flex items-center gap-3 text-[11px] text-faint">
                  <span>By {post.author}</span>
                  <span>&bull;</span>
                  <span>{post.date}</span>
                  <span>&bull;</span>
                  <span>{post.readTime}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={blasting === post.slug}
                  onClick={() => handleSendEmailBlast(post.slug)}
                  className="rounded-xl border border-line bg-surface hover:bg-purple-600/10 hover:text-accent hover:border-purple-500/30 px-3 py-1.5 text-xs text-ink transition-all flex items-center gap-1.5 disabled:opacity-50"
                  title="Broadcast email update to subscribers"
                >
                  <Mail className="h-3.5 w-3.5 text-accent" />
                  <span>{blasting === post.slug ? "Sending..." : "Email Blast"}</span>
                </button>
                <a
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-line bg-surface p-2 text-xs text-ink hover:border-accent"
                  title="View published article"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => handleDeleteBlogPost(post.slug)}
                  className="rounded-xl border border-line bg-surface p-2 text-xs text-danger hover:bg-danger/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* New Blog Post Modal with Templates & Email Blast */}
      {showBlogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSaveBlogPost}
            className="w-full max-w-2xl rounded-2xl border border-line bg-surface p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent" />
                <h4 className="text-base font-bold text-ink">Publish New Blog Post</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowBlogModal(false)}
                className="text-muted hover:text-ink text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Template Selector */}
            <div className="p-3.5 rounded-xl bg-paper border border-line space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-ink">
                <FileText className="w-4 h-4 text-accent" />
                <span>Choose a Pre-Engineered Template (Optional)</span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                Speed up writing by starting from an expertly structured product release, engineering post, or community update.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {BLOG_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl.id)}
                    className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                      selectedTemplate === tpl.id
                        ? "bg-purple-600/20 border-purple-500/50 text-ink shadow-sm"
                        : "bg-surface border-line hover:border-line-strong text-ink-2"
                    }`}
                  >
                    <div className="font-semibold text-ink flex items-center justify-between">
                      <span>{tpl.name}</span>
                      {selectedTemplate === tpl.id && <Check className="w-3.5 h-3.5 text-accent" />}
                    </div>
                    <p className="text-[11px] text-muted mt-0.5 line-clamp-1">{tpl.tagline}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1">Post Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Launching Roster Early Access"
                value={blogForm.title}
                onChange={(e) => {
                  const t = e.target.value;
                  setBlogForm({
                    ...blogForm,
                    title: t,
                    slug: blogForm.slug || t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
                  });
                }}
                className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-accent focus:outline-none"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">URL Slug</label>
                <input
                  type="text"
                  required
                  placeholder="launching-roster-early-access"
                  value={blogForm.slug}
                  onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })}
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-accent focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">Author Name</label>
                <input
                  type="text"
                  placeholder="RoleFlow Engineering"
                  value={blogForm.author}
                  onChange={(e) => setBlogForm({ ...blogForm, author: e.target.value })}
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Short Excerpt</label>
                <input
                  type="text"
                  placeholder="Brief summary displayed on social cards and post lists..."
                  value={blogForm.excerpt}
                  onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">Estimated Read Time</label>
                <input
                  type="text"
                  placeholder="3 min read"
                  value={blogForm.readTime}
                  onChange={(e) => setBlogForm({ ...blogForm, readTime: e.target.value })}
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-accent focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1">Article Content (Separate paragraphs with double Enter)</label>
              <textarea
                required
                rows={9}
                placeholder="Write your article paragraphs here..."
                value={blogForm.content}
                onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-accent focus:outline-none font-sans leading-relaxed"
              />
            </div>

            {/* Email Blast Toggle */}
            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-start gap-3">
              <input
                id="sendEmailBlastCheckbox"
                type="checkbox"
                checked={sendEmailBlast}
                onChange={(e) => setSendEmailBlast(e.target.checked)}
                className="mt-0.5 rounded border-line text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="sendEmailBlastCheckbox" className="text-xs text-ink cursor-pointer select-none">
                <span className="font-bold flex items-center gap-1.5 text-accent">
                  <Mail className="w-3.5 h-3.5" />
                  Send blog post email blast to newsletter subscribers
                </span>
                <p className="text-[11px] text-muted mt-0.5">
                  Automatically delivers a branded email dispatch to all opted-in subscribers with an instant one-click link to read the full post.
                </p>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => setShowBlogModal(false)}
                className="rounded-xl border border-line bg-paper px-4 py-2 text-xs font-medium text-ink hover:bg-surface"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-card shadow-purple-600/30 hover:bg-purple-500 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{saving ? "Publishing..." : sendEmailBlast ? "Publish & Send Email" : "Publish Article"}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
