import {
  allowlistWalk,
  parseEphemeralSpec,
  type EphemeralSpec,
} from "./ephemeral/spec"
import type { TaskState } from "./task-state"
import { getScenarioEntry, SLIDES_CANONICAL_ORDER } from "./scenarios/registry"

export type Condition = "baseline" | "ephemeral"

export type ValidatedSupport = {
  spec: EphemeralSpec
  componentTypes: string[]
}

export function parseSpecForScenario(
  scenarioId: string,
  raw: unknown
): ValidatedSupport | null {
  const spec = parseEphemeralSpec(raw)
  if (!spec) return null
  const entry = getScenarioEntry(scenarioId)
  if (!entry) return null
  const walk = allowlistWalk(spec, entry.ephemeralTargets)
  if (!walk.valid) return null
  return { spec, componentTypes: walk.componentTypes }
}

export function buildFallbackSpec(
  scenarioId: string,
  taskState?: TaskState | null
): ValidatedSupport {
  if (scenarioId === "dashboard-priority") {
    const focusTargetId =
      taskState?.scenarioId === "dashboard-priority"
        ? taskState.variant === "b"
          ? "sla-breaches-card"
          : "payments-backlog-card"
        : "payments-backlog-card"
    const compareTargetId =
      focusTargetId === "payments-backlog-card"
        ? "engineering-backlog-card"
        : "payments-backlog-card"
    const spec: EphemeralSpec = {
      version: 1,
      root: {
        type: "Stack",
        props: { gap: "sm" },
        children: [
          {
            type: "ConnectorLine",
            props: { fromTargetId: "alerts-strip", toTargetId: focusTargetId },
          },
          {
            type: "ComparisonStrip",
            props: {
              leftTargetId: focusTargetId,
              rightTargetId: compareTargetId,
              headline: "Cross-check",
              body: "Use the alerts to identify what changed, then confirm that the card you choose tells the same story with backlog, response, or satisfaction evidence.",
            },
          },
          {
            type: "InspectPanel",
            props: {
              targetId: "alerts-strip",
              title: "Read alerts with cards",
              summary:
                "Use the strip for what changed; the card you escalate should reinforce that story with concrete evidence.",
              details: [
                "If a card contradicts the alert without explanation, treat it as weaker evidence.",
                "Prefer the area where the alert narrative and the card details point to the same operational issue.",
              ],
              placement: "bottom",
            },
          },
        ],
      },
      meta: { dismissible: true },
    }
    return {
      spec,
      componentTypes: [
        "Stack",
        "ConnectorLine",
        "ComparisonStrip",
        "InspectPanel",
      ],
    }
  }

  if (scenarioId === "slides-outline-refine") {
    const variant =
      taskState?.scenarioId === "slides-outline-refine"
        ? taskState.variant
        : "a"
    const isMetricsRefinement = variant === "b"
    const spec: EphemeralSpec = {
      version: 1,
      root: {
        type: "Stack",
        props: { gap: "sm" },
        children: [
          {
            type: "StepRail",
            props: { targetIds: [...SLIDES_CANONICAL_ORDER] },
          },
          {
            type: "ConnectorLine",
            props: isMetricsRefinement
              ? {
                  fromTargetId: "slide-problem-card",
                  toTargetId: "slide-metrics-card",
                }
              : {
                  fromTargetId: "slide-title-card",
                  toTargetId: "slide-problem-card",
                },
          },
          {
            type: "AnchoredHtml",
            props: isMetricsRefinement
              ? {
                  targetId: "slide-metrics-bullets",
                  html: '<div style="display:flex;flex-direction:column;gap:8px"><h4 style="margin:0;font-weight:600">Tighten the evidence</h4><p style="margin:0">Make each metric line tie to a real risk — e.g. <strong>zero rehearsals</strong>, <strong>demo failure</strong>, or <strong>time overrun</strong>.</p><svg viewBox="0 0 200 32" width="200" height="32" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="8" width="80" height="16" rx="4" fill="#e0f2fe" stroke="#0284c7" stroke-width="1"/><text x="40" y="20" text-anchor="middle" font-size="9" fill="#0c4a6e">Placeholder</text><line x1="84" y1="16" x2="112" y2="16" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="3,2"/><polygon points="112,12 120,16 112,20" fill="#0284c7"/><rect x="120" y="8" width="80" height="16" rx="4" fill="#d1fae5" stroke="#10b981" stroke-width="1"/><text x="160" y="20" text-anchor="middle" font-size="9" fill="#065f46">Proof</text></svg></div>',
                  placement: "top",
                }
              : {
                  targetId: "slide-problem-bullets",
                  html: '<div style="display:flex;flex-direction:column;gap:8px"><h4 style="margin:0;font-weight:600">Strengthen this slide</h4><p style="margin:0">Replace vague language with a concrete risk — e.g. <strong>delays</strong>, <strong>complaint spike</strong>, or <strong>missed goals</strong>.</p><svg viewBox="0 0 200 32" width="200" height="32" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="8" width="80" height="16" rx="4" fill="#fef3c7" stroke="#f59e0b" stroke-width="1"/><text x="40" y="20" text-anchor="middle" font-size="9" fill="#92400e">Vague pain</text><line x1="84" y1="16" x2="112" y2="16" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3,2"/><polygon points="112,12 120,16 112,20" fill="#f59e0b"/><rect x="120" y="8" width="80" height="16" rx="4" fill="#d1fae5" stroke="#10b981" stroke-width="1"/><text x="160" y="20" text-anchor="middle" font-size="9" fill="#065f46">Named risk</text></svg></div>',
                  placement: "top",
                },
          },
          {
            type: "InspectPanel",
            props: {
              targetId: "deck-context-bar",
              title: "Refinement goal",
              summary: isMetricsRefinement
                ? "After a sensible order, the metrics should prove the stakes — not just fill space."
                : "Readers expect a clear story: context first, then a concrete problem, then evidence and the ask.",
              details: isMetricsRefinement
                ? [
                    "Reorder first so problem leads naturally into evidence.",
                    "Each metric line should point at a concrete risk the audience can act on.",
                  ]
                : [
                    "Weak starting order buries the problem before context.",
                    "The problem slide should name a concrete risk, not vague frustration.",
                  ],
              placement: "bottom",
            },
          },
        ],
      },
      meta: { dismissible: true },
    }
    return {
      spec,
      componentTypes: [
        "Stack",
        "StepRail",
        "ConnectorLine",
        "AnchoredHtml",
        "InspectPanel",
      ],
    }
  }

  if (scenarioId === "pm-sprint-handoff") {
    const focusTargetId =
      taskState?.scenarioId === "pm-sprint-handoff"
        ? (taskState.backlog.find((ticket) => ticket.priority === "P0")?.id ??
          "ticket-api-timeout")
        : "ticket-api-timeout"
    const spec: EphemeralSpec = {
      version: 1,
      root: {
        type: "Stack",
        props: { gap: "sm" },
        children: [
          {
            type: "StepRail",
            props: {
              targetIds: [
                "sprint-goal-strip",
                focusTargetId,
                "in-progress-column-header",
              ],
            },
          },
          {
            type: "ConsequenceNote",
            props: {
              targetId: focusTargetId,
              line: "If this stays in backlog, the biggest event-day bottleneck stays unresolved.",
              placement: "bottom",
            },
          },
          {
            type: "InspectPanel",
            props: {
              targetId: "backlog-column-header",
              title: "Pull the right work forward",
              summary:
                "Match backlog items to the goal; only one move to In progress is required—pick the work that most directly protects the event outcome.",
              details: [
                "Polish tasks help later but do not remove the main event-day bottleneck.",
                "Compare ticket detail text against the goal strip wording.",
              ],
              placement: "bottom",
            },
          },
        ],
      },
      meta: { dismissible: true },
    }
    return {
      spec,
      componentTypes: ["Stack", "StepRail", "ConsequenceNote", "InspectPanel"],
    }
  }

  const entry = getScenarioEntry(scenarioId)
  const targetId = entry?.ephemeralTargets[0] ?? "payments-backlog-card"
  const body = "Here is a small hint for this task."
  const spec: EphemeralSpec = {
    version: 1,
    root: {
      type: "Stack",
      props: { gap: "sm" },
      children: [
        { type: "HighlightRing", props: { targetId } },
        { type: "ArrowCue", props: { targetId } },
        {
          type: "AnchoredTooltip",
          props: { targetId, body, placement: "bottom" },
        },
      ],
    },
    meta: { dismissible: true },
  }
  return {
    spec,
    componentTypes: ["Stack", "HighlightRing", "ArrowCue", "AnchoredTooltip"],
  }
}

export { CATALOG_VERSION } from "./ephemeral/catalog"
