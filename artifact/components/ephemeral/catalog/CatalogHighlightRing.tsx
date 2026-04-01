"use client";

import { useTargetRect } from "../useTargetRect";

export function CatalogHighlightRing(props: { targetId: string }) {
  const rect = useTargetRect(props.targetId);

  if (!rect) return null;

  const pad = 6;

  return (
    <div
      className="pointer-events-none absolute rounded-xl border-2 border-amber-400/90 bg-amber-400/10 shadow-[0_0_0_4px_rgba(251,191,36,0.2)]"
      style={{
        left: rect.left - pad,
        top: rect.top - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }}
    />
  );
}
