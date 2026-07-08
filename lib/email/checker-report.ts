import type { CountryObligation } from "@/lib/engine/types";
import { sealStatusFor } from "@/lib/checker/seal-status";
import { formatDateIt } from "@/lib/checker/format";
import { t } from "@/lib/i18n";
import type { SealStatus } from "@/components/seal";

/**
 * The detailed report promised by the email gate (ARCHITECTURE.md §6): the
 * result cards stay scannable, the full per-country checklist lives here.
 *
 * Pure builder — no I/O, no env. Plain HTML string with inline styles and
 * email-safe system fonts. Every normative datum comes from the engine output
 * (which mirrors /rules YAML): nothing is authored here.
 *
 * Trust rules (DESIGN_SYSTEM.md §8.13 + addendum): every uncertain element is
 * labelled "in verifica"; sources show "consultata il {accessed}"; "verificato
 * il" appears only when a human sign-off date exists; fixed legal disclaimer.
 */

// Design tokens as hex — email clients don't load the app's CSS.
const INK = "#17242f";
const MUTED = "#5a6b76";
const LINE = "#dee3e0";
const BRAND = "#0e6b5c";
const SEAL_COLOR: Record<SealStatus, string> = {
  conforme: "#1e7f4f",
  azione_richiesta: "#b45309",
  esposto: "#b3261e",
  non_obbligato: INK,
};

export interface CheckerReportEmail {
  subject: string;
  html: string;
  text: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function uncertainSuffixHtml(uncertain: boolean | undefined): string {
  return uncertain ? ` <em style="color:${MUTED};font-style:normal;">(${escapeHtml(t("check.result.inVerifica"))})</em>` : "";
}

function uncertainSuffixText(uncertain: boolean | undefined): string {
  return uncertain ? ` (${t("check.result.inVerifica")})` : "";
}

function line(label: string, valueHtml: string): string {
  return `<p style="margin:4px 0;color:${INK};font-size:14px;line-height:1.6;"><strong>${escapeHtml(label)}:</strong> ${valueHtml}</p>`;
}

function countrySectionHtml(obligation: CountryObligation, index: number): string {
  const status = sealStatusFor(obligation);
  const statusLabel = t(`seal.${status}`);
  const parts: string[] = [];

  parts.push(
    `<h2 style="margin:28px 0 4px;padding-top:20px;border-top:1px solid ${LINE};color:${INK};font-size:18px;">` +
      `${index + 1}. ${escapeHtml(obligation.countryName)} — ` +
      `<span style="color:${SEAL_COLOR[status]};text-transform:uppercase;letter-spacing:0.08em;font-size:14px;">${escapeHtml(statusLabel)}</span>` +
      `</h2>`,
  );

  if (obligation.domestic) {
    const domesticKey = `check.result.domestic.${obligation.countryCode}`;
    const domesticCopy = t(domesticKey);
    const copy =
      domesticCopy === domesticKey
        ? t("check.result.domestic.default", { country: obligation.countryName })
        : domesticCopy;
    parts.push(`<p style="margin:4px 0;color:${INK};font-size:14px;line-height:1.6;">${escapeHtml(copy)}</p>`);
  }

  parts.push(
    line(
      t("check.result.registerLabel"),
      `${escapeHtml(obligation.register.name)} — ${escapeHtml(obligation.register.authority)}` +
        ` · <a href="${escapeHtml(obligation.register.portalUrl)}" style="color:${BRAND};">${escapeHtml(obligation.register.portalUrl)}</a>` +
        uncertainSuffixHtml(obligation.register.uncertain),
    ),
  );

  const items = obligation.requirements
    .map(
      (req) =>
        `<li style="margin:4px 0;color:${INK};font-size:14px;line-height:1.6;"><strong>${escapeHtml(req.label)}</strong> — ${escapeHtml(req.when)}` +
        (req.note ? `<br /><span style="color:${MUTED};">${escapeHtml(req.note)}</span>` : "") +
        uncertainSuffixHtml(req.uncertain) +
        `</li>`,
    )
    .join("");
  parts.push(`<p style="margin:12px 0 2px;color:${INK};font-size:14px;"><strong>${escapeHtml(t("check.email.report.checklistTitle"))}</strong></p>`);
  parts.push(`<ol style="margin:0 0 8px;padding-left:20px;">${items}</ol>`);

  if (obligation.nextDeadline) {
    const deadline = obligation.nextDeadline;
    const when = deadline.dueDate ? formatDateIt(deadline.dueDate) : deadline.ruleText;
    parts.push(
      line(
        t("check.result.nextDeadlineLabel"),
        `${escapeHtml(when)}` +
          (deadline.dueDate && deadline.ruleText ? ` — ${escapeHtml(deadline.ruleText)}` : "") +
          uncertainSuffixHtml(deadline.uncertain),
      ),
    );
  }

  if (obligation.authorisedRepresentative) {
    parts.push(
      line(
        t("check.result.arLabel"),
        escapeHtml(obligation.authorisedRepresentative.note) +
          uncertainSuffixHtml(obligation.authorisedRepresentative.uncertain),
      ),
    );
  }

  parts.push(line(t("check.email.report.deMinimisLabel"), escapeHtml(obligation.deMinimis)));

  parts.push(
    line(
      t("check.email.report.penaltiesLabel"),
      escapeHtml(obligation.penalties.summary) +
        uncertainSuffixHtml(obligation.penalties.uncertain) +
        ` · <a href="${escapeHtml(obligation.penalties.detailUrl)}" style="color:${BRAND};">${escapeHtml(t("check.email.report.penaltiesDetail"))}</a>`,
    ),
  );

  const sources = obligation.sources
    .map(
      (source) =>
        `<li style="margin:2px 0;color:${MUTED};font-size:13px;line-height:1.5;"><a href="${escapeHtml(source.url)}" style="color:${BRAND};">${escapeHtml(source.title)}</a> · ${escapeHtml(t("check.result.sourceAccessed"))} ${formatDateIt(source.accessed)}</li>`,
    )
    .join("");
  parts.push(`<p style="margin:12px 0 2px;color:${INK};font-size:14px;"><strong>${escapeHtml(t("check.email.report.sourcesTitle"))}</strong></p>`);
  parts.push(`<ul style="margin:0;padding-left:20px;">${sources}</ul>`);

  if (obligation.lastVerifiedByHuman) {
    parts.push(
      `<p style="margin:6px 0 0;color:${MUTED};font-size:13px;">${escapeHtml(t("common.verifiedOn"))} ${formatDateIt(obligation.lastVerifiedByHuman)}</p>`,
    );
  } else if (obligation.rulesStatus === "draft") {
    parts.push(
      `<p style="margin:6px 0 0;color:${MUTED};font-size:13px;">${escapeHtml(t("check.result.draftNotice"))}</p>`,
    );
  }

  return parts.join("\n");
}

function countrySectionText(obligation: CountryObligation, index: number): string {
  const status = sealStatusFor(obligation);
  const lines: string[] = [];
  lines.push(`${index + 1}. ${obligation.countryName} — ${t(`seal.${status}`).toUpperCase()}`);

  if (obligation.domestic) {
    const domesticKey = `check.result.domestic.${obligation.countryCode}`;
    const domesticCopy = t(domesticKey);
    lines.push(
      domesticCopy === domesticKey
        ? t("check.result.domestic.default", { country: obligation.countryName })
        : domesticCopy,
    );
  }

  lines.push(
    `${t("check.result.registerLabel")}: ${obligation.register.name} — ${obligation.register.authority} · ${obligation.register.portalUrl}${uncertainSuffixText(obligation.register.uncertain)}`,
  );
  lines.push(`${t("check.email.report.checklistTitle")}:`);
  for (const req of obligation.requirements) {
    lines.push(
      `  - ${req.label} — ${req.when}${req.note ? ` (${req.note})` : ""}${uncertainSuffixText(req.uncertain)}`,
    );
  }
  if (obligation.nextDeadline) {
    const deadline = obligation.nextDeadline;
    const when = deadline.dueDate ? formatDateIt(deadline.dueDate) : deadline.ruleText;
    lines.push(`${t("check.result.nextDeadlineLabel")}: ${when}${uncertainSuffixText(deadline.uncertain)}`);
  }
  if (obligation.authorisedRepresentative) {
    lines.push(
      `${t("check.result.arLabel")}: ${obligation.authorisedRepresentative.note}${uncertainSuffixText(obligation.authorisedRepresentative.uncertain)}`,
    );
  }
  lines.push(`${t("check.email.report.deMinimisLabel")}: ${obligation.deMinimis}`);
  lines.push(
    `${t("check.email.report.penaltiesLabel")}: ${obligation.penalties.summary}${uncertainSuffixText(obligation.penalties.uncertain)} · ${obligation.penalties.detailUrl}`,
  );
  lines.push(`${t("check.email.report.sourcesTitle")}:`);
  for (const source of obligation.sources) {
    lines.push(`  - ${source.title} · ${t("check.result.sourceAccessed")} ${formatDateIt(source.accessed)} · ${source.url}`);
  }
  if (obligation.lastVerifiedByHuman) {
    lines.push(`${t("common.verifiedOn")} ${formatDateIt(obligation.lastVerifiedByHuman)}`);
  } else if (obligation.rulesStatus === "draft") {
    lines.push(t("check.result.draftNotice"));
  }
  return lines.join("\n");
}

export function buildCheckerReportEmail(
  obligations: CountryObligation[],
  notCoveredNames: string[],
  referenceDate: string,
): CheckerReportEmail {
  const countries = obligations.map((o) => o.countryName).join(", ");
  const date = formatDateIt(referenceDate);
  const subject = t("check.email.report.subject", {
    countries: countries || notCoveredNames.join(", "),
  });

  const htmlParts: string[] = [];
  htmlParts.push(
    `<div style="max-width:640px;margin:0 auto;padding:24px;font-family:Arial,Helvetica,sans-serif;background:#ffffff;">`,
  );
  htmlParts.push(
    `<p style="margin:0 0 2px;color:${BRAND};font-size:12px;text-transform:uppercase;letter-spacing:0.08em;"><strong>${escapeHtml(t("common.appName"))}</strong></p>`,
  );
  htmlParts.push(`<h1 style="margin:0 0 8px;color:${INK};font-size:22px;">${escapeHtml(t("check.resultTitle"))}</h1>`);
  htmlParts.push(
    `<p style="margin:0 0 4px;color:${INK};font-size:14px;line-height:1.6;">${escapeHtml(t("check.email.report.intro", { date }))}</p>`,
  );
  htmlParts.push(
    `<p style="margin:0;color:${MUTED};font-size:13px;line-height:1.6;">${escapeHtml(t("check.result.assumptionNote"))}</p>`,
  );
  obligations.forEach((obligation, index) => {
    htmlParts.push(countrySectionHtml(obligation, index));
  });
  if (notCoveredNames.length > 0) {
    htmlParts.push(
      `<h2 style="margin:28px 0 4px;padding-top:20px;border-top:1px solid ${LINE};color:${INK};font-size:16px;">${escapeHtml(t("check.email.report.notCoveredTitle"))}</h2>`,
    );
    htmlParts.push(
      `<p style="margin:4px 0;color:${INK};font-size:14px;line-height:1.6;">${escapeHtml(t("check.email.report.notCoveredBody", { countries: notCoveredNames.join(", ") }))}</p>`,
    );
  }
  htmlParts.push(
    `<p style="margin:24px 0 0;color:${INK};font-size:14px;line-height:1.6;">${escapeHtml(t("check.email.report.outro", { appName: t("common.appName") }))}</p>`,
  );
  htmlParts.push(
    `<p style="margin:24px 0 0;padding-top:16px;border-top:1px solid ${LINE};color:${MUTED};font-size:12px;line-height:1.5;">${escapeHtml(t("common.legalDisclaimer"))}</p>`,
  );
  htmlParts.push(`</div>`);

  const textParts: string[] = [
    t("common.appName"),
    t("check.resultTitle"),
    t("check.email.report.intro", { date }),
    t("check.result.assumptionNote"),
    "",
    ...obligations.map((obligation, index) => `${countrySectionText(obligation, index)}\n`),
  ];
  if (notCoveredNames.length > 0) {
    textParts.push(t("check.email.report.notCoveredTitle"));
    textParts.push(t("check.email.report.notCoveredBody", { countries: notCoveredNames.join(", ") }));
    textParts.push("");
  }
  textParts.push(t("check.email.report.outro", { appName: t("common.appName") }));
  textParts.push("");
  textParts.push(t("common.legalDisclaimer"));

  return { subject, html: htmlParts.join("\n"), text: textParts.join("\n") };
}
