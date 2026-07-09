"use client";

import { useEffect, useRef } from "react";
import { capture } from "@/lib/analytics/capture";
import { EVENTS } from "@/lib/analytics/events";

/**
 * Fires checker_result once when the result page is viewed. Aggregate
 * properties only — no email, no PII. notCoveredCountries carries WHICH
 * selected countries have no rule file yet: it is the demand signal that
 * decides the next country to cover.
 */
export interface ResultTrackerProps {
  covered: number;
  exposed: number;
  /** ISO codes of selected countries without a rule file. */
  notCoveredCountries: string[];
  establishment: string;
  channels: string[];
}

export function ResultTracker({
  covered,
  exposed,
  notCoveredCountries,
  establishment,
  channels,
}: ResultTrackerProps) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    capture(EVENTS.checkerResult, {
      covered,
      exposed,
      notCovered: notCoveredCountries.length,
      notCoveredCountries,
      establishment,
      channels,
    });
  }, [covered, exposed, notCoveredCountries, establishment, channels]);
  return null;
}
