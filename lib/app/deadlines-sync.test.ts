import { describe, expect, it } from "vitest";
import type { EngineDeadline } from "@/lib/engine/types";
import { reconcileDeadlines, toDesiredDeadlines } from "./deadlines-sync";
import type { DeadlineRow } from "./types";

const deadline = (
  countryCode: string,
  kind: EngineDeadline["kind"],
  dueDate: string | null,
): EngineDeadline => ({
  countryCode,
  kind,
  sourceKind: "test",
  dueDate,
  periodLabel: "",
  ruleText: "rule",
});

const row = (
  id: string,
  country_code: string,
  kind: string,
  due_date: string,
  status: string,
): DeadlineRow => ({
  id,
  company_id: "c1",
  country_code,
  kind,
  due_date,
  status,
  reminder_sent_at: null,
});

describe("toDesiredDeadlines", () => {
  it("drops undated deadlines and dedupes by (country, kind, dueDate)", () => {
    const desired = toDesiredDeadlines([
      deadline("DE", "report", "2027-05-15"),
      deadline("IT", "registration", null),
      deadline("DE", "report", "2027-05-15"),
      deadline("FR", "registration", "2026-09-30"),
    ]);
    expect(desired).toEqual([
      { countryCode: "DE", kind: "report", dueDate: "2027-05-15" },
      { countryCode: "FR", kind: "registration", dueDate: "2026-09-30" },
    ]);
  });
});

describe("reconcileDeadlines", () => {
  it("inserts new, deletes stale open, keeps matches and done history", () => {
    const desired = toDesiredDeadlines([
      deadline("DE", "report", "2027-05-15"),
      deadline("FR", "registration", "2026-09-30"),
    ]);
    const existing: DeadlineRow[] = [
      row("e1", "DE", "report", "2027-05-15", "open"), // unchanged → keep, no insert
      row("e2", "IT", "report", "2027-01-20", "open"), // stale open → delete
      row("e3", "DE", "report", "2026-01-01", "done"), // stale but done → keep
    ];

    const plan = reconcileDeadlines(desired, existing);
    expect(plan.toInsert).toEqual([
      { countryCode: "FR", kind: "registration", dueDate: "2026-09-30" },
    ]);
    expect(plan.toDeleteIds).toEqual(["e2"]);
  });

  it("first sync inserts everything", () => {
    const desired = toDesiredDeadlines([deadline("DE", "report", "2027-05-15")]);
    const plan = reconcileDeadlines(desired, []);
    expect(plan.toInsert).toHaveLength(1);
    expect(plan.toDeleteIds).toEqual([]);
  });
});
