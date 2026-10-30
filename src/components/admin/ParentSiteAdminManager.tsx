"use client";

import React, { useState, useEffect } from "react";
import { Product } from "@/lib/parent-site";
import { Plus, Trash2, Edit3, Save, RefreshCw, Clock, Sparkles } from "lucide-react";

export function ParentSiteAdminManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [countdown, setCountdown] = useState<{ targetDate: string | null; label: string | null }>({
    targetDate: null,
    label: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // New product form
  const [newProd, setNewProd] = useState<Product>({
    id: "",
    name: "",
    tagline: "",
    description: "",
    href: "",
    badge: "Coming soon",
    logoSolid: "/logo-pack/roster-by-roleflow-solid.png",
    logoTransparent: "/logo-pack/roster-by-roleflow-transparent.png",
  });
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/parent-site");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setCountdown(data.countdown || { targetDate: null, label: null });
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
        setMessage({ ok: true, text: "Products saved successfully!" });
      } else {
        setMessage({ ok: false, text: data.error || "Failed to save." });
      }
    } catch {
      setMessage({ ok: false, text: "Network error saving products." });
    } finally {
      setSaving(false);
    }
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

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name || !newProd.id) return;
    const updated = [...products, newProd];
    handleSaveProducts(updated);
    setShowAddModal(false);
    setNewProd({
      id: "",
      name: "",
      tagline: "",
      description: "",
      href: "",
      badge: "Coming soon",
      logoSolid: "/logo-pack/roster-by-roleflow-solid.png",
      logoTransparent: "/logo-pack/roster-by-roleflow-transparent.png",
    });
  };

  const handleDeleteProduct = (id: string) => {
    if (!confirm("Are you sure you want to remove this product?")) return;
    const updated = products.filter((p) => p.id !== id);
    handleSaveProducts(updated);
  };

  if (loading) {
    return <div className="p-8 text-center text-xs font-mono text-muted">Loading parent site management suite...</div>;
  }

  return (
    <div className="space-y-10">
      {message && (
        <div
          className={`rounded-xl border p-4 text-xs font-semibold ${
            message.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-rose-500/30 bg-rose-500/10 text-rose-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Countdown Configuration */}
      <section className="rounded-3xl border border-line bg-surface/50 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-violet-400" />
          <h3 className="text-lg font-bold text-ink">Product Launch Countdown</h3>
        </div>
        <p className="mt-1 text-xs text-muted">
          Displays an optional live ticking banner on the parent company homepage.
        </p>

        <form onSubmit={handleSaveCountdown} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-ink mb-1">Banner Label</label>
            <input
              type="text"
              value={countdown.label || ""}
              onChange={(e) => setCountdown({ ...countdown, label: e.target.value })}
              placeholder="e.g. Next Product Early Access"
              className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1">Target Date &amp; Time (ISO or local)</label>
            <input
              type="datetime-local"
              value={countdown.targetDate ? countdown.targetDate.slice(0, 16) : ""}
              onChange={(e) => setCountdown({ ...countdown, targetDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
              className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 sm:col-span-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-violet-500 disabled:opacity-50"
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

      {/* Product Catalog Management */}
      <section className="rounded-3xl border border-line bg-surface/50 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-violet-400" />
              <h3 className="text-lg font-bold text-ink">Products Lineup</h3>
            </div>
            <p className="mt-1 text-xs text-muted">
              Add, edit badges, or remove products shown on the parent homepage and products showcase.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-violet-500"
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
        <div className="mt-6 space-y-4">
          {products.map((p, idx) => (
            <div
              key={p.id}
              className="flex flex-col gap-4 rounded-2xl border border-line bg-paper p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-sm text-ink">{p.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      p.badge === "Live"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {p.badge}
                  </span>
                </div>
                <p className="text-xs text-violet-600 font-medium">{p.tagline}</p>
                <p className="text-xs text-muted max-w-xl">{p.description}</p>
                <p className="font-mono text-[10px] text-slate-400">URL: {p.href}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const nextBadge = p.badge === "Live" ? "Coming soon" : "Live";
                    const updated = [...products];
                    updated[idx] = { ...p, badge: nextBadge };
                    handleSaveProducts(updated);
                  }}
                  className="rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:border-violet-500"
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

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleAddProduct}
            className="w-full max-w-lg rounded-3xl border border-line bg-surface p-6 shadow-2xl space-y-4"
          >
            <h4 className="text-base font-bold text-ink">Add New RoleFlow Product</h4>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Product ID (slug)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. auditflow"
                  value={newProd.id}
                  onChange={(e) => setNewProd({ ...newProd, id: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AuditFlow by RoleFlow"
                  value={newProd.name}
                  onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1">Tagline</label>
              <input
                type="text"
                required
                placeholder="e.g. Real-time staff logs and moderation telemetry."
                value={newProd.tagline}
                onChange={(e) => setNewProd({ ...newProd, tagline: e.target.value })}
                className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1">Description</label>
              <textarea
                required
                rows={3}
                placeholder="Describe what the product does for Roblox groups and Discord servers..."
                value={newProd.description}
                onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Link URL</label>
                <input
                  type="text"
                  required
                  placeholder="https://auditflow.roleflow.site"
                  value={newProd.href}
                  onChange={(e) => setNewProd({ ...newProd, href: e.target.value })}
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">Badge Status</label>
                <select
                  value={newProd.badge}
                  onChange={(e) => setNewProd({ ...newProd, badge: e.target.value as any })}
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-violet-500 focus:outline-none"
                >
                  <option value="Live">Live</option>
                  <option value="Coming soon">Coming soon</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-xl border border-line bg-paper px-4 py-2 text-xs font-medium text-ink hover:bg-surface"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
              >
                Save Product
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
