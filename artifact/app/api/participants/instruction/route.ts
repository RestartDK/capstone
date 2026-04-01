import { NextResponse } from "next/server";
import { z } from "zod";

import { getParticipantIdFromCookies } from "@/lib/session";
import { acknowledgeInstruction } from "@/lib/study";

const bodySchema = z.object({
  participantId: z.string().uuid(),
});

export async function POST(req: Request): Promise<Response> {
  const participantIdCookie = await getParticipantIdFromCookies();
  const json: unknown = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { participantId } = parsed.data;
  if (!participantIdCookie || participantIdCookie !== participantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await acknowledgeInstruction(participantId);
  return NextResponse.json({ ok: true });
}
