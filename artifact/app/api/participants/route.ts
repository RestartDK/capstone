import { NextResponse } from "next/server";
import { z } from "zod";

import { createParticipant } from "@/lib/study";
import { setParticipantCookie } from "@/lib/session";

const bodySchema = z.object({
  consented: z.literal(true),
});

export async function POST(req: Request): Promise<Response> {
  const json: unknown = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { id } = await createParticipant(parsed.data.consented);
  await setParticipantCookie(id);
  return NextResponse.json({ participantId: id });
}
