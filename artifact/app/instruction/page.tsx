"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { pathForStudyStep } from "@/lib/study-routes";
import type { StudyStateResponse } from "@/lib/study";

/** Legacy route: study introduction was merged into consent and background. */
export default function InstructionPage(): React.ReactElement {
  const router = useRouter();

  React.useEffect(() => {
    void (async () => {
      const res = await fetch("/api/study/state");
      if (res.status === 401) {
        router.replace("/consent");
        return;
      }
      const data = (await res.json()) as StudyStateResponse;
      router.replace(pathForStudyStep(data));
    })();
  }, [router]);

  return (
    <div className="flex min-h-svh items-center justify-center p-6 text-sm text-muted-foreground">
      Redirecting…
    </div>
  );
}
