"use client";

import { useTargetRect } from "../useTargetRect";

export function PulseRing(props: { targetId: string; durationMs?: number }) {
  const rect = useTargetRect(props.targetId);
  const duration = props.durationMs ?? 2000;

  if (!rect) return null;

  const pad = 6;

  return (
    <div
      className="pointer-events-none absolute rounded-xl border-2 border-amber-400/80"
      style={{
        left: rect.left - pad,
        top: rect.top - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
        animation: `ephemeral-pulse ${duration}ms ease-in-out infinite`,
      }}
    >
      <style>{`
        @keyframes ephemeral-pulse {
          0%, 100% { opacity: 0.4; box-shadow: 0 0 0 0 rgba(251,191,36,0.3); }
          50% { opacity: 1; box-shadow: 0 0 0 6px rgba(251,191,36,0.15); }
        }
        @media (prefers-reduced-motion: reduce) {
          .pointer-events-none[style*="ephemeral-pulse"] {
            animation: none !important;
            opacity: 1;
            box-shadow: 0 0 0 4px rgba(251,191,36,0.2);
          }
        }
      `}</style>
    </div>
  );
}
