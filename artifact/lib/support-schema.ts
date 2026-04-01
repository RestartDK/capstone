import {
  allowlistWalk,
  parseEphemeralSpec,
  type EphemeralSpec,
} from "./ephemeral/spec";
import { getScenarioEntry } from "./scenarios/registry";

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
  const entry = getScenarioEntry(scenarioId);
  const targetId = entry?.ephemeralTargets[0] ?? "payments-backlog-card";
  const messages: Record<string, string> = {
    "dashboard-priority": "Backlog and SLA risk often need the fastest response.",
    "slides-outline-refine": "Strengthen the weakest narrative slide before adding polish elsewhere.",
    "pm-sprint-handoff": "Protect the sprint goal by pulling the item that unblocks reliability first.",
  };
  const body = messages[scenarioId] ?? "Here is a small hint for this task.";
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
