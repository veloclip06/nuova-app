"use client";

import * as React from "react";
import { t } from "@/lib/i18n";
import { EU_COUNTRIES, optionKeys } from "@/lib/checker/options";
import { OptionCard } from "./option-card";

/**
 * The uniform 27-EU-state selection grid shared by the checker (step 2) and
 * onboarding (step 2) wizards. Coverage is data, not layout, so no country is
 * visually privileged; the list is sorted by Italian label.
 */
export function CountryGrid({
  name,
  selected,
  onToggle,
}: {
  name: string;
  selected: string[];
  onToggle: (code: string) => void;
}) {
  const euSorted = React.useMemo(
    () =>
      [...EU_COUNTRIES].sort((a, b) =>
        t(optionKeys.country(a)).localeCompare(t(optionKeys.country(b)), "it"),
      ),
    [],
  );
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2.5">
      {euSorted.map((code) => (
        <OptionCard
          key={code}
          type="checkbox"
          name={name}
          value={code}
          checked={selected.includes(code)}
          onChange={() => onToggle(code)}
          label={t(optionKeys.country(code))}
          flagCode={code}
          compact
        />
      ))}
    </div>
  );
}
