import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t("app.auth.signup.title") };

export default function SignupPage() {
  return (
    <AuthShell
      eyebrow={t("app.auth.signup.eyebrow")}
      title={t("app.auth.signup.title")}
      subtitle={t("app.auth.signup.subtitle")}
      footer={
        <>
          {t("app.auth.signup.haveAccount")}{" "}
          <Link href="/login" className="rounded-sm text-brand hover:underline">
            {t("app.auth.signup.loginLink")}
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
