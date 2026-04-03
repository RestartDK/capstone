"use client"

import * as React from "react"
import type { CSSProperties } from "react"
import { useRouter } from "next/navigation"

import { EphemeralDebugPanel } from "@/components/ephemeral/EphemeralDebugPanel"
import { EphemeralLayer } from "@/components/ephemeral/EphemeralLayer"
import { ScenarioDashboard } from "@/components/study/ScenarioDashboard"
import { ScenarioPmSprint } from "@/components/study/ScenarioPmSprint"
import { ScenarioSlides } from "@/components/study/ScenarioSlides"
import type { SlidesAttemptState } from "@/components/study/ScenarioSlides"
import { StudyProgressBar } from "@/components/study/StudyProgressBar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DEFAULT_EPHEMERAL_DEBUG_SETTINGS,
  ephemeralStressBand,
  loadEphemeralDebugSettings,
  normalizeHueDegrees,
  saveEphemeralDebugSettings,
  type EphemeralDebugSettings,
} from "@/lib/ephemeral/debug-settings"
import type {
  EphemeralSpec,
  EphemeralSupportInteraction,
} from "@/lib/ephemeral/spec"
import { buildParticipantTaskSnapshotPayload } from "@/lib/participant-task-snapshot"
import { interfaceVersionLetter } from "@/lib/interface-version"
import type {
  DashboardTaskState,
  PmSprintTaskState,
  SlidesTaskState,
} from "@/lib/task-state"
import { getTaskStateForScenario } from "@/lib/task-state"
import { cn } from "@/lib/utils"
import { SLIDES_START_ORDER, getScenarioEntry } from "@/lib/scenarios/registry"
import { isScenarioId } from "@/lib/scenarios/ids"
import { getScenarioVariantForCondition } from "@/lib/scenarios/variant"
import { pathForStudyStep } from "@/lib/study-routes"
import type { StudyStateResponse } from "@/lib/study"
import { trackEvent } from "@/lib/track"

type SupportTrigger = "initial" | "hesitation" | "explicit_request"

type SupportApiResponse = {
  spec: EphemeralSpec
  meta: {
    usedFallback: boolean
    modelName: string
    catalogVersion: string
    componentTypes: string[]
    trigger: string
  }
}

type SupportDismissReason = "explicit" | "used" | "task_complete" | "superseded"

const supportDebugEnabled =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_DEBUG_SUPPORT === "1"

type SupportDebugInfo = {
  at: string
  trialId: string
  trigger: string
  phase:
    | "start"
    | "success"
    | "http_error"
    | "network_error"
    | "skipped_already_loaded"
  httpStatus?: number
  detail?: string
}

const INITIAL_SLIDES_ATTEMPT: SlidesAttemptState = {
  hasReordered: false,
  hasEditedProblem: false,
  readyToSubmit: false,
}

/** Stored when the participant submits without a generated refinement payload. */
const SLIDES_INCOMPLETE_SUBMIT_FALLBACK = "{}"

function participantChecklistCompletion(
  scenarioId: string,
  participantOutcome: readonly string[],
  slidesAttempt: SlidesAttemptState,
  selected: string | null,
  pmAnswer: string | null
): boolean[] {
  let steps: boolean[]
  if (!isScenarioId(scenarioId)) {
    steps = []
  } else if (scenarioId === "slides-outline-refine") {
    steps = [slidesAttempt.hasReordered, slidesAttempt.hasEditedProblem]
  } else if (scenarioId === "dashboard-priority") {
    steps = [selected != null]
  } else if (scenarioId === "pm-sprint-handoff") {
    steps = [pmAnswer != null]
  } else {
    steps = []
  }
  return participantOutcome.map((_, i) => steps[i] ?? false)
}

export default function StudyPage(): React.ReactElement {
  const router = useRouter()
  const [state, setState] = React.useState<StudyStateResponse | null>(null)
  const [selected, setSelected] = React.useState<string | null>(null)
  const [refinementAnswer, setRefinementAnswer] = React.useState<string | null>(
    null
  )
  const [pmAnswer, setPmAnswer] = React.useState<string | null>(null)
  const [slidesLive, setSlidesLive] = React.useState<{
    order: string[]
    problemBullets: string[]
    metricsBullets: string[]
    ctaBullets: string[]
  } | null>(null)
  const [slidesAttempt, setSlidesAttempt] = React.useState<SlidesAttemptState>(
    INITIAL_SLIDES_ATTEMPT
  )
  const [pmBoard, setPmBoard] = React.useState<Record<
    string,
    "backlog" | "in_progress"
  > | null>(null)
  const [spec, setSpec] = React.useState<EphemeralSpec | null>(null)
  const [loadingSupport, setLoadingSupport] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [supportDebug, setSupportDebug] =
    React.useState<SupportDebugInfo | null>(null)
  const [debugSettings, setDebugSettings] =
    React.useState<EphemeralDebugSettings>(() =>
      supportDebugEnabled
        ? loadEphemeralDebugSettings()
        : DEFAULT_EPHEMERAL_DEBUG_SETTINGS
    )
  const startedRef = React.useRef<string | null>(null)
  const supportLoadedRef = React.useRef(false)
  const supportShownRef = React.useRef(false)
  const prevTrialIdForResetRef = React.useRef<string | undefined>(undefined)
  const prevSlidesReadyRef = React.useRef(false)

  React.useEffect(() => {
    if (!supportDebugEnabled) return
    saveEphemeralDebugSettings(debugSettings)
  }, [debugSettings])

  const loadState = React.useCallback(async () => {
    const res = await fetch("/api/study/state")
    if (res.status === 401) {
      router.replace("/consent")
      return null
    }
    return (await res.json()) as StudyStateResponse
  }, [router])

  React.useEffect(() => {
    void (async () => {
      const s = await loadState()
      if (!s) return
      setState(s)
      if (s.step !== "study") {
        router.replace(pathForStudyStep(s))
      }
    })()
  }, [loadState, router])

  const trial = state?.trial
  const scenarioContext = React.useMemo(() => {
    if (!state || !trial || !isScenarioId(trial.scenarioId)) {
      return { scenarioVariant: null, entry: null, taskState: null }
    }
    const scenarioVariant = getScenarioVariantForCondition(
      state.participantId,
      trial.scenarioId,
      trial.condition
    )
    return {
      scenarioVariant,
      entry: getScenarioEntry(trial.scenarioId, scenarioVariant),
      taskState: getTaskStateForScenario(trial.scenarioId, scenarioVariant),
    }
  }, [state, trial])

  const fetchSupport = React.useCallback(
    async (
      participantId: string,
      trialId: string,
      scenarioId: string,
      trigger: SupportTrigger
    ) => {
      if (supportLoadedRef.current && trigger !== "explicit_request") {
        const skip: SupportDebugInfo = {
          at: new Date().toISOString(),
          trialId,
          trigger,
          phase: "skipped_already_loaded",
          detail:
            "Automatic assistance was already requested for this trial. Dismiss the overlay to reset, or use “Request assistance” to fetch again with your current progress.",
        }
        if (supportDebugEnabled) {
          setSupportDebug(skip)
          console.warn("[support]", skip)
        }
        return
      }
      const participantSnapshot = isScenarioId(scenarioId)
        ? buildParticipantTaskSnapshotPayload(scenarioId, {
            selectedCardId: selected,
            slidesLive,
            pmTicketColumns: pmBoard,
          })
        : undefined
      supportLoadedRef.current = true
      const started: SupportDebugInfo = {
        at: new Date().toISOString(),
        trialId,
        trigger,
        phase: "start",
      }
      if (supportDebugEnabled) {
        setSupportDebug(started)
        console.info("[support] POST /api/support", {
          trialId,
          scenarioId,
          trigger,
        })
      }
      setLoadingSupport(true)
      try {
        const res = await fetch("/api/support", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participantId,
            trialId,
            scenarioId,
            trigger,
            ...(participantSnapshot ? { participantSnapshot } : {}),
            ...(supportDebugEnabled && debugSettings.forceApiFallback
              ? { debugForceFallback: true }
              : {}),
          }),
        })
        if (res.ok) {
          const data = (await res.json()) as SupportApiResponse
          setSpec(data.spec)
          supportShownRef.current = true
          if (supportDebugEnabled) {
            const okInfo: SupportDebugInfo = {
              at: new Date().toISOString(),
              trialId,
              trigger,
              phase: "success",
              httpStatus: res.status,
              detail: `usedFallback=${String(data.meta.usedFallback)} model=${data.meta.modelName} types=${data.meta.componentTypes.join(",")}`,
            }
            setSupportDebug(okInfo)
            console.info("[support] spec applied", data.meta, data.spec)
          }
          await trackEvent({
            participantId,
            trialId,
            eventType: "support_shown",
            payload: {
              componentTypes: data.meta.componentTypes,
              catalogVersion: data.meta.catalogVersion,
              trigger: data.meta.trigger,
              usedFallback: data.meta.usedFallback,
            },
          })
        } else {
          supportLoadedRef.current = false
          const text = await res.text().catch(() => "")
          const errInfo: SupportDebugInfo = {
            at: new Date().toISOString(),
            trialId,
            trigger,
            phase: "http_error",
            httpStatus: res.status,
            detail: text.slice(0, 400) || res.statusText,
          }
          if (supportDebugEnabled) {
            setSupportDebug(errInfo)
          }
          console.error("[support] /api/support failed", res.status, text)
        }
      } catch (e) {
        supportLoadedRef.current = false
        const errInfo: SupportDebugInfo = {
          at: new Date().toISOString(),
          trialId,
          trigger,
          phase: "network_error",
          detail: e instanceof Error ? e.message : String(e),
        }
        if (supportDebugEnabled) {
          setSupportDebug(errInfo)
        }
        console.error("[support] fetch error", e)
      } finally {
        setLoadingSupport(false)
      }
    },
    [debugSettings.forceApiFallback, selected, slidesLive, pmBoard]
  )

  React.useEffect(() => {
    const tid = state?.trial?.id
    if (!tid) return
    if (tid === prevTrialIdForResetRef.current) return
    prevTrialIdForResetRef.current = tid
    startedRef.current = null
    setSelected(null)
    setRefinementAnswer(null)
    setPmAnswer(null)
    setSlidesLive(null)
    setSlidesAttempt(INITIAL_SLIDES_ATTEMPT)
    setPmBoard(null)
    setSpec(null)
    supportLoadedRef.current = false
    supportShownRef.current = false
    prevSlidesReadyRef.current = false
  }, [state?.trial?.id])

  React.useEffect(() => {
    const trialNow = state?.trial
    if (!trialNow || state?.step !== "study") return
    const pid = state.participantId
    const tid = trialNow.id

    void (async () => {
      if (startedRef.current === tid) return
      startedRef.current = tid
      supportLoadedRef.current = false
      supportShownRef.current = false
      setSpec(null)
      await fetch(`/api/trials/${tid}/start`, { method: "POST" })
      await trackEvent({
        participantId: pid,
        trialId: tid,
        eventType: "trial_started",
        payload: {
          condition: trialNow.condition,
          scenarioId: trialNow.scenarioId,
          scenarioVariant: isScenarioId(trialNow.scenarioId)
            ? getScenarioVariantForCondition(
                pid,
                trialNow.scenarioId,
                trialNow.condition
              )
            : undefined,
        },
      })
      await trackEvent({
        participantId: pid,
        trialId: tid,
        eventType: "trial_viewed",
      })

      if (
        trialNow.condition === "ephemeral" &&
        debugSettings.supportOnTrialStart
      ) {
        void fetchSupport(pid, tid, trialNow.scenarioId, "initial")
      } else if (trialNow.condition !== "ephemeral") {
        setSpec(null)
      }
    })()
  }, [
    fetchSupport,
    state?.participantId,
    state?.step,
    state?.trial?.condition,
    state?.trial?.id,
    state?.trial?.scenarioId,
    debugSettings.supportOnTrialStart,
  ])

  React.useEffect(() => {
    const trialNow = state?.trial
    if (!trialNow || state?.step !== "study") return
    if (trialNow.condition !== "ephemeral") return
    const ms = debugSettings.hesitationMs
    if (ms <= 0) return
    const pid = state.participantId
    const tid = trialNow.id
    const scenarioId = trialNow.scenarioId
    const t = window.setTimeout(() => {
      void trackEvent({
        participantId: pid,
        trialId: tid,
        eventType: "support_triggered",
        payload: { reason: "hesitation" },
      })
      void fetchSupport(pid, tid, scenarioId, "hesitation")
    }, ms)
    return () => window.clearTimeout(t)
  }, [
    fetchSupport,
    state?.participantId,
    state?.step,
    state?.trial?.condition,
    state?.trial?.id,
    state?.trial?.scenarioId,
    debugSettings.hesitationMs,
  ])

  function dismissSupport(
    reason: SupportDismissReason,
    payload: Record<string, unknown> = {}
  ): void {
    if (!trial || !state || !spec) return
    setSpec(null)
    supportLoadedRef.current = false
    void trackEvent({
      participantId: state.participantId,
      trialId: trial.id,
      eventType: "support_dismissed",
      payload: {
        reason,
        scenarioId: trial.scenarioId,
        scenarioVariant,
        ...payload,
      },
    })
    if (reason === "used") {
      void trackEvent({
        participantId: state.participantId,
        trialId: trial.id,
        eventType: "support_used",
        payload: {
          scenarioId: trial.scenarioId,
          scenarioVariant,
          ...payload,
        },
      })
    }
  }

  async function onSelectDashboard(id: string): Promise<void> {
    if (!trial || state?.step !== "study") return
    setSelected(id)
    await trackEvent({
      participantId: state.participantId,
      trialId: trial.id,
      eventType: "answer_selected",
      payload: { selectedAnswer: id },
    })
    dismissSupport("used", {
      scenarioAction: "dashboard_card_selected",
      selectedAnswer: id,
    })
  }

  const onRefinementAnswerChange = React.useCallback((json: string | null) => {
    setRefinementAnswer(json)
  }, [])

  const onPmWorkflowAnswerChange = React.useCallback((json: string | null) => {
    setPmAnswer(json)
  }, [])

  const onLiveOutlineChange = React.useCallback(
    (live: {
      order: string[]
      problemBullets: string[]
      metricsBullets: string[]
      ctaBullets: string[]
    }) => {
      setSlidesLive(live)
    },
    []
  )

  function onSlidesAttemptChange(attempt: SlidesAttemptState): void {
    if (attempt.readyToSubmit && !prevSlidesReadyRef.current) {
      dismissSupport("used", {
        scenarioAction: "slides_attempt_completed",
        hasReordered: attempt.hasReordered,
        hasEditedProblem: attempt.hasEditedProblem,
      })
    }
    prevSlidesReadyRef.current = attempt.readyToSubmit
    setSlidesAttempt(attempt)
  }

  const onPmBoardStateChange = React.useCallback(
    (columns: Record<string, "backlog" | "in_progress">) => {
      setPmBoard(columns)
    },
    []
  )

  async function onExplicitSupportRequest(): Promise<void> {
    if (!trial || state?.step !== "study" || trial.condition !== "ephemeral")
      return
    dismissSupport("superseded", { scenarioAction: "support_refreshed" })
    await trackEvent({
      participantId: state.participantId,
      trialId: trial.id,
      eventType: "support_requested",
      payload: {},
    })
    await trackEvent({
      participantId: state.participantId,
      trialId: trial.id,
      eventType: "support_triggered",
      payload: { reason: "explicit_request" },
    })
    await fetchSupport(
      state.participantId,
      trial.id,
      trial.scenarioId,
      "explicit_request"
    )
  }

  async function onSubmit(): Promise<void> {
    if (!trial || state?.step !== "study") return
    const sid = trial.scenarioId
    const answer =
      sid === "dashboard-priority"
        ? selected
        : sid === "slides-outline-refine"
          ? (refinementAnswer ?? SLIDES_INCOMPLETE_SUBMIT_FALLBACK)
          : sid === "pm-sprint-handoff"
            ? pmAnswer
            : null
    if (!answer) return

    setSubmitting(true)
    try {
      dismissSupport("task_complete", { scenarioAction: "trial_submit" })
      if (trial.condition === "ephemeral" && !supportShownRef.current) {
        await trackEvent({
          participantId: state.participantId,
          trialId: trial.id,
          eventType: "support_ignored",
          payload: {},
        })
      }
      await trackEvent({
        participantId: state.participantId,
        trialId: trial.id,
        eventType: "trial_submitted",
        payload: { answer, scenarioVariant },
      })
      const res = await fetch(`/api/trials/${trial.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answerSubmitted: answer }),
      })
      if (!res.ok) {
        throw new Error("submit failed")
      }
      router.push(`/questionnaire?trialId=${trial.id}`)
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  const editTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastEditSlideRef = React.useRef<string | null>(null)

  function onSlideEdit(slideId: string): void {
    if (!trial || state?.step !== "study") return
    if (lastEditSlideRef.current === slideId && editTimerRef.current) return
    lastEditSlideRef.current = slideId
    if (editTimerRef.current) clearTimeout(editTimerRef.current)
    editTimerRef.current = setTimeout(() => {
      lastEditSlideRef.current = null
      editTimerRef.current = null
    }, 2000)
    void trackEvent({
      participantId: state.participantId,
      trialId: trial.id,
      eventType: "outline_edited",
      payload: { slideId },
    })
  }

  function onSlideReordered(fromIndex: number, toIndex: number): void {
    if (!trial || state?.step !== "study") return
    void trackEvent({
      participantId: state.participantId,
      trialId: trial.id,
      eventType: "slide_reordered",
      payload: { fromIndex, toIndex },
    })
  }

  function onTicketMoved(ticketId: string): void {
    if (!trial || state?.step !== "study") return
    void trackEvent({
      participantId: state.participantId,
      trialId: trial.id,
      eventType: "ticket_moved",
      payload: { ticketId, toColumn: "in_progress" },
    })
    void trackEvent({
      participantId: state.participantId,
      trialId: trial.id,
      eventType: "workflow_step_completed",
      payload: { step: "move_to_in_progress", ticketId },
    })
    dismissSupport("used", {
      scenarioAction: "pm_ticket_moved",
      ticketId,
    })
  }

  function onDismissSupport(): void {
    dismissSupport("explicit", { scenarioAction: "manual_close" })
  }

  function onEphemeralSupportInteraction(
    interaction: EphemeralSupportInteraction
  ): void {
    if (!trial || !state || interaction.kind !== "inspect_expanded") return
    void trackEvent({
      participantId: state.participantId,
      trialId: trial.id,
      eventType: "support_inspect_expanded",
      payload: {},
    })
  }

  function applyLocalEphemeralSpec(s: EphemeralSpec): void {
    if (!trial || !state) return
    setSpec(s)
    supportLoadedRef.current = true
    supportShownRef.current = true
  }

  if (!state || state.step !== "study" || !trial) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  const sid = trial.scenarioId
  const { scenarioVariant, entry, taskState } = scenarioContext
  const taskHeading =
    (trial.condition === "baseline" && entry?.baselineTaskHeading
      ? entry.baselineTaskHeading
      : entry?.taskHeading) ?? "Complete the task using the interface below."
  const preamble = entry?.scenarioPreamble ?? null
  const participantOutcome =
    (trial.condition === "baseline" && entry?.baselineParticipantOutcome
      ? entry.baselineParticipantOutcome
      : entry?.participantOutcome) ?? [
      "Complete the task in the workspace below.",
    ]
  const canSubmit =
    sid === "dashboard-priority"
      ? !!selected
      : sid === "slides-outline-refine"
        ? true
        : sid === "pm-sprint-handoff"
          ? !!pmAnswer
          : false

  const participantChecklistDone = participantChecklistCompletion(
    sid,
    participantOutcome,
    slidesAttempt,
    selected,
    pmAnswer
  )

  const dashboardTaskState =
    taskState?.scenarioId === "dashboard-priority" ? taskState : null
  const slidesTaskState =
    taskState?.scenarioId === "slides-outline-refine" ? taskState : null
  const pmTaskState =
    taskState?.scenarioId === "pm-sprint-handoff" ? taskState : null
  const fallbackVariant = scenarioVariant ?? "a"

  const taskUi = !isScenarioId(sid) ? null : sid === "dashboard-priority" ? (
    <ScenarioDashboard
      taskState={
        (dashboardTaskState ??
          getTaskStateForScenario(sid, fallbackVariant)) as DashboardTaskState
      }
      selectedId={selected}
      onSelect={(id) => void onSelectDashboard(id)}
    />
  ) : sid === "slides-outline-refine" ? (
    <ScenarioSlides
      key={trial.id}
      taskState={
        (slidesTaskState ??
          getTaskStateForScenario(sid, fallbackVariant)) as SlidesTaskState
      }
      initialOrder={SLIDES_START_ORDER}
      trialCondition={trial.condition}
      onAnswerPayloadChange={onRefinementAnswerChange}
      onLiveOutlineChange={onLiveOutlineChange}
      onAttemptStateChange={onSlidesAttemptChange}
      onSlideEdited={onSlideEdit}
      onSlideReordered={onSlideReordered}
    />
  ) : (
    <ScenarioPmSprint
      key={trial.id}
      taskState={
        (pmTaskState ??
          getTaskStateForScenario(sid, fallbackVariant)) as PmSprintTaskState
      }
      onWorkflowAnswerChange={onPmWorkflowAnswerChange}
      onBoardStateChange={onPmBoardStateChange}
      onTicketMoved={onTicketMoved}
    />
  )

  const targetStressBand =
    supportDebugEnabled && debugSettings.skinAllowlistedTargets
      ? ephemeralStressBand(debugSettings.visualStress)
      : "0"

  const chromaDeg = supportDebugEnabled
    ? normalizeHueDegrees(debugSettings.chromaticShiftDegrees)
    : 0
  const targetChromatic =
    supportDebugEnabled &&
    debugSettings.chromaticOnSkinnedTargets &&
    debugSettings.skinAllowlistedTargets &&
    targetStressBand !== "0" &&
    chromaDeg !== 0

  return (
    <>
      <StudyProgressBar progress={state.progress} />
      <div className="relative mx-auto max-w-5xl px-6 pt-6 pb-24">
        {supportDebugEnabled ? (
          <EphemeralDebugPanel
            settings={debugSettings}
            onSettingsChange={setDebugSettings}
            supportLog={supportDebug}
            scenarioId={isScenarioId(sid) ? sid : null}
            condition={trial.condition}
            onApplyLocalSpec={applyLocalEphemeralSpec}
            onDismissSpec={onDismissSupport}
            onFireSupport={() => void onExplicitSupportRequest()}
            hasActiveSpec={!!spec}
          />
        ) : null}
        <EphemeralLayer
          spec={spec}
          onDismiss={onDismissSupport}
          onSupportInteraction={onEphemeralSupportInteraction}
          visualStress={supportDebugEnabled ? debugSettings.visualStress : 0}
          chromaticShiftDegrees={
            supportDebugEnabled ? debugSettings.chromaticShiftDegrees : 0
          }
        />

        <div className="mb-8 space-y-4">
          {state.baselineIsVersionA != null ? (
            <Badge
              variant={trial.condition === "ephemeral" ? "default" : "secondary"}
              className="h-7 gap-1.5 px-3 text-sm"
            >
              Version{" "}
              {interfaceVersionLetter(
                state.baselineIsVersionA,
                trial.condition
              )}
              {" — "}
              {trial.condition === "ephemeral"
                ? "with assistance"
                : "without assistance"}
            </Badge>
          ) : null}

          <Card>
            <CardHeader>
              <CardDescription>
                {trial.condition === "ephemeral"
                  ? "On-screen help may appear after a moment. You can close it any time."
                  : "No extra on-screen help — just the normal interface."}
              </CardDescription>
            </CardHeader>

            {preamble ? (
              <CardContent>
                <CardTitle className="mb-2">Situation</CardTitle>
                <CardDescription className="leading-relaxed">
                  {preamble}
                </CardDescription>
              </CardContent>
            ) : null}

            <CardContent>
              <CardTitle className="mb-2">Your task</CardTitle>
              <p className="text-sm font-semibold leading-relaxed text-foreground">
                {taskHeading}
              </p>
            </CardContent>

            <CardContent>
              <CardTitle className="mb-3">Steps to complete</CardTitle>
              <ul className="space-y-3">
                {participantOutcome.map((line, i) => (
                  <li key={`${line}-${i}`} className="flex gap-3">
                    <span
                      className={cn(
                        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold transition-colors",
                        participantChecklistDone[i]
                          ? "bg-emerald-600 text-white"
                          : "bg-muted text-muted-foreground/60 ring-1 ring-border"
                      )}
                      aria-hidden
                    >
                      {participantChecklistDone[i] ? "✓" : i + 1}
                    </span>
                    <span
                      className={cn(
                        "min-w-0 flex-1 pt-0.5 text-sm leading-relaxed text-muted-foreground",
                        participantChecklistDone[i] &&
                          "text-foreground line-through decoration-muted-foreground/30"
                      )}
                    >
                      {line}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>

            {trial.condition === "ephemeral" && loadingSupport ? (
              <CardFooter>
                <p className="text-xs text-muted-foreground">
                  Preparing help…
                </p>
              </CardFooter>
            ) : null}
          </Card>
        </div>

        <div
          className={cn(
            supportDebugEnabled &&
              debugSettings.skinAllowlistedTargets &&
              targetStressBand !== "0" &&
              "ephemeral-target-skin",
            targetChromatic && "ephemeral-target-chromatic"
          )}
          data-target-stress={
            targetStressBand !== "0" ? targetStressBand : undefined
          }
          style={
            targetChromatic
              ? ({ "--e-hue": `${chromaDeg}deg` } as CSSProperties)
              : undefined
          }
        >
          {taskUi}
        </div>

        <div className="fixed right-0 bottom-0 left-0 border-t border-border bg-background/95 p-4 backdrop-blur">
          <div className="mx-auto flex max-w-5xl justify-end gap-2 px-6">
            <Button
              disabled={!canSubmit || submitting}
              onClick={() => void onSubmit()}
            >
              {submitting ? "Submitting…" : "Submit"}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
