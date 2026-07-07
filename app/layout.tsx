import type { Metadata } from "next";
import { archivo, instrumentSans, ibmPlexMono } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { PostHogProvider } from "@/components/posthog-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Cockpit EPR — Obblighi imballaggi UE, chiari",
    template: "%s · Cockpit EPR",
  },
  description:
    "Trasforma il caos degli obblighi EPR multi-paese in una risposta chiara: sei a posto o sei esposto, ed ecco cosa fare.",
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
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
