import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm"

import { FINAL_QUESTION_KEYS, POST_TRIAL_KEYS } from "./constants"
import { db, participants, questionnaireResponses, trials } from "./db"
import type { Trial } from "./db/schema"
import { buildTrialPlan, TRIAL_SCHEDULE_LENGTH } from "./scenarios/schedule"
import { isScenarioId } from "./scenarios/ids"
import { getScenarioVariantForCondition } from "./scenarios/variant"

/**
 * Progress segments from background form through thank-you: background (1) + each trial’s task &
 * post-trial questionnaire (2×trials) + final questionnaire (1) + thank-you (1).
 */
export const STUDY_PROGRESS_TOTAL = 1 + TRIAL_SCHEDULE_LENGTH * 2 + 2

export type StudyProgress = {
  current: number
  total: number
  percent: number
}

export function packStudyProgress(current: number): StudyProgress {
  const total = STUDY_PROGRESS_TOTAL
  const c = Math.min(Math.max(0, current), total)
  const percent = Math.min(100, Math.round((c / total) * 100))
  return { current: c, total, percent }
}
import { isAnswerCorrectForScenario } from "./scenarios/registry"

export async function createParticipant(
  consented: boolean
): Promise<{ id: string }> {
  const [row] = await db
    .insert(participants)
    .values({
      consentedAt: consented ? new Date() : null,
      baselineIsVersionA: Math.random() < 0.5,
    })
    .returning({ id: participants.id })
  if (!row) {
    throw new Error("Failed to create participant")
  }
  return row
}

export async function updateParticipantBackground(input: {
  participantId: string
  ageRange: string
  occupation: string
  webAppFamiliarity: number
  aiToolFamiliarity: number
}): Promise<void> {
  const now = new Date()
  await db
    .update(participants)
    .set({
      ageRange: input.ageRange,
      occupation: input.occupation,
      webAppFamiliarity: input.webAppFamiliarity,
      aiToolFamiliarity: input.aiToolFamiliarity,
      instructionAcknowledgedAt: now,
    })
    .where(eq(participants.id, input.participantId))
}

export async function acknowledgeInstruction(
  participantId: string
): Promise<void> {
  await db
    .update(participants)
    .set({ instructionAcknowledgedAt: new Date() })
    .where(eq(participants.id, participantId))
  await ensureTrialsUpToDate(participantId, true)
}

/**
 * Ensures trial rows match the participant schedule: first row after onboarding; each next row
 * after the previous trial is completed and post-trial questionnaire is saved.
 */
export async function ensureTrialsUpToDate(
  participantId: string,
  instructionAcknowledged: boolean
): Promise<void> {
  const plan = buildTrialPlan(participantId)
  let all = await getTrialsForParticipant(participantId)

  if (all.length === 0) {
    if (!instructionAcknowledged) {
      return
    }
    await db.insert(trials).values({
      participantId,
      scenarioId: plan[0].scenarioId,
      condition: plan[0].condition,
      trialIndex: 0,
    })
    return
  }

  while (all.length < plan.length) {
    const last = all[all.length - 1]
    if (!last?.completed) {
      return
    }
    if (!(await hasCompletedPostTrial(participantId, last.id))) {
      return
    }
    const nextIndex = all.length
    await db.insert(trials).values({
      participantId,
      scenarioId: plan[nextIndex].scenarioId,
      condition: plan[nextIndex].condition,
      trialIndex: nextIndex,
    })
    all = await getTrialsForParticipant(participantId)
  }
}

export async function getTrialsForParticipant(
  participantId: string
): Promise<Trial[]> {
  return db
    .select()
    .from(trials)
    .where(eq(trials.participantId, participantId))
    .orderBy(asc(trials.trialIndex))
}

export async function getOpenTrial(
  participantId: string
): Promise<Trial | null> {
  const rows = await db
    .select()
    .from(trials)
    .where(
      and(eq(trials.participantId, participantId), eq(trials.completed, false))
    )
    .orderBy(asc(trials.trialIndex))
    .limit(1)
  return rows[0] ?? null
}

export async function getTrialByIdForParticipant(
  participantId: string,
  trialId: string
): Promise<Trial | null> {
  const rows = await db
    .select()
    .from(trials)
    .where(and(eq(trials.id, trialId), eq(trials.participantId, participantId)))
    .limit(1)
  return rows[0] ?? null
}

export async function markTrialStarted(trialId: string): Promise<void> {
  await db
    .update(trials)
    .set({ startedAt: new Date() })
    .where(and(eq(trials.id, trialId), isNull(trials.startedAt)))
}

export async function submitTrialAnswer(input: {
  trialId: string
  participantId: string
  answerSubmitted: string
}): Promise<Trial> {
  const trial = await getTrialByIdForParticipant(
    input.participantId,
    input.trialId
  )
  if (!trial) {
    throw new Error("Trial not found")
  }
  if (trial.completed) {
    return trial
  }
  const variant = isScenarioId(trial.scenarioId)
    ? getScenarioVariantForCondition(
        input.participantId,
        trial.scenarioId,
        trial.condition
      )
    : "a"
  const correct = isAnswerCorrectForScenario(
    trial.scenarioId,
    input.answerSubmitted,
    variant
  )
  const endedAt = new Date()
  const durationMs =
    trial.startedAt != null
      ? endedAt.getTime() - trial.startedAt.getTime()
      : null
  const [updated] = await db
    .update(trials)
    .set({
      completed: true,
      correct,
      answerSubmitted: input.answerSubmitted,
      endedAt,
      durationMs: durationMs ?? undefined,
    })
    .where(eq(trials.id, input.trialId))
    .returning()
  if (!updated) {
    throw new Error("Failed to update trial")
  }
  return updated
}

async function countDistinctPostTrialKeys(
  participantId: string,
  trialId: string
): Promise<number> {
  const rows = await db
    .select({ k: questionnaireResponses.questionKey })
    .from(questionnaireResponses)
    .where(
      and(
        eq(questionnaireResponses.participantId, participantId),
        eq(questionnaireResponses.trialId, trialId),
        inArray(questionnaireResponses.questionKey, [...POST_TRIAL_KEYS])
      )
    )
  return new Set(rows.map((r) => r.k)).size
}

export async function hasCompletedPostTrial(
  participantId: string,
  trialId: string
): Promise<boolean> {
  const n = await countDistinctPostTrialKeys(participantId, trialId)
  return n >= POST_TRIAL_KEYS.length
}

/** First completed trial that still needs post-trial questionnaire (FIFO). */
export async function findPendingPostTrial(
  participantId: string
): Promise<string | null> {
  const doneTrials = await db
    .select()
    .from(trials)
    .where(
      and(eq(trials.participantId, participantId), eq(trials.completed, true))
    )
    .orderBy(asc(trials.trialIndex))
  for (const t of doneTrials) {
    if (!(await hasCompletedPostTrial(participantId, t.id))) {
      return t.id
    }
  }
  return null
}

export async function allTrialsFinished(
  participantId: string
): Promise<boolean> {
  const list = await getTrialsForParticipant(participantId)
  if (list.length < TRIAL_SCHEDULE_LENGTH) {
    return false
  }
  return list.every((t) => t.completed)
}

async function countFinalResponses(participantId: string): Promise<number> {
  const rows = await db
    .select({ k: questionnaireResponses.questionKey })
    .from(questionnaireResponses)
    .where(
      and(
        eq(questionnaireResponses.participantId, participantId),
        sql`${questionnaireResponses.trialId} is null`,
        inArray(questionnaireResponses.questionKey, [...FINAL_QUESTION_KEYS])
      )
    )
  return new Set(rows.map((r) => r.k)).size
}

export async function hasCompletedFinal(
  participantId: string
): Promise<boolean> {
  const n = await countFinalResponses(participantId)
  return n >= FINAL_QUESTION_KEYS.length
}

export async function incrementInteractionCount(
  trialId: string,
  delta: number
): Promise<void> {
  if (delta === 0) {
    return
  }
  await db
    .update(trials)
    .set({
      interactionCount: sql`${trials.interactionCount} + ${delta}`,
    })
    .where(eq(trials.id, trialId))
}

const INTERACTION_EVENT_TYPES = new Set([
  "trial_viewed",
  "answer_selected",
  "answer_changed",
  "support_requested",
  "support_triggered",
  "support_shown",
  "support_dismissed",
  "support_inspect_expanded",
  "support_used",
  "support_ignored",
  "slide_reordered",
  "ticket_moved",
  "workflow_step_completed",
])

export function shouldIncrementInteraction(eventType: string): boolean {
  return INTERACTION_EVENT_TYPES.has(eventType)
}

export type StudyStep =
  | "background"
  | "instruction"
  | "study"
  | "post_trial"
  | "final"
  | "complete"

export type StudyStateResponse = {
  participantId: string
  step: StudyStep
  trial: Trial | null
  postTrialTrialId: string | null
  baselineIsVersionA: boolean | null
  /** Latest trial row (by index); useful for logging events after all trials complete. */
  lastTrialId: string | null
  totalTrials: number
  progress: StudyProgress
}

export async function resolveStudyState(
  participantId: string
): Promise<StudyStateResponse> {
  async function lastTrialId(): Promise<string | null> {
    const list = await getTrialsForParticipant(participantId)
    const last = list[list.length - 1]
    return last?.id ?? null
  }

  const total = TRIAL_SCHEDULE_LENGTH

  const [p] = await db
    .select()
    .from(participants)
    .where(eq(participants.id, participantId))
    .limit(1)
  if (!p) {
    return {
      participantId,
      step: "background",
      trial: null,
      postTrialTrialId: null,
      baselineIsVersionA: null,
      lastTrialId: null,
      totalTrials: total,
      progress: packStudyProgress(1),
    }
  }
  if (
    !p.ageRange ||
    !p.occupation ||
    p.webAppFamiliarity == null ||
    p.aiToolFamiliarity == null
  ) {
    return {
      participantId,
      step: "background",
      trial: null,
      postTrialTrialId: null,
      baselineIsVersionA: p.baselineIsVersionA,
      lastTrialId: null,
      totalTrials: total,
      progress: packStudyProgress(1),
    }
  }

  await ensureTrialsUpToDate(participantId, true)
  const lt = await lastTrialId()
  const open = await getOpenTrial(participantId)
  if (open) {
    return {
      participantId,
      step: "study",
      trial: open,
      postTrialTrialId: null,
      baselineIsVersionA: p.baselineIsVersionA,
      lastTrialId: lt,
      totalTrials: total,
      progress: packStudyProgress(2 + 2 * open.trialIndex),
    }
  }

  const pendingPost = await findPendingPostTrial(participantId)
  if (pendingPost) {
    const postTrialRow = await getTrialByIdForParticipant(
      participantId,
      pendingPost
    )
    const idx = postTrialRow?.trialIndex ?? 0
    return {
      participantId,
      step: "post_trial",
      trial: null,
      postTrialTrialId: pendingPost,
      baselineIsVersionA: p.baselineIsVersionA,
      lastTrialId: lt,
      totalTrials: total,
      progress: packStudyProgress(3 + 2 * idx),
    }
  }

  if (!(await hasCompletedFinal(participantId))) {
    return {
      participantId,
      step: "final",
      trial: null,
      postTrialTrialId: null,
      baselineIsVersionA: p.baselineIsVersionA,
      lastTrialId: lt,
      totalTrials: total,
      progress: packStudyProgress(1 + TRIAL_SCHEDULE_LENGTH * 2 + 1),
    }
  }

  return {
    participantId,
    step: "complete",
    trial: null,
    postTrialTrialId: null,
    baselineIsVersionA: p.baselineIsVersionA,
    lastTrialId: lt,
    totalTrials: total,
    progress: packStudyProgress(STUDY_PROGRESS_TOTAL),
  }
}
