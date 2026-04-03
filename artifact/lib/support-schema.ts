import {
  allowlistWalk,
  parseEphemeralSpec,
  type EphemeralSpec,
} from "./ephemeral/spec"
import type { TaskState } from "./task-state"
import {
  getScenarioEntry,
  slidesCanonicalOrderForVariant,
} from "./scenarios/registry"
import type { ScenarioVariant } from "./scenarios/variant"

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
    const variant: ScenarioVariant =
      taskState?.scenarioId === "slides-outline-refine"
        ? taskState.variant
        : "a"
    const canonical = slidesCanonicalOrderForVariant(variant)
    const orderHint =
      variant === "a"
        ? "title → problem → metrics → ask"
        : "meeting → policy → proof → vote"
    const spec: EphemeralSpec = {
      version: 1,
      root: {
        type: "Stack",
        props: { gap: "sm" },
        children: [
          {
            type: "StepRail",
            props: { targetIds: [...canonical] },
          },
          {
            type: "ConnectorLine",
            props: {
              fromTargetId: canonical[0],
              toTargetId: canonical[1],
            },
          },
          {
            type: "AnchoredHtml",
            props: {
              targetId: "deck-context-bar",
              html: `<div style="display:flex;flex-direction:column;gap:8px"><h4 style="margin:0;font-weight:600">Fix the order first</h4><p style="margin:0">Drag cards until the strip reads: <strong>${orderHint}</strong>. The large view is preview-only.</p></div>`,
              placement: "top",
            },
          },
          {
            type: "InspectPanel",
            props: {
              targetId: "slide-canvas-area",
              title: "Story order",
              summary:
                variant === "a"
                  ? "Participants only rearrange the strip. Order should introduce the readout, then the problem, metrics, and ask."
                  : "This deck uses different slide ids from the CX scenario. Order should frame the committee, then rules, proof, and ballot items.",
              details:
                variant === "a"
                  ? [
                      "Title before problem so metrics feel motivated.",
                      "End with the ask after evidence.",
                    ]
                  : [
                      "Meeting frame before policy so rules land in context.",
                      "Proof before vote so asks feel grounded.",
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
