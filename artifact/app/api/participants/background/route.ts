import { NextResponse } from "next/server";
import { z } from "zod";

import { getParticipantIdFromCookies } from "@/lib/session";
import { updateParticipantBackground } from "@/lib/study";

const bodySchema = z.object({
  ageRange: z.string().min(1),
  occupation: z.string().min(1),
  webAppFamiliarity: z.number().int().min(1).max(7),
  aiToolFamiliarity: z.number().int().min(1).max(7),
});

export async function POST(req: Request): Promise<Response> {
  const participantId = await getParticipantIdFromCookies();
  if (!participantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json: unknown = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  await updateParticipantBackground({
    participantId,
    ...parsed.data,
  });
  return NextResponse.json({ ok: true });
}
