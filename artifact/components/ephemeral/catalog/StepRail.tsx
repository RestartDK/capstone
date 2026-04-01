"use client";

import { useTargetRect } from "../useTargetRect";

function StepBadge(props: { targetId: string; stepNumber: number }) {
  const rect = useTargetRect(props.targetId);

  if (!rect) return null;

  return (
    <div
      className="pointer-events-none absolute flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white shadow-md"
      style={{
        left: rect.left - 12,
        top: rect.top - 12,
      }}
    >
      {props.stepNumber}
    </div>
  );
}

export function StepRail(props: { targetIds: string[] }) {
  return (
    <>
      {props.targetIds.map((id, i) => (
        <StepBadge key={id} targetId={id} stepNumber={i + 1} />
      ))}
    </>
  );
}
