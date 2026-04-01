import type { ScenarioId } from "./ids";
import { isScenarioId } from "./ids";
import type { TaskState } from "./task-state";

export type ScenarioTaxonomy = "interpretive" | "refinement" | "task_execution";

export type ScenarioRegistryEntry = {
  taxonomy: ScenarioTaxonomy;
  correctAnswerId: string;
  ephemeralTargets: readonly string[];
  /** First line for participant UI; second line is usually shared study copy. */
  taskHeading: string;
  /** Instructions for the model: what “good” support should help with. */
  supportUserPromptPreamble: string;
  buildTaskState: () => TaskState;
};

export const SCENARIO_REGISTRY: Record<ScenarioId, ScenarioRegistryEntry> = {
  "dashboard-priority": {
    taxonomy: "interpretive",
    correctAnswerId: "payments-backlog-card",
    ephemeralTargets: [
      "payments-backlog-card",
      "engineering-backlog-card",
      "sla-breaches-card",
      "customer-sentiment-card",
      "alerts-strip",
    ],
    taskHeading: "Which area needs the most immediate attention on this dashboard?",
    supportUserPromptPreamble:
      "Scenario: dashboard triage. Task: help the user notice which area likely needs the most immediate attention based on the state below.",
    buildTaskState: (): TaskState => ({
      scenarioId: "dashboard-priority",
      metrics: [
        { id: "ticket-backlog", label: "Ticket backlog", value: 48 },
        { id: "missed-sla", label: "Missed SLA (7d)", value: 17 },
        { id: "payments-queue", label: "Payments queue depth", value: 212 },
        { id: "csat", label: "CSAT (rolling)", value: "4.1 / 5" },
      ],
      alerts: [
        { id: "payments-risk", label: "Payments delivery risk increased week over week" },
        { id: "eng-stability", label: "Engineering stability returned to baseline" },
      ],
    }),
  },
  "slides-outline-refine": {
    taxonomy: "refinement",
    correctAnswerId: "slide-problem-card",
    ephemeralTargets: [
      "slide-title-card",
      "slide-problem-card",
      "slide-metrics-card",
      "slide-cta-card",
      "deck-context-bar",
    ],
    taskHeading:
      "Stakeholder review is tomorrow. Which slide should you strengthen first so the narrative holds up?",
    supportUserPromptPreamble:
      "Scenario: outline refinement before a stakeholder review. Task: help the user decide which slide content is weakest and should be tightened first.",
    buildTaskState: (): TaskState => ({
      scenarioId: "slides-outline-refine",
      reviewGoal: "Ship readout: show traction, justify Q3 focus, and surface one key risk.",
      slides: [
        {
          id: "slide-title-card",
          title: "Title — Q3 priorities",
          summary: "Sets the session objective; mostly placeholders.",
        },
        {
          id: "slide-problem-card",
          title: "Problem framing",
          summary: "Single vague bullet; no customer evidence or urgency.",
        },
        {
          id: "slide-metrics-card",
          title: "Metrics snapshot",
          summary: "Concrete ARR, retention, and funnel deltas with footnotes.",
        },
        {
          id: "slide-cta-card",
          title: "Ask",
          summary: "Clear decision request with two options and owners.",
        },
      ],
    }),
  },
  "pm-sprint-handoff": {
    taxonomy: "task_execution",
    correctAnswerId: "ticket-api-timeout",
    ephemeralTargets: [
      "ticket-docs-lag",
      "ticket-api-timeout",
      "ticket-ui-copy",
      "ticket-data-hygiene",
      "sprint-goal-strip",
      "backlog-column-header",
    ],
    taskHeading:
      "Sprint goal: restore reliable payouts by Friday. Which backlog item should move to In progress first?",
    supportUserPromptPreamble:
      "Scenario: sprint planning handoff. Task: help the user pick the backlog item that best protects the sprint goal.",
    buildTaskState: (): TaskState => ({
      scenarioId: "pm-sprint-handoff",
      sprintGoal: "Restore reliable payouts by Friday; reduce customer-visible payout errors to near zero.",
      risks: [
        { id: "risk-payouts", label: "Payout path still seeing intermittent 504s on peak hours" },
        { id: "risk-scope", label: "Analytics polish requests may expand scope" },
      ],
      backlog: [
        {
          id: "ticket-docs-lag",
          title: "Refresh API error codes in help center",
          priority: "P2",
          detail: "Improves support deflection; not blocking release.",
        },
        {
          id: "ticket-api-timeout",
          title: "Harden payout API timeout + retry policy",
          priority: "P0",
          detail: "Directly tied to 504s; blocking GA for payouts.",
        },
        {
          id: "ticket-ui-copy",
          title: "Clarify payout status labels in wallet UI",
          priority: "P1",
          detail: "Helps users but does not fix server failures.",
        },
        {
          id: "ticket-data-hygiene",
          title: "Backfill missing settlement metadata",
          priority: "P1",
          detail: "Important for reporting after reliability is stable.",
        },
      ],
    }),
  },
};

export function getScenarioEntry(scenarioId: string): ScenarioRegistryEntry | null {
  if (!isScenarioId(scenarioId)) {
    return null;
  }
  return SCENARIO_REGISTRY[scenarioId];
}

export function getTaskStateForScenario(scenarioId: string): TaskState | null {
  const entry = getScenarioEntry(scenarioId);
  return entry ? entry.buildTaskState() : null;
}

export function isAnswerCorrectForScenario(scenarioId: string, answerSubmitted: string): boolean {
  const entry = getScenarioEntry(scenarioId);
  if (!entry) {
    return false;
  }
  return answerSubmitted === entry.correctAnswerId;
}
