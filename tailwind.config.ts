import type { Config } from "tailwindcss";

/**
 * RoleFlow design system v2 ("Iris on Ink").
 * `purple` and `violet` are remapped to one iris scale and `slate` to a calmer ink neutral,
 * so every existing page picks up the new look from the tokens alone.
 */
const iris = {
  50: "#f3f1ff",
  100: "#e9e5ff",
  200: "#d6cfff",
  300: "#bbaeff",
  400: "#9b88ff",
  500: "#7f66ff",
  600: "#6d4df5",
  700: "#5c3cd9",
  800: "#4a31ad",
  900: "#3a2a85",
  950: "#1f1750",
};

const ink = {
  50: "#f6f7fb",
  100: "#eceef5",
  200: "#d9dce8",
  300: "#b8bdd0",
  400: "#9299b0",
  500: "#747b94",
  600: "#565c73",
  700: "#3a3f53",
  800: "#252938",
  900: "#181b27",
  950: "#0d0f16",
};

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      colors: {
        background: "#090a0f",
        surface: "#10121a",
        "surface-card": "#151824",
        "surface-border": "#232738",
        purple: iris,
        violet: iris,
        slate: ink,
        primary: {
          DEFAULT: iris[600],
          hover: iris[500],
          light: iris[300],
          dark: iris[800],
        },
        glow: { purple: "rgba(127, 102, 255, 0.22)" },
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
        "3xl": "1.5rem",
      },
      backgroundImage: {
        "radial-glow": "radial-gradient(circle at 50% -20%, rgba(127, 102, 255, 0.16), transparent 70%)",
        "card-gradient": "linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0) 100%)",
      },
      keyframes: {
        "rf-in": { from: { opacity: "0", transform: "translateY(4px) scale(0.99)" }, to: { opacity: "1", transform: "none" } },
        "rf-marquee-fade": { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: {
        "rf-in": "rf-in 0.18s ease-out both",
        "rf-fade": "rf-marquee-fade 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
