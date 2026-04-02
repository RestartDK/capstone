import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText, NoObjectGeneratedError, Output } from "ai"

import type { ParticipantTaskSnapshot } from "@/lib/participant-task-snapshot"
import { buildSupportSystemPrompt, buildSupportUserPrompt } from "@/lib/prompts"
import {
  coerceEphemeralSpecVersionFromModel,
  describeEphemeralSpecParseFailure,
  ephemeralSpecSchemaForModel,
  getSpecRuleViolations,
  parseEphemeralSpec,
} from "@/lib/ephemeral/spec"
import { getScenarioEntry } from "@/lib/scenarios/registry"
import {
  buildFallbackSpec,
  CATALOG_VERSION,
  type ValidatedSupport,
  parseSpecForScenario,
} from "@/lib/support-schema"
import type { TaskState } from "@/lib/task-state"

const DEFAULT_MODEL = "gemini-2.0-flash"

export type SupportGenResult = {
  result: ValidatedSupport
  catalogVersion: string
  modelName: string
  rawOutput: unknown
  usedFallback: boolean
}

function getGoogleApiKey() {
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY
}

function logModelObjectSnippet(
  tag: string,
  scenarioId: string,
  modelId: string,
  object: unknown
): void {
  try {
    const s = JSON.stringify(object)
    console.warn(`[support-gen] ${tag} model_output_preview`, {
      scenarioId,
      modelId,
      charLength: s.length,
      preview: s.length > 2000 ? `${s.slice(0, 2000)}…` : s,
    })
  } catch {
    console.warn(`[support-gen] ${tag} model_output_not_json_stringifiable`, {
      scenarioId,
      modelId,
    })
  }
}

function tryParseModelJsonText(text: string): unknown | null {
  const trimmed = text.trim()
  if (trimmed.length === 0) return null

  const candidates = new Set<string>([trimmed])
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim()
  if (unfenced.length > 0) {
    candidates.add(unfenced)
    const firstBrace = unfenced.indexOf("{")
    const lastBrace = unfenced.lastIndexOf("}")
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      candidates.add(unfenced.slice(firstBrace, lastBrace + 1))
    }
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as unknown
    } catch {
      continue
    }
  }

  return null
}

function tryRecoverValidatedSupportFromModelText(
  scenarioId: string,
  modelId: string,
  text: string
): { result: ValidatedSupport; rawOutput: unknown } | null {
  const parsedJson = tryParseModelJsonText(text)
  if (!parsedJson) {
    console.warn("[support-gen] recovery: could not parse model text as JSON", {
      scenarioId,
      modelId,
      preview: text.length > 2000 ? `${text.slice(0, 2000)}…` : text,
    })
    return null
  }

  const specPayload = coerceEphemeralSpecVersionFromModel(parsedJson)
  const validated = parseSpecForScenario(scenarioId, specPayload)
  if (!validated) {
    const parsedSpec = parseEphemeralSpec(specPayload)
    if (!parsedSpec) {
      console.warn(
        "[support-gen] recovery: parsed JSON still failed spec envelope/tree validation",
        {
          scenarioId,
          modelId,
          parseDetail: describeEphemeralSpecParseFailure(specPayload),
        }
      )
    } else {
      const entry = getScenarioEntry(scenarioId)
      const violations = entry
        ? getSpecRuleViolations(parsedSpec, entry.ephemeralTargets)
        : [`unknown_scenario: ${scenarioId}`]
      console.warn(
        "[support-gen] recovery: parsed JSON still failed support rules",
        {
          scenarioId,
          modelId,
          violations,
        }
      )
    }
    return null
  }

  console.warn(
    "[support-gen] recovered valid spec from raw model text after SDK object failure",
    {
      scenarioId,
      modelId,
    }
  )
  return { result: validated, rawOutput: parsedJson }
}

export async function generateValidatedSupport(
  scenarioId: string,
  taskState: TaskState,
  participantSnapshot: ParticipantTaskSnapshot | null
): Promise<SupportGenResult> {
  const apiKey = getGoogleApiKey()
  const modelId = process.env.GEMINI_MODEL ?? DEFAULT_MODEL

  if (!apiKey) {
    console.warn(
      "[support-gen] fallback: missing GOOGLE_GENERATIVE_AI_API_KEY / GEMINI_API_KEY",
      {
        scenarioId,
      }
    )
    const result = buildFallbackSpec(scenarioId, taskState)
    return {
      result,
      catalogVersion: CATALOG_VERSION,
      modelName: "none",
      rawOutput: result.spec,
      usedFallback: true,
    }
  }

  const google = createGoogleGenerativeAI({ apiKey })

  try {
    const { output: object } = await generateText({
      model: google(modelId),
      system: buildSupportSystemPrompt(scenarioId),
      prompt: buildSupportUserPrompt(taskState, participantSnapshot),
      providerOptions: {
        google: {
          structuredOutputs: false,
        },
      },
      output: Output.object({
        schema: ephemeralSpecSchemaForModel,
        name: "EphemeralSpec",
        description:
          "Tree-shaped ephemeral UI spec: a root node with typed children, each targeting allowed page elements.",
      }),
    })

    if (!object) {
      console.warn(
        "[support-gen] fallback: generateText returned empty structured output",
        {
          scenarioId,
          modelId,
        }
      )
      const fallback = buildFallbackSpec(scenarioId, taskState)
      return {
        result: fallback,
        catalogVersion: CATALOG_VERSION,
        modelName: modelId,
        rawOutput: null,
        usedFallback: true,
      }
    }

    const specPayload = coerceEphemeralSpecVersionFromModel(object)
    const validated = parseSpecForScenario(scenarioId, specPayload)
    if (validated) {
      return {
        result: validated,
        catalogVersion: CATALOG_VERSION,
        modelName: modelId,
        rawOutput: object,
        usedFallback: false,
      }
    }

    logModelObjectSnippet(
      "fallback:failed_scenario_validation",
      scenarioId,
      modelId,
      object
    )
    const parsed = parseEphemeralSpec(specPayload)
    if (!parsed) {
      console.warn(
        "[support-gen] fallback: parseEphemeralSpec rejected model output",
        {
          scenarioId,
          modelId,
          parseDetail: describeEphemeralSpecParseFailure(specPayload),
        }
      )
    } else {
      const entry = getScenarioEntry(scenarioId)
      const violations = entry
        ? getSpecRuleViolations(parsed, entry.ephemeralTargets)
        : [`unknown_scenario: ${scenarioId}`]
      console.warn(
        "[support-gen] fallback: parsed spec failed allowlist/props/html rules",
        {
          scenarioId,
          modelId,
          violations,
          allowlistedTargetCount: entry?.ephemeralTargets.length ?? 0,
        }
      )
    }

    const fallback = buildFallbackSpec(scenarioId, taskState)
    return {
      result: fallback,
      catalogVersion: CATALOG_VERSION,
      modelName: modelId,
      rawOutput: object,
      usedFallback: true,
    }
  } catch (e) {
    if (NoObjectGeneratedError.isInstance(e) && typeof e.text === "string") {
      const recovered = tryRecoverValidatedSupportFromModelText(
        scenarioId,
        modelId,
        e.text
      )
      if (recovered) {
        return {
          result: recovered.result,
          catalogVersion: CATALOG_VERSION,
          modelName: modelId,
          rawOutput: recovered.rawOutput,
          usedFallback: false,
        }
      }
    }

    console.error("[support-gen] fallback: generateText threw", {
      scenarioId,
      modelId,
      error: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
    })
    const fallback = buildFallbackSpec(scenarioId, taskState)
    return {
      result: fallback,
      catalogVersion: CATALOG_VERSION,
      modelName: modelId,
      rawOutput: null,
      usedFallback: true,
    }
  }
}
