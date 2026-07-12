import * as React from "react";
import type { CountryObligation } from "@/lib/engine/types";
import { sealStatusFor } from "@/lib/checker/seal-status";
import { arCopyFor } from "@/lib/checker/ar-copy";
import { formatDateIt, segmentFigures } from "@/lib/checker/format";
import { t } from "@/lib/i18n";
import { Seal } from "@/components/seal";
import { Flag } from "./flag";
import { UncertainBadge } from "./uncertain-badge";

/**
 * Country result card (design export "Risultato checker", adapted where the
 * engine supersedes the mockup):
 * - seal = legal status (sealStatusFor), date = check date;
 * - risk lines = engine riskFactors verbatim (max 2: penalties + marketplace),
 *   figures in mono, uncertain items badged;
 * - AR gets its own inset block so its uncertainty is never hidden by the cap
 *   and the long sourced paragraph stays scannable (copy stays verbatim);
 * - footer cites sources[0] with "consultata il {accessed}"; "verificato il"
 *   only with a human sign-off date, drafts carry the verification notice.
 */

const TILTS = [-2, -1.2, -1.6];

/** Register-style row label ("intestazione di registro", DESIGN_SYSTEM.md §4). */
function MetaLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-display text-[11px] font-semibold uppercase leading-relaxed tracking-register text-muted-foreground">
      {children}
    </span>
  );
}

function RiskLine({ text, uncertain }: { text: string; uncertain?: boolean }) {
  return (
    <p className="text-xs leading-relaxed text-ink">
      {segmentFigures(text).map((segment, i) =>
        segment.mono ? (
          <span key={i} className="font-mono">
            {segment.text}
          </span>
        ) : (
          <React.Fragment key={i}>{segment.text}</React.Fragment>
        ),
      )}
      {uncertain && <UncertainBadge />}
    </p>
  );
}

export interface ResultCardProps {
  obligation: CountryObligation;
  index: number;
  /** The check date (YYYY-MM-DD) — stamped on the seal. */
  referenceDate: string;
}

export function ResultCard({ obligation, index, referenceDate }: ResultCardProps) {
  const status = sealStatusFor(obligation);
  const domesticKey = `check.result.domestic.${obligation.countryCode}`;
  const domesticCopy = t(domesticKey);
  const deadline = obligation.nextDeadline;

  return (
    <article
      className="flex animate-card-enter flex-col gap-4 rounded-lg border border-line bg-surface p-6"
      // 80ms stagger (design export HANDOFF); animate-card-enter fills "both",
      // so cards stay hidden until their delay; reduced-motion disables it all
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-display text-2xs font-semibold uppercase tracking-register text-ink">
          <Flag code={obligation.countryCode} />
          {obligation.countryName}
        </span>
        <span className="font-mono text-2xs text-muted-foreground">
          {obligation.countryCode}
        </span>
      </div>

      <Seal
        status={status}
        date={formatDateIt(referenceDate)}
        tilt={TILTS[index % TILTS.length]}
        animate
        className="self-start"
      />

      <div className="flex flex-col gap-2">
        {obligation.domestic ? (
          <p className="text-xs leading-relaxed text-ink">
            {domesticCopy === domesticKey
              ? t("check.result.domestic.default", { country: obligation.countryName })
              : domesticCopy}
          </p>
        ) : (
          obligation.riskFactors
            .slice(0, 2)
            .map((factor, i) => (
              <RiskLine key={i} text={factor.text} uncertain={factor.uncertain} />
            ))
        )}
      </div>

      <div className="flex flex-col gap-2 text-2xs">
        <p className="line-clamp-2" title={obligation.register.name}>
          <MetaLabel>{t("check.result.registerLabel")}</MetaLabel>{" "}
          <a
            href={obligation.register.portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm text-brand hover:underline"
          >
            {obligation.register.name}
          </a>
        </p>
        {deadline && (
          <p>
            <MetaLabel>{t("check.result.nextDeadlineLabel")}</MetaLabel>{" "}
            {deadline.dueDate ? (
              <span className="font-mono text-ink">{formatDateIt(deadline.dueDate)}</span>
            ) : (
              <span className="text-ink">{deadline.ruleText}</span>
            )}
            {deadline.uncertain && <UncertainBadge />}
          </p>
        )}
        {obligation.authorisedRepresentative && (
          <div className="rounded-md border border-line bg-paper p-3">
            <p>
              <MetaLabel>{t("check.result.arLabel")}</MetaLabel>
              {obligation.authorisedRepresentative.uncertain && <UncertainBadge />}
            </p>
            <p className="mt-1.5 leading-relaxed text-ink">{arCopyFor(obligation)}</p>
          </div>
        )}
      </div>

      <div className="mt-auto border-t border-line pt-3 text-2xs text-muted-foreground">
        {obligation.sources[0] && (
          <p>
            {t("common.source")}:{" "}
            <a
              href={obligation.sources[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm text-brand hover:underline"
            >
              {obligation.sources[0].title}
            </a>{" "}
            · {t("check.result.sourceAccessed")}{" "}
            <span className="font-mono">{formatDateIt(obligation.sources[0].accessed)}</span>
          </p>
        )}
        {obligation.lastVerifiedByHuman ? (
          <p className="mt-1">
            {t("common.verifiedOn")}{" "}
            <span className="font-mono">{formatDateIt(obligation.lastVerifiedByHuman)}</span>
          </p>
        ) : (
          obligation.rulesStatus === "draft" && (
            <p className="mt-1">{t("check.result.draftNotice")}</p>
          )
        )}
      </div>
    </article>
  );
}
