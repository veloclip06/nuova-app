import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Keeps the Supabase session fresh and enforces the /app auth guard
 * (PROMPT 5). Runs only where the session is actually consumed: the protected
 * area (/app, /onboarding) and the entry auth pages (logged-in redirect).
 * Public pages (landing, /check, /guide, /prezzi, APIs) never read the session
 * server-side, so they skip the per-request Supabase auth round-trip entirely.
 * (/auth/callback does its own code exchange; /reset-password refreshes its
 * recovery session client-side.)
 */
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/app/:path*", "/onboarding", "/login", "/registrati"],
};
