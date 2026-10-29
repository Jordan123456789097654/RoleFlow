import type { Config } from "tailwindcss";

/**
 * RoleFlow design system v3 — "Ledger".
 * Warm paper, ink-black type, one vermilion accent, moss for "healthy/accepted".
 * Hairline borders and flat surfaces instead of glows. Light theme only.
 *
 * Token vocabulary (use these, never raw hex or violet/slate/white-on-dark):
 *   bg-paper        page background
 *   bg-surface      cards, panels, inputs
 *   bg-sunk         inset areas, table headers, zebra rows
 *   border-line     default hairline        border-line-strong  hover / emphasis
 *   text-ink        primary text            text-ink-2  secondary   text-muted  tertiary   text-faint  placeholder/disabled
 *   bg-accent / text-accent / bg-accent-soft     primary CTA, highlights (vermilion)
 *   bg-moss / text-moss / bg-moss-soft           success, accepted, online
 *   bg-gold / text-gold / bg-gold-soft           warnings, pending, featured
 *   bg-danger / text-danger / bg-danger-soft     errors, rejections, destructive
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        paper: "#f4f1ea",
        surface: "#fbfaf6",
        sunk: "#ebe6da",
        line: "#d9d3c5",
        "line-strong": "#bdb5a3",
        ink: {
          DEFAULT: "#161512",
          2: "#3d3a33",
        },
        muted: "#6b665a",
        faint: "#958f80",
        accent: {
          DEFAULT: "#e5532d",
          hover: "#cf4420",
          soft: "#f8e1d9",
          ink: "#9e2e12",
        },
        moss: {
          DEFAULT: "#2d5a47",
          soft: "#dce9e2",
          ink: "#1f4234",
        },
        gold: {
          DEFAULT: "#a8771c",
          soft: "#f3e8cc",
        },
        danger: {
          DEFAULT: "#b3261e",
          soft: "#f7dcd9",
        },
      },
      borderRadius: {
        sm: "0.375rem",
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
      },
      boxShadow: {
        card: "0 1px 0 rgba(22,21,18,0.04), 0 1px 2px rgba(22,21,18,0.04)",
        pop: "0 12px 40px -12px rgba(22,21,18,0.25), 0 2px 6px rgba(22,21,18,0.08)",
      },
      keyframes: {
        "rf-in": { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: {
        "rf-in": "rf-in 0.2s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
