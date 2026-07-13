import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t("app.auth.reset.requestTitle") };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode: modeParam } = await searchParams;
  const mode = modeParam === "update" ? "update" : "request";

  return (
    <AuthShell
      eyebrow={
        mode === "update" ? t("app.auth.reset.updateEyebrow") : t("app.auth.reset.requestEyebrow")
      }
      title={mode === "update" ? t("app.auth.reset.updateTitle") : t("app.auth.reset.requestTitle")}
      subtitle={
        mode === "update" ? t("app.auth.reset.updateSubtitle") : t("app.auth.reset.requestSubtitle")
      }
      footer={
        mode === "request" ? (
          <Link href="/login" className="rounded-sm text-brand hover:underline">
            {t("app.auth.backToLogin")}
          </Link>
        ) : undefined
      }
    >
      <ResetPasswordForm mode={mode} />
    </AuthShell>
  );
}
