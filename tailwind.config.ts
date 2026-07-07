import type { Config } from "tailwindcss";

/**
 * Theme built from DESIGN_SYSTEM.md.
 * Colors, radius and the typographic scale are the single source of truth here;
 * shadcn/ui semantic aliases resolve to the same CSS variables (see app/globals.css).
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // --- Raw brand tokens (DESIGN_SYSTEM.md §3) ---
        ink: "var(--ink)",
        paper: "var(--paper)",
        surface: "var(--surface)",
        line: "var(--line)",
        brand: {
          DEFAULT: "var(--brand)",
          hover: "var(--brand-hover)",
        },
        ok: "var(--ok)",
        warn: "var(--warn)",
        risk: "var(--risk)",

        // --- shadcn/ui semantic aliases (mapped onto the tokens above) ---
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
      },
      borderRadius: {
        // DESIGN_SYSTEM.md §6 — base radius 8px
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        // Loaded via next/font in app/layout.tsx (DESIGN_SYSTEM.md §4)
        display: ["var(--font-archivo)", "system-ui", "sans-serif"],
        sans: ["var(--font-instrument-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        // Typographic scale (DESIGN_SYSTEM.md §4): 13 / 15 / 16 / 20 / 25 / 31 / 39 / 49
        "2xs": ["0.8125rem", { lineHeight: "1.5" }], // 13
        xs: ["0.9375rem", { lineHeight: "1.6" }], // 15
        base: ["1rem", { lineHeight: "1.6" }], // 16
        lg: ["1.25rem", { lineHeight: "1.5" }], // 20
        xl: ["1.5625rem", { lineHeight: "1.3" }], // 25
        "2xl": ["1.9375rem", { lineHeight: "1.2" }], // 31
        "3xl": ["2.4375rem", { lineHeight: "1.15" }], // 39
        "4xl": ["3.0625rem", { lineHeight: "1.1" }], // 49
      },
      letterSpacing: {
        // "intestazione di registro" eyebrow/label spacing (DESIGN_SYSTEM.md §4)
        register: "0.08em",
        tightDisplay: "-0.01em",
      },
      keyframes: {
        // Sigillo stamp reveal (DESIGN_SYSTEM.md §5, ~300ms)
        stamp: {
          "0%": { opacity: "0", transform: "scale(1.15) rotate(var(--stamp-tilt, 0deg))" },
          "60%": { opacity: "1", transform: "scale(0.96) rotate(var(--stamp-tilt, 0deg))" },
          "100%": { opacity: "1", transform: "scale(1) rotate(var(--stamp-tilt, 0deg))" },
        },
        // Checker result cards enter (DESIGN_SYSTEM.md §7, fade + translateY 8px)
        "card-enter": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        stamp: "stamp 300ms ease-out",
        "card-enter": "card-enter 300ms ease-out both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
