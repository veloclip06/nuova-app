/**
 * Deterministic EPR rules engine (ARCHITECTURE.md §4) — three pure functions,
 * no AI, no I/O: rules are parsed from /rules/*.yaml by lib/rules/load.ts and
 * passed in. Anything unverified in the YAML propagates as `uncertain: true`.
 */
export { checkObligations, MARKETPLACE_CHANNELS } from "./check-obligations";
export { computeReport } from "./compute-report";
export {
  DEFAULT_HORIZON_MONTHS,
  generateDeadlines,
  pickNextDeadline,
  resolveSchedule,
} from "./generate-deadlines";
export { EU_MEMBER_STATES, isEuMember } from "./eu-countries";
export * from "./types";
