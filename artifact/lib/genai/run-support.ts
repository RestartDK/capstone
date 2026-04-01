import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";

import { buildSupportSystemPrompt, buildSupportUserPrompt } from "@/lib/prompts";
import {
  buildFallbackSpec,
  CATALOG_VERSION,
  type ValidatedSupport,
  parseSpecForScenario,
} from "@/lib/support-schema";
import { ephemeralSpecSchemaForModel } from "@/lib/ephemeral/spec";
import type { TaskState } from "@/lib/task-state";

const DEFAULT_MODEL = "gemini-2.0-flash";

export type SupportGenResult = {
  result: ValidatedSupport;
  catalogVersion: string;
  modelName: string;
  rawOutput: unknown;
  usedFallback: boolean;
};

function getGoogleApiKey() {
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
}

export async function generateValidatedSupport(
  scenarioId: string,
  taskState: TaskState,
): Promise<SupportGenResult> {
  const apiKey = getGoogleApiKey();
  const modelId = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;

  if (!apiKey) {
    const result = buildFallbackSpec(scenarioId);
    return {
      result,
      catalogVersion: CATALOG_VERSION,
      modelName: "none",
      rawOutput: result.spec,
      usedFallback: true,
    };
  }

  const google = createGoogleGenerativeAI({ apiKey });

  try {
    const { object } = await generateObject({
      model: google(modelId),
      schema: ephemeralSpecSchemaForModel,
      schemaName: "EphemeralSpec",
      schemaDescription:
        "Tree-shaped ephemeral UI spec: a root node with typed children, each targeting allowed page elements.",
      system: buildSupportSystemPrompt(scenarioId),
      prompt: buildSupportUserPrompt(taskState),
    });

    const validated = parseSpecForScenario(scenarioId, object);
    if (validated) {
      return {
        result: validated,
        catalogVersion: CATALOG_VERSION,
        modelName: modelId,
        rawOutput: object,
        usedFallback: false,
      };
    }

    const fallback = buildFallbackSpec(scenarioId);
    return {
      result: fallback,
      catalogVersion: CATALOG_VERSION,
      modelName: modelId,
      rawOutput: object,
      usedFallback: true,
    };
  } catch {
    const fallback = buildFallbackSpec(scenarioId);
    return {
      result: fallback,
      catalogVersion: CATALOG_VERSION,
      modelName: modelId,
      rawOutput: null,
      usedFallback: true,
    };
  }
}
