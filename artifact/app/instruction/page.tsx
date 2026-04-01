"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { pathForStudyStep } from "@/lib/study-routes";
import type { StudyStateResponse } from "@/lib/study";

export default function InstructionPage(): React.ReactElement {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [participantId, setParticipantId] = React.useState<string | null>(null);

  React.useEffect(() => {
    void (async () => {
      const res = await fetch("/api/study/state");
      if (res.status === 401) {
        router.replace("/consent");
        return;
      }
      const data = (await res.json()) as StudyStateResponse;
      setParticipantId(data.participantId);
      if (data.step === "background") {
        router.replace("/participant");
        return;
      }
      if (data.step !== "instruction") {
        router.replace(pathForStudyStep(data));
      }
    })();
  }, [router]);

  async function onContinue(): Promise<void> {
    if (!participantId) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/participants/instruction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId }),
      });
      if (!res.ok) {
        throw new Error("failed");
      }
      router.push("/study");
      router.refresh();
    } catch {
      setError("Could not continue. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="text-lg font-medium">Before you begin</h1>
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>In this study, you will complete a series of short interface tasks.</p>
        <p>During some tasks, the interface may provide additional temporary assistance.</p>
        <p>
          Please complete each task as naturally as possible. You may ignore or dismiss any
          assistance if you do not find it useful.
        </p>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button asChild type="button" variant="outline" size="sm">
          <Link href="/participant">Back</Link>
        </Button>
        <Button type="button" size="sm" disabled={loading || !participantId} onClick={() => void onContinue()}>
          {loading ? "Loading…" : "Next"}
        </Button>
      </div>
    </div>
  );
}
