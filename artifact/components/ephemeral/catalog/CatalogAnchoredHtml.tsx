"use client";

import * as React from "react";

import { sanitizeEphemeralHtml } from "@/lib/ephemeral/sanitize-html";

import { useTargetRect } from "../useTargetRect";

type Placement = "top" | "bottom" | "left" | "right";

function computePosition(rect: DOMRect, placement: Placement, width: number) {
  const gap = 8;

  switch (placement) {
    case "top":
      return {
        left: Math.min(
          window.innerWidth - width - 8,
          Math.max(8, rect.left + rect.width / 2 - width / 2),
        ),
        top: rect.top - gap,
        transform: "translateY(-100%)",
      };
    case "left":
      return {
        left: rect.left - gap - width,
        top: rect.top + rect.height / 2,
        transform: "translateY(-50%)",
      };
    case "right":
      return {
        left: rect.right + gap,
        top: rect.top + rect.height / 2,
        transform: "translateY(-50%)",
      };
    case "bottom":
    default:
      return {
        left: Math.min(
          window.innerWidth - width - 8,
          Math.max(8, rect.left + rect.width / 2 - width / 2),
        ),
        top: rect.bottom + gap,
        transform: undefined,
      };
  }
}

export function CatalogAnchoredHtml(props: {
  targetId: string;
  html: string;
  placement?: Placement;
  dismissible?: boolean;
  onDismiss?: () => void;
}): React.JSX.Element | null {
  const rect = useTargetRect(props.targetId);
  const placement = props.placement ?? "bottom";
  const width = 320;
  const clean = React.useMemo(() => sanitizeEphemeralHtml(props.html), [props.html]);

  if (!rect) return null;

  const pos = computePosition(rect, placement, width);

  return (
    <div
      className="pointer-events-auto w-[min(320px,calc(100vw-2rem))] max-h-[min(70vh,520px)] overflow-auto rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg"
      style={{ left: pos.left, top: pos.top, transform: pos.transform as string | undefined }}
    >
      <div
        className="text-sm leading-snug [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:text-xs [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-2 [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: clean }}
      />
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
