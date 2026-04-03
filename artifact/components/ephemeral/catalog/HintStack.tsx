"use client";

import * as React from "react";

import { anchorAndClamp, type Placement } from "../clampToViewport";
import { useTargetRect } from "../useTargetRect";

export function HintStack(props: {
  targetId: string;
  lines: string[];
  placement?: Placement;
}) {
  const rect = useTargetRect(props.targetId);
  const placement = props.placement ?? "bottom";
  const width = 280;
  const elRef = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState(100);

  React.useLayoutEffect(() => {
    if (elRef.current) setHeight(elRef.current.offsetHeight);
  });

  if (!rect || props.lines.length === 0) return null;

  const pos = anchorAndClamp(rect, placement, width, height);

  return (
    <div
      ref={elRef}
      className="pointer-events-auto absolute w-[min(280px,calc(100vw-2rem))] rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg"
      style={{ left: pos.left, top: pos.top }}
    >
      <ul className="list-inside list-disc space-y-1">
        {props.lines.map((line, i) => (
          <li key={i} className="text-sm leading-snug">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
