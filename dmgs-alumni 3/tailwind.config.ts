import type { Config } from "tailwindcss";

/**
 * DMGS design system — "warm institutional Nigerian alumni portal".
 * Tokens mirror the HTML prototype's CSS custom properties so the
 * Next.js build matches the archive/yearbook aesthetic exactly.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          900: "#0e3b2e",
          800: "#1a5240",
          700: "#246b54",
          600: "#2f8566",
        },
        gold: {
          500: "#b88a3e",
          400: "#d4a656",
        },
        cream: {
          DEFAULT: "#f5efe1",
          dark: "#ebe2cd",
        },
        paper: "#fbf7ec",
        ink: {
          DEFAULT: "#1b1712",
          soft: "#4a4337",
          muted: "#8a8272",
        },
        border: "#d9cfb5",
        danger: "#8a2a2a",
        success: "#3f6b3a",
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "Times New Roman", "serif"],
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(27, 23, 18, 0.04), 0 8px 24px rgba(27, 23, 18, 0.06)",
        lg: "0 2px 4px rgba(27, 23, 18, 0.05), 0 24px 48px rgba(27, 23, 18, 0.12)",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.35s ease",
      },
    },
  },
  plugins: [],
};

export default config;
