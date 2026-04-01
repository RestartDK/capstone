import { NextResponse } from "next/server";
import { z } from "zod";

import { getParticipantIdFromCookies } from "@/lib/session";
import { getTrialByIdForParticipant, submitTrialAnswer } from "@/lib/study";

const bodySchema = z.object({
  answerSubmitted: z.string().min(1),
});

type RouteContext = { params: Promise<{ trialId: string }> };

export async function POST(req: Request, context: RouteContext): Promise<Response> {
  const { trialId } = await context.params;
  const participantId = await getParticipantIdFromCookies();
  if (!participantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const trial = await getTrialByIdForParticipant(participantId, trialId);
  if (!trial) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const json: unknown = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  try {
    const updated = await submitTrialAnswer({
      trialId,
      participantId,
      answerSubmitted: parsed.data.answerSubmitted,
    });
    return NextResponse.json({ trial: updated });
  } catch {
    return NextResponse.json({ error: "Submit failed" }, { status: 400 });
  }
}
