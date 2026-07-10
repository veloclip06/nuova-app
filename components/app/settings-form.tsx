"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EU_COUNTRIES, EXTRA_EU } from "@/lib/checker/options";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { updateCompany } from "@/app/app/impostazioni/actions";

export function SettingsForm({
  email,
  initialName,
  initialEstablishment,
  initialVat,
}: {
  email: string;
  initialName: string;
  initialEstablishment: string;
  initialVat: string;
}) {
  const router = useRouter();
  const [name, setName] = React.useState(initialName);
  const [establishment, setEstablishment] = React.useState(initialEstablishment);
  const [vat, setVat] = React.useState(initialVat);
  const [feedback, setFeedback] = React.useState<"saved" | "error" | null>(null);
  // The action revalidates /app paths itself; the transition keeps `pending`
  // true through the streamed re-render, so no router.refresh() is needed.
  const [pending, startTransition] = React.useTransition();

  const euOptions = React.useMemo(
    () =>
      [...EU_COUNTRIES].sort((a, b) =>
        t(`countries.${a}`).localeCompare(t(`countries.${b}`), "it"),
      ),
    [],
  );

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const result = await updateCompany({
        name,
        establishmentCountry: establishment,
        vatNumber: vat,
      });
      setFeedback(result?.error ? "error" : "saved");
    });
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={onSubmit}
        aria-busy={pending}
        className="flex flex-col gap-5 rounded-lg border border-line bg-surface p-6"
      >
        <p className="eyebrow text-muted-foreground">{t("app.settings.companyTitle")}</p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">{t("app.settings.nameLabel")}</Label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="establishment">{t("app.settings.countryLabel")}</Label>
          <Select
            id="establishment"
            value={establishment}
            onChange={(e) => setEstablishment(e.target.value)}
          >
            {euOptions.map((code) => (
              <option key={code} value={code}>
                {t(`countries.${code}`)}
              </option>
            ))}
            <option value={EXTRA_EU}>{t(`countries.${EXTRA_EU}`)}</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="vat">{t("app.settings.vatLabel")}</Label>
          <Input id="vat" value={vat} onChange={(e) => setVat(e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? t("app.common.saving") : t("app.settings.save")}
          </Button>
          {feedback === "saved" && (
            <span role="status" className="text-2xs text-ok">
              {t("app.settings.saved")}
            </span>
          )}
          {feedback === "error" && (
            <span role="alert" className="text-2xs text-risk">
              {t("app.settings.error")}
            </span>
          )}
        </div>
      </form>

      <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-6">
        <p className="eyebrow text-muted-foreground">{t("app.settings.accountTitle")}</p>
        <div>
          <p className="text-2xs text-muted-foreground">{t("app.settings.emailLabel")}</p>
          <p className="font-mono text-xs text-ink">{email}</p>
        </div>
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={signOut}>
          {t("app.settings.signout")}
        </Button>
      </div>
    </div>
  );
}
