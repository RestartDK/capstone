"use client";

export function InlineBubble(props: {
  rect: DOMRect;
  message: string;
  dismissible: boolean;
  onDismiss: () => void;
}): React.ReactElement {
  const left = Math.min(
    window.innerWidth - 280,
    Math.max(8, props.rect.left + props.rect.width / 2 - 140),
  );
  const top = props.rect.bottom + 8;
  return (
    <div
      className="pointer-events-auto absolute w-[min(280px,calc(100vw-2rem))] rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg"
      style={{ left, top }}
    >
      <p className="text-sm leading-snug">{props.message}</p>
      {props.dismissible ? (
        <button
          type="button"
          className="mt-2 text-xs font-medium text-primary underline"
          onClick={props.onDismiss}
        >
          Dismiss
        </button>
      ) : null}
    </div>
  );
}
