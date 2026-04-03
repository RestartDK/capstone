import type { ScenarioId } from "./ids"
import type { ScenarioVariant } from "./variant"

/** Which read-only canvas template a slide uses (shared layouts). */
export type SlideCanvasTemplate = "title" | "problem" | "metrics" | "ask"

export type DashboardCardState = {
  id: string
  title: string
  subtitle: string
  metric: string
  trend: string
  footnote?: string
  sparkline: number[]
  updatedAt: string
}

export type DashboardTaskState = {
  scenarioId: "dashboard-priority"
  variant: ScenarioVariant
  workspaceTitle: string
  title: string
  timestampLabel: string
  cards: DashboardCardState[]
  alerts: { id: string; label: string }[]
}

export type SlideDef = {
  id: string
  title: string
  summary: string
  bullets: string[]
  canvas: SlideCanvasTemplate
  /** Short chip on thumbnails (e.g. title, policy, vote). */
  stripTag: string
}

export type SlidesTaskState = {
  scenarioId: "slides-outline-refine"
  variant: ScenarioVariant
  reviewGoal: string
  deckLabel: string
  deckDeadlineLabel: string
  slides: SlideDef[]
}

export type PmTicketState = {
  id: string
  title: string
  priority: string
  detail: string
  acceptanceCriteria: string
  linkedIncident: string | null
  estimate: string
}

export type PmSprintTaskState = {
  scenarioId: "pm-sprint-handoff"
  variant: ScenarioVariant
  boardLabel: string
  sprintGoal: string
  risks: { id: string; label: string }[]
  backlog: PmTicketState[]
}

export type TaskState = DashboardTaskState | SlidesTaskState | PmSprintTaskState

export function taskStateScenarioId(state: TaskState): ScenarioId {
  return state.scenarioId
}
