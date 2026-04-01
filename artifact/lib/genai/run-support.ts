import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";

import {
  buildSupportSystemPrompt,
  buildSupportUserPrompt,
  SUPPORT_PROMPT_VERSION,
} from "@/lib/prompts";
import {
  buildFallbackSupport,
  parseSupportPayload,
  supportPayloadSchema,
  type SupportPayload,
} from "@/lib/support-schema";
import type { DashboardTaskState } from "@/lib/task-state";

const DEFAULT_MODEL = "gemini-2.0-flash";

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
  taskState: DashboardTaskState,
): Promise<SupportGenResult> {
  const apiKey = getGoogleApiKey();
  const modelId = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  if (!apiKey) {
    const payload = buildFallbackSupport();
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
      schema: supportPayloadSchema,
      schemaName: "EphemeralSupport",
      schemaDescription:
        "Bounded on-screen assistance: one target, one effect, short message, dismissible.",
      system: buildSupportSystemPrompt(),
      prompt: buildSupportUserPrompt(taskState),
    });

    const validated = parseSupportPayload(object);
    const payload = validated ?? buildFallbackSupport();
    return {
      payload,
      promptVersion: SUPPORT_PROMPT_VERSION,
      modelName: modelId,
      rawText: JSON.stringify(object),
      usedFallback: validated == null,
    };
  } catch {
    const payload = buildFallbackSupport();
    return {
      payload,
      promptVersion: SUPPORT_PROMPT_VERSION,
      modelName: modelId,
      rawText: JSON.stringify(payload),
      usedFallback: true,
    };
  }
}
