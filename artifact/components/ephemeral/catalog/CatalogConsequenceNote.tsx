"use client";

import * as React from "react";

import { anchorAndClamp, type Placement } from "../clampToViewport";
import { useTargetRect } from "../useTargetRect";

export function CatalogConsequenceNote(props: {
  targetId: string;
  line: string;
  placement?: Placement;
}): React.JSX.Element | null {
  const rect = useTargetRect(props.targetId);
  const placement = props.placement ?? "bottom";
  const width = 280;
  const elRef = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState(40);

  React.useLayoutEffect(() => {
    if (elRef.current) setHeight(elRef.current.offsetHeight);
  });

  if (!rect) return null;

  const pos = anchorAndClamp(rect, placement, width, height, 6);

  return (
    <div
      ref={elRef}
      className="pointer-events-none absolute w-[min(280px,calc(100vw-2rem))] rounded-md border border-amber-500/30 bg-amber-500/5 px-2.5 py-1.5 text-xs italic leading-snug text-amber-950"
      style={{ left: pos.left, top: pos.top }}
    >
      {props.line}
    </div>
  );
}
