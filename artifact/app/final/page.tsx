"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { FinalQuestions } from "@/components/study/FinalQuestions";
import { pathForStudyStep } from "@/lib/study-routes";
import type { StudyStateResponse } from "@/lib/study";
import { trackEvent } from "@/lib/track";

export default function FinalPage(): React.ReactElement {
  const router = useRouter();
  const [state, setState] = React.useState<StudyStateResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    void (async () => {
      const res = await fetch("/api/study/state");
      if (res.status === 401) {
        router.replace("/consent");
        return;
      }
      const s = (await res.json()) as StudyStateResponse;
      setState(s);
      if (s.step !== "final") {
        router.replace(pathForStudyStep(s));
        return;
      }
    })();
  }, [router]);

  async function onSubmit(r: {
    final_preference: string;
    final_helpfulness: string;
    final_intrusiveness: string;
    final_real_life: string;
    final_comments: string;
  }): Promise<void> {
    if (!state || state.step !== "final") return;
    const lastTrialId = state.lastTrialId;
    if (!lastTrialId) {
      setError("Missing trial context");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const responses = [
        { questionKey: "final_preference", responseValue: r.final_preference },
        { questionKey: "final_helpfulness", responseValue: r.final_helpfulness },
        { questionKey: "final_intrusiveness", responseValue: r.final_intrusiveness },
        { questionKey: "final_real_life", responseValue: r.final_real_life },
      ];
      if (r.final_comments.trim().length > 0) {
        responses.push({ questionKey: "final_comments", responseValue: r.final_comments.trim() });
      }
      const res = await fetch("/api/questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: state.participantId,
          responses,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? "Save failed");
      }
      await trackEvent({
        participantId: state.participantId,
        trialId: lastTrialId,
        eventType: "final_questions_submitted",
        payload: {},
      });
      router.push("/complete");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  if (!state || state.step !== "final") {
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
      <FinalQuestions onSubmit={(r) => void onSubmit(r)} disabled={loading} />
    </div>
  );
}
