import { cookies } from "next/headers";

import { COOKIE_PARTICIPANT } from "./constants";

export async function getParticipantIdFromCookies(): Promise<string | null> {
  const jar = await cookies();
  const v = jar.get(COOKIE_PARTICIPANT)?.value;
  return v && v.length > 0 ? v : null;
}

export async function setParticipantCookie(participantId: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_PARTICIPANT, participantId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearParticipantCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_PARTICIPANT);
}
