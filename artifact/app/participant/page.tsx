"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { StudyProgressBar } from "@/components/study/StudyProgressBar";
import { Button } from "@/components/ui/button";
import { pathForStudyStep } from "@/lib/study-routes";
import type { StudyProgress, StudyStateResponse } from "@/lib/study";

export default function ParticipantPage(): React.ReactElement {
  const router = useRouter();
  const [ageRange, setAgeRange] = React.useState("");
  const [occupation, setOccupation] = React.useState("");
  const [webFam, setWebFam] = React.useState("");
  const [aiFam, setAiFam] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState<StudyProgress | null>(null);

  React.useEffect(() => {
    void (async () => {
      const res = await fetch("/api/study/state");
      if (res.status === 401) {
        router.replace("/consent");
        return;
      }
      const data = (await res.json()) as StudyStateResponse;
      setProgress(data.progress);
      if (data.step !== "background") {
        router.replace(pathForStudyStep(data));
      }
    })();
  }, [router]);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    const w = Number(webFam);
    const a = Number(aiFam);
    if (!ageRange || !occupation || !Number.isFinite(w) || !Number.isFinite(a)) {
      setError("Please fill all fields with valid numbers (1–7) for familiarity.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/participants/background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ageRange,
          occupation,
          webAppFamiliarity: w,
          aiToolFamiliarity: a,
        }),
      });
      if (!res.ok) {
        throw new Error("Save failed");
      }
      router.push("/study");
      router.refresh();
    } catch {
      setError("Could not save. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {progress ? <StudyProgressBar progress={progress} /> : null}
      <div className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="text-lg font-medium">Background</h1>
      <p className="text-sm text-muted-foreground">
        A few quick questions. The last two use a scale from 1 (not at all) to 7 (very much).
      </p>
      <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="age">
            Your age
          </label>
          <input
            id="age"
            required
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={ageRange}
            onChange={(e) => setAgeRange(e.target.value)}
            placeholder="e.g. 28"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="occ">
            Occupation or role
          </label>
          <input
            id="occ"
            required
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            placeholder="e.g. Student, developer, analyst…"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="web">
            How comfortable are you using websites and browser-based tools? (1–7)
          </label>
          <p className="text-xs text-muted-foreground">
            Examples: online banking, shopping sites, work tools in a web browser — not programming.
            1 = rarely use them or find them difficult; 7 = use them often and with ease.
          </p>
          <input
            id="web"
            required
            type="number"
            min={1}
            max={7}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={webFam}
            onChange={(e) => setWebFam(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="ai">
            How familiar are you with AI-assisted tools (for example chat assistants or writing
            helpers)? (1–7)
          </label>
          <input
            id="ai"
            required
            type="number"
            min={1}
            max={7}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={aiFam}
            onChange={(e) => setAiFam(e.target.value)}
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex gap-2 pt-2">
          <Button asChild type="button" variant="outline" size="sm">
            <Link href="/consent">Back</Link>
          </Button>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Saving…" : "Continue to tasks"}
          </Button>
        </div>
      </form>
    </div>
    </>
  );
}
