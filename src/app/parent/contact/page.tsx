import React from "react";
import { ParentContactForm } from "@/components/parent/ParentForms";
import { SUPPORT_EMAIL } from "@/lib/parent-site";

export const metadata = {
  title: "Contact Support | RoleFlow",
  description: "Get in touch with the RoleFlow team for support, questions, or partnership inquiries.",
};

export default function ContactPage() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* Header */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-300">
            Get in Touch
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Contact Support
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-300">
            Have questions about RoleFlow products, need help with your community account, or want to report an issue? Our team is here to help.
          </p>
        </div>

        {/* Contact Info & Form */}
        <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-md sm:p-12">
          <div className="mb-8 border-b border-white/10 pb-6 text-sm text-slate-300">
            <p>
              You can also email us directly at{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-medium text-violet-400 hover:text-violet-300 underline underline-offset-4"
              >
                {SUPPORT_EMAIL}
              </a>
              . We respond to all inquiries within 24 to 48 hours.
            </p>
          </div>

          <ParentContactForm />
        </div>
      </div>
    </div>
  );
}
