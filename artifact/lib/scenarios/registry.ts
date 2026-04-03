import type { ScenarioId } from "./ids"
import { isScenarioId } from "./ids"
import type {
  DashboardTaskState,
  PmSprintTaskState,
  SlidesTaskState,
  TaskState,
} from "./task-state"
import type { ScenarioVariant } from "./variant"

export type ScenarioTaxonomy = "interpretive" | "refinement" | "task_execution"

export const SLIDES_CANONICAL_ORDER: readonly string[] = [
  "slide-title-card",
  "slide-problem-card",
  "slide-metrics-card",
  "slide-cta-card",
]

export const SLIDES_START_ORDER: readonly string[] = [
  "slide-metrics-card",
  "slide-cta-card",
  "slide-title-card",
  "slide-problem-card",
]

export type ScenarioRegistryEntry = {
  taxonomy: ScenarioTaxonomy
  correctAnswerId: string
  ephemeralTargets: readonly string[]
  scenarioPreamble: string
  taskHeading: string
  participantOutcome: readonly string[]
  supportUserPromptPreamble: string
  buildTaskState: () => TaskState
}

const EPHEMERAL_TARGETS = {
  dashboard: [
    "payments-backlog-card",
    "engineering-backlog-card",
    "sla-breaches-card",
    "customer-sentiment-card",
    "alerts-strip",
  ] as const,
  slides: [
    "slide-title-card",
    "slide-problem-card",
    "slide-metrics-card",
    "slide-cta-card",
    "deck-context-bar",
    "slide-canvas-area",
    "slide-canvas-header",
    "slide-problem-hint",
    "slide-problem-bullets",
  ] as const,
  pm: [
    "ticket-docs-lag",
    "ticket-api-timeout",
    "ticket-ui-copy",
    "ticket-data-hygiene",
    "sprint-goal-strip",
    "backlog-column-header",
    "in-progress-column-header",
  ] as const,
}

const PROBLEM_RISK_PATTERN =
  /\b(risk|delay|delayed|late|missed|complaint|complaints|shortage|backlog|bottleneck|confusion|overbooked|failure|issue|problem)\b/i

function buildDashboardVariantA(): DashboardTaskState {
  return {
    scenarioId: "dashboard-priority",
    variant: "a",
    workspaceTitle: "TeamPulse",
    title: "Customer Support · Morning Check-in",
    timestampLabel: "Wed 2 Apr 2025 · 09:15 UTC",
    cards: [
      {
        id: "payments-backlog-card",
        title: "Delayed orders",
        subtitle: "Orders waiting on packing, dispatch, or manual follow-up",
        metric: "212 delayed",
        trend: "+18% vs last week",
        footnote:
          "Most new complaints mention orders arriving later than promised",
        sparkline: [140, 155, 168, 175, 190, 198, 212],
        updatedAt: "Updated 12 min ago",
      },
      {
        id: "engineering-backlog-card",
        title: "Internal requests",
        subtitle: "Website, campaign, and admin improvements",
        metric: "94 open",
        trend: "flat vs last week",
        footnote: "Routine work only; nothing urgent is stacked here",
        sparkline: [91, 96, 93, 95, 92, 94, 94],
        updatedAt: "Updated 28 min ago",
      },
      {
        id: "sla-breaches-card",
        title: "Missed reply targets",
        subtitle: "Messages answered later than the promised support window",
        metric: "17 this week",
        trend: "+4 vs prior week",
        footnote: "Late replies often reference shipping and tracking problems",
        sparkline: [8, 9, 11, 10, 13, 15, 17],
        updatedAt: "Updated 6 min ago",
      },
      {
        id: "customer-sentiment-card",
        title: "Customer satisfaction",
        subtitle: "Rolling post-support survey",
        metric: "4.1 / 5",
        trend: "slight dip",
        footnote:
          "Recent comments repeatedly mention late deliveries and uncertainty",
        sparkline: [44, 45, 44, 43, 42, 42, 41],
        updatedAt: "Updated 1 hr ago",
      },
    ],
    alerts: [
      {
        id: "payments-risk",
        label: "Customer complaints about late deliveries increased this week",
      },
      {
        id: "sla-cluster",
        label:
          "Most missed reply targets are tied to delivery-related messages",
      },
      {
        id: "eng-stability",
        label: "Website traffic and checkout activity stayed close to normal",
      },
    ],
  }
}

function buildDashboardVariantB(): DashboardTaskState {
  return {
    scenarioId: "dashboard-priority",
    variant: "b",
    workspaceTitle: "TeamPulse",
    title: "Event Support · Morning Check-in",
    timestampLabel: "Thu 10 Apr 2025 · 09:10 UTC",
    cards: [
      {
        id: "payments-backlog-card",
        title: "Registration queue",
        subtitle: "Sign-up issues, confirmation resend requests, manual fixes",
        metric: "163 open",
        trend: "+21% vs last week",
        footnote:
          "Backlog rose after attendees reported missing confirmation emails",
        sparkline: [102, 109, 118, 129, 141, 152, 163],
        updatedAt: "Updated 9 min ago",
      },
      {
        id: "engineering-backlog-card",
        title: "Design requests",
        subtitle: "Posters, social assets, and signage updates",
        metric: "101 open",
        trend: "flat vs last week",
        footnote:
          "Routine coordination work; no clear spike tied to attendee issues",
        sparkline: [100, 99, 102, 103, 100, 101, 101],
        updatedAt: "Updated 25 min ago",
      },
      {
        id: "sla-breaches-card",
        title: "Missed response targets",
        subtitle: "Attendee questions answered later than promised",
        metric: "19 this week",
        trend: "+6 vs prior week",
        footnote:
          "Late replies cluster around registration and confirmation issues",
        sparkline: [7, 8, 10, 11, 13, 16, 19],
        updatedAt: "Updated 5 min ago",
      },
      {
        id: "customer-sentiment-card",
        title: "Attendee sentiment",
        subtitle: "Rolling event support survey",
        metric: "4.2 / 5",
        trend: "slight dip",
        footnote:
          "Comments mention uncertainty about whether registration actually worked",
        sparkline: [46, 46, 45, 45, 44, 43, 42],
        updatedAt: "Updated 58 min ago",
      },
    ],
    alerts: [
      {
        id: "activation-risk",
        label: "Attendee confusion about registration increased this week",
      },
      {
        id: "verification-cluster",
        label:
          "Most missed response targets are tied to registration questions",
      },
      {
        id: "payments-stable",
        label: "Website visits stayed steady across the week",
      },
    ],
  }
}

function buildSlidesVariantA(): SlidesTaskState {
  return {
    scenarioId: "slides-outline-refine",
    variant: "a",
    reviewGoal:
      "Prepare a team update that explains the problem clearly, shows supporting evidence, and names one concrete risk before the ask.",
    deckLabel: "Team update draft",
    deckDeadlineLabel: "Due tomorrow 09:00",
    slides: [
      {
        id: "slide-title-card",
        title: "Customer experience update",
        summary: "Sets the readout frame and stakes.",
        bullets: [
          "Weekly team review",
          "Decision: focus on delivery delays first",
        ],
      },
      {
        id: "slide-problem-card",
        title: "Problem",
        summary: "Must name a concrete risk; vague pains are insufficient.",
        bullets: [
          "Late deliveries are driving repeat customer complaints",
          "Current wording is still too vague",
        ],
      },
      {
        id: "slide-metrics-card",
        title: "Metrics snapshot",
        summary: "Evidence and deltas with footnotes.",
        bullets: [
          "Delivery complaints +18% this month",
          "On-time delivery rate 82%",
          "Refund requests +9% week over week",
        ],
      },
      {
        id: "slide-cta-card",
        title: "Ask",
        summary: "Decision request with owners.",
        bullets: [
          "Approve a delivery recovery plan",
          "Assign one operations lead and one support lead",
          "Review impact in 30 days",
        ],
      },
    ],
  }
}

function buildSlidesVariantB(): SlidesTaskState {
  return {
    scenarioId: "slides-outline-refine",
    variant: "b",
    reviewGoal:
      "Prepare a readiness update that explains the current problem clearly, shows supporting evidence, and names one concrete risk before the ask.",
    deckLabel: "Event readiness draft",
    deckDeadlineLabel: "Due tomorrow 11:30",
    slides: [
      {
        id: "slide-title-card",
        title: "Open day readiness",
        summary: "Frames the launch review and decision.",
        bullets: [
          "Planning review",
          "Decision: protect check-in before event day",
        ],
      },
      {
        id: "slide-problem-card",
        title: "Problem",
        summary: "Must name a concrete risk; vague pains are insufficient.",
        bullets: [
          "Too few trained volunteers could cause long check-in delays",
          "The draft still avoids naming the real risk clearly",
        ],
      },
      {
        id: "slide-metrics-card",
        title: "Metrics snapshot",
        summary: "Evidence and deltas with footnotes.",
        bullets: [
          "Volunteer coverage at 68% of target",
          "Queue wait estimate up 12 minutes",
          "Last event: 23 check-in complaints",
        ],
      },
      {
        id: "slide-cta-card",
        title: "Ask",
        summary: "Decision request with owners.",
        bullets: [
          "Approve an extra volunteer recruitment push",
          "Assign one logistics lead and one check-in lead",
          "Return with an updated staffing plan",
        ],
      },
    ],
  }
}

function buildPmVariantA(): PmSprintTaskState {
  return {
    scenarioId: "pm-sprint-handoff",
    variant: "a",
    boardLabel: "Planning board",
    sprintGoal:
      "Get next Friday's event check-in running smoothly; reduce guest confusion and delays before the doors open.",
    risks: [
      {
        id: "risk-payouts",
        label:
          "The guest list still contains duplicate registrations that will slow check-in",
      },
      {
        id: "risk-scope",
        label: "Last-minute poster changes may expand scope",
      },
    ],
    backlog: [
      {
        id: "ticket-docs-lag",
        title: "Update the attendee FAQ page",
        priority: "P2",
        detail:
          "Helpful for guests, but not what will break check-in on the day.",
        acceptanceCriteria:
          "FAQ answers the top 10 attendee questions and is reviewed by the event lead.",
        linkedIncident: null,
        estimate: "2 pts",
      },
      {
        id: "ticket-api-timeout",
        title: "Remove duplicate registrations from the guest list",
        priority: "P0",
        detail:
          "Duplicate names will slow staff down at the door and confuse guests.",
        acceptanceCriteria:
          "Each guest appears once on the final list and the check-in sheet matches printed badges.",
        linkedIncident: "OPS-4471",
        estimate: "5 pts",
      },
      {
        id: "ticket-ui-copy",
        title: "Rewrite the reminder email subject line",
        priority: "P1",
        detail: "Useful polish, but it does not protect the check-in flow.",
        acceptanceCriteria:
          "New subject line is approved and scheduled in the mailing tool.",
        linkedIncident: null,
        estimate: "1 pt",
      },
      {
        id: "ticket-data-hygiene",
        title: "Resize sponsor logos for the welcome slide",
        priority: "P1",
        detail:
          "Needed before the presentation, not before guests reach the desk.",
        acceptanceCriteria:
          "All sponsor logos fit the template and pass the design check.",
        linkedIncident: null,
        estimate: "3 pts",
      },
    ],
  }
}

function buildPmVariantB(): PmSprintTaskState {
  return {
    scenarioId: "pm-sprint-handoff",
    variant: "b",
    boardLabel: "Prep board",
    sprintGoal:
      "Make the workshop launch feel organised by Friday; reduce confusion before guests arrive for the first session.",
    risks: [
      {
        id: "risk-verification",
        label: "Volunteer cover is incomplete for the busiest arrival window",
      },
      {
        id: "risk-scope",
        label:
          "Extra reporting requests may distract the team from launch prep",
      },
    ],
    backlog: [
      {
        id: "ticket-docs-lag",
        title: "Update the workshop FAQ page",
        priority: "P2",
        detail:
          "Helpful for guests later, but not the biggest launch risk right now.",
        acceptanceCriteria:
          "FAQ answers the top workshop questions and is reviewed by the host team.",
        linkedIncident: null,
        estimate: "2 pts",
      },
      {
        id: "ticket-api-timeout",
        title: "Rewrite the arrival reminder message",
        priority: "P1",
        detail:
          "Useful polish, but it will not fix the biggest launch-day bottleneck.",
        acceptanceCriteria: "Reminder copy is approved and ready to send.",
        linkedIncident: null,
        estimate: "1 pt",
      },
      {
        id: "ticket-ui-copy",
        title: "Add sponsor notes to the follow-up report template",
        priority: "P1",
        detail: "Useful after the workshop, not before the doors open.",
        acceptanceCriteria:
          "Report template includes sponsor notes and is shared with the team.",
        linkedIncident: null,
        estimate: "3 pts",
      },
      {
        id: "ticket-data-hygiene",
        title: "Close the volunteer staffing gap for check-in",
        priority: "P0",
        detail:
          "Without enough trained volunteers, guests will face long lines at arrival.",
        acceptanceCriteria:
          "Every check-in shift has confirmed coverage and the busiest arrival slot has backup volunteers.",
        linkedIncident: "OPS-4520",
        estimate: "5 pts",
      },
    ],
  }
}

export const SCENARIO_REGISTRY: Record<
  ScenarioId,
  Record<ScenarioVariant, ScenarioRegistryEntry>
> = {
  "dashboard-priority": {
    a: {
      taxonomy: "interpretive",
      correctAnswerId: "payments-backlog-card",
      ephemeralTargets: EPHEMERAL_TARGETS.dashboard,
      scenarioPreamble:
        "You are reviewing a customer-support dashboard in a morning stand-up. The lead asks for one area to escalate first that best explains the rise in customer complaints this week, using both the alerts and the cards together rather than a single number in isolation.",
      taskHeading:
        "Which area would you escalate first as the best explanation for rising customer complaints, given the alerts and cards combined?",
      participantOutcome: [
        "Select the card that best answers the task (one choice).",
      ],
      supportUserPromptPreamble:
        "Scenario: interpretive dashboard triage. Task: help the user combine competing signals (alerts plus cards) to judge which area best explains the complaint spike right now, not simply the loudest single number.",
      buildTaskState: buildDashboardVariantA,
    },
    b: {
      taxonomy: "interpretive",
      correctAnswerId: "sla-breaches-card",
      ephemeralTargets: EPHEMERAL_TARGETS.dashboard,
      scenarioPreamble:
        "You are reviewing an event-support dashboard in a morning stand-up. The lead asks for one area to escalate first that best explains attendee confusion this week, using both the alerts and the cards together rather than a single number in isolation.",
      taskHeading:
        "Which area would you escalate first as the best explanation for growing attendee confusion, given the alerts and cards combined?",
      participantOutcome: [
        "Select the card that best answers the task (one choice).",
      ],
      supportUserPromptPreamble:
        "Scenario: interpretive dashboard triage. Task: help the user combine competing signals (alerts plus cards) to judge which area best explains attendee confusion right now, not simply the loudest single number.",
      buildTaskState: buildDashboardVariantB,
    },
  },
  "slides-outline-refine": {
    a: {
      taxonomy: "refinement",
      correctAnswerId: "slides-refinement-json",
      ephemeralTargets: EPHEMERAL_TARGETS.slides,
      scenarioPreamble:
        "You are finalising a team update deck the night before a review. The slide story is in a weak order, and the Problem slide still reads like a vague draft instead of a clear problem statement.",
      taskHeading:
        "Improve the deck before submission: reorder the slide thumbnails into a coherent story (title → problem → metrics → ask), then revise the Problem slide on the canvas so it explicitly states a concrete risk such as delays, complaints, or missed goals.",
      participantOutcome: [
        "Reorder the slides into title → problem → metrics → ask.",
        "Revise the Problem slide so it names a concrete risk.",
      ],
      supportUserPromptPreamble:
        "Scenario: refinement before a team review in a lightweight deck editor. Task: help the user reorder the narrative and strengthen the Problem slide with an explicit risk line, not just pick a weak slide from a list.",
      buildTaskState: buildSlidesVariantA,
    },
    b: {
      taxonomy: "refinement",
      correctAnswerId: "slides-refinement-json",
      ephemeralTargets: EPHEMERAL_TARGETS.slides,
      scenarioPreamble:
        "You are finalising an event-readiness deck the night before a decision review. The story order is weak, and the Problem slide still hints at trouble without naming the risk clearly.",
      taskHeading:
        "Improve the deck before submission: reorder the slide thumbnails into a coherent story (title → problem → metrics → ask), then revise the Problem slide on the canvas so it explicitly states a concrete risk such as delays, complaints, or missed goals.",
      participantOutcome: [
        "Reorder the slides into title → problem → metrics → ask.",
        "Revise the Problem slide so it names a concrete risk.",
      ],
      supportUserPromptPreamble:
        "Scenario: refinement before an event review in a lightweight deck editor. Task: help the user reorder the narrative and strengthen the Problem slide with an explicit risk line, not just point at a weak slide.",
      buildTaskState: buildSlidesVariantB,
    },
  },
  "pm-sprint-handoff": {
    a: {
      taxonomy: "task_execution",
      correctAnswerId: "ticket-api-timeout",
      ephemeralTargets: EPHEMERAL_TARGETS.pm,
      scenarioPreamble:
        "You are joining an event-planning board that already reflects the team's immediate goal. Use the board itself to pull the most important work into motion.",
      taskHeading:
        "Goal: make next Friday's event check-in run smoothly. Move exactly one ticket from Backlog to In progress, the one that best protects that goal.",
      participantOutcome: [
        "Move exactly one ticket from Backlog to In progress.",
      ],
      supportUserPromptPreamble:
        "Scenario: bounded workflow on a task board. Task: help the user complete the move-to-In-progress step for the item that most directly prevents check-in problems, not pick a card without doing the board action.",
      buildTaskState: buildPmVariantA,
    },
    b: {
      taxonomy: "task_execution",
      correctAnswerId: "ticket-data-hygiene",
      ephemeralTargets: EPHEMERAL_TARGETS.pm,
      scenarioPreamble:
        "You are joining a workshop-launch planning board that already reflects the team's immediate goal. Use the board itself to pull the right work into motion.",
      taskHeading:
        "Goal: make the workshop launch feel organised by Friday. Move exactly one ticket from Backlog to In progress, the one that best protects that goal.",
      participantOutcome: [
        "Move exactly one ticket from Backlog to In progress.",
      ],
      supportUserPromptPreamble:
        "Scenario: bounded workflow on a task board. Task: help the user complete the move-to-In-progress step for the item that removes the biggest launch-day bottleneck, not pick a card without doing the board action.",
      buildTaskState: buildPmVariantB,
    },
  },
}

export function isSlidesRefinementPayloadCorrect(raw: string): boolean {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw) as unknown
  } catch {
    return false
  }
  if (typeof parsed !== "object" || parsed === null) return false
  const o = parsed as { order?: unknown; problemBullets?: unknown }
  if (!Array.isArray(o.order) || !o.order.every((x) => typeof x === "string"))
    return false
  if (o.order.length !== SLIDES_CANONICAL_ORDER.length) return false
  for (let i = 0; i < SLIDES_CANONICAL_ORDER.length; i++) {
    if (o.order[i] !== SLIDES_CANONICAL_ORDER[i]) return false
  }
  if (
    !Array.isArray(o.problemBullets) ||
    !o.problemBullets.every((x) => typeof x === "string")
  ) {
    return false
  }
  const problemText = o.problemBullets.join(" ").trim()
  if (problemText.length < 8) return false
  return PROBLEM_RISK_PATTERN.test(problemText)
}

export function isPmWorkflowPayloadCorrect(
  scenarioId: ScenarioId,
  raw: string,
  variant: ScenarioVariant = "a"
): boolean {
  if (scenarioId !== "pm-sprint-handoff") return false
  let parsed: unknown
  try {
    parsed = JSON.parse(raw) as unknown
  } catch {
    return false
  }
  if (typeof parsed !== "object" || parsed === null) return false
  const id = (parsed as { inProgressTicketId?: unknown }).inProgressTicketId
  if (typeof id !== "string") return false
  return id === SCENARIO_REGISTRY[scenarioId][variant].correctAnswerId
}

export function getScenarioEntry(
  scenarioId: string,
  variant: ScenarioVariant = "a"
): ScenarioRegistryEntry | null {
  if (!isScenarioId(scenarioId)) {
    return null
  }
  return SCENARIO_REGISTRY[scenarioId][variant]
}

export function getTaskStateForScenario(
  scenarioId: string,
  variant: ScenarioVariant = "a"
): TaskState | null {
  const entry = getScenarioEntry(scenarioId, variant)
  return entry ? entry.buildTaskState() : null
}

export function isAnswerCorrectForScenario(
  scenarioId: string,
  answerSubmitted: string,
  variant: ScenarioVariant = "a"
): boolean {
  if (!isScenarioId(scenarioId)) {
    return false
  }
  if (scenarioId === "slides-outline-refine") {
    return isSlidesRefinementPayloadCorrect(answerSubmitted)
  }
  if (scenarioId === "pm-sprint-handoff") {
    return isPmWorkflowPayloadCorrect(scenarioId, answerSubmitted, variant)
  }
  const entry = SCENARIO_REGISTRY[scenarioId][variant]
  return answerSubmitted === entry.correctAnswerId
}
