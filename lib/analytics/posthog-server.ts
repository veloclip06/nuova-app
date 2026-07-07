import "server-only";
import { PostHog } from "posthog-node";

/**
 * Server-side PostHog client for capturing events from Route Handlers / Server
 * Actions (e.g. checker_email_submitted, lead saved). Returns null when no key
 * is configured so local/dev runs never fail on missing analytics.
 *
 * Remember to `await client.shutdown()` in short-lived server contexts to flush.
 */
let cached: PostHog | null | undefined;

export function getPostHogServer(): PostHog | null {
  if (cached !== undefined) return cached;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";
  cached = key ? new PostHog(key, { host, flushAt: 1, flushInterval: 0 }) : null;
  return cached;
}
