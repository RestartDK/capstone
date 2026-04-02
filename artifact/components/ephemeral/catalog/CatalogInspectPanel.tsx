"use client";

import * as React from "react";
import type { CSSProperties } from "react";

import { useTargetRect } from "../useTargetRect";

type Placement = "top" | "bottom" | "left" | "right";

function computePosition(rect: DOMRect, placement: Placement) {
  const width = 300;
  const gap = 8;

  switch (placement) {
    case "top":
      return {
        left: Math.min(
          window.innerWidth - width - 8,
          Math.max(8, rect.left + rect.width / 2 - width / 2),
        ),
        top: rect.top - gap,
        transform: "translateY(-100%)" as const,
      };
    case "left":
      return {
        left: rect.left - gap - width,
        top: rect.top + rect.height / 2,
        transform: "translateY(-50%)" as const,
      };
    case "right":
      return {
        left: rect.right + gap,
        top: rect.top + rect.height / 2,
        transform: "translateY(-50%)" as const,
      };
    case "bottom":
    default:
      return {
        left: Math.min(
          window.innerWidth - width - 8,
          Math.max(8, rect.left + rect.width / 2 - width / 2),
        ),
        top: rect.bottom + gap,
        transform: undefined as undefined,
      };
  }
}

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

  if (!rect) return null;

  const pos = computePosition(rect, placement);

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
      className="pointer-events-auto absolute w-[min(300px,calc(100vw-2rem))] rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg"
      style={
        {
          left: pos.left,
          top: pos.top,
          transform: pos.transform,
        } as CSSProperties
      }
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
