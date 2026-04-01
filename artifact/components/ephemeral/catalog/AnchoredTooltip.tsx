"use client";

import { useTargetRect } from "../useTargetRect";

type Placement = "top" | "bottom" | "left" | "right";

function computePosition(rect: DOMRect, placement: Placement) {
  const tooltipWidth = 280;
  const gap = 8;

  switch (placement) {
    case "top":
      return {
        left: Math.min(
          window.innerWidth - tooltipWidth - 8,
          Math.max(8, rect.left + rect.width / 2 - tooltipWidth / 2),
        ),
        top: rect.top - gap,
        transform: "translateY(-100%)",
      };
    case "left":
      return {
        left: rect.left - gap - tooltipWidth,
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
          window.innerWidth - tooltipWidth - 8,
          Math.max(8, rect.left + rect.width / 2 - tooltipWidth / 2),
        ),
        top: rect.bottom + gap,
        transform: undefined,
      };
  }
}

export function AnchoredTooltip(props: {
  targetId: string;
  body: string;
  placement?: Placement;
  dismissible?: boolean;
  onDismiss?: () => void;
}) {
  const rect = useTargetRect(props.targetId);
  const placement = props.placement ?? "bottom";

  if (!rect) return null;

  const pos = computePosition(rect, placement);

  return (
    <div
      className="pointer-events-auto absolute w-[min(280px,calc(100vw-2rem))] rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg"
      style={{ left: pos.left, top: pos.top, transform: pos.transform }}
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
