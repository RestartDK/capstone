import { z } from "zod";

import type { ScenarioId } from "@/lib/scenarios/ids";
import { isScenarioId } from "@/lib/scenarios/ids";
import { getScenarioEntry, SLIDES_CANONICAL_ORDER } from "@/lib/scenarios/registry";

const MAX_SLIDE_ORDER_LEN = 8;
const MAX_PROBLEM_BULLETS = 16;
const MAX_BULLET_CHARS = 400;
const MAX_ID_LEN = 120;

export type DashboardParticipantSnapshot = {
  scenarioId: "dashboard-priority";
  selectedCardId: string | null;
};

export type SlidesParticipantSnapshot = {
  scenarioId: "slides-outline-refine";
  slideOrder: string[];
  problemBullets: string[];
};

export type PmSprintParticipantSnapshot = {
  scenarioId: "pm-sprint-handoff";
  ticketColumns: Record<string, "backlog" | "in_progress">;
};

export type ParticipantTaskSnapshot =
  | DashboardParticipantSnapshot
  | SlidesParticipantSnapshot
  | PmSprintParticipantSnapshot;

function dashboardSchema(allowedCards: readonly string[]) {
  const allow = new Set(allowedCards);
  return z.object({
    scenarioId: z.literal("dashboard-priority"),
    selectedCardId: z.string().max(MAX_ID_LEN).nullable(),
  }).refine(
    (v) => v.selectedCardId === null || allow.has(v.selectedCardId),
    "selectedCardId must be null or an allowed card id",
  );
}

function slidesSchema(allowedSlideIds: readonly string[]) {
  const allow = new Set(allowedSlideIds);
  return z
    .object({
      scenarioId: z.literal("slides-outline-refine"),
      slideOrder: z.array(z.string().max(MAX_ID_LEN)).min(1).max(MAX_SLIDE_ORDER_LEN),
      problemBullets: z
        .array(z.string().max(MAX_BULLET_CHARS))
        .max(MAX_PROBLEM_BULLETS),
    })
    .refine((v) => v.slideOrder.every((id) => allow.has(id)), "slideOrder ids must be allowed slides")
    .refine(
      (v) => new Set(v.slideOrder).size === v.slideOrder.length,
      "slideOrder must not contain duplicates",
    );
}

function pmSchema(allowedTicketIds: readonly string[]) {
  const allow = new Set(allowedTicketIds);
  const col = z.enum(["backlog", "in_progress"]);
  return z
    .object({
      scenarioId: z.literal("pm-sprint-handoff"),
      ticketColumns: z.record(z.string().max(MAX_ID_LEN), col),
    })
    .refine((v) => {
      const keys = Object.keys(v.ticketColumns);
      if (keys.length !== allow.size) return false;
      return keys.every((k) => allow.has(k));
    }, "ticketColumns must contain exactly each allowed ticket id once");
}

/**
 * Builds the JSON body field for POST /api/support. Server validates with
 * {@link parseParticipantTaskSnapshotForScenario}.
 */
export function buildParticipantTaskSnapshotPayload(
  scenarioId: ScenarioId,
  progress: {
    selectedCardId: string | null;
    slidesLive: { order: string[]; problemBullets: string[] } | null;
    pmTicketColumns: Record<string, "backlog" | "in_progress"> | null;
  },
): ParticipantTaskSnapshot | undefined {
  if (scenarioId === "dashboard-priority") {
    return { scenarioId, selectedCardId: progress.selectedCardId };
  }
  if (scenarioId === "slides-outline-refine") {
    if (!progress.slidesLive) return undefined;
    return {
      scenarioId,
      slideOrder: progress.slidesLive.order,
      problemBullets: progress.slidesLive.problemBullets,
    };
  }
  if (scenarioId === "pm-sprint-handoff") {
    if (!progress.pmTicketColumns) return undefined;
    return { scenarioId, ticketColumns: progress.pmTicketColumns };
  }
  return undefined;
}

export function parseParticipantTaskSnapshotForScenario(
  scenarioId: string,
  raw: unknown,
): ParticipantTaskSnapshot | null {
  if (raw === undefined || raw === null) return null;
  if (!isScenarioId(scenarioId)) return null;
  const entry = getScenarioEntry(scenarioId);
  if (!entry) return null;

  try {
    if (scenarioId === "dashboard-priority") {
      const allowed = entry.ephemeralTargets.filter((id) => id !== "alerts-strip");
      const parsed = dashboardSchema(allowed).safeParse(raw);
      return parsed.success ? parsed.data : null;
    }
    if (scenarioId === "slides-outline-refine") {
      const parsed = slidesSchema(SLIDES_CANONICAL_ORDER).safeParse(raw);
      return parsed.success ? parsed.data : null;
    }
    if (scenarioId === "pm-sprint-handoff") {
      const ticketIds = entry.ephemeralTargets.filter((id) => id.startsWith("ticket-"));
      const parsed = pmSchema(ticketIds).safeParse(raw);
      return parsed.success ? parsed.data : null;
    }
  } catch {
    return null;
  }
  return null;
}
