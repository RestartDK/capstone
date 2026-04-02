import { asc } from "drizzle-orm"

import {
  db,
  participants,
  questionnaireResponses,
  supportOutputs,
  trialEvents,
  trials,
} from "./db"
import { isScenarioId } from "./scenarios/ids"
import { getScenarioVariantForCondition } from "./scenarios/variant"

function csvEscape(value: string | number | null | undefined): string {
  if (value == null) {
    return ""
  }
  const s = String(value)
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function rowsToCsv(
  headers: string[],
  rows: Record<string, string | number | null>[]
): string {
  const lines = [headers.join(",")]
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h] ?? "")).join(","))
  }
  return lines.join("\n") + "\n"
}

export async function exportStudyCsvs(): Promise<{
  participants: string
  trials: string
  trialEvents: string
  questionnaire: string
  supportOutputs: string
}> {
  const pRows = await db
    .select()
    .from(participants)
    .orderBy(asc(participants.createdAt))
  const participantsCsv = rowsToCsv(
    [
      "id",
      "created_at",
      "consented_at",
      "age_range",
      "occupation",
      "web_app_familiarity",
      "ai_tool_familiarity",
      "baseline_is_version_a",
      "instruction_acknowledged_at",
    ],
    pRows.map((p) => ({
      id: p.id,
      created_at: p.createdAt.toISOString(),
      consented_at: p.consentedAt?.toISOString() ?? "",
      age_range: p.ageRange ?? "",
      occupation: p.occupation ?? "",
      web_app_familiarity: p.webAppFamiliarity ?? "",
      ai_tool_familiarity: p.aiToolFamiliarity ?? "",
      baseline_is_version_a:
        p.baselineIsVersionA == null
          ? ""
          : p.baselineIsVersionA
            ? "true"
            : "false",
      instruction_acknowledged_at:
        p.instructionAcknowledgedAt?.toISOString() ?? "",
    }))
  )

  const tRows = await db.select().from(trials).orderBy(asc(trials.createdAt))
  const trialsCsv = rowsToCsv(
    [
      "id",
      "participant_id",
      "created_at",
      "scenario_id",
      "scenario_variant",
      "condition",
      "trial_index",
      "started_at",
      "ended_at",
      "duration_ms",
      "completed",
      "correct",
      "answer_submitted",
      "interaction_count",
    ],
    tRows.map((t) => ({
      id: t.id,
      participant_id: t.participantId,
      created_at: t.createdAt.toISOString(),
      scenario_id: t.scenarioId,
      scenario_variant: isScenarioId(t.scenarioId)
        ? getScenarioVariantForCondition(
            t.participantId,
            t.scenarioId,
            t.condition
          )
        : "",
      condition: t.condition,
      trial_index: t.trialIndex,
      started_at: t.startedAt?.toISOString() ?? "",
      ended_at: t.endedAt?.toISOString() ?? "",
      duration_ms: t.durationMs ?? "",
      completed: t.completed ? "true" : "false",
      correct: t.correct == null ? "" : t.correct ? "true" : "false",
      answer_submitted: t.answerSubmitted ?? "",
      interaction_count: t.interactionCount,
    }))
  )

  const eRows = await db.select().from(trialEvents).orderBy(asc(trialEvents.id))
  const eventsCsv = rowsToCsv(
    ["id", "trial_id", "participant_id", "created_at", "event_type", "payload"],
    eRows.map((e) => ({
      id: e.id,
      trial_id: e.trialId,
      participant_id: e.participantId,
      created_at: e.createdAt.toISOString(),
      event_type: e.eventType,
      payload: JSON.stringify(e.payload),
    }))
  )

  const qRows = await db
    .select()
    .from(questionnaireResponses)
    .orderBy(asc(questionnaireResponses.id))
  const qCsv = rowsToCsv(
    [
      "id",
      "participant_id",
      "trial_id",
      "created_at",
      "question_key",
      "response_value",
    ],
    qRows.map((q) => ({
      id: q.id,
      participant_id: q.participantId,
      trial_id: q.trialId ?? "",
      created_at: q.createdAt.toISOString(),
      question_key: q.questionKey,
      response_value: q.responseValue,
    }))
  )

  const sRows = await db
    .select()
    .from(supportOutputs)
    .orderBy(asc(supportOutputs.id))
  const sCsv = rowsToCsv(
    ["id", "trial_id", "created_at", "model_name", "input_state", "output"],
    sRows.map((s) => ({
      id: s.id,
      trial_id: s.trialId,
      created_at: s.createdAt.toISOString(),
      model_name: s.modelName,
      input_state: JSON.stringify(s.inputState),
      output: JSON.stringify(s.output),
    }))
  )

  return {
    participants: participantsCsv,
    trials: trialsCsv,
    trialEvents: eventsCsv,
    questionnaire: qCsv,
    supportOutputs: sCsv,
  }
}

export async function exportBundleZipLike(): Promise<string> {
  const parts = await exportStudyCsvs()
  return [
    "=== participants.csv ===\n",
    parts.participants,
    "\n=== trials.csv ===\n",
    parts.trials,
    "\n=== trial_events.csv ===\n",
    parts.trialEvents,
    "\n=== questionnaire_responses.csv ===\n",
    parts.questionnaire,
    "\n=== support_outputs.csv ===\n",
    parts.supportOutputs,
  ].join("")
}
