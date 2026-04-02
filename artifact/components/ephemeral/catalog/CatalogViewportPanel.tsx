"use client";

import * as React from "react";

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function CatalogViewportPanel(props: {
  topPct: number;
  leftPct: number;
  widthPct: number;
  maxHeightVh?: number;
  zIndex?: number;
  pointerEvents?: "auto" | "none";
  children?: React.ReactNode;
}): React.JSX.Element {
  const top = clamp(props.topPct, 0, 92);
  const left = clamp(props.leftPct, 0, 92);
  const width = clamp(props.widthPct, 15, 96);
  const maxH =
    props.maxHeightVh != null ? `${clamp(props.maxHeightVh, 12, 88)}vh` : "min(70vh, calc(100vh - 6rem))";

  return (
    <div
      className="pointer-events-auto overflow-auto rounded-lg border border-border bg-popover/95 p-3 text-popover-foreground shadow-lg backdrop-blur-sm"
      style={{
        position: "absolute",
        top: `${top}%`,
        left: `${left}%`,
        width: `${width}%`,
        maxHeight: maxH,
        zIndex: props.zIndex ?? 12,
        pointerEvents: props.pointerEvents ?? "auto",
      }}
    >
      <div className="flex flex-col gap-2">{props.children}</div>
    </div>
  );
}
