"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { PostTrialQuestions } from "@/components/study/PostTrialQuestions";
import { pathForStudyStep } from "@/lib/study-routes";
import type { StudyStateResponse } from "@/lib/study";
import { trackEvent } from "@/lib/track";

export function QuestionnaireClient(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trialIdParam = searchParams.get("trialId");
  const [participantId, setParticipantId] = React.useState<string | null>(null);
  const [trialId, setTrialId] = React.useState<string | null>(trialIdParam);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch("/api/study/state");
      if (res.status === 401) {
        router.replace("/consent");
        return;
      }
      const s = (await res.json()) as StudyStateResponse;
      if (cancelled) return;
      setParticipantId(s.participantId);
      const tid = trialIdParam ?? s.postTrialTrialId;
      if (tid) setTrialId(tid);
      if (s.step !== "post_trial") {
        router.replace(pathForStudyStep(s));
        return;
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router, trialIdParam]);

  async function onSubmit(r: {
    helpfulness: string;
    intrusiveness: string;
    control: string;
  }): Promise<void> {
    if (!participantId || !trialId) {
      setError("Missing session");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          trialId,
          responses: [
            { questionKey: "helpfulness", responseValue: r.helpfulness },
            { questionKey: "intrusiveness", responseValue: r.intrusiveness },
            { questionKey: "control", responseValue: r.control },
          ],
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? "Save failed");
      }
      await trackEvent({
        participantId,
        trialId,
        eventType: "post_trial_questions_submitted",
        payload: {},
      });
      router.push("/study");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  if (loading || !trialId || !participantId) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div>
      {error ? (
        <p className="px-6 pt-6 text-sm text-destructive">{error}</p>
      ) : null}
      <PostTrialQuestions onSubmit={(r) => void onSubmit(r)} disabled={loading} />
    </div>
  );
}
