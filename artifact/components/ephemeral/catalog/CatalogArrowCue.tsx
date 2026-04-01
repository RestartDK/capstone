"use client";

import { useTargetRect } from "../useTargetRect";

export function CatalogArrowCue(props: { targetId: string }) {
  const rect = useTargetRect(props.targetId);

  if (!rect) return null;

  const left = rect.left - 28;
  const top = rect.top + rect.height / 2 - 6;

  return (
    <div
      className="pointer-events-none absolute text-amber-500 drop-shadow-sm"
      style={{ left, top }}
      aria-hidden
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 12h14l-4-4v8l4-4H4z" />
      </svg>
    </div>
  );
}
