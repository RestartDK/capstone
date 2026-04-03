"use client";

import * as React from "react";

import { anchorAndClamp, type Placement } from "../clampToViewport";
import { useTargetRect } from "../useTargetRect";

export function CatalogInspectPanel(props: {
  targetId: string;
  title: string;
  summary: string;
  details?: string[];
  placement?: Placement;
  dismissible?: boolean;
  onDismiss?: () => void;
  onInspectExpanded?: () => void;
}): React.JSX.Element | null {
  const rect = useTargetRect(props.targetId);
  const placement = props.placement ?? "bottom";
  const [expanded, setExpanded] = React.useState(false);
  const expandedOnceRef = React.useRef(false);
  const details = props.details ?? [];
  const width = 300;
  const elRef = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState(140);

  React.useLayoutEffect(() => {
    if (elRef.current) setHeight(elRef.current.offsetHeight);
  });

  if (!rect) return null;

  const pos = anchorAndClamp(rect, placement, width, height);

  function toggleExpanded(): void {
    const next = !expanded;
    setExpanded(next);
    if (next && !expandedOnceRef.current) {
      expandedOnceRef.current = true;
      props.onInspectExpanded?.();
    }
  }

  return (
    <div
      ref={elRef}
      className="pointer-events-auto absolute w-[min(300px,calc(100vw-2rem))] rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg"
      style={{ left: pos.left, top: pos.top }}
    >
      <p className="text-xs font-semibold leading-tight text-foreground">{props.title}</p>
      <p className="mt-1.5 text-sm leading-snug text-muted-foreground">{props.summary}</p>
      {details.length > 0 ? (
        <>
          <button
            type="button"
            className="mt-2 text-xs font-medium text-primary underline"
            onClick={toggleExpanded}
          >
            {expanded ? "Hide detail" : "More detail"}
          </button>
          {expanded ? (
            <ul className="mt-2 list-inside list-disc space-y-1 border-t border-border pt-2">
              {details.map((line, i) => (
                <li key={i} className="text-sm leading-snug">
                  {line}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
      {props.dismissible && props.onDismiss ? (
        <button
          type="button"
          className="mt-2 block text-xs font-medium text-primary underline"
          onClick={props.onDismiss}
        >
          Dismiss
        </button>
      ) : null}
    </div>
  );
}
