"use client";

import type { CSSProperties } from "react";

import { useTargetRect } from "../useTargetRect";

type Placement = "top" | "bottom" | "left" | "right";

export function CatalogConsequenceNote(props: {
  targetId: string;
  line: string;
  placement?: Placement;
}): React.JSX.Element | null {
  const rect = useTargetRect(props.targetId);
  const placement = props.placement ?? "bottom";

  if (!rect) return null;

  const width = 280;
  const gap = 6;

  const style: CSSProperties = (() => {
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
        };
    }
  })();

  return (
    <div
      className="pointer-events-none absolute w-[min(280px,calc(100vw-2rem))] rounded-md border border-amber-500/30 bg-amber-500/5 px-2.5 py-1.5 text-xs italic leading-snug text-amber-950 dark:text-amber-100"
      style={style}
    >
      {props.line}
    </div>
  );
}
