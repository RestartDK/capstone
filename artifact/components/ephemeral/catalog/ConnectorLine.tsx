"use client";

import { useTargetRect } from "../useTargetRect";

export function ConnectorLine(props: {
  fromTargetId: string;
  toTargetId: string;
}) {
  const fromRect = useTargetRect(props.fromTargetId);
  const toRect = useTargetRect(props.toTargetId);

  if (!fromRect || !toRect) return null;

  const x1 = fromRect.left + fromRect.width / 2;
  const y1 = fromRect.top + fromRect.height / 2;
  const x2 = toRect.left + toRect.width / 2;
  const y2 = toRect.top + toRect.height / 2;

  return (
    <svg className="pointer-events-none fixed inset-0 h-full w-full" aria-hidden>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="rgba(251,191,36,0.6)"
        strokeWidth={2}
        strokeDasharray="6 4"
      />
    </svg>
  );
}
