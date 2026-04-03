import type { ScenarioId } from "./ids";
import { STUDY_SCENARIO_IDS } from "./ids";
import { conditionForVersionLetter } from "../interface-version";

export type TrialPlanSlot = { scenarioId: ScenarioId; condition: "baseline" | "ephemeral" };

/**
 * Fixed order: Version A first, then Version B (see `conditionForVersionLetter`).
 * One slot per study scenario × letter; scenarios are ordered, then A/B within each.
 */
export function buildTrialPlan(baselineIsVersionA: boolean): TrialPlanSlot[] {
  const slots: TrialPlanSlot[] = [];
  for (const scenarioId of STUDY_SCENARIO_IDS) {
    slots.push({
      scenarioId,
      condition: conditionForVersionLetter(baselineIsVersionA, "A"),
    });
    slots.push({
      scenarioId,
      condition: conditionForVersionLetter(baselineIsVersionA, "B"),
    });
  }
  return slots;
}

export const TRIAL_SCHEDULE_LENGTH = STUDY_SCENARIO_IDS.length * 2;
