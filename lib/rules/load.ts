import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { countryRuleSchema, type CountryRule } from "./schema";

export const RULES_DIR = join(process.cwd(), "rules");

export interface LoadedRule {
  file: string;
  rule: CountryRule;
}

export interface RuleLoadError {
  file: string;
  message: string;
}

export interface LoadRulesResult {
  ok: LoadedRule[];
  errors: RuleLoadError[];
}

/** List every *.yaml / *.yml file in /rules. */
export function listRuleFiles(dir: string = RULES_DIR): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
    .sort();
}

/** Parse + validate a single rule file. Never throws. */
export function loadRuleFile(
  file: string,
  dir: string = RULES_DIR,
): { rule?: CountryRule; error?: string } {
  try {
    const raw = readFileSync(join(dir, file), "utf8");
    const data = parseYaml(raw);
    const parsed = countryRuleSchema.safeParse(data);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((i) => `  · ${i.path.join(".") || "(root)"}: ${i.message}`)
        .join("\n");
      return { error: `schema validation failed:\n${issues}` };
    }
    return { rule: parsed.data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

/** Production memo — rule files are bundled at deploy time and never change
 * within a running server, so parsing + Zod validation happens once per dir.
 * Dev/test stay unmemoized to keep YAML hot-reload while authoring rules. */
const memo = new Map<string, LoadRulesResult>();

/**
 * Load + validate all rule files, partitioning successes from failures.
 * Treat the returned result as immutable — in production it is shared
 * between requests.
 */
export function loadAllRules(dir: string = RULES_DIR): LoadRulesResult {
  if (process.env.NODE_ENV === "production") {
    const hit = memo.get(dir);
    if (hit) return hit;
  }
  const result: LoadRulesResult = { ok: [], errors: [] };
  for (const file of listRuleFiles(dir)) {
    const { rule, error } = loadRuleFile(file, dir);
    if (rule) result.ok.push({ file, rule });
    else result.errors.push({ file, message: error ?? "unknown error" });
  }
  if (process.env.NODE_ENV === "production") memo.set(dir, result);
  return result;
}
