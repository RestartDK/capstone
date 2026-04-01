import { NextResponse } from "next/server";
import { z } from "zod";

import { FINAL_QUESTION_KEYS, POST_TRIAL_KEYS } from "@/lib/constants";
import { questionnaireResponses } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { getParticipantIdFromCookies } from "@/lib/session";
import {
  ensureTrialsUpToDate,
  getTrialByIdForParticipant,
  hasCompletedFinal,
  hasCompletedPostTrial,
} from "@/lib/study";

const responseItem = z.object({
  questionKey: z.string().min(1),
  responseValue: z.string().min(0),
});

const bodySchema = z.object({
  participantId: z.string().uuid(),
  trialId: z.string().uuid().nullable().optional(),
  responses: z.array(responseItem).min(1),
});

export async function POST(req: Request): Promise<Response> {
  const participantIdCookie = await getParticipantIdFromCookies();
  const json: unknown = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { participantId, trialId, responses } = parsed.data;
  if (!participantIdCookie || participantIdCookie !== participantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trialIdOrNull = trialId ?? null;
  const keys = responses.map((r) => r.questionKey);

  if (trialIdOrNull) {
    const trial = await getTrialByIdForParticipant(participantId, trialIdOrNull);
    if (!trial?.completed) {
      return NextResponse.json({ error: "Trial not completed" }, { status: 400 });
    }
    const keySet = new Set(keys);
    if (
      keySet.size !== POST_TRIAL_KEYS.length ||
      !POST_TRIAL_KEYS.every((k) => keySet.has(k))
    ) {
      return NextResponse.json({ error: "Invalid post-trial keys" }, { status: 400 });
    }
    if (await hasCompletedPostTrial(participantId, trialIdOrNull)) {
      return NextResponse.json({ error: "Already submitted" }, { status: 400 });
    }
  } else {
    if (await hasCompletedFinal(participantId)) {
      return NextResponse.json({ error: "Already submitted" }, { status: 400 });
    }
    const allowedFinal = new Set<string>([...FINAL_QUESTION_KEYS, "final_comments"]);
    if (!keys.every((k) => allowedFinal.has(k))) {
      return NextResponse.json({ error: "Invalid final keys" }, { status: 400 });
    }
    const keySet = new Set(keys);
    if (!FINAL_QUESTION_KEYS.every((k) => keySet.has(k))) {
      return NextResponse.json({ error: "Missing final Likert responses" }, { status: 400 });
    }
  }

  await db.insert(questionnaireResponses).values(
    responses.map((r) => ({
      participantId,
      trialId: trialIdOrNull,
      questionKey: r.questionKey,
      responseValue: r.responseValue,
    })),
  );

  if (trialIdOrNull) {
    await ensureTrialsUpToDate(participantId, true);
  }

  return NextResponse.json({ ok: true });
}
