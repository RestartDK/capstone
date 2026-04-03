"use client";

import * as React from "react";

import { sanitizeEphemeralHtml } from "@/lib/ephemeral/sanitize-html";
import { cn } from "@/lib/utils";

import { anchorAndClamp, type Placement } from "../clampToViewport";
import { useTargetRect } from "../useTargetRect";

export function CatalogAnchoredHtml(props: {
  targetId: string;
  html: string;
  placement?: Placement;
  variant?: "popover" | "inline";
  dismissible?: boolean;
  onDismiss?: () => void;
}): React.JSX.Element | null {
  const rect = useTargetRect(props.targetId);
  const placement = props.placement ?? "bottom";
  const variant = props.variant ?? "popover";
  const width = 320;
  const elRef = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState(160);
  const clean = React.useMemo(() => sanitizeEphemeralHtml(props.html), [props.html]);

  React.useLayoutEffect(() => {
    if (elRef.current) setHeight(elRef.current.offsetHeight);
  });

  if (!rect) return null;

  const pos = anchorAndClamp(rect, placement, width, height);

  const isInline = variant === "inline";

  return (
    <div
      ref={elRef}
      className={cn(
        "pointer-events-auto w-[min(320px,calc(100vw-2rem))] max-h-[min(70vh,520px)] overflow-auto",
        isInline
          ? "rounded-md border-l-2 border-primary/40 bg-muted/60 px-3 py-2 text-foreground/80 backdrop-blur-sm"
          : "rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg",
      )}
      style={{ left: pos.left, top: pos.top }}
    >
      <div
        className="text-sm leading-snug [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:text-xs [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-2 [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: clean }}
      />
      {props.dismissible && props.onDismiss ? (
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
