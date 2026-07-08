import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Crawl the public marketing/checker surface; keep the authenticated app, the
 * API and the param-dependent result page out of the index (ARCHITECTURE.md §2).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app", "/api", "/check/risultato"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
