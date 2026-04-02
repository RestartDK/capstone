import {
  allowlistWalk,
  parseEphemeralSpec,
  type EphemeralSpec,
} from "./ephemeral/spec";
import { getScenarioEntry, SLIDES_CANONICAL_ORDER } from "./scenarios/registry";

export type Condition = "baseline" | "ephemeral";

export type ValidatedSupport = {
  spec: EphemeralSpec;
  componentTypes: string[];
};

export function parseSpecForScenario(
  scenarioId: string,
  raw: unknown,
): ValidatedSupport | null {
  const spec = parseEphemeralSpec(raw);
  if (!spec) return null;
  const entry = getScenarioEntry(scenarioId);
  if (!entry) return null;
  const walk = allowlistWalk(spec, entry.ephemeralTargets);
  if (!walk.valid) return null;
  return { spec, componentTypes: walk.componentTypes };
}

export function buildFallbackSpec(scenarioId: string): ValidatedSupport {
  if (scenarioId === "dashboard-priority") {
    const spec: EphemeralSpec = {
      version: 1,
      root: {
        type: "Stack",
        props: { gap: "sm" },
        children: [
          {
            type: "ConnectorLine",
            props: { fromTargetId: "alerts-strip", toTargetId: "payments-backlog-card" },
          },
          {
            type: "ComparisonStrip",
            props: {
              leftTargetId: "payments-backlog-card",
              rightTargetId: "engineering-backlog-card",
              headline: "Cross-check",
              body: "Payout failures should be supported by both the alert narrative and the card that owns delivery load—not by whichever metric is merely flat or generic.",
            },
          },
          {
            type: "InspectPanel",
            props: {
              targetId: "alerts-strip",
              title: "Read alerts with cards",
              summary:
                "Use the strip for what changed operationally; cards should tell the same story with workload or SLA specifics.",
              details: [
                "If a card contradicts the alert without explanation, treat it as weaker evidence.",
                "Escalate where payout impact is explicit across both levels.",
              ],
              placement: "bottom",
            },
          },
        ],
      },
      meta: { dismissible: true, autoHideMs: null },
    };
    return {
      spec,
      componentTypes: ["Stack", "ConnectorLine", "ComparisonStrip", "InspectPanel"],
    };
  }

  if (scenarioId === "slides-outline-refine") {
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
            props: { fromTargetId: "slide-title-card", toTargetId: "slide-problem-card" },
          },
          {
            type: "InspectPanel",
            props: {
              targetId: "deck-context-bar",
              title: "Refinement goal",
              summary:
                "Stakeholders expect a clear story: hook, concrete risk on the problem slide, then evidence and the ask.",
              details: [
                "Weak starting order buries the problem before context.",
                "The problem slide must name operational risk, not vague pain.",
              ],
              placement: "bottom",
            },
          },
        ],
      },
      meta: { dismissible: true, autoHideMs: null },
    };
    return {
      spec,
      componentTypes: ["Stack", "StepRail", "ConnectorLine", "InspectPanel"],
    };
  }

  if (scenarioId === "pm-sprint-handoff") {
    const spec: EphemeralSpec = {
      version: 1,
      root: {
        type: "Stack",
        props: { gap: "sm" },
        children: [
          {
            type: "StepRail",
            props: {
              targetIds: ["sprint-goal-strip", "ticket-api-timeout", "in-progress-column-header"],
            },
          },
          {
            type: "ConsequenceNote",
            props: {
              targetId: "ticket-api-timeout",
              line: "Leaving this in backlog keeps payout 504s on the critical path through Friday.",
              placement: "bottom",
            },
          },
          {
            type: "InspectPanel",
            props: {
              targetId: "backlog-column-header",
              title: "Pull the right work forward",
              summary:
                "Match backlog items to the sprint goal; only one move to In progress is required—pick the work that directly protects payouts.",
              details: [
                "Docs and UI polish help later but do not remove the server failure mode.",
                "Compare ticket detail text against the goal strip wording.",
              ],
              placement: "bottom",
            },
          },
        ],
      },
      meta: { dismissible: true, autoHideMs: null },
    };
    return {
      spec,
      componentTypes: ["Stack", "StepRail", "ConsequenceNote", "InspectPanel"],
    };
  }

  const entry = getScenarioEntry(scenarioId);
  const targetId = entry?.ephemeralTargets[0] ?? "payments-backlog-card";
  const body = "Here is a small hint for this task.";
  const spec: EphemeralSpec = {
    version: 1,
    root: {
      type: "Stack",
      props: { gap: "sm" },
      children: [
        { type: "HighlightRing", props: { targetId } },
        { type: "ArrowCue", props: { targetId } },
        { type: "AnchoredTooltip", props: { targetId, body, placement: "bottom" } },
      ],
    },
    meta: { dismissible: true, autoHideMs: null },
  };
  return {
    spec,
    componentTypes: ["Stack", "HighlightRing", "ArrowCue", "AnchoredTooltip"],
  };
}

export { CATALOG_VERSION } from "./ephemeral/catalog";
