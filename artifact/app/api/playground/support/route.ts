import { NextResponse } from "next/server";
import { z } from "zod";

import { CATALOG_VERSION } from "@/lib/ephemeral/catalog";
import { generateValidatedSupport } from "@/lib/genai/run-support";
import { isScenarioId } from "@/lib/scenarios/ids";
import { buildFallbackSpec, type ValidatedSupport } from "@/lib/support-schema";
import { getTaskStateForScenario } from "@/lib/task-state";

const bodySchema = z.object({
  scenarioId: z.string().min(1),
  trigger: z.enum(["initial", "hesitation", "explicit_request"]).optional(),
  /** Same as /api/support: only honored when NEXT_PUBLIC_DEBUG_SUPPORT=1. */
  debugForceFallback: z.boolean().optional(),
});

const supportDebugEnabled = process.env.NEXT_PUBLIC_DEBUG_SUPPORT === "1";

/**
 * Dev-only support generation without a participant or trial row. Not available in production builds.
 */
export async function POST(req: Request): Promise<Response> {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const json: unknown = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { scenarioId, trigger, debugForceFallback } = parsed.data;
  if (!isScenarioId(scenarioId)) {
    return NextResponse.json({ error: "Unknown scenario" }, { status: 400 });
  }

  const taskState = getTaskStateForScenario(scenarioId);
  if (!taskState) {
    return NextResponse.json({ error: "Invalid scenario state" }, { status: 500 });
  }

  let gen: {
    result: ValidatedSupport;
    catalogVersion: string;
    modelName: string;
    usedFallback: boolean;
  };

  if (debugForceFallback && supportDebugEnabled) {
    const result = buildFallbackSpec(scenarioId);
    gen = {
      result,
      catalogVersion: CATALOG_VERSION,
      modelName: "debug-fallback",
      usedFallback: true,
    };
  } else {
    gen = await generateValidatedSupport(scenarioId, taskState);
  }

  return NextResponse.json({
    spec: gen.result.spec,
    meta: {
      usedFallback: gen.usedFallback,
      modelName: gen.modelName,
      catalogVersion: gen.catalogVersion,
      componentTypes: gen.result.componentTypes,
      trigger: trigger ?? "explicit_request",
    },
  });
}
