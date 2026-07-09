"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t } from "@/lib/i18n";
import { GoogleButton } from "./google-button";
import { AuthDivider, AuthError } from "./auth-parts";

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [confirmSent, setConfirmSent] = React.useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError(t("app.auth.errors.weakPassword"));
      return;
    }
    setPending(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/onboarding")}`,
      },
    });
    if (signUpError) {
      setError(
        /registered|exists/i.test(signUpError.message)
          ? t("app.auth.errors.emailInUse")
          : t("app.auth.errors.generic"),
      );
      setPending(false);
      return;
    }
    // Email confirmation on → no session yet; email confirmation off → straight to onboarding.
    if (data.session) {
      router.push("/onboarding");
      router.refresh();
    } else {
      setConfirmSent(true);
      setPending(false);
    }
  }

  if (confirmSent) {
    return (
      <div className="rounded-lg border border-line bg-surface p-5">
        <p className="font-display text-base font-semibold text-ink">
          {t("app.auth.signup.confirmTitle")}
        </p>
        <p className="mt-2 text-2xs text-muted-foreground">
          {t("app.auth.signup.confirmBody", { email })}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <GoogleButton next="/onboarding" />
      <AuthDivider />
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">{t("app.auth.fields.password")}</Label>
          <Input
            id="password"
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
          {pending ? t("app.common.saving") : t("app.auth.signup.submit")}
        </Button>
        <p className="text-2xs text-muted-foreground">{t("app.auth.signup.terms")}</p>
      </form>
    </div>
  );
}
