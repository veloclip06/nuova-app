import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Public, indexable routes only (ARCHITECTURE.md §2). /check/risultato is
 * intentionally excluded — it is noindex (query-param dependent). Country
 * guides and the authenticated /app are added once they ship real content.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${siteUrl}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/check`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/prezzi`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/termini`, lastModified, changeFrequency: "yearly", priority: 0.2 },
  ];
}
