import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth / email-confirmation / password-recovery callback (ARCHITECTURE.md §2).
 * Supabase (@supabase/ssr, PKCE) redirects here with a `code`; we exchange it
 * for a session cookie and forward to `next` (default /app). New signups point
 * `next` at /onboarding; recovery links at /reset-password?mode=update.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // `next` is an internal path; guard against open-redirect via absolute URLs.
      const safeNext = next.startsWith("/") ? next : "/app";
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
