import { describe, expect, it } from "vitest";
import { buildDeadlineReminderEmail, type ReminderDeadline } from "./deadline-reminder";

const deadlines: ReminderDeadline[] = [
  { countryName: "Germania", date: "2026-05-15", description: "Dichiarazione volumi (LUCID)", daysUntil: 30 },
  { countryName: "Francia", date: "2026-02-28", description: "Adesione éco-organisme", daysUntil: 1 },
];

describe("buildDeadlineReminderEmail", () => {
  it("summarises the deadlines with dd/mm/yyyy dates and the company name", () => {
    const email = buildDeadlineReminderEmail(deadlines, "Rossi Commerce Srl");
    expect(email.subject).toContain("2");
    expect(email.html).toContain("Germania");
    expect(email.html).toContain("Francia");
    expect(email.html).toContain("15/05/2026");
    expect(email.text).toContain("Rossi Commerce Srl");
    expect(email.text).toContain("domani"); // daysUntil 1
  });

  it("uses the singular subject for a single deadline", () => {
    const email = buildDeadlineReminderEmail([deadlines[0]], "Rossi");
    expect(email.subject).toBe("Promemoria: una scadenza EPR in arrivo");
  });
});
