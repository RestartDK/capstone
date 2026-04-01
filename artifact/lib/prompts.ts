import { DASHBOARD_EPHEMERAL_TARGETS, SUPPORT_EFFECT_TYPES } from "./support-schema";

import type { DashboardTaskState } from "./task-state";

export const SUPPORT_PROMPT_VERSION = "support-v1";

export function buildSupportSystemPrompt(): string {
  const targets = DASHBOARD_EPHEMERAL_TARGETS.join(", ");
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

export function buildSupportUserPrompt(taskState: DashboardTaskState): string {
  return `Scenario: dashboard triage. Task: help the user notice which area likely needs the most immediate attention based on the state below.\n\n${JSON.stringify(taskState)}`;
}
