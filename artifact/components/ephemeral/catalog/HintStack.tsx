"use client";

import { useTargetRect } from "../useTargetRect";

type Placement = "top" | "bottom" | "left" | "right";

export function HintStack(props: {
  targetId: string;
  lines: string[];
  placement?: Placement;
}) {
  const rect = useTargetRect(props.targetId);
  const placement = props.placement ?? "bottom";

  if (!rect || props.lines.length === 0) return null;

  const gap = 8;
  const width = 280;

  const style: React.CSSProperties = (() => {
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
          top: rect.top,
        };
      case "right":
        return {
          left: rect.right + gap,
          top: rect.top,
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
      className="pointer-events-auto absolute w-[min(280px,calc(100vw-2rem))] rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg"
      style={style}
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
