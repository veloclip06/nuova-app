import { z } from "zod";
import { checkObligations } from "@/lib/engine/check-obligations";
import type { CheckerInput, CountryObligation } from "@/lib/engine/types";
import type { CountryRule } from "@/lib/rules/schema";
import { toCheckerInput, type CheckerAnswers } from "./options";
import { sanitizeAnswers } from "./params";

/**
 * Email-gate payload validation + lead assembly (ARCHITECTURE.md §6:
 * salva lead → invia report). Server-side only (zod, engine).
 *
 * The result is always recomputed here from the answers — the client never
 * ships obligations, so a tampered request cannot store a fabricated result.
 */

export const leadPayloadSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  answers: z.unknown().transform((raw, ctx): CheckerAnswers => {
    const answers = sanitizeAnswers(raw);
    if (!answers) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "invalid checker answers" });
      return z.NEVER;
    }
    return answers;
  }),
});

export type LeadPayload = z.infer<typeof leadPayloadSchema>;

export interface Lead {
  email: string;
  /** Stored in leads.answers (jsonb) — the exact engine input, referenceDate included. */
  answers: CheckerInput;
  /** Stored in leads.result (jsonb) — recomputed server-side. */
  result: CountryObligation[];
}

export function buildLead(
  payload: LeadPayload,
  rules: CountryRule[],
  referenceDate: string,
): Lead {
  const input = toCheckerInput(payload.answers, referenceDate);
  return {
    email: payload.email,
    answers: input,
    result: checkObligations(input, rules),
  };
}
