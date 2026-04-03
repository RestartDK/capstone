"use client"

import * as React from "react"
import type { CSSProperties } from "react"

import type { EphemeralDebugLog } from "@/components/ephemeral/EphemeralDebugPanel"
import { EphemeralDebugPanel } from "@/components/ephemeral/EphemeralDebugPanel"
import { EphemeralLayer } from "@/components/ephemeral/EphemeralLayer"
import { ScenarioDashboard } from "@/components/study/ScenarioDashboard"
import { ScenarioPmSprint } from "@/components/study/ScenarioPmSprint"
import { ScenarioSlides } from "@/components/study/ScenarioSlides"
import type { SlidesAttemptState } from "@/components/study/ScenarioSlides"
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
import { getTaskStateForScenario } from "@/lib/task-state"
import { SCENARIO_IDS, type ScenarioId } from "@/lib/scenarios/ids"
import { getScenarioEntry, SLIDES_START_ORDER } from "@/lib/scenarios/registry"
import { cn } from "@/lib/utils"

const PLAYGROUND_TRIAL_LOG_ID = "playground"
const INITIAL_SLIDES_ATTEMPT: SlidesAttemptState = {
  hasReordered: false,
  hasEditedProblem: false,
  readyToSubmit: false,
}

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

const supportDebugEnv =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_DEBUG_SUPPORT === "1"

export function PlaygroundClient(): React.ReactElement {
  const [scenarioId, setScenarioId] = React.useState<ScenarioId>(
    SCENARIO_IDS[0]
  )
  const [selected, setSelected] = React.useState<string | null>(null)
  const [, setSlidesAttempt] = React.useState<SlidesAttemptState>(
    INITIAL_SLIDES_ATTEMPT
  )
  const [slidesLive, setSlidesLive] = React.useState<{
    order: string[]
    problemBullets: string[]
  } | null>(null)
  const [pmBoard, setPmBoard] = React.useState<Record<
    string,
    "backlog" | "in_progress"
  > | null>(null)
  const [spec, setSpec] = React.useState<EphemeralSpec | null>(null)
  const [loadingSupport, setLoadingSupport] = React.useState(false)
  const [supportDebug, setSupportDebug] =
    React.useState<EphemeralDebugLog>(null)
  const [debugSettings, setDebugSettings] =
    React.useState<EphemeralDebugSettings>(() => loadEphemeralDebugSettings())
  const supportLoadedRef = React.useRef(false)
  const supportShownRef = React.useRef(false)
  const prevScenarioRef = React.useRef<ScenarioId | undefined>(undefined)
  const bootRef = React.useRef<string | null>(null)
  const prevSlidesReadyRef = React.useRef(false)

  React.useEffect(() => {
    saveEphemeralDebugSettings(debugSettings)
  }, [debugSettings])

  const fetchSupport = React.useCallback(
    async (sid: ScenarioId, trigger: SupportTrigger) => {
      if (supportLoadedRef.current && trigger !== "explicit_request") {
        const skip: NonNullable<EphemeralDebugLog> = {
          at: new Date().toISOString(),
          trialId: PLAYGROUND_TRIAL_LOG_ID,
          trigger,
          phase: "skipped_already_loaded",
          detail:
            "Automatic support was already loaded for this scenario. Clear the overlay to reset, or use Fetch support (explicit) to refresh with current UI state.",
        }
        setSupportDebug(skip)
        console.warn("[playground/support]", skip)
        return
      }
      const participantSnapshot = buildParticipantTaskSnapshotPayload(sid, {
        selectedCardId: selected,
        slidesLive,
        pmTicketColumns: pmBoard,
      })
      supportLoadedRef.current = true
      setSupportDebug({
        at: new Date().toISOString(),
        trialId: PLAYGROUND_TRIAL_LOG_ID,
        trigger,
        phase: "start",
      })
      setLoadingSupport(true)
      try {
        const res = await fetch("/api/playground/support", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scenarioId: sid,
            trigger,
            ...(participantSnapshot ? { participantSnapshot } : {}),
            ...(supportDebugEnv && debugSettings.forceApiFallback
              ? { debugForceFallback: true }
              : {}),
          }),
        })
        if (res.ok) {
          const data = (await res.json()) as SupportApiResponse
          setSpec(data.spec)
          supportShownRef.current = true
          setSupportDebug({
            at: new Date().toISOString(),
            trialId: PLAYGROUND_TRIAL_LOG_ID,
            trigger,
            phase: "success",
            httpStatus: res.status,
            detail: `usedFallback=${String(data.meta.usedFallback)} model=${data.meta.modelName} types=${data.meta.componentTypes.join(",")}`,
          })
        } else {
          supportLoadedRef.current = false
          const text = await res.text().catch(() => "")
          setSupportDebug({
            at: new Date().toISOString(),
            trialId: PLAYGROUND_TRIAL_LOG_ID,
            trigger,
            phase: "http_error",
            httpStatus: res.status,
            detail: text.slice(0, 400) || res.statusText,
          })
        }
      } catch (e) {
        supportLoadedRef.current = false
        setSupportDebug({
          at: new Date().toISOString(),
          trialId: PLAYGROUND_TRIAL_LOG_ID,
          trigger,
          phase: "network_error",
          detail: e instanceof Error ? e.message : String(e),
        })
      } finally {
        setLoadingSupport(false)
      }
    },
    [debugSettings.forceApiFallback, selected, slidesLive, pmBoard]
  )

  React.useEffect(() => {
    if (prevScenarioRef.current === scenarioId) return
    prevScenarioRef.current = scenarioId
    setSelected(null)
    setSlidesAttempt(INITIAL_SLIDES_ATTEMPT)
    setSlidesLive(null)
    setPmBoard(null)
    setSpec(null)
    supportLoadedRef.current = false
    supportShownRef.current = false
    bootRef.current = null
    prevSlidesReadyRef.current = false
  }, [scenarioId])

  React.useEffect(() => {
    if (bootRef.current === scenarioId) return
    bootRef.current = scenarioId
    supportLoadedRef.current = false
    supportShownRef.current = false
    setSpec(null)
    if (debugSettings.supportOnTrialStart) {
      void fetchSupport(scenarioId, "initial")
    }
  }, [scenarioId, debugSettings.supportOnTrialStart, fetchSupport])

  React.useEffect(() => {
    const ms = debugSettings.hesitationMs
    if (ms <= 0) return
    const t = window.setTimeout(() => {
      void fetchSupport(scenarioId, "hesitation")
    }, ms)
    return () => window.clearTimeout(t)
  }, [scenarioId, debugSettings.hesitationMs, fetchSupport])

  function onFireSupport(): void {
    onDismissSupport()
    void fetchSupport(scenarioId, "explicit_request")
  }

  function onDismissSupport(): void {
    setSpec(null)
    supportLoadedRef.current = false
  }

  function onEphemeralSupportInteraction(
    interaction: EphemeralSupportInteraction
  ): void {
    void interaction
  }

  function applyLocalEphemeralSpec(s: EphemeralSpec): void {
    setSpec(s)
    supportLoadedRef.current = true
    supportShownRef.current = true
  }

  const entry = React.useMemo(() => getScenarioEntry(scenarioId), [scenarioId])
  const taskState = React.useMemo(
    () => getTaskStateForScenario(scenarioId),
    [scenarioId]
  )
  const taskHeading = entry?.taskHeading ?? scenarioId
  const preamble = entry?.scenarioPreamble ?? null
  const participantOutcome = entry?.participantOutcome ?? [
    "Complete the task in the workspace below.",
  ]

  const onRefinementAnswerChange = React.useCallback(() => {}, [])

  const onPmWorkflowAnswerChange = React.useCallback(() => {}, [])

  const onLiveOutlineChange = React.useCallback(
    (live: { order: string[]; problemBullets: string[] }) => {
      setSlidesLive(live)
    },
    []
  )

  const onPmBoardStateChange = React.useCallback(
    (columns: Record<string, "backlog" | "in_progress">) => {
      setPmBoard(columns)
    },
    []
  )

  function onSlidesAttemptChange(attempt: SlidesAttemptState): void {
    if (attempt.readyToSubmit && !prevSlidesReadyRef.current) {
      onDismissSupport()
    }
    prevSlidesReadyRef.current = attempt.readyToSubmit
    setSlidesAttempt(attempt)
  }

  function onSelectDashboard(id: string): void {
    setSelected(id)
    onDismissSupport()
  }

  function onTicketMoved(): void {
    onDismissSupport()
  }

  const taskUi =
    scenarioId === "dashboard-priority" ? (
      <ScenarioDashboard
        taskState={taskState as never}
        selectedId={selected}
        onSelect={onSelectDashboard}
      />
    ) : scenarioId === "slides-outline-refine" ? (
      <ScenarioSlides
        key={scenarioId}
        taskState={taskState as never}
        initialOrder={SLIDES_START_ORDER}
        onAnswerPayloadChange={onRefinementAnswerChange}
        onLiveOutlineChange={onLiveOutlineChange}
        onAttemptStateChange={onSlidesAttemptChange}
        onSlideEdited={() => void 0}
        onSlideReordered={() => void 0}
      />
    ) : (
      <ScenarioPmSprint
        key={scenarioId}
        taskState={taskState as never}
        onWorkflowAnswerChange={onPmWorkflowAnswerChange}
        onBoardStateChange={onPmBoardStateChange}
        onTicketMoved={onTicketMoved}
      />
    )

  const targetStressBand = debugSettings.skinAllowlistedTargets
    ? ephemeralStressBand(debugSettings.visualStress)
    : "0"

  const chromaDeg = normalizeHueDegrees(debugSettings.chromaticShiftDegrees)
  const targetChromatic =
    debugSettings.chromaticOnSkinnedTargets &&
    debugSettings.skinAllowlistedTargets &&
    targetStressBand !== "0" &&
    chromaDeg !== 0

  return (
    <>
      <div className="border-b border-border bg-background/95 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Development only
            </p>
            <h1 className="text-base font-semibold text-foreground">
              Ephemeral playground
            </h1>
            <p className="mt-1 max-w-prose text-xs text-muted-foreground">
              Switch scenarios and use the debug panel (presets, JSON, stress)
              without going through the study flow. Not available in production
              builds.
            </p>
          </div>
          <label className="flex min-w-[min(100%,280px)] flex-col gap-1">
            <span className="text-xs text-muted-foreground">Scenario</span>
            <select
              className="rounded-md border border-input bg-background px-2 py-2 text-sm"
              value={scenarioId}
              onChange={(e) => setScenarioId(e.target.value as ScenarioId)}
            >
              {SCENARIO_IDS.map((id) => {
                const e = getScenarioEntry(id)
                const label = e?.taskHeading ?? id
                const short =
                  label.length > 72 ? `${label.slice(0, 69)}…` : label
                return (
                  <option key={id} value={id}>
                    {id} — {short}
                  </option>
                )
              })}
            </select>
          </label>
        </div>
        <div className="mx-auto mt-3 w-full max-w-5xl rounded-md border border-border bg-muted/25 px-3 py-2.5">
          <p className="mb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Automatic support API (same as Debug → Timing &amp; API)
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex flex-wrap items-center gap-2 text-xs text-foreground">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={debugSettings.hesitationMs > 0}
                  onChange={(e) => {
                    setDebugSettings((prev) => ({
                      ...prev,
                      hesitationMs: e.target.checked
                        ? prev.hesitationMs > 0
                          ? prev.hesitationMs
                          : DEFAULT_EPHEMERAL_DEBUG_SETTINGS.hesitationMs
                        : 0,
                    }))
                  }}
                />
                <span>Hesitation timer</span>
              </label>
              <label className="flex items-center gap-1.5 text-muted-foreground">
                <span className="sr-only">Delay in milliseconds</span>
                <input
                  type="number"
                  min={500}
                  max={600_000}
                  step={500}
                  disabled={debugSettings.hesitationMs <= 0}
                  aria-label="Hesitation delay in milliseconds"
                  className="w-[5.5rem] rounded border border-input bg-background px-1.5 py-0.5 text-xs text-foreground tabular-nums disabled:cursor-not-allowed disabled:opacity-50"
                  value={
                    debugSettings.hesitationMs <= 0
                      ? ""
                      : debugSettings.hesitationMs
                  }
                  placeholder={String(
                    DEFAULT_EPHEMERAL_DEBUG_SETTINGS.hesitationMs
                  )}
                  onChange={(e) => {
                    const n = Number(e.target.value)
                    if (!Number.isFinite(n)) return
                    setDebugSettings((prev) => ({
                      ...prev,
                      hesitationMs:
                        n <= 0
                          ? 0
                          : Math.min(600_000, Math.max(500, Math.round(n))),
                    }))
                  }}
                />
                <span>ms</span>
              </label>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-foreground">
              <input
                type="checkbox"
                className="accent-primary"
                checked={debugSettings.supportOnTrialStart}
                onChange={(e) =>
                  setDebugSettings((prev) => ({
                    ...prev,
                    supportOnTrialStart: e.target.checked,
                  }))
                }
              />
              <span>Fetch on scenario open (&quot;initial&quot;)</span>
            </label>
            <button
              type="button"
              className="text-xs font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
              onClick={() =>
                setDebugSettings((prev) => ({
                  ...prev,
                  hesitationMs: DEFAULT_EPHEMERAL_DEBUG_SETTINGS.hesitationMs,
                  supportOnTrialStart:
                    DEFAULT_EPHEMERAL_DEBUG_SETTINGS.supportOnTrialStart,
                }))
              }
            >
              Match study defaults (14s hesitation, no initial)
            </button>
          </div>
          <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
            Turn these on to reproduce /study ephemeral timing without opening
            the bug button. Values persist in session storage with the rest of
            the debug settings.
          </p>
        </div>
      </div>

      <EphemeralDebugPanel
        settings={debugSettings}
        onSettingsChange={setDebugSettings}
        supportLog={supportDebug}
        scenarioId={scenarioId}
        condition="ephemeral"
        onApplyLocalSpec={applyLocalEphemeralSpec}
        onDismissSpec={onDismissSupport}
        onFireSupport={onFireSupport}
        hasActiveSpec={!!spec}
      />

      <EphemeralLayer
        spec={spec}
        onDismiss={onDismissSupport}
        onSupportInteraction={onEphemeralSupportInteraction}
        visualStress={debugSettings.visualStress}
        chromaticShiftDegrees={debugSettings.chromaticShiftDegrees}
      />

      <div className="relative mx-auto max-w-5xl px-6 pt-6 pb-20">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground tabular-nums">
            Preview · {scenarioId}
          </p>
          {!spec && !loadingSupport ? (
            <button
              type="button"
              className="rounded-md border border-input bg-background px-2 py-1 text-xs font-medium hover:bg-muted"
              onClick={onFireSupport}
            >
              Fetch support (API)
            </button>
          ) : loadingSupport ? (
            <p className="text-xs text-muted-foreground">Loading support…</p>
          ) : null}
        </div>

        {preamble ? (
          <p className="mb-4 max-w-prose text-sm leading-relaxed text-muted-foreground">
            {preamble}
          </p>
        ) : null}

        <h2 className="mb-2 max-w-prose text-base leading-snug font-semibold text-foreground">
          {taskHeading}
        </h2>
        <p className="mb-6 text-xs text-muted-foreground">
          Same task surfaces as the study; assistance is always treated as
          ephemeral here.
        </p>

        <ul className="mb-4 space-y-1 text-xs text-muted-foreground">
          {participantOutcome.map((line, i) => (
            <li key={line} className="flex items-start gap-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                {i + 1}
              </span>
              <span className="pt-px">{line}</span>
            </li>
          ))}
        </ul>

        <div
          className={cn(
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
      </div>
    </>
  )
}
