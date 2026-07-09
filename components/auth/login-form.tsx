"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t } from "@/lib/i18n";
import { GoogleButton } from "./google-button";
import { AuthDivider, AuthError } from "./auth-parts";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(t("app.auth.errors.invalidCredentials"));
      setPending(false);
      return;
    }
    router.push(next || "/app");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <GoogleButton next={next} />
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("app.auth.fields.password")}</Label>
            <Link href="/reset-password" className="rounded-sm text-2xs text-brand hover:underline">
              {t("app.auth.login.forgot")}
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <AuthError message={error} />}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? t("app.common.saving") : t("app.auth.login.submit")}
        </Button>
      </form>
    </div>
  );
}
