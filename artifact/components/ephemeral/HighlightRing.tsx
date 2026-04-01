"use client";

export function HighlightRing(props: { rect: DOMRect }): React.ReactElement {
  const pad = 6;
  return (
    <div
      className="pointer-events-none absolute rounded-xl border-2 border-amber-400/90 bg-amber-400/10 shadow-[0_0_0_4px_rgba(251,191,36,0.2)]"
      style={{
        left: props.rect.left - pad,
        top: props.rect.top - pad,
        width: props.rect.width + pad * 2,
        height: props.rect.height + pad * 2,
      }}
    />
  );
}
