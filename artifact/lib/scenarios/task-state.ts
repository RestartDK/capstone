import type { ScenarioId } from "./ids";

export type DashboardTaskState = {
  scenarioId: "dashboard-priority";
  metrics: { id: string; label: string; value: string | number }[];
  alerts: { id: string; label: string }[];
};

export type SlidesTaskState = {
  scenarioId: "slides-outline-refine";
  reviewGoal: string;
  slides: { id: string; title: string; summary: string }[];
};

export type PmSprintTaskState = {
  scenarioId: "pm-sprint-handoff";
  sprintGoal: string;
  risks: { id: string; label: string }[];
  backlog: { id: string; title: string; priority: string; detail: string }[];
};

export type TaskState = DashboardTaskState | SlidesTaskState | PmSprintTaskState;

export function taskStateScenarioId(state: TaskState): ScenarioId {
  return state.scenarioId;
}
