import Link from "next/link";
import type { CompanyCountryStatus, CountryObligation } from "@/lib/engine/types";
import { dashboardSealFor } from "@/lib/app/seal";
import { formatDateIt } from "@/lib/checker/format";
import { t } from "@/lib/i18n";
import { Seal } from "@/components/seal";
import { Flag } from "@/components/checker/flag";
import { Button } from "@/components/ui/button";

/**
 * Country card (DESIGN_SYSTEM.md §5-6, dashboard export): flag + register name +
 * status seal + one-line status + next deadline (Plex Mono) + one action + a
 * source/verification footer. Draft rules never show an invented verification
 * date — they carry the "in verifica" notice instead (§8.13 + YAML rule).
 *
 * Per §6 ("max 1 CTA primaria per schermata") card actions are outline/ghost —
 * the single prominent action is the progress banner on the dashboard.
 */
function statusSentenceKey(obligation: CountryObligation, status: CompanyCountryStatus): string {
  if (!obligation.obligated) return "not_obligated";
  return status;
}

function cardAction(
  obligation: CountryObligation,
  status: CompanyCountryStatus,
): { key: string; variant: "outline" | "ghost" } {
  if (obligation.obligated && status === "not_registered") return { key: "start", variant: "outline" };
  if (obligation.obligated && status === "in_progress") return { key: "continue", variant: "ghost" };
  return { key: "details", variant: "ghost" };
}

export function CountryCard({
  obligation,
  status,
  tilt = 0,
}: {
  obligation: CountryObligation;
  status: CompanyCountryStatus;
  tilt?: number;
}) {
  const seal = dashboardSealFor(obligation, status);
  const href = `/app/paesi/${obligation.countryCode.toLowerCase()}`;
  const sentence = t(`app.dashboard.status.${statusSentenceKey(obligation, status)}`);
  const action = cardAction(obligation, status);
  const source = obligation.sources[0] ?? null;
  const deadline = obligation.nextDeadline;
  const deadlineText = deadline
    ? deadline.dueDate
      ? formatDateIt(deadline.dueDate)
      : t("app.dashboard.deadlines.undated")
    : null;

  return (
    <article className="flex flex-col gap-3.5 rounded-lg border border-line bg-surface p-6 transition-[border-color,box-shadow] hover:border-ink/20 hover:shadow-sm">
      <div className="flex items-center gap-2">
        <Flag code={obligation.countryCode} />
        <span className="font-display text-2xs font-semibold uppercase tracking-register text-ink">
          {obligation.register.name}
        </span>
        <span className="ml-auto text-2xs text-muted-foreground">{obligation.countryName}</span>
      </div>

      <Seal status={seal} tilt={tilt} className="self-start" />

      <p className="text-xs leading-[1.55] text-ink">{sentence}</p>

      <div className="flex items-center justify-between gap-3">
        <span className="text-2xs text-muted-foreground">{t("app.dashboard.card.nextDeadline")}</span>
        <span className="font-mono text-2xs font-semibold text-ink">
          {deadlineText ?? t("app.dashboard.card.noDeadline")}
        </span>
      </div>

      <Button asChild variant={action.variant} size="sm" className="self-start">
        <Link href={href}>{t(`app.dashboard.card.${action.key}`)}</Link>
      </Button>

      <div className="mt-auto border-t border-line pt-3">
        <p className="text-2xs text-muted-foreground">
          {source ? (
            <>
              {t("common.source")}:{" "}
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:underline"
              >
                {source.title}
              </a>{" "}
              ·{" "}
            </>
          ) : null}
          {obligation.lastVerifiedByHuman ? (
            <>
              {t("common.verifiedOn")}{" "}
              <span className="font-mono">{formatDateIt(obligation.lastVerifiedByHuman)}</span>
            </>
          ) : (
            t("app.dashboard.draftNotice")
          )}
        </p>
      </div>
    </article>
  );
}
