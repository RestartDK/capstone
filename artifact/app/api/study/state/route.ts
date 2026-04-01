import { NextResponse } from "next/server";

import { getParticipantIdFromCookies } from "@/lib/session";
import { resolveStudyState } from "@/lib/study";

export async function GET(): Promise<Response> {
  const participantId = await getParticipantIdFromCookies();
  if (!participantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const state = await resolveStudyState(participantId);
  return NextResponse.json(state);
}
