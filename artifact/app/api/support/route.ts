import { NextResponse } from "next/server";
import { z } from "zod";

import { supportOutputs } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { generateValidatedSupport } from "@/lib/genai/run-support";
import { isScenarioId } from "@/lib/scenarios/ids";
import { getParticipantIdFromCookies } from "@/lib/session";
import { getTaskStateForScenario } from "@/lib/task-state";
import { getTrialByIdForParticipant } from "@/lib/study";

const bodySchema = z.object({
  participantId: z.string().uuid(),
  trialId: z.string().uuid(),
  scenarioId: z.string().min(1),
});

export async function POST(req: Request): Promise<Response> {
  const participantIdCookie = await getParticipantIdFromCookies();
  const json: unknown = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { participantId, trialId, scenarioId } = parsed.data;
  if (!participantIdCookie || participantIdCookie !== participantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isScenarioId(scenarioId)) {
    return NextResponse.json({ error: "Unknown scenario" }, { status: 400 });
  }
  const trial = await getTrialByIdForParticipant(participantId, trialId);
  if (!trial || trial.completed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (trial.scenarioId !== scenarioId) {
    return NextResponse.json({ error: "Scenario mismatch" }, { status: 400 });
  }
  if (trial.condition !== "ephemeral") {
    return NextResponse.json({ error: "Support not available for this trial" }, { status: 400 });
  }

  const taskState = getTaskStateForScenario(scenarioId);
  if (!taskState) {
    return NextResponse.json({ error: "Invalid scenario state" }, { status: 500 });
  }
  const gen = await generateValidatedSupport(scenarioId, taskState);

  await db.insert(supportOutputs).values({
    trialId,
    promptVersion: gen.promptVersion,
    inputState: taskState as unknown as Record<string, unknown>,
    modelName: gen.modelName,
    output: gen.payload as unknown as Record<string, unknown>,
  });

  return NextResponse.json({
    support: gen.payload,
    meta: { usedFallback: gen.usedFallback, modelName: gen.modelName },
  });
}
