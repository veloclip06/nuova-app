"use client";

import * as React from "react";
import { t } from "@/lib/i18n";
import { capture } from "@/lib/analytics/capture";
import { EVENTS } from "@/lib/analytics/events";
import type { CheckerAnswers } from "@/lib/checker/options";
import { Button } from "@/components/ui/button";

/**
 * Email gate (ARCHITECTURE.md §6): the screen's single primary CTA. Posts
 * {email, answers} to /api/leads — the server recomputes the result, saves
 * the lead and sends the report. checker_email_submitted fires only on
 * confirmed success, from the client (it owns the whole funnel).
 */

type Status = "idle" | "submitting" | "success" | "error";

export function EmailGate({ answers }: { answers: CheckerAnswers }) {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<Status>("idle");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, answers }),
      });
      if (!response.ok) throw new Error(`leads responded ${response.status}`);
      setStatus("success");
      capture(EVENTS.checkerEmailSubmitted);
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="mx-auto w-full max-w-[680px] rounded-lg border border-line bg-surface p-6 sm:p-8">
      <h2 className="font-display text-lg font-semibold tracking-tightDisplay text-ink">
        {t("check.emailGateTitle")}
      </h2>
      <p className="mt-1 text-base text-muted-foreground">{t("check.emailGateSubtitle")}</p>

      {/* What the report actually contains (mirrors lib/email/checker-report.ts
          sections) — mono indices, registry style, no decorative icons */}
      <ul className="mt-4 flex flex-col gap-1.5">
        {(["1", "2", "3"] as const).map((n) => (
          <li key={n} className="flex gap-2.5 text-2xs text-ink">
            <span aria-hidden="true" className="font-mono text-muted-foreground">
              0{n}
            </span>
            {t(`check.email.contents.${n}`)}
          </li>
        ))}
      </ul>

      {status === "success" ? (
        <div role="status" className="mt-5">
          <p className="text-base font-medium text-ok">{t("check.email.success", { email })}</p>
          <p className="mt-1 text-2xs text-muted-foreground">{t("check.email.successHint")}</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate={false} className="mt-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor="lead-email" className="sr-only">
              {t("check.email.label")}
            </label>
            <input
              id="lead-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("check.emailPlaceholder")}
              className="h-11 min-w-0 flex-1 rounded-md border border-line bg-surface px-4 text-base text-ink placeholder:text-[color:var(--placeholder)]"
            />
            <Button type="submit" disabled={status === "submitting"}>
              {status === "submitting" ? t("check.email.sending") : t("check.emailSubmit")}
            </Button>
          </div>
          {status === "error" && (
            <p role="alert" className="mt-2 text-2xs text-risk">
              {t("check.email.error")}
            </p>
          )}
          <p className="mt-2 text-2xs text-muted-foreground">{t("check.emailReassurance")}</p>
        </form>
      )}
    </section>
  );
}
