import { EPHEMERAL_COMPONENT_TYPES } from "./ephemeral/catalog";
import { getScenarioEntry } from "./scenarios/registry";

import type { TaskState } from "./task-state";

export function buildSupportSystemPrompt(scenarioId: string) {
  const entry = getScenarioEntry(scenarioId);
  const targets = entry?.ephemeralTargets.join(", ") ?? "";
  const componentTypes = EPHEMERAL_COMPONENT_TYPES.join(", ");
  return [
    "You generate bounded ephemeral interface support for a research prototype.",
    "Return a JSON object matching the EphemeralSpec schema described below.",
    "",
    "EphemeralSpec = { version: 1, root: Node, meta: { dismissible: boolean, autoHideMs: number | null } }",
    "Node = { type: ComponentType, props: object, children?: Node[] }",
    "",
    `Allowed component types: ${componentTypes}.`,
    "",
    "Component prop schemas:",
    "- Stack: { gap?: 'none' | 'sm' | 'md' }  (container; children rendered in sequence)",
    "- FocusMask: { targetId: string, strength?: number (0-1) }  (dims everything except targetId)",
    "- HighlightRing: { targetId: string }  (amber ring around target)",
    "- PulseRing: { targetId: string, durationMs?: number (500-5000) }  (animated ring)",
    "- ArrowCue: { targetId: string }  (arrow pointing at target)",
    "- AnchoredTooltip: { targetId: string, body: string (max 400 chars), placement?: 'top'|'bottom'|'left'|'right' }",
    "- HintStack: { targetId: string, lines: string[] (1-4 items, each max 200 chars), placement?: 'top'|'bottom'|'left'|'right' }",
    "- StepRail: { targetIds: string[] (2-6 items) }  (numbered callouts in order)",
    "- ConnectorLine: { fromTargetId: string, toTargetId: string }  (dashed line between two targets)",
    "",
    `Allowed target IDs: ${targets}.`,
    "Every targetId / fromTargetId / toTargetId must be one of the allowed target IDs.",
    "",
    "Rules:",
    "- The root should be a Stack containing 2-4 children.",
    "- Choose components that help the user notice what matters for the task.",
    "- Max tree depth: 3. Max children per node: 6.",
    "- Keep tooltip/hint text under 400 characters, plain language, no HTML or Markdown.",
    "- Set meta.dismissible to true.",
    "- Set meta.autoHideMs to null unless you have a good reason for timed fade.",
    "- Do not redesign the page, output HTML, code, or standalone Markdown.",
    "- Return only the JSON object, nothing else.",
  ].join("\n");
}

export function buildSupportUserPrompt(taskState: TaskState) {
  const entry = getScenarioEntry(taskState.scenarioId);
  const preamble = entry?.supportUserPromptPreamble ?? "Help the user with the task below.";
  return `${preamble}\n\n${JSON.stringify(taskState)}`;
}
