import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

import {
  buildSupportSystemPrompt,
  buildSupportUserPrompt,
  SUPPORT_PROMPT_VERSION,
} from "@/lib/prompts";
import {
  buildFallbackSupport,
  looseSupportObjectSchema,
  parseSupportPayloadForScenario,
  SUPPORT_EFFECT_TYPES,
  type SupportPayload,
} from "@/lib/support-schema";
import type { TaskState } from "@/lib/task-state";

const DEFAULT_MODEL = "gemini-2.0-flash";

/** Schema passed to the model (effect enum); target validated per scenario after parse. */
const supportObjectSchemaForModel = z.object({
  targetId: z.string().min(1).max(120),
  effectType: z.enum(SUPPORT_EFFECT_TYPES),
  message: z.string().min(1).max(400),
  dismissible: z.boolean(),
});

export type SupportGenResult = {
  payload: SupportPayload;
  promptVersion: string;
  modelName: string;
  rawText: string;
  usedFallback: boolean;
};

function getGoogleApiKey(): string | undefined {
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
}

export async function generateValidatedSupport(
  scenarioId: string,
  taskState: TaskState,
): Promise<SupportGenResult> {
  const apiKey = getGoogleApiKey();
  const modelId = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  if (!apiKey) {
    const payload = buildFallbackSupport(scenarioId);
    return {
      payload,
      promptVersion: SUPPORT_PROMPT_VERSION,
      modelName: "none",
      rawText: JSON.stringify(payload),
      usedFallback: true,
    };
  }

  const google = createGoogleGenerativeAI({ apiKey });

  try {
    const { object } = await generateObject({
      model: google(modelId),
      schema: supportObjectSchemaForModel,
      schemaName: "EphemeralSupport",
      schemaDescription:
        "Bounded on-screen assistance: one target, one effect, short message, dismissible.",
      system: buildSupportSystemPrompt(scenarioId),
      prompt: buildSupportUserPrompt(taskState),
    });

    const validated = parseSupportPayloadForScenario(scenarioId, object);
    const coerced = looseSupportObjectSchema.safeParse(object);
    const payload = validated ?? buildFallbackSupport(scenarioId);
    return {
      payload,
      promptVersion: SUPPORT_PROMPT_VERSION,
      modelName: modelId,
      rawText: JSON.stringify(coerced.success ? coerced.data : object),
      usedFallback: validated == null,
    };
  } catch {
    const payload = buildFallbackSupport(scenarioId);
    return {
      payload,
      promptVersion: SUPPORT_PROMPT_VERSION,
      modelName: modelId,
      rawText: JSON.stringify(payload),
      usedFallback: true,
    };
  }
}
