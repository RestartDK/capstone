"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export default function ConsentPage(): React.ReactElement {
  const router = useRouter();
  const [agree, setAgree] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onStart(): Promise<void> {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consented: true }),
      });
      if (!res.ok) {
        throw new Error("Could not start session");
      }
      router.push("/participant");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="text-lg font-medium">Welcome</h1>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p>
          In this study, you will complete a series of short interface tasks. During some tasks, the
          interface may provide additional temporary assistance.
        </p>
        <p>
          Please complete each task as naturally as possible. You may ignore or dismiss any
          assistance if you do not find it useful.
        </p>
        <p>Your responses are used for research. Do not include personally identifying information.</p>
      </div>
      <label className="flex cursor-pointer items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          className="mt-1 accent-primary"
        />
        <span>I have read the above and agree to participate.</span>
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/">Back</Link>
        </Button>
        <Button size="sm" disabled={!agree || loading} onClick={() => void onStart()}>
          {loading ? "Starting…" : "Start"}
        </Button>
      </div>
    </div>
  );
}
