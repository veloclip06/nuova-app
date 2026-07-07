/**
 * validate-rules.ts
 *
 * Validates every /rules/*.yaml against the Zod schema (lib/rules/schema.ts).
 * With `--seed`, upserts the validated rules into the public `countries` table
 * (ARCHITECTURE.md §3-4) using the service-role Supabase client.
 *
 *   npm run validate-rules      # validate only (CI-safe, no DB needed)
 *   npm run seed-rules          # validate + seed countries
 *
 * Seeding never runs unless validation is fully green.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadAllRules, listRuleFiles, RULES_DIR } from "@/lib/rules/load";
import type { CountryRule } from "@/lib/rules/schema";

const SEED = process.argv.includes("--seed");

/** Short content hash so `countries.rules_version` traces to the exact file. */
function ruleVersion(rule: CountryRule, file: string): string {
  const raw = readFileSync(join(RULES_DIR, file), "utf8");
  const hash = createHash("sha256").update(raw).digest("hex").slice(0, 8);
  return `${rule.status}-${hash}`;
}

/** Map a validated rule onto a `countries` row. */
function toCountryRow(rule: CountryRule, file: string) {
  return {
    code: rule.country_code,
    name: rule.country_name,
    register_name: rule.register.name,
    authority: rule.register.authority.trim(),
    portal_url: rule.register.portal_url,
    rules_version: ruleVersion(rule, file),
  };
}

async function main() {
  const files = listRuleFiles();
  console.log(`Validating ${files.length} rule file(s) in ${RULES_DIR}\n`);

  const { ok, errors } = loadAllRules();

  for (const { file, rule } of ok) {
    console.log(`  ✓ ${file}  (${rule.country_code} · ${rule.status})`);
  }
  for (const { file, message } of errors) {
    console.error(`  ✗ ${file}\n    ${message.replace(/\n/g, "\n    ")}`);
  }

  if (errors.length > 0) {
    console.error(`\n${errors.length} file(s) failed validation. Aborting.`);
    process.exit(1);
  }

  console.log(`\nAll ${ok.length} rule file(s) valid.`);

  // Report how many normative fields are still unverified — visibility, not a gate.
  const draft = ok.filter(({ rule }) => rule.status === "draft");
  if (draft.length > 0) {
    console.log(
      `${draft.length} file(s) still in draft (awaiting human verification): ` +
        draft.map(({ rule }) => rule.country_code).join(", "),
    );
  }

  if (!SEED) {
    console.log("\nValidation only (pass --seed to write to countries).");
    return;
  }

  console.log("\nSeeding countries…");
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const rows = ok.map(({ rule, file }) => toCountryRow(rule, file));
  const { error } = await supabase
    .from("countries")
    .upsert(rows, { onConflict: "code" });

  if (error) {
    console.error(`Seed failed: ${error.message}`);
    process.exit(1);
  }

  console.log(`Seeded ${rows.length} country row(s): ${rows.map((r) => r.code).join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
