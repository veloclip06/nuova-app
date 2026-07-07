import { Archivo, Instrument_Sans, IBM_Plex_Mono } from "next/font/google";

/**
 * Typography from DESIGN_SYSTEM.md §4, loaded via next/font (self-hosted, no
 * layout shift). Exposed as CSS variables consumed by tailwind.config.ts.
 *
 * - Archivo         → display / titles (600–700)
 * - Instrument Sans → body (400/500)
 * - IBM Plex Mono   → data, codes, registration numbers, weights, deadlines
 */
export const archivo = Archivo({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-archivo",
  display: "swap",
});

export const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-instrument-sans",
  display: "swap",
});

export const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});
