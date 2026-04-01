import { z } from "zod";

import { getScenarioEntry } from "./scenarios/registry";

export type Condition = "baseline" | "ephemeral";

export const SUPPORT_EFFECT_TYPES = [
  "arrow",
  "highlight",
  "inline_bubble",
  "arrow-highlight",
] as const;

export type SupportEffectType = (typeof SUPPORT_EFFECT_TYPES)[number];

export type SupportPayload = {
  targetId: string;
  effectType: SupportEffectType;
  message: string;
  dismissible: boolean;
};

/** Loose shape for model output; targets validated per scenario. */
export const looseSupportObjectSchema = z.object({
  targetId: z.string().min(1).max(120),
  effectType: z.enum(SUPPORT_EFFECT_TYPES),
  message: z.string().min(1).max(400),
  dismissible: z.boolean(),
});

function isAllowedTarget(scenarioId: string, targetId: string): boolean {
  const entry = getScenarioEntry(scenarioId);
  if (!entry) {
    return false;
  }
  return (entry.ephemeralTargets as readonly string[]).includes(targetId);
}

export function parseSupportPayloadForScenario(
  scenarioId: string,
  raw: unknown,
): SupportPayload | null {
  const parsed = looseSupportObjectSchema.safeParse(raw);
  if (!parsed.success || !isAllowedTarget(scenarioId, parsed.data.targetId)) {
    return null;
  }
  return parsed.data;
}

export function buildFallbackSupport(scenarioId: string): SupportPayload {
  const entry = getScenarioEntry(scenarioId);
  const targetId = entry?.ephemeralTargets[0] ?? "payments-backlog-card";
  const messages: Record<string, string> = {
    "dashboard-priority": "Backlog and SLA risk often need the fastest response.",
    "slides-outline-refine": "Strengthen the weakest narrative slide before adding polish elsewhere.",
    "pm-sprint-handoff": "Protect the sprint goal by pulling the item that unblocks reliability first.",
  };
  return {
    targetId,
    effectType: "arrow-highlight",
    message: messages[scenarioId] ?? "Here is a small hint for this task.",
    dismissible: true,
  };
}
