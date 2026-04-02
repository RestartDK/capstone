import type { ScenarioId } from "./ids";
import { isScenarioId } from "./ids";
import type { TaskState } from "./task-state";

export type ScenarioTaxonomy = "interpretive" | "refinement" | "task_execution";

/** Target narrative order for the slides refinement task (strong flow). */
export const SLIDES_CANONICAL_ORDER: readonly string[] = [
  "slide-title-card",
  "slide-problem-card",
  "slide-metrics-card",
  "slide-cta-card",
];

/** Weak starting order shown to participants (refinement: reorder + evidence edits). */
export const SLIDES_START_ORDER: readonly string[] = [
  "slide-metrics-card",
  "slide-cta-card",
  "slide-title-card",
  "slide-problem-card",
];

export type ScenarioRegistryEntry = {
  taxonomy: ScenarioTaxonomy;
  correctAnswerId: string;
  ephemeralTargets: readonly string[];
  /** Neutral 1–2 sentence context shown before the task question. No hints toward the answer. */
  scenarioPreamble: string;
  /** First line for participant UI; second line is usually shared study copy. */
  taskHeading: string;
  /**
   * Short outcome steps shown above the interactive prototype so participants know how to finish
   * the trial (proximity: grouped with the artifact, not the narrative preamble).
   */
  participantOutcome: readonly string[];
  /** Instructions for the model: what “good” support should help with. */
  supportUserPromptPreamble: string;
  buildTaskState: () => TaskState;
};

const PROBLEM_RISK_PATTERN = /\b(risk|504|outage|incident|latency|severity|blocked|p0|sev)\b/i;

export function isSlidesRefinementPayloadCorrect(raw: string): boolean {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return false;
  }
  if (typeof parsed !== "object" || parsed === null) return false;
  const o = parsed as { order?: unknown; problemBullets?: unknown };
  if (!Array.isArray(o.order) || !o.order.every((x) => typeof x === "string")) return false;
  if (o.order.length !== SLIDES_CANONICAL_ORDER.length) return false;
  for (let i = 0; i < SLIDES_CANONICAL_ORDER.length; i++) {
    if (o.order[i] !== SLIDES_CANONICAL_ORDER[i]) return false;
  }
  if (!Array.isArray(o.problemBullets) || !o.problemBullets.every((x) => typeof x === "string")) {
    return false;
  }
  const problemText = o.problemBullets.join(" ").trim();
  if (problemText.length < 8) return false;
  return PROBLEM_RISK_PATTERN.test(problemText);
}

export function isPmWorkflowPayloadCorrect(scenarioId: ScenarioId, raw: string): boolean {
  if (scenarioId !== "pm-sprint-handoff") return false;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return false;
  }
  if (typeof parsed !== "object" || parsed === null) return false;
  const id = (parsed as { inProgressTicketId?: unknown }).inProgressTicketId;
  if (typeof id !== "string") return false;
  return id === SCENARIO_REGISTRY["pm-sprint-handoff"]?.correctAnswerId;
}

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
    scenarioPreamble:
      "You are reviewing the operations dashboard for a morning stand-up. The lead asks for one escalation that best explains customer-visible payout failures this week, using both the alert strip and the cards together—not a single metric in isolation.",
    taskHeading:
      "Which area do you escalate first as the best explanation of escalating payout failures, given the alerts and cards combined?",
    participantOutcome: [
      "Read the alerts and cards together.",
      "Click one card.",
      "Submit.",
    ],
    supportUserPromptPreamble:
      "Scenario: interpretive dashboard triage. Task: help the user combine competing signals (alerts + backlog/SLA/sentiment cards) to judge which area best explains payout-impacting failures right now—not simply the loudest single number.",
    buildTaskState: (): TaskState => ({
      scenarioId: "dashboard-priority",
      metrics: [
        { id: "payments-queue", label: "Payments queue depth", value: "212 open (+18% WoW); wallet ERR 3.4%" },
        { id: "missed-sla", label: "Missed SLA (7d)", value: "17 tickets (+4 vs prior week)" },
        { id: "engineering-load", label: "Engineering backlog", value: "94 open (flat)" },
        { id: "csat", label: "CSAT (rolling)", value: "4.1 / 5 (slight dip)" },
        { id: "chargebacks", label: "Chargeback notices", value: "+22% WoW" },
      ],
      alerts: [
        { id: "payments-risk", label: "Payments delivery risk increased week over week" },
        { id: "sla-cluster", label: "SLA misses concentrated in payout-related ticket class" },
        { id: "eng-stability", label: "Core platform stability returned to baseline" },
      ],
    }),
  },
  "slides-outline-refine": {
    taxonomy: "refinement",
    correctAnswerId: "slides-refinement-json",
    ephemeralTargets: [
      "slide-title-card",
      "slide-problem-card",
      "slide-metrics-card",
      "slide-cta-card",
      "deck-context-bar",
    ],
    scenarioPreamble:
      "You are tightening a deck the night before a stakeholder readout. The outline starts in a weak order and the problem slide does not yet surface operational risk clearly.",
    taskHeading:
      "Refine the outline: reorder slides into a coherent story (title → problem → metrics → ask), and edit the Problem slide so it explicitly states a concrete risk (reliability, incident, latency, severity, or similar).",
    participantOutcome: [
      "Drag slides into the correct order.",
      "Edit the Problem slide to state a risk.",
      "Submit.",
    ],
    supportUserPromptPreamble:
      "Scenario: refinement before a stakeholder review. Task: help the user reorder the narrative and strengthen the problem slide with an explicit risk line—not pick a single 'weakest slide' from a list.",
    buildTaskState: (): TaskState => ({
      scenarioId: "slides-outline-refine",
      reviewGoal: "Ship readout: show traction, justify Q3 focus, surface one explicit operational risk before the ask.",
      slides: [
        {
          id: "slide-title-card",
          title: "Title — Q3 priorities",
          summary: "Sets the session objective; placeholders acceptable.",
        },
        {
          id: "slide-problem-card",
          title: "Problem framing",
          summary: "Must name a concrete risk; vague pains are insufficient.",
        },
        {
          id: "slide-metrics-card",
          title: "Metrics snapshot",
          summary: "Evidence and deltas with footnotes.",
        },
        {
          id: "slide-cta-card",
          title: "Ask",
          summary: "Decision request with owners.",
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
      "in-progress-column-header",
    ],
    scenarioPreamble:
      "You are joining sprint planning on a board that already reflects the team’s sprint goal. Use the board itself to pull work into motion.",
    taskHeading:
      "Sprint goal: restore reliable payouts by Friday. Move exactly one ticket from Backlog to In progress—the one that best protects that goal.",
    participantOutcome: [
      "Drag one ticket into In progress.",
      "Pick the one that protects the sprint goal.",
      "Submit.",
    ],
    supportUserPromptPreamble:
      "Scenario: bounded workflow on a task board. Task: help the user complete the move-to-In-progress step for the item that unblocks payout reliability—not pick a card without doing the board action.",
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
  if (!isScenarioId(scenarioId)) {
    return false;
  }
  if (scenarioId === "slides-outline-refine") {
    return isSlidesRefinementPayloadCorrect(answerSubmitted);
  }
  if (scenarioId === "pm-sprint-handoff") {
    return isPmWorkflowPayloadCorrect(scenarioId, answerSubmitted);
  }
  const entry = SCENARIO_REGISTRY[scenarioId];
  return answerSubmitted === entry.correctAnswerId;
}
