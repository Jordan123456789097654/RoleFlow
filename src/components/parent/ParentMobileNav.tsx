"use client";

import React, { useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/products", label: "Products" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/ideas", label: "Suggest Idea" },
  { href: "/contact", label: "Contact" },
];

export function ParentMobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="parent-mobile-menu"
        className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10"
      >
        {open ? "Close" : "Menu"}
      </button>
      {open && (
        <nav
          id="parent-mobile-menu"
          aria-label="Mobile"
          className="absolute left-0 right-0 top-16 border-b border-white/10 bg-[#090a0f]/95 px-5 py-4 backdrop-blur-md"
        >
          <ul className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/5 hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
