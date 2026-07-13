import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t("app.auth.login.title") };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") ? next : "/app";

  return (
    <AuthShell
      eyebrow={t("app.auth.login.eyebrow")}
      title={t("app.auth.login.title")}
      subtitle={t("app.auth.login.subtitle")}
      footer={
        <>
          {t("app.auth.login.noAccount")}{" "}
          <Link href="/registrati" className="rounded-sm text-brand hover:underline">
            {t("app.auth.login.signupLink")}
          </Link>
        </>
      }
    >
      <LoginForm next={safeNext} />
    </AuthShell>
  );
}
