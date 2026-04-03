export const SCENARIO_IDS = [
  "dashboard-priority",
  "slides-outline-refine",
  "pm-sprint-handoff",
] as const;

export type ScenarioId = (typeof SCENARIO_IDS)[number];

/** Scenarios used in the live study (subset of {@link SCENARIO_IDS}). */
export const STUDY_SCENARIO_IDS = ["slides-outline-refine"] as const satisfies readonly ScenarioId[];

export function isScenarioId(value: string): value is ScenarioId {
  return (SCENARIO_IDS as readonly string[]).includes(value);
}
