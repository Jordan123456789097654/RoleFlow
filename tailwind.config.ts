import type { Config } from "tailwindcss";

/**
 * RoleFlow Dark Mode Theme.
 * Deep obsidian dark theme with violet & purple accents, glowing borders, and rich glassmorphism.
 */
const config: Config = {
  darkMode: "class",
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
        paper: "#090a0f",
        surface: "#10121a",
        sunk: "#0c0d14",
        line: "rgba(255, 255, 255, 0.08)",
        "line-strong": "rgba(255, 255, 255, 0.16)",
        ink: {
          DEFAULT: "#f1f3f9",
          2: "#c5cbd9",
        },
        muted: "#8890a4",
        faint: "#555c70",
        accent: {
          DEFAULT: "#8b5cf6",
          hover: "#7c3aed",
          soft: "rgba(139, 92, 246, 0.15)",
          ink: "#ddd6fe",
        },
        moss: {
          DEFAULT: "#10b981",
          soft: "rgba(16, 185, 129, 0.15)",
          ink: "#6ee7b7",
        },
        gold: {
          DEFAULT: "#f59e0b",
          soft: "rgba(245, 158, 11, 0.15)",
        },
        danger: {
          DEFAULT: "#ef4444",
          soft: "rgba(239, 68, 68, 0.15)",
        },
      },
      borderRadius: {
        sm: "0.375rem",
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.5), 0 1px 2px -1px rgba(0, 0, 0, 0.5)",
        glow: "0 0 25px -5px rgba(139, 92, 246, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
