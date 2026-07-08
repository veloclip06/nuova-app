"use client";

import { useEffect, useRef } from "react";
import { capture } from "@/lib/analytics/capture";
import { EVENTS } from "@/lib/analytics/events";

/**
 * Fires checker_result once when the result page is viewed. Aggregate
 * properties only — no email, no PII.
 */
export interface ResultTrackerProps {
  covered: number;
  exposed: number;
  notCovered: number;
  establishment: string;
  channels: string[];
}

export function ResultTracker({
  covered,
  exposed,
  notCovered,
  establishment,
  channels,
}: ResultTrackerProps) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    capture(EVENTS.checkerResult, { covered, exposed, notCovered, establishment, channels });
  }, [covered, exposed, notCovered, establishment, channels]);
  return null;
}
