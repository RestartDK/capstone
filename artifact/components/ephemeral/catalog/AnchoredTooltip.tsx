"use client";

import * as React from "react";

import { anchorAndClamp, type Placement } from "../clampToViewport";
import { useTargetRect } from "../useTargetRect";

export function AnchoredTooltip(props: {
  targetId: string;
  body: string;
  placement?: Placement;
  dismissible?: boolean;
  onDismiss?: () => void;
}) {
  const rect = useTargetRect(props.targetId);
  const placement = props.placement ?? "bottom";
  const elRef = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState(120);
  const width = 280;

  React.useLayoutEffect(() => {
    if (elRef.current) setHeight(elRef.current.offsetHeight);
  });

  if (!rect) return null;

  const pos = anchorAndClamp(rect, placement, width, height);

  return (
    <div
      ref={elRef}
      className="pointer-events-auto absolute w-[min(280px,calc(100vw-2rem))] rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg"
      style={{ left: pos.left, top: pos.top }}
    >
      <p className="text-sm leading-snug">{props.body}</p>
      {props.dismissible && props.onDismiss ? (
        <button
          type="button"
          className="mt-2 text-xs font-medium text-primary underline"
          onClick={props.onDismiss}
        >
          Dismiss
        </button>
      ) : null}
    </div>
  );
}
