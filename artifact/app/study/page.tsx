"use client";

import * as React from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";

import { EphemeralDebugPanel } from "@/components/ephemeral/EphemeralDebugPanel";
import { EphemeralLayer } from "@/components/ephemeral/EphemeralLayer";
import { ScenarioDashboard } from "@/components/study/ScenarioDashboard";
import { ScenarioPmSprint } from "@/components/study/ScenarioPmSprint";
import { ScenarioSlides } from "@/components/study/ScenarioSlides";
import { StudyProgressBar } from "@/components/study/StudyProgressBar";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_EPHEMERAL_DEBUG_SETTINGS,
  ephemeralStressBand,
  loadEphemeralDebugSettings,
  normalizeHueDegrees,
  saveEphemeralDebugSettings,
  type EphemeralDebugSettings,
} from "@/lib/ephemeral/debug-settings";
import type { EphemeralSpec, EphemeralSupportInteraction } from "@/lib/ephemeral/spec";
import { cn } from "@/lib/utils";
import { SLIDES_START_ORDER, getScenarioEntry } from "@/lib/scenarios/registry";
import { isScenarioId } from "@/lib/scenarios/ids";
import { pathForStudyStep } from "@/lib/study-routes";
import type { StudyStateResponse } from "@/lib/study";
import { trackEvent } from "@/lib/track";

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

const supportDebugEnabled =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_DEBUG_SUPPORT === "1";

type SupportDebugInfo = {
  at: string;
  trialId: string;
  trigger: string;
  phase: "start" | "success" | "http_error" | "network_error" | "skipped_already_loaded";
  httpStatus?: number;
  detail?: string;
};

export default function StudyPage(): React.ReactElement {
  const router = useRouter();
  const [state, setState] = React.useState<StudyStateResponse | null>(null);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [refinementAnswer, setRefinementAnswer] = React.useState<string | null>(null);
  const [pmAnswer, setPmAnswer] = React.useState<string | null>(null);
  const [spec, setSpec] = React.useState<EphemeralSpec | null>(null);
  const [loadingSupport, setLoadingSupport] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [supportDebug, setSupportDebug] = React.useState<SupportDebugInfo | null>(null);
  const [debugSettings, setDebugSettings] = React.useState<EphemeralDebugSettings>(() =>
    supportDebugEnabled ? loadEphemeralDebugSettings() : DEFAULT_EPHEMERAL_DEBUG_SETTINGS,
  );
  const startedRef = React.useRef<string | null>(null);
  const supportLoadedRef = React.useRef(false);
  const supportShownRef = React.useRef(false);
  const prevTrialIdForResetRef = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    if (!supportDebugEnabled) return;
    saveEphemeralDebugSettings(debugSettings);
  }, [debugSettings]);

  const loadState = React.useCallback(async () => {
    const res = await fetch("/api/study/state");
    if (res.status === 401) {
      router.replace("/consent");
      return null;
    }
    return (await res.json()) as StudyStateResponse;
  }, [router]);

  React.useEffect(() => {
    void (async () => {
      const s = await loadState();
      if (!s) return;
      setState(s);
      if (s.step !== "study") {
        router.replace(pathForStudyStep(s));
      }
    })();
  }, [loadState, router]);

  const trial = state?.trial;

  const fetchSupport = React.useCallback(
    async (participantId: string, trialId: string, scenarioId: string, trigger: SupportTrigger) => {
      if (supportLoadedRef.current) {
        const skip: SupportDebugInfo = {
          at: new Date().toISOString(),
          trialId,
          trigger,
          phase: "skipped_already_loaded",
          detail:
            "Support was already requested for this trial (or a fetch is in flight). Dismiss assistance to request again.",
        };
        if (supportDebugEnabled) {
          setSupportDebug(skip);
          console.warn("[support]", skip);
        }
        return;
      }
      supportLoadedRef.current = true;
      const started: SupportDebugInfo = {
        at: new Date().toISOString(),
        trialId,
        trigger,
        phase: "start",
      };
      if (supportDebugEnabled) {
        setSupportDebug(started);
        console.info("[support] POST /api/support", { trialId, scenarioId, trigger });
      }
      setLoadingSupport(true);
      try {
        const res = await fetch("/api/support", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participantId,
            trialId,
            scenarioId,
            trigger,
            ...(supportDebugEnabled && debugSettings.forceApiFallback
              ? { debugForceFallback: true }
              : {}),
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as SupportApiResponse;
          setSpec(data.spec);
          supportShownRef.current = true;
          if (supportDebugEnabled) {
            const okInfo: SupportDebugInfo = {
              at: new Date().toISOString(),
              trialId,
              trigger,
              phase: "success",
              httpStatus: res.status,
              detail: `usedFallback=${String(data.meta.usedFallback)} model=${data.meta.modelName} types=${data.meta.componentTypes.join(",")}`,
            };
            setSupportDebug(okInfo);
            console.info("[support] spec applied", data.meta, data.spec);
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
          });
        } else {
          supportLoadedRef.current = false;
          const text = await res.text().catch(() => "");
          const errInfo: SupportDebugInfo = {
            at: new Date().toISOString(),
            trialId,
            trigger,
            phase: "http_error",
            httpStatus: res.status,
            detail: text.slice(0, 400) || res.statusText,
          };
          if (supportDebugEnabled) {
            setSupportDebug(errInfo);
          }
          console.error("[support] /api/support failed", res.status, text);
        }
      } catch (e) {
        supportLoadedRef.current = false;
        const errInfo: SupportDebugInfo = {
          at: new Date().toISOString(),
          trialId,
          trigger,
          phase: "network_error",
          detail: e instanceof Error ? e.message : String(e),
        };
        if (supportDebugEnabled) {
          setSupportDebug(errInfo);
        }
        console.error("[support] fetch error", e);
      } finally {
        setLoadingSupport(false);
      }
    },
    [debugSettings.forceApiFallback],
  );

  React.useEffect(() => {
    const tid = state?.trial?.id;
    if (!tid) return;
    if (tid === prevTrialIdForResetRef.current) return;
    prevTrialIdForResetRef.current = tid;
    startedRef.current = null;
    setSelected(null);
    setRefinementAnswer(null);
    setPmAnswer(null);
    setSpec(null);
    supportLoadedRef.current = false;
    supportShownRef.current = false;
  }, [state?.trial?.id]);

  React.useEffect(() => {
    const trialNow = state?.trial;
    if (!trialNow || state?.step !== "study") return;
    const pid = state.participantId;
    const tid = trialNow.id;

    void (async () => {
      if (startedRef.current === tid) return;
      startedRef.current = tid;
      supportLoadedRef.current = false;
      supportShownRef.current = false;
      setSpec(null);
      await fetch(`/api/trials/${tid}/start`, { method: "POST" });
      await trackEvent({
        participantId: pid,
        trialId: tid,
        eventType: "trial_started",
        payload: { condition: trialNow.condition, scenarioId: trialNow.scenarioId },
      });
      await trackEvent({
        participantId: pid,
        trialId: tid,
        eventType: "trial_viewed",
      });

      if (trialNow.condition === "ephemeral" && debugSettings.supportOnTrialStart) {
        void fetchSupport(pid, tid, trialNow.scenarioId, "initial");
      } else if (trialNow.condition !== "ephemeral") {
        setSpec(null);
      }
    })();
  }, [
    fetchSupport,
    state?.participantId,
    state?.step,
    state?.trial?.condition,
    state?.trial?.id,
    state?.trial?.scenarioId,
    debugSettings.supportOnTrialStart,
  ]);

  React.useEffect(() => {
    const trialNow = state?.trial;
    if (!trialNow || state?.step !== "study") return;
    if (trialNow.condition !== "ephemeral") return;
    const ms = debugSettings.hesitationMs;
    if (ms <= 0) return;
    const pid = state.participantId;
    const tid = trialNow.id;
    const scenarioId = trialNow.scenarioId;
    const t = window.setTimeout(() => {
      void trackEvent({
        participantId: pid,
        trialId: tid,
        eventType: "support_triggered",
        payload: { reason: "hesitation" },
      });
      void fetchSupport(pid, tid, scenarioId, "hesitation");
    }, ms);
    return () => window.clearTimeout(t);
  }, [
    fetchSupport,
    state?.participantId,
    state?.step,
    state?.trial?.condition,
    state?.trial?.id,
    state?.trial?.scenarioId,
    debugSettings.hesitationMs,
  ]);

  async function onSelectDashboard(id: string): Promise<void> {
    if (!trial || state?.step !== "study") return;
    setSelected(id);
    await trackEvent({
      participantId: state.participantId,
      trialId: trial.id,
      eventType: "answer_selected",
      payload: { selectedAnswer: id },
    });
  }

  const onRefinementAnswerChange = React.useCallback((json: string | null) => {
    setRefinementAnswer(json);
  }, []);

  const onPmWorkflowAnswerChange = React.useCallback((json: string | null) => {
    setPmAnswer(json);
  }, []);

  async function onExplicitSupportRequest(): Promise<void> {
    if (!trial || state?.step !== "study" || trial.condition !== "ephemeral") return;
    await trackEvent({
      participantId: state.participantId,
      trialId: trial.id,
      eventType: "support_requested",
      payload: {},
    });
    await trackEvent({
      participantId: state.participantId,
      trialId: trial.id,
      eventType: "support_triggered",
      payload: { reason: "explicit_request" },
    });
    await fetchSupport(state.participantId, trial.id, trial.scenarioId, "explicit_request");
  }

  async function onSubmit(): Promise<void> {
    if (!trial || state?.step !== "study") return;
    const sid = trial.scenarioId;
    const answer =
      sid === "dashboard-priority"
        ? selected
        : sid === "slides-outline-refine"
          ? refinementAnswer
          : sid === "pm-sprint-handoff"
            ? pmAnswer
            : null;
    if (!answer) return;

    setSubmitting(true);
    try {
      if (trial.condition === "ephemeral" && !supportShownRef.current) {
        await trackEvent({
          participantId: state.participantId,
          trialId: trial.id,
          eventType: "support_ignored",
          payload: {},
        });
      }
      await trackEvent({
        participantId: state.participantId,
        trialId: trial.id,
        eventType: "trial_submitted",
        payload: { answer },
      });
      const res = await fetch(`/api/trials/${trial.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answerSubmitted: answer }),
      });
      if (!res.ok) {
        throw new Error("submit failed");
      }
      router.push(`/questionnaire?trialId=${trial.id}`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const editTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEditSlideRef = React.useRef<string | null>(null);

  function onSlideEdit(slideId: string): void {
    if (!trial || state?.step !== "study") return;
    if (lastEditSlideRef.current === slideId && editTimerRef.current) return;
    lastEditSlideRef.current = slideId;
    if (editTimerRef.current) clearTimeout(editTimerRef.current);
    editTimerRef.current = setTimeout(() => {
      lastEditSlideRef.current = null;
      editTimerRef.current = null;
    }, 2000);
    void trackEvent({
      participantId: state.participantId,
      trialId: trial.id,
      eventType: "outline_edited",
      payload: { slideId },
    });
  }

  function onSlideReordered(fromIndex: number, toIndex: number): void {
    if (!trial || state?.step !== "study") return;
    void trackEvent({
      participantId: state.participantId,
      trialId: trial.id,
      eventType: "slide_reordered",
      payload: { fromIndex, toIndex },
    });
  }

  function onTicketMoved(ticketId: string): void {
    if (!trial || state?.step !== "study") return;
    void trackEvent({
      participantId: state.participantId,
      trialId: trial.id,
      eventType: "ticket_moved",
      payload: { ticketId, toColumn: "in_progress" },
    });
    void trackEvent({
      participantId: state.participantId,
      trialId: trial.id,
      eventType: "workflow_step_completed",
      payload: { step: "move_to_in_progress", ticketId },
    });
  }

  function onDismissSupport(): void {
    if (!trial || !state || !spec) return;
    setSpec(null);
    supportLoadedRef.current = false;
    void trackEvent({
      participantId: state.participantId,
      trialId: trial.id,
      eventType: "support_dismissed",
      payload: {},
    });
  }

  function onEphemeralSupportInteraction(interaction: EphemeralSupportInteraction): void {
    if (!trial || !state || interaction.kind !== "inspect_expanded") return;
    void trackEvent({
      participantId: state.participantId,
      trialId: trial.id,
      eventType: "support_inspect_expanded",
      payload: {},
    });
  }

  function applyLocalEphemeralSpec(s: EphemeralSpec): void {
    if (!trial || !state) return;
    setSpec(s);
    supportLoadedRef.current = true;
    supportShownRef.current = true;
  }

  if (!state || state.step !== "study" || !trial) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  const sid = trial.scenarioId;
  const entry = isScenarioId(sid) ? getScenarioEntry(sid) : null;
  const taskHeading = entry?.taskHeading ?? "Complete the task using the interface below.";
  const preamble = entry?.scenarioPreamble ?? null;
  const participantOutcome = entry?.participantOutcome ?? ["Complete the task.", "Submit."];
  const taskNumber = trial.trialIndex + 1;
  const totalTrials = state.totalTrials;

  const canSubmit =
    sid === "dashboard-priority"
      ? !!selected
      : sid === "slides-outline-refine"
        ? !!refinementAnswer
        : sid === "pm-sprint-handoff"
          ? !!pmAnswer
          : false;

  const ephemeralIdle =
    trial.condition === "ephemeral" && !spec && !loadingSupport && !supportLoadedRef.current;

  const taskUi = !isScenarioId(sid) ? null : sid === "dashboard-priority" ? (
    <ScenarioDashboard
      selectedId={selected}
      onSelect={(id) => void onSelectDashboard(id)}
    />
  ) : sid === "slides-outline-refine" ? (
    <ScenarioSlides
      key={trial.id}
      initialOrder={SLIDES_START_ORDER}
      onAnswerPayloadChange={onRefinementAnswerChange}
      onSlideEdited={onSlideEdit}
      onSlideReordered={onSlideReordered}
    />
  ) : (
    <ScenarioPmSprint
      key={trial.id}
      onWorkflowAnswerChange={onPmWorkflowAnswerChange}
      onTicketMoved={onTicketMoved}
    />
  );

  const targetStressBand =
    supportDebugEnabled && debugSettings.skinAllowlistedTargets
      ? ephemeralStressBand(debugSettings.visualStress)
      : "0";

  const chromaDeg =
    supportDebugEnabled ? normalizeHueDegrees(debugSettings.chromaticShiftDegrees) : 0;
  const targetChromatic =
    supportDebugEnabled &&
    debugSettings.chromaticOnSkinnedTargets &&
    debugSettings.skinAllowlistedTargets &&
    targetStressBand !== "0" &&
    chromaDeg !== 0;

  return (
    <>
      <StudyProgressBar progress={state.progress} />
      <div className="relative mx-auto max-w-5xl px-6 pb-24 pt-6">
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
        chromaticShiftDegrees={supportDebugEnabled ? debugSettings.chromaticShiftDegrees : 0}
      />

      <div className="mb-6 flex items-baseline justify-between">
        <p className="text-xs tabular-nums text-muted-foreground">
          Task {taskNumber} of {totalTrials}
        </p>
        {trial.condition === "ephemeral" && ephemeralIdle ? (
          <Button type="button" size="xs" variant="outline" onClick={() => void onExplicitSupportRequest()}>
            Request assistance
          </Button>
        ) : trial.condition === "ephemeral" && loadingSupport ? (
          <p className="text-xs text-muted-foreground">Preparing…</p>
        ) : null}
      </div>

      {preamble ? (
        <p className="mb-4 max-w-prose text-sm leading-relaxed text-muted-foreground">{preamble}</p>
      ) : null}

      <h1 className="mb-2 max-w-prose text-base font-semibold leading-snug text-foreground">
        {taskHeading}
      </h1>
      <p className="mb-6 text-xs text-muted-foreground">
        {trial.condition === "ephemeral"
          ? "Temporary assistance may appear. You can dismiss or ignore it."
          : "No on-screen assistance is provided for this task."}
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
          supportDebugEnabled &&
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

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl justify-end gap-2 px-6">
          <Button disabled={!canSubmit || submitting} onClick={() => void onSubmit()}>
            {submitting ? "Submitting…" : "Submit"}
          </Button>
        </div>
      </div>
    </div>
    </>
  );
}
