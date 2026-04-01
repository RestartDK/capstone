import { z } from "zod";

import { SCENARIO_ID } from "./constants";

export type Condition = "baseline" | "ephemeral";

export type ScenarioId = typeof SCENARIO_ID;

export const SUPPORT_EFFECT_TYPES = [
  "arrow",
  "highlight",
  "inline_bubble",
  "arrow-highlight",
] as const;

export type SupportEffectType = (typeof SUPPORT_EFFECT_TYPES)[number];

/** Cards and regions the model may reference for dashboard-priority. */
export const DASHBOARD_EPHEMERAL_TARGETS = [
  "payments-backlog-card",
  "engineering-backlog-card",
  "sla-breaches-card",
  "customer-sentiment-card",
  "alerts-strip",
] as const;

export type DashboardEphemeralTarget = (typeof DASHBOARD_EPHEMERAL_TARGETS)[number];

export const supportPayloadSchema = z.object({
  targetId: z.enum(DASHBOARD_EPHEMERAL_TARGETS),
  effectType: z.enum(SUPPORT_EFFECT_TYPES),
  message: z.string().min(1).max(400),
  dismissible: z.boolean(),
});

export type SupportPayload = z.infer<typeof supportPayloadSchema>;

export function parseSupportPayload(raw: unknown): SupportPayload | null {
  const parsed = supportPayloadSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function buildFallbackSupport(): SupportPayload {
  return {
    targetId: "payments-backlog-card",
    effectType: "arrow-highlight",
    message: "Backlog and SLA risk often need the fastest response.",
    dismissible: true,
  };
}
