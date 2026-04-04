import { NextResponse } from "next/server"
import { z } from "zod"

import { supportOutputs } from "@/lib/db/schema"
import { db } from "@/lib/db"
import { CATALOG_VERSION } from "@/lib/ephemeral/catalog"
import { generateValidatedSupport } from "@/lib/genai/run-support"
import { isScenarioId } from "@/lib/scenarios/ids"
import { getParticipantIdFromCookies } from "@/lib/session"
import { parseParticipantTaskSnapshotForScenario } from "@/lib/participant-task-snapshot"
import { buildFallbackSpec, type ValidatedSupport } from "@/lib/support-schema"
import { getTaskStateForScenario } from "@/lib/task-state"
import { getScenarioVariantForCondition } from "@/lib/scenarios/variant"
import { getTrialByIdForParticipant } from "@/lib/study"

const bodySchema = z.object({
  participantId: z.string().uuid(),
  trialId: z.string().uuid(),
  scenarioId: z.string().min(1),
  trigger: z.enum(["initial", "hesitation", "explicit_request"]).optional(),
  /** Current selections / draft outline / board columns; validated server-side. */
  participantSnapshot: z.unknown().optional(),
  /** Dev only: skip model and return `buildFallbackSpec`. Requires NEXT_PUBLIC_DEBUG_SUPPORT=1. */
  debugForceFallback: z.boolean().optional(),
})

const supportDebugEnabled = process.env.NEXT_PUBLIC_DEBUG_SUPPORT === "1"

export async function POST(req: Request): Promise<Response> {
  const requestId = crypto.randomUUID()
  const jsonError = (status: number, body: Record<string, unknown>) =>
    NextResponse.json({ requestId, ...body }, { status })

  const participantIdCookie = await getParticipantIdFromCookies()
  const json: unknown = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    console.warn("[api/support] invalid_body", { requestId })
    return jsonError(400, { error: "Invalid body" })
  }
  const {
    participantId,
    trialId,
    scenarioId,
    trigger,
    participantSnapshot: snapshotRaw,
    debugForceFallback,
  } = parsed.data
  console.info("[api/support] request_received", {
    requestId,
    participantId,
    trialId,
    scenarioId,
    trigger: trigger ?? "initial",
    hasParticipantCookie: Boolean(participantIdCookie),
    debugForceFallback: Boolean(debugForceFallback),
    participantSnapshotPresent: snapshotRaw !== undefined,
  })
  if (!participantIdCookie || participantIdCookie !== participantId) {
    console.warn("[api/support] unauthorized", {
      requestId,
      hasParticipantCookie: Boolean(participantIdCookie),
      cookieMatchesBody: participantIdCookie === participantId,
    })
    return jsonError(401, { error: "Unauthorized" })
  }
  if (!isScenarioId(scenarioId)) {
    console.warn("[api/support] unknown_scenario", { requestId, scenarioId })
    return jsonError(400, { error: "Unknown scenario" })
  }
  const trial = await getTrialByIdForParticipant(participantId, trialId)
  if (!trial || trial.completed) {
    console.warn("[api/support] trial_not_found_or_completed", {
      requestId,
      trialId,
      found: Boolean(trial),
      completed: trial?.completed ?? null,
    })
    return jsonError(404, { error: "Not found" })
  }
  if (trial.scenarioId !== scenarioId) {
    console.warn("[api/support] scenario_mismatch", {
      requestId,
      trialScenarioId: trial.scenarioId,
      scenarioId,
    })
    return jsonError(400, { error: "Scenario mismatch" })
  }
  if (trial.condition !== "ephemeral") {
    console.warn("[api/support] non_ephemeral_trial", {
      requestId,
      trialId,
      condition: trial.condition,
    })
    return jsonError(400, { error: "Support not available for this trial" })
  }

  const variant = getScenarioVariantForCondition(
    participantId,
    scenarioId,
    trial.condition
  )
  const taskState = getTaskStateForScenario(scenarioId, variant)
  if (!taskState) {
    console.error("[api/support] invalid_scenario_state", {
      requestId,
      scenarioId,
      variant,
    })
    return jsonError(500, { error: "Invalid scenario state" })
  }

  const participantSnapshot = parseParticipantTaskSnapshotForScenario(
    scenarioId,
    snapshotRaw
  )

  let gen: {
    result: ValidatedSupport
    catalogVersion: string
    modelName: string
    rawOutput: unknown
    usedFallback: boolean
    providerAttempted: boolean
    fallbackReason: string | null
  }

  if (debugForceFallback && supportDebugEnabled) {
    const result = buildFallbackSpec(scenarioId, taskState)
    gen = {
      result,
      catalogVersion: CATALOG_VERSION,
      modelName: "debug-fallback",
      rawOutput: result.spec,
      usedFallback: true,
      providerAttempted: false,
      fallbackReason: "debug_force_fallback",
    }
  } else {
    console.info("[api/support] generating_support", {
      requestId,
      scenarioId,
      trigger: trigger ?? "initial",
    })
    gen = await generateValidatedSupport(
      scenarioId,
      taskState,
      participantSnapshot
    )
  }

  console.info("[api/support] generation_complete", {
    requestId,
    scenarioId,
    usedFallback: gen.usedFallback,
    fallbackReason: gen.fallbackReason,
    providerAttempted: gen.providerAttempted,
    modelName: gen.modelName,
    componentTypes: gen.result.componentTypes,
  })

  try {
    await db.insert(supportOutputs).values({
      trialId,
      inputState: {
        baselineTaskState: taskState,
        participantSnapshot,
        trigger: trigger ?? "initial",
      } as unknown as Record<string, unknown>,
      modelName: gen.modelName,
      output: {
        catalogVersion: gen.catalogVersion,
        spec: gen.result.spec,
        componentTypes: gen.result.componentTypes,
        trigger: trigger ?? "initial",
        usedFallback: gen.usedFallback,
        fallbackReason: gen.fallbackReason,
        providerAttempted: gen.providerAttempted,
      } as unknown as Record<string, unknown>,
    })
    console.info("[api/support] support_output_saved", {
      requestId,
      trialId,
    })
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e)
    console.error("[api/support] support_outputs insert failed", {
      requestId,
      detail,
      error: e,
    })
    return jsonError(500, {
      error: "support_outputs_insert_failed",
      detail,
      hint: "If the detail mentions an old column (e.g. prompt_version), run `bun run db:migrate` against this DATABASE_URL.",
    })
  }

  return NextResponse.json({
    requestId,
    spec: gen.result.spec,
    meta: {
      usedFallback: gen.usedFallback,
      fallbackReason: gen.fallbackReason,
      providerAttempted: gen.providerAttempted,
      modelName: gen.modelName,
      catalogVersion: gen.catalogVersion,
      componentTypes: gen.result.componentTypes,
      trigger: trigger ?? "initial",
    },
  })
}
