import type { ScenarioId } from "./ids";
import { SCENARIO_IDS } from "./ids";

export type TrialPlanSlot = { scenarioId: ScenarioId; condition: "baseline" | "ephemeral" };

function hashUuidToSeed(uuid: string): number {
  let h = 2166136261;
  for (let i = 0; i < uuid.length; i++) {
    h ^= uuid.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: readonly T[], rand: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

/** Full cross of scenarios × conditions, shuffled deterministically per participant. */
export function buildTrialPlan(participantId: string): TrialPlanSlot[] {
  const slots: TrialPlanSlot[] = [];
  for (const scenarioId of SCENARIO_IDS) {
    slots.push({ scenarioId, condition: "baseline" });
    slots.push({ scenarioId, condition: "ephemeral" });
  }
  const rand = mulberry32(hashUuidToSeed(participantId));
  return shuffle(slots, rand);
}

export const TRIAL_SCHEDULE_LENGTH = SCENARIO_IDS.length * 2;
