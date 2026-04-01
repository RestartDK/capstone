import { NextResponse } from "next/server";
import { z } from "zod";

import { SCENARIO_ID } from "@/lib/constants";
import { supportOutputs } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { generateValidatedSupport } from "@/lib/genai/run-support";
import { getParticipantIdFromCookies } from "@/lib/session";
import { getTrialByIdForParticipant } from "@/lib/study";
import { getDashboardTaskState } from "@/lib/task-state";

const bodySchema = z.object({
  participantId: z.string().uuid(),
  trialId: z.string().uuid(),
  scenarioId: z.literal(SCENARIO_ID),
});

export async function POST(req: Request): Promise<Response> {
  const participantIdCookie = await getParticipantIdFromCookies();
  const json: unknown = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { participantId, trialId } = parsed.data;
  if (!participantIdCookie || participantIdCookie !== participantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const trial = await getTrialByIdForParticipant(participantId, trialId);
  if (!trial || trial.completed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (trial.condition !== "ephemeral") {
    return NextResponse.json({ error: "Support not available for this trial" }, { status: 400 });
  }

  const taskState = getDashboardTaskState();
  const gen = await generateValidatedSupport(taskState);

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
