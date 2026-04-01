export const SCENARIO_IDS = ["dashboard-priority", "slides-outline-refine", "pm-sprint-handoff"] as const;

export type ScenarioId = (typeof SCENARIO_IDS)[number];

export function isScenarioId(value: string): value is ScenarioId {
  return (SCENARIO_IDS as readonly string[]).includes(value);
}
