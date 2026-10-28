import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#08090d",
        surface: "#0e1018",
        "surface-card": "#121422",
        "surface-border": "#1e2238",
        primary: {
          DEFAULT: "#8b5cf6",
          hover: "#7c3aed",
          light: "#a78bfa",
          dark: "#6d28d9",
        },
        glow: {
          purple: "rgba(139, 92, 246, 0.25)",
        }
      },
      backgroundImage: {
        "radial-glow": "radial-gradient(circle at 50% -20%, rgba(139, 92, 246, 0.18), transparent 70%)",
        "card-gradient": "linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0) 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
