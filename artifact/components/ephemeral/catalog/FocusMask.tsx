"use client";

import { useTargetRect } from "../useTargetRect";

export function FocusMask(props: { targetId: string; strength?: number }) {
  const rect = useTargetRect(props.targetId);
  const opacity = props.strength ?? 0.5;

  if (!rect) return null;

  const pad = 8;
  const cutout = {
    x: rect.left - pad,
    y: rect.top - pad,
    w: rect.width + pad * 2,
    h: rect.height + pad * 2,
  };

  return (
    <svg className="pointer-events-none fixed inset-0 h-full w-full" aria-hidden>
      <defs>
        <mask id="ephemeral-focus-mask">
          <rect width="100%" height="100%" fill="white" />
          <rect
            x={cutout.x}
            y={cutout.y}
            width={cutout.w}
            height={cutout.h}
            rx={12}
            fill="black"
          />
        </mask>
      </defs>
      <rect
        width="100%"
        height="100%"
        fill={`rgba(0,0,0,${opacity})`}
        mask="url(#ephemeral-focus-mask)"
      />
    </svg>
  );
}
