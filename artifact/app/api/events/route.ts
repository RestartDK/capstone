import { NextResponse } from "next/server";
import { z } from "zod";

import { trialEvents } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { getParticipantIdFromCookies } from "@/lib/session";
import {
  getTrialByIdForParticipant,
  incrementInteractionCount,
  shouldIncrementInteraction,
} from "@/lib/study";

const bodySchema = z.object({
  participantId: z.string().uuid(),
  trialId: z.string().uuid(),
  eventType: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request): Promise<Response> {
  const participantIdCookie = await getParticipantIdFromCookies();
  const json: unknown = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { participantId, trialId, eventType, payload } = parsed.data;
  if (!participantIdCookie || participantIdCookie !== participantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const trial = await getTrialByIdForParticipant(participantId, trialId);
  if (!trial) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.insert(trialEvents).values({
    trialId,
    participantId,
    eventType,
    payload: payload ?? {},
  });

  if (shouldIncrementInteraction(eventType)) {
    await incrementInteractionCount(trialId, 1);
  }

  return NextResponse.json({ ok: true });
}
