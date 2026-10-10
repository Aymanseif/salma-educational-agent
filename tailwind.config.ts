import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        edu: {
          bg: "#f8fafc",
          card: "#ffffff",
          ink: "#0f172a",
          muted: "#64748b",
          line: "#e2e8f0",
        },
      },
      fontFamily: {
        sans: [
          "Cairo",
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 4px 24px -8px rgb(15 23 42 / 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;