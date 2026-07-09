"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t } from "@/lib/i18n";
import { AuthError } from "./auth-parts";

/**
 * Two modes: "request" sends a reset link; "update" (reached via the emailed
 * link → /auth/callback established a recovery session) sets the new password.
 */
export function ResetPasswordForm({ mode }: { mode: "request" | "update" }) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function onRequest(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password?mode=update")}`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (resetError) {
      setError(t("app.auth.errors.generic"));
      setPending(false);
      return;
    }
    setSent(true);
    setPending(false);
  }

  async function onUpdate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError(t("app.auth.errors.weakPassword"));
      return;
    }
    setPending(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(t("app.auth.errors.generic"));
      setPending(false);
      return;
    }
    router.push("/app");
    router.refresh();
  }

  if (mode === "update") {
    return (
      <form onSubmit={onUpdate} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-password">{t("app.auth.fields.newPassword")}</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <AuthError message={error} />}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? t("app.common.saving") : t("app.auth.reset.updateSubmit")}
        </Button>
      </form>
    );
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-line bg-surface p-5">
        <p className="text-2xs text-muted-foreground">
          {t("app.auth.reset.requestSent", { email })}
        </p>
        <Link
          href="/login"
          className="mt-3 inline-block rounded-sm text-2xs text-brand hover:underline"
        >
          {t("app.auth.reset.backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onRequest} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t("app.auth.fields.email")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {error && <AuthError message={error} />}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? t("app.common.saving") : t("app.auth.reset.requestSubmit")}
      </Button>
    </form>
  );
}
