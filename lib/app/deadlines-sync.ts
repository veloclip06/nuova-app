import type { EngineDeadline } from "@/lib/engine/types";
import type { DeadlineRow } from "./types";

/**
 * Materialisation of engine deadlines into the `deadlines` table (ARCHITECTURE.md
 * §3, §7). The dashboard renders `generateDeadlines` live; this persists only the
 * DATED occurrences so the Vercel Cron can send 30/7/1-day reminders and track
 * `status`/`reminder_sent_at`. Undated deadlines (no machine-readable date in the
 * YAML — the engine never invents one) are intentionally not persisted.
 *
 * The reconcile step is pure so it can be unit-tested; the I/O wrapper
 * `syncDeadlines` applies it against Supabase.
 */

export interface DesiredDeadline {
  countryCode: string;
  kind: string;
  /** YYYY-MM-DD — never null here (undated deadlines are filtered out first). */
  dueDate: string;
}

export interface ReconcilePlan {
  toInsert: DesiredDeadline[];
  toDeleteIds: string[];
}

const keyOf = (d: { countryCode: string; kind: string; dueDate: string }): string =>
  `${d.countryCode}|${d.kind}|${d.dueDate}`;

/** Keep only dated deadlines and dedupe by (country, kind, dueDate). */
export function toDesiredDeadlines(deadlines: EngineDeadline[]): DesiredDeadline[] {
  const seen = new Set<string>();
  const result: DesiredDeadline[] = [];
  for (const deadline of deadlines) {
    if (!deadline.dueDate) continue;
    const desired: DesiredDeadline = {
      countryCode: deadline.countryCode,
      kind: deadline.kind,
      dueDate: deadline.dueDate,
    };
    const key = keyOf(desired);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(desired);
  }
  return result;
}

/**
 * Diff desired vs existing rows. Matches on (country, kind, dueDate) so an
 * unchanged deadline keeps its `status` and `reminder_sent_at`. New ones are
 * inserted; stale OPEN ones are deleted (rows already marked done/overdue are
 * kept as operational history — a regenerated schedule never wipes them).
 */
export function reconcileDeadlines(
  desired: DesiredDeadline[],
  existing: DeadlineRow[],
): ReconcilePlan {
  const desiredKeys = new Set(desired.map(keyOf));
  const existingKeys = new Set(
    existing.map((row) => keyOf({ countryCode: row.country_code, kind: row.kind, dueDate: row.due_date })),
  );

  const toInsert = desired.filter((d) => !existingKeys.has(keyOf(d)));
  const toDeleteIds = existing
    .filter(
      (row) =>
        row.status === "open" &&
        !desiredKeys.has(keyOf({ countryCode: row.country_code, kind: row.kind, dueDate: row.due_date })),
    )
    .map((row) => row.id);

  return { toInsert, toDeleteIds };
}
