import type { CountryRule } from "@/lib/rules/schema";
import { isEuMember } from "./eu-countries";
import {
  DEFAULT_HORIZON_MONTHS,
  generateDeadlines,
  parseIsoDate,
  pickNextDeadline,
} from "./generate-deadlines";
import type {
  CheckerInput,
  CountryObligation,
  ObligationRequirement,
  RiskFactor,
} from "./types";
import {
  isArUncertain,
  isDraft,
  isMarketplaceEnforcementUncertain,
  isPenaltiesUncertain,
  isRegisterCostUncertain,
  textHasTodoVerify,
} from "./uncertainty";

/**
 * Channel ids that are marketplaces. Product taxonomy (matches the checker's
 * channel options), not a normative value: marketplace enforcement facts live
 * in the YAML (`scope.marketplace_blocking` / `marketplace_enforcement`).
 */
export const MARKETPLACE_CHANNELS: readonly string[] = ["amazon", "ebay"];

function sellsOnMarketplace(channels: string[]): boolean {
  return channels.some((channel) =>
    MARKETPLACE_CHANNELS.includes(channel.trim().toLowerCase()),
  );
}

function buildObligation(
  rule: CountryRule,
  input: CheckerInput,
  establishment: string,
): CountryObligation {
  const domestic = establishment === rule.country_code;
  const onMarketplace = sellsOnMarketplace(input.channels);

  // The legal obligation itself is channel-independent: DE/FR/IT all obligate
  // from the first unit placed on the market (scope.who_is_obligated; the
  // de_minimis texts reduce the fee, never the obligation).
  const obligated = true;

  const requirements: ObligationRequirement[] = rule.requirements
    .filter((req) => req.applies_to !== "non_established" || !domestic)
    .map((req) => {
      const uncertain = textHasTodoVerify(req.note) || textHasTodoVerify(req.when);
      return {
        id: req.id,
        label: req.label,
        when: req.when,
        ...(req.note ? { note: req.note.trim() } : {}),
        ...(uncertain ? { uncertain: true as const } : {}),
      };
    });

  const registerUncertain = isRegisterCostUncertain(rule);
  const register = {
    name: rule.register.name,
    authority: rule.register.authority.trim(),
    portalUrl: rule.register.portal_url,
    costRegistration: rule.register.cost_registration,
    ...(registerUncertain ? { uncertain: true as const } : {}),
  };

  // eu_seller vs non_eu_seller resolved by establishment (EU_MEMBER_STATES —
  // the extra-EU sentinel "ZZ" is not a member, so it falls to non_eu_seller).
  const sellerType = isEuMember(establishment) ? ("eu" as const) : ("non_eu" as const);
  const arCase =
    rule.authorised_representative.required_for_non_established[
      sellerType === "eu" ? "eu_seller" : "non_eu_seller"
    ];
  const authorisedRepresentative = domestic
    ? null
    : {
        sellerType,
        status: arCase.status,
        ...(arCase.value ? { value: arCase.value } : {}),
        ...(arCase.value_until_2026_08_11
          ? { valueUntil20260811: arCase.value_until_2026_08_11 }
          : {}),
        ...(arCase.value_from_2026_08_12
          ? { valueFrom20260812: arCase.value_from_2026_08_12 }
          : {}),
        uncertain: isArUncertain(arCase),
        notes: rule.authorised_representative.notes.trim(),
      };

  const penaltiesUncertain = isPenaltiesUncertain(rule);
  const penalties = {
    summary: rule.penalties.summary.trim(),
    detailUrl: rule.penalties.detail_url,
    ...(penaltiesUncertain ? { uncertain: true as const } : {}),
  };

  // Risk: obligated → medium (penalties always apply); high only when the
  // country's marketplaces block listings AND the company sells on one. A
  // seller with only its own shop is not exposed to marketplace enforcement.
  const riskFactors: RiskFactor[] = [
    {
      text: penalties.summary,
      sourceUrl: penalties.detailUrl,
      ...(penaltiesUncertain ? { uncertain: true as const } : {}),
    },
  ];
  if (onMarketplace) {
    riskFactors.push({
      text: rule.scope.marketplace_enforcement.trim(),
      ...(isMarketplaceEnforcementUncertain(rule) ? { uncertain: true as const } : {}),
    });
  }
  if (authorisedRepresentative?.uncertain) {
    riskFactors.push({ text: authorisedRepresentative.notes, uncertain: true });
  }
  const riskLevel =
    onMarketplace && rule.scope.marketplace_blocking === "yes" ? "high" : "medium";

  // Next deadline for a company that has not registered yet — reuses the
  // deadline generator on a minimal profile (no CAC figures at checker time,
  // so e.g. the CONAI periodicity comes back explicitly uncertain).
  const nextDeadline = pickNextDeadline(
    generateDeadlines(
      {
        establishmentCountry: establishment,
        countries: [{ countryCode: rule.country_code, status: "not_registered" }],
      },
      [rule],
      { referenceDate: input.referenceDate, horizonMonths: DEFAULT_HORIZON_MONTHS },
    ),
  );

  const uncertain =
    isDraft(rule) ||
    registerUncertain ||
    penaltiesUncertain ||
    requirements.some((req) => req.uncertain) ||
    riskFactors.some((factor) => factor.uncertain) ||
    (authorisedRepresentative?.uncertain ?? false) ||
    (nextDeadline?.uncertain ?? false);

  return {
    countryCode: rule.country_code,
    countryName: rule.country_name,
    obligated,
    domestic,
    register,
    requirements,
    nextDeadline,
    riskLevel,
    riskFactors,
    authorisedRepresentative,
    deMinimis: rule.scope.de_minimis.trim(),
    penalties,
    sources: rule.sources.map((s) => ({ ...s })),
    rulesStatus: rule.status,
    lastVerifiedByHuman: rule.last_verified_by_human,
    uncertain,
  };
}

/**
 * Given the checker profile, what must the company do and where
 * (ARCHITECTURE.md §4). Returns one entry per selling country covered by the
 * rule files, in the order the countries were asked for; countries without a
 * rule file are simply absent (the caller decides how to present them).
 */
export function checkObligations(
  input: CheckerInput,
  rules: CountryRule[],
): CountryObligation[] {
  parseIsoDate(input.referenceDate); // fail fast on malformed input
  const byCode = new Map(rules.map((rule) => [rule.country_code, rule]));
  const establishment = input.establishmentCountry.trim().toUpperCase();

  const obligations: CountryObligation[] = [];
  const seen = new Set<string>();
  for (const raw of input.sellingCountries) {
    const code = raw.trim().toUpperCase();
    if (seen.has(code)) continue;
    seen.add(code);
    const rule = byCode.get(code);
    if (!rule) continue;
    obligations.push(buildObligation(rule, input, establishment));
  }
  return obligations;
}
