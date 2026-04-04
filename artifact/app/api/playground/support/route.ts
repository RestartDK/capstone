import { NextResponse } from "next/server"
import { z } from "zod"

import { CATALOG_VERSION } from "@/lib/ephemeral/catalog"
import { generateValidatedSupport } from "@/lib/genai/run-support"
import { parseParticipantTaskSnapshotForScenario } from "@/lib/participant-task-snapshot"
import { isScenarioId } from "@/lib/scenarios/ids"
import { buildFallbackSpec, type ValidatedSupport } from "@/lib/support-schema"
import { getTaskStateForScenario } from "@/lib/task-state"

const bodySchema = z.object({
  scenarioId: z.string().min(1),
  trigger: z.enum(["initial", "hesitation", "explicit_request"]).optional(),
  participantSnapshot: z.unknown().optional(),
  /** Same as /api/support: only honored when NEXT_PUBLIC_DEBUG_SUPPORT=1. */
  debugForceFallback: z.boolean().optional(),
})

const supportDebugEnabled = process.env.NEXT_PUBLIC_DEBUG_SUPPORT === "1"

/**
 * Dev-only support generation without a participant or trial row. Not available in production builds.
 */
export async function POST(req: Request): Promise<Response> {
  const requestId = crypto.randomUUID()

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const json: unknown = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const {
    scenarioId,
    trigger,
    participantSnapshot: snapshotRaw,
    debugForceFallback,
  } = parsed.data
  if (!isScenarioId(scenarioId)) {
    return NextResponse.json({ error: "Unknown scenario" }, { status: 400 })
  }

  const taskState = getTaskStateForScenario(scenarioId)
  if (!taskState) {
    return NextResponse.json(
      { error: "Invalid scenario state" },
      { status: 500 }
    )
  }

  const participantSnapshot = parseParticipantTaskSnapshotForScenario(
    scenarioId,
    snapshotRaw
  )

  let gen: {
    result: ValidatedSupport
    catalogVersion: string
    modelName: string
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
      usedFallback: true,
      providerAttempted: false,
      fallbackReason: "debug_force_fallback",
    }
  } else {
    gen = await generateValidatedSupport(
      scenarioId,
      taskState,
      participantSnapshot
    )
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
      trigger: trigger ?? "explicit_request",
    },
  })
}
