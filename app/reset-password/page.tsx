import type { Metadata } from "next";
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
      title={mode === "update" ? t("app.auth.reset.updateTitle") : t("app.auth.reset.requestTitle")}
      subtitle={
        mode === "update" ? t("app.auth.reset.updateSubtitle") : t("app.auth.reset.requestSubtitle")
      }
    >
      <ResetPasswordForm mode={mode} />
    </AuthShell>
  );
}
