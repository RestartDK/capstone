import { NextResponse } from "next/server";

import { getParticipantIdFromCookies } from "@/lib/session";
import { getTrialByIdForParticipant, markTrialStarted } from "@/lib/study";

type RouteContext = { params: Promise<{ trialId: string }> };

export async function POST(_req: Request, context: RouteContext): Promise<Response> {
  const { trialId } = await context.params;
  const participantId = await getParticipantIdFromCookies();
  if (!participantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const trial = await getTrialByIdForParticipant(participantId, trialId);
  if (!trial) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (trial.completed) {
    return NextResponse.json({ ok: true, trial });
  }
  await markTrialStarted(trialId);
  const updated = await getTrialByIdForParticipant(participantId, trialId);
  return NextResponse.json({ ok: true, trial: updated });
}
