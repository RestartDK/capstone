"use client";

export function ArrowCue(props: { rect: DOMRect }): React.ReactElement {
  const left = props.rect.left - 28;
  const top = props.rect.top + props.rect.height / 2 - 6;
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
