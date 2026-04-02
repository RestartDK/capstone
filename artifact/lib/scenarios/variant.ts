import type { ScenarioId } from "./ids"

export type ScenarioVariant = "a" | "b"

function hashTextToSeed(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function baselineVariantForScenario(
  participantId: string,
  scenarioId: ScenarioId
): ScenarioVariant {
  return hashTextToSeed(`${participantId}:${scenarioId}`) % 2 === 0 ? "a" : "b"
}

export function oppositeScenarioVariant(
  variant: ScenarioVariant
): ScenarioVariant {
  return variant === "a" ? "b" : "a"
}

export function getScenarioVariantForCondition(
  participantId: string,
  scenarioId: ScenarioId,
  condition: "baseline" | "ephemeral"
): ScenarioVariant {
  const baselineVariant = baselineVariantForScenario(participantId, scenarioId)
  return condition === "baseline"
    ? baselineVariant
    : oppositeScenarioVariant(baselineVariant)
}
