import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session on every matched request (see middleware.ts —
 * only /app, /onboarding and the entry auth pages) and guards the
 * authenticated area. Following the @supabase/ssr contract: the SAME response
 * object must carry the refreshed auth cookies, and getUser() must run here so
 * Server Components downstream see a valid session (ARCHITECTURE.md §2,
 * Supabase Auth).
 *
 * - Unauthenticated → /app/* or /onboarding : redirect to /login?next=…
 * - Authenticated   → /login or /registrati  : redirect to /app
 *   (/reset-password is exempt: the recovery "set new password" step needs the
 *   session that the email link established.)
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Without Supabase configured, skip auth rather than 500 the whole site.
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected =
    path === "/app" || path.startsWith("/app/") || path === "/onboarding";
  const isEntryAuthPage = path === "/login" || path === "/registrati";

  if (!user && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isEntryAuthPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/app";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
