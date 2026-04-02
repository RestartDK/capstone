"use client";

import type { ReactElement } from "react";

import type { StudyProgress } from "@/lib/study";

export function StudyProgressBar(props: { progress: StudyProgress }): ReactElement {
  const { progress } = props;
  const label = `Study progress: ${progress.percent}% · step ${progress.current} of ${progress.total}`;
  return (
    <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-2">
        <div
          className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"
          title={label}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
            style={{ width: `${progress.percent}%` }}
            role="progressbar"
            aria-valuenow={progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={label}
          />
        </div>
        <span className="hidden shrink-0 tabular-nums text-xs text-muted-foreground sm:inline">
          {progress.percent}% · {progress.current}/{progress.total}
        </span>
        <span className="shrink-0 tabular-nums text-xs text-muted-foreground sm:hidden">{progress.percent}%</span>
      </div>
    </div>
  );
}
