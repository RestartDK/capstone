"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { EphemeralLayer } from "@/components/ephemeral/EphemeralLayer";
import { ScenarioDashboard } from "@/components/study/ScenarioDashboard";
import { ScenarioPmSprint } from "@/components/study/ScenarioPmSprint";
import { ScenarioSlides } from "@/components/study/ScenarioSlides";
import { Button } from "@/components/ui/button";
import type { EphemeralSpec } from "@/lib/ephemeral/spec";
import { pathForStudyStep } from "@/lib/study-routes";
import type { StudyStateResponse } from "@/lib/study";
import { getScenarioEntry } from "@/lib/scenarios/registry";
import { isScenarioId } from "@/lib/scenarios/ids";
import { trackEvent } from "@/lib/track";

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

export default function StudyPage(): React.ReactElement {
  const router = useRouter();
  const [state, setState] = React.useState<StudyStateResponse | null>(null);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [spec, setSpec] = React.useState<EphemeralSpec | null>(null);
  const [loadingSupport, setLoadingSupport] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const startedRef = React.useRef<string | null>(null);

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

  React.useEffect(() => {
    if (!trial || state?.step !== "study") return;
    const pid = state.participantId;
    const tid = trial.id;

    void (async () => {
      if (startedRef.current === tid) return;
      startedRef.current = tid;
      await fetch(`/api/trials/${tid}/start`, { method: "POST" });
      await trackEvent({
        participantId: pid,
        trialId: tid,
        eventType: "trial_started",
        payload: { condition: trial.condition, scenarioId: trial.scenarioId },
      });
      await trackEvent({
        participantId: pid,
        trialId: tid,
        eventType: "trial_viewed",
      });

      if (trial.condition === "ephemeral") {
        setLoadingSupport(true);
        try {
          const res = await fetch("/api/support", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              participantId: pid,
              trialId: tid,
              scenarioId: trial.scenarioId,
              trigger: "initial",
            }),
          });
          if (res.ok) {
            const data = (await res.json()) as SupportApiResponse;
            setSpec(data.spec);
            await trackEvent({
              participantId: pid,
              trialId: tid,
              eventType: "support_shown",
              payload: {
                componentTypes: data.meta.componentTypes,
                catalogVersion: data.meta.catalogVersion,
                trigger: data.meta.trigger,
                usedFallback: data.meta.usedFallback,
              },
            });
          }
        } finally {
          setLoadingSupport(false);
        }
      } else {
        setSpec(null);
      }
    })();
  }, [trial, state?.participantId, state?.step]);

  React.useEffect(() => {
    setSelected(null);
    setSpec(null);
    startedRef.current = null;
  }, [trial?.id]);

  async function onSelect(id: string): Promise<void> {
    if (!trial || state?.step !== "study") return;
    setSelected(id);
    await trackEvent({
      participantId: state.participantId,
      trialId: trial.id,
      eventType: "answer_selected",
      payload: { selectedAnswer: id },
    });
  }

  async function onSubmit(): Promise<void> {
    if (!trial || !selected || state?.step !== "study") return;
    setSubmitting(true);
    try {
      await trackEvent({
        participantId: state.participantId,
        trialId: trial.id,
        eventType: "trial_submitted",
        payload: { answer: selected },
      });
      const res = await fetch(`/api/trials/${trial.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answerSubmitted: selected }),
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

  function onSlideEdit(slideId: string) {
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

  function onDismissSupport(): void {
    if (!trial || !state || !spec) return;
    setSpec(null);
    void trackEvent({
      participantId: state.participantId,
      trialId: trial.id,
      eventType: "support_dismissed",
      payload: {},
    });
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
  const taskNumber = trial.trialIndex + 1;
  const totalTrials = state.totalTrials;

  const taskUi = !isScenarioId(sid) ? null : sid === "dashboard-priority" ? (
    <ScenarioDashboard selectedId={selected} onSelect={(id) => void onSelect(id)} />
  ) : sid === "slides-outline-refine" ? (
    <ScenarioSlides selectedId={selected} onSelect={(id) => void onSelect(id)} onEdit={onSlideEdit} />
  ) : (
    <ScenarioPmSprint selectedId={selected} onSelect={(id) => void onSelect(id)} />
  );

  return (
    <div className="relative mx-auto max-w-3xl space-y-6 p-6 pb-24">
      <EphemeralLayer spec={spec} onDismiss={onDismissSupport} />
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Task {taskNumber} of {totalTrials}
        </p>
        {preamble ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{preamble}</p>
        ) : null}
        <h1 className="text-lg font-medium leading-snug">{taskHeading}</h1>
        <p className="text-xs text-muted-foreground">
          The interface may show temporary assistance. You can dismiss it or ignore it.
        </p>
      </div>
      {trial.condition === "ephemeral" && loadingSupport ? (
        <p className="text-xs text-muted-foreground">Preparing assistance…</p>
      ) : null}
      {taskUi}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-3xl justify-end gap-2">
          <Button disabled={!selected || submitting} onClick={() => void onSubmit()}>
            {submitting ? "Submitting…" : "Submit answer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
