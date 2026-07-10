import type { Metadata } from "next";
import { archivo, instrumentSans, ibmPlexMono } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { PostHogProvider } from "@/components/posthog-provider";
import { CookieBanner } from "@/components/cookie-banner";
import "./globals.css";

// metadataBase makes canonical/OG URLs absolute. Domain is not decided yet
// (STATO_PROGETTO §7) — driven by NEXT_PUBLIC_SITE_URL, swap when chosen.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Cockpit EPR — Obblighi imballaggi UE, chiari",
    template: "%s · Cockpit EPR",
  },
  description:
    "Trasforma il caos degli obblighi EPR multi-paese in una risposta chiara: sei a posto o sei esposto, ed ecco cosa fare.",
  openGraph: {
    type: "website",
    siteName: "Cockpit EPR",
    locale: "it_IT",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body
        className={cn(
          archivo.variable,
          instrumentSans.variable,
          ibmPlexMono.variable,
        )}
      >
        <PostHogProvider>
          {children}
          <CookieBanner />
        </PostHogProvider>
      </body>
    </html>
  );
}
