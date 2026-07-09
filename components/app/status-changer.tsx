"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { CountryObligation } from "@/lib/engine/types";
import { dashboardSealFor } from "@/lib/app/seal";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { Seal } from "@/components/seal";
import { updateCountryStatus } from "@/app/app/paesi/actions";
import type { CompanyCountryStatus } from "@/lib/app/types";

const ORDER: CompanyCountryStatus[] = ["not_registered", "in_progress", "registered"];

/**
 * Live status control + seal. Changing status persists via a server action and
 * re-stamps the seal (DESIGN_SYSTEM.md §5 — the moment it turns CONFORME is the
 * reward). The seal state is derived client-side from the (static) obligation
 * facts + the chosen status, so the stamp plays instantly.
 */
export function StatusChanger({
  code,
  obligated,
  domestic,
  initialStatus,
}: {
  code: string;
  obligated: boolean;
  domestic: boolean;
  initialStatus: CompanyCountryStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = React.useState<CompanyCountryStatus>(initialStatus);
  const [animate, setAnimate] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const seal = dashboardSealFor({ obligated, domestic } as CountryObligation, status);

  async function choose(next: CompanyCountryStatus) {
    if (next === status || pending) return;
    const previous = status;
    setStatus(next);
    setAnimate(true);
    setSaved(false);
    setPending(true);
    const result = await updateCountryStatus(code, next);
    setPending(false);
    if (result?.error) {
      setStatus(previous);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {obligated && (
        <Seal key={status} status={seal} animate={animate} tilt={-1.4} className="self-start" />
      )}
      <div
        role="radiogroup"
        aria-label={t("app.country.statusTitle")}
        className="flex flex-wrap gap-2"
      >
        {ORDER.map((option) => {
          const selected = status === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={pending}
              onClick={() => choose(option)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-2xs transition-colors disabled:opacity-60",
                selected
                  ? "border-brand bg-brand/[0.06] font-medium text-brand"
                  : "border-line text-ink hover:border-brand",
              )}
            >
              {t(`app.country.statusOptions.${option}`)}
            </button>
          );
        })}
      </div>
      {saved && (
        <p role="status" className="text-2xs text-ok">
          {t("app.country.statusSaved")}
        </p>
      )}
    </div>
  );
}
