import type { CountryRule } from "@/lib/rules/schema";

/**
 * Single place that decides what counts as "uncertain" (CLAUDE.md: unverified
 * normative data must propagate as `uncertain: true`, never presented as
 * settled). Signals, in order of preference:
 *
 * 1. structured markers added next to the sourced text (`uncertain: true`,
 *    `todo_verify`, `cost_registration_uncertain`, ...);
 * 2. the authorised-representative enum's uncertain values;
 * 3. a defensive fallback: the literal TODO-VERIFY marker inside a string
 *    VALUE (markers inside YAML comments are lost at parse time — that is why
 *    the structured mirrors exist).
 */

export const TODO_VERIFY_MARKER = "TODO-VERIFY";

export function textHasTodoVerify(text: string | null | undefined): boolean {
  return typeof text === "string" && text.includes(TODO_VERIFY_MARKER);
}

export function isDraft(rule: CountryRule): boolean {
  return rule.status === "draft";
}

export function isArUncertain(rule: CountryRule): boolean {
  const value = rule.authorised_representative.required_for_non_established;
  return value === "uncertain" || value === "yes_currently_uncertain_future";
}

export function isRegisterCostUncertain(rule: CountryRule): boolean {
  return (
    rule.register.cost_registration === null ||
    rule.register.cost_registration_uncertain === true
  );
}

export function isPenaltiesUncertain(rule: CountryRule): boolean {
  return rule.penalties.uncertain === true || textHasTodoVerify(rule.penalties.summary);
}

export function isMarketplaceEnforcementUncertain(rule: CountryRule): boolean {
  return (
    rule.scope.marketplace_blocking === "uncertain" ||
    rule.scope.marketplace_blocking === undefined ||
    textHasTodoVerify(rule.scope.marketplace_enforcement)
  );
}
