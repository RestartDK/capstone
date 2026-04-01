"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { EphemeralLayer } from "@/components/ephemeral/EphemeralLayer";
import { ScenarioDashboard } from "@/components/study/ScenarioDashboard";
import { Button } from "@/components/ui/button";
import { SCENARIO_ID } from "@/lib/constants";
import type { StudyStateResponse } from "@/lib/study";
import type { SupportPayload } from "@/lib/support-schema";
import { trackEvent } from "@/lib/track";
export default function StudyPage(): React.ReactElement {
  const router = useRouter();
  const [state, setState] = React.useState<StudyStateResponse | null>(null);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [support, setSupport] = React.useState<SupportPayload | null>(null);
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
      if (s.step === "background") {
        router.replace("/participant");
        return;
      }
      if (s.step === "post_trial") {
        router.replace(`/questionnaire?trialId=${s.postTrialTrialId}`);
        return;
      }
      if (s.step === "final") {
        router.replace("/final");
        return;
      }
      if (s.step === "complete") {
        router.replace("/complete");
        return;
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
        payload: { condition: trial.condition },
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
              scenarioId: SCENARIO_ID,
            }),
          });
          if (res.ok) {
            const data = (await res.json()) as { support: SupportPayload };
            setSupport(data.support);
            await trackEvent({
              participantId: pid,
              trialId: tid,
              eventType: "support_shown",
              payload: {
                targetId: data.support.targetId,
                effectType: data.support.effectType,
              },
            });
          }
        } finally {
          setLoadingSupport(false);
        }
      } else {
        setSupport(null);
      }
    })();
  }, [trial, state?.participantId, state?.step]);

  React.useEffect(() => {
    setSelected(null);
    setSupport(null);
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

  function onDismissSupport(): void {
    if (!trial || !state || !support) return;
    setSupport(null);
    void trackEvent({
      participantId: state.participantId,
      trialId: trial.id,
      eventType: "support_dismissed",
      payload: { targetId: support.targetId },
    });
  }

  if (!state || state.step !== "study" || !trial) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-3xl space-y-6 p-6 pb-24">
      <EphemeralLayer support={support} onDismiss={onDismissSupport} />
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Task</p>
        <h1 className="text-lg font-medium leading-snug">
          Which area needs the most <em>immediate</em> attention on this dashboard?
        </h1>
        <p className="text-sm text-muted-foreground">
          The interface may show temporary assistance. You can dismiss it or ignore it.
        </p>
      </div>
      {trial.condition === "ephemeral" && loadingSupport ? (
        <p className="text-xs text-muted-foreground">Preparing assistance…</p>
      ) : null}
      <ScenarioDashboard selectedId={selected} onSelect={(id) => void onSelect(id)} />
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-3xl justify-end gap-2">
          <Button
            disabled={!selected || submitting}
            onClick={() => void onSubmit()}
          >
            {submitting ? "Submitting…" : "Submit answer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
