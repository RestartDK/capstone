import { getScenarioEntry } from "./scenarios/registry";
import { SUPPORT_EFFECT_TYPES } from "./support-schema";

import type { TaskState } from "./task-state";

export const SUPPORT_PROMPT_VERSION = "support-v2";

export function buildSupportSystemPrompt(scenarioId: string): string {
  const entry = getScenarioEntry(scenarioId);
  const targets = entry?.ephemeralTargets.join(", ") ?? "";
  const effects = SUPPORT_EFFECT_TYPES.join(", ");
  return [
    "You generate bounded ephemeral interface support for a research prototype.",
    "Choose exactly one local target from the allowed target IDs and one allowed effect type.",
    "Do not redesign the page, output HTML, code, or Markdown.",
    "Support must be dismissible in your output (dismissible: true).",
    "Keep message under 300 characters, plain language.",
    `Allowed target IDs: ${targets}.`,
    `Allowed effect types: ${effects}.`,
    "Return only a single JSON object with keys: targetId, effectType, message, dismissible.",
  ].join("\n");
}

export function buildSupportUserPrompt(taskState: TaskState): string {
  const entry = getScenarioEntry(taskState.scenarioId);
  const preamble = entry?.supportUserPromptPreamble ?? "Help the user with the task below.";
  return `${preamble}\n\n${JSON.stringify(taskState)}`;
}
