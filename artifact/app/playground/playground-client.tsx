"use client";

import * as React from "react";
import type { CSSProperties } from "react";

import type { EphemeralDebugLog } from "@/components/ephemeral/EphemeralDebugPanel";
import { EphemeralDebugPanel } from "@/components/ephemeral/EphemeralDebugPanel";
import { EphemeralLayer } from "@/components/ephemeral/EphemeralLayer";
import { ScenarioDashboard } from "@/components/study/ScenarioDashboard";
import { ScenarioPmSprint } from "@/components/study/ScenarioPmSprint";
import { ScenarioSlides } from "@/components/study/ScenarioSlides";
import {
  ephemeralStressBand,
  loadEphemeralDebugSettings,
  normalizeHueDegrees,
  saveEphemeralDebugSettings,
  type EphemeralDebugSettings,
} from "@/lib/ephemeral/debug-settings";
import type { EphemeralSpec, EphemeralSupportInteraction } from "@/lib/ephemeral/spec";
import { SCENARIO_IDS, type ScenarioId } from "@/lib/scenarios/ids";
import { getScenarioEntry, SLIDES_START_ORDER } from "@/lib/scenarios/registry";
import { cn } from "@/lib/utils";

const PLAYGROUND_TRIAL_LOG_ID = "playground";

type SupportTrigger = "initial" | "hesitation" | "explicit_request";

type SupportApiResponse = {
  spec: EphemeralSpec;
  meta: {
    usedFallback: boolean;
    modelName: string;
    catalogVersion: string;
    componentTypes: string[];
    trigger: string;
  };
};

const supportDebugEnv =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_DEBUG_SUPPORT === "1";

export function PlaygroundClient(): React.ReactElement {
  const [scenarioId, setScenarioId] = React.useState<ScenarioId>(SCENARIO_IDS[0]);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [refinementAnswer, setRefinementAnswer] = React.useState<string | null>(null);
  const [pmAnswer, setPmAnswer] = React.useState<string | null>(null);
  const [spec, setSpec] = React.useState<EphemeralSpec | null>(null);
  const [loadingSupport, setLoadingSupport] = React.useState(false);
  const [supportDebug, setSupportDebug] = React.useState<EphemeralDebugLog>(null);
  const [debugSettings, setDebugSettings] = React.useState<EphemeralDebugSettings>(() =>
    loadEphemeralDebugSettings(),
  );
  const supportLoadedRef = React.useRef(false);
  const supportShownRef = React.useRef(false);
  const prevScenarioRef = React.useRef<ScenarioId | undefined>(undefined);
  const bootRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    saveEphemeralDebugSettings(debugSettings);
  }, [debugSettings]);

  const fetchSupport = React.useCallback(
    async (sid: ScenarioId, trigger: SupportTrigger) => {
      if (supportLoadedRef.current) {
        const skip: NonNullable<EphemeralDebugLog> = {
          at: new Date().toISOString(),
          trialId: PLAYGROUND_TRIAL_LOG_ID,
          trigger,
          phase: "skipped_already_loaded",
          detail:
            "Support was already loaded for this scenario. Clear the overlay to fetch again.",
        };
        setSupportDebug(skip);
        console.warn("[playground/support]", skip);
        return;
      }
      supportLoadedRef.current = true;
      setSupportDebug({
        at: new Date().toISOString(),
        trialId: PLAYGROUND_TRIAL_LOG_ID,
        trigger,
        phase: "start",
      });
      setLoadingSupport(true);
      try {
        const res = await fetch("/api/playground/support", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scenarioId: sid,
            trigger,
            ...(supportDebugEnv && debugSettings.forceApiFallback
              ? { debugForceFallback: true }
              : {}),
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as SupportApiResponse;
          setSpec(data.spec);
          supportShownRef.current = true;
          setSupportDebug({
            at: new Date().toISOString(),
            trialId: PLAYGROUND_TRIAL_LOG_ID,
            trigger,
            phase: "success",
            httpStatus: res.status,
            detail: `usedFallback=${String(data.meta.usedFallback)} model=${data.meta.modelName} types=${data.meta.componentTypes.join(",")}`,
          });
        } else {
          supportLoadedRef.current = false;
          const text = await res.text().catch(() => "");
          setSupportDebug({
            at: new Date().toISOString(),
            trialId: PLAYGROUND_TRIAL_LOG_ID,
            trigger,
            phase: "http_error",
            httpStatus: res.status,
            detail: text.slice(0, 400) || res.statusText,
          });
        }
      } catch (e) {
        supportLoadedRef.current = false;
        setSupportDebug({
          at: new Date().toISOString(),
          trialId: PLAYGROUND_TRIAL_LOG_ID,
          trigger,
          phase: "network_error",
          detail: e instanceof Error ? e.message : String(e),
        });
      } finally {
        setLoadingSupport(false);
      }
    },
    [debugSettings.forceApiFallback],
  );

  React.useEffect(() => {
    if (prevScenarioRef.current === scenarioId) return;
    prevScenarioRef.current = scenarioId;
    setSelected(null);
    setRefinementAnswer(null);
    setPmAnswer(null);
    setSpec(null);
    supportLoadedRef.current = false;
    supportShownRef.current = false;
    bootRef.current = null;
  }, [scenarioId]);

  React.useEffect(() => {
    if (bootRef.current === scenarioId) return;
    bootRef.current = scenarioId;
    supportLoadedRef.current = false;
    supportShownRef.current = false;
    setSpec(null);
    if (debugSettings.supportOnTrialStart) {
      void fetchSupport(scenarioId, "initial");
    }
  }, [scenarioId, debugSettings.supportOnTrialStart, fetchSupport]);

  React.useEffect(() => {
    const ms = debugSettings.hesitationMs;
    if (ms <= 0) return;
    const t = window.setTimeout(() => {
      void fetchSupport(scenarioId, "hesitation");
    }, ms);
    return () => window.clearTimeout(t);
  }, [scenarioId, debugSettings.hesitationMs, fetchSupport]);

  function onFireSupport(): void {
    void fetchSupport(scenarioId, "explicit_request");
  }

  function onDismissSupport(): void {
    setSpec(null);
    supportLoadedRef.current = false;
  }

  function onEphemeralSupportInteraction(_interaction: EphemeralSupportInteraction): void {
    /* no study analytics in playground */
  }

  function applyLocalEphemeralSpec(s: EphemeralSpec): void {
    setSpec(s);
    supportLoadedRef.current = true;
    supportShownRef.current = true;
  }

  const entry = getScenarioEntry(scenarioId);
  const taskHeading = entry?.taskHeading ?? scenarioId;
  const preamble = entry?.scenarioPreamble ?? null;
  const participantOutcome = entry?.participantOutcome ?? ["Interact with the prototype."];

  const onRefinementAnswerChange = React.useCallback((json: string | null) => {
    setRefinementAnswer(json);
  }, []);

  const onPmWorkflowAnswerChange = React.useCallback((json: string | null) => {
    setPmAnswer(json);
  }, []);

  const taskUi =
    scenarioId === "dashboard-priority" ? (
      <ScenarioDashboard selectedId={selected} onSelect={setSelected} />
    ) : scenarioId === "slides-outline-refine" ? (
      <ScenarioSlides
        key={scenarioId}
        initialOrder={SLIDES_START_ORDER}
        onAnswerPayloadChange={onRefinementAnswerChange}
        onSlideEdited={() => void 0}
        onSlideReordered={() => void 0}
      />
    ) : (
      <ScenarioPmSprint
        key={scenarioId}
        onWorkflowAnswerChange={onPmWorkflowAnswerChange}
        onTicketMoved={() => void 0}
      />
    );

  const targetStressBand = debugSettings.skinAllowlistedTargets
    ? ephemeralStressBand(debugSettings.visualStress)
    : "0";

  const chromaDeg = normalizeHueDegrees(debugSettings.chromaticShiftDegrees);
  const targetChromatic =
    debugSettings.chromaticOnSkinnedTargets &&
    debugSettings.skinAllowlistedTargets &&
    targetStressBand !== "0" &&
    chromaDeg !== 0;

  return (
    <>
      <div className="border-b border-border bg-background/95 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Development only
            </p>
            <h1 className="text-base font-semibold text-foreground">Ephemeral playground</h1>
            <p className="mt-1 max-w-prose text-xs text-muted-foreground">
              Switch scenarios and use the debug panel (presets, JSON, stress) without going through
              the study flow. Not available in production builds.
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
                const e = getScenarioEntry(id);
                const label = e?.taskHeading ?? id;
                const short = label.length > 72 ? `${label.slice(0, 69)}…` : label;
                return (
                  <option key={id} value={id}>
                    {id} — {short}
                  </option>
                );
              })}
            </select>
          </label>
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

      <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs tabular-nums text-muted-foreground">
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
          <p className="mb-4 max-w-prose text-sm leading-relaxed text-muted-foreground">{preamble}</p>
        ) : null}

        <h2 className="mb-2 max-w-prose text-base font-semibold leading-snug text-foreground">
          {taskHeading}
        </h2>
        <p className="mb-6 text-xs text-muted-foreground">
          Same task surfaces as the study; assistance is always treated as ephemeral here.
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
            targetChromatic && "ephemeral-target-chromatic",
          )}
          data-target-stress={targetStressBand !== "0" ? targetStressBand : undefined}
          style={
            targetChromatic ? ({ "--e-hue": `${chromaDeg}deg` } as CSSProperties) : undefined
          }
        >
          {taskUi}
        </div>
      </div>
    </>
  );
}
