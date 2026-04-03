"use client";

import * as React from "react";

import { sanitizeEphemeralHtml } from "@/lib/ephemeral/sanitize-html";

import { useTargetRect } from "../useTargetRect";

type Side = "left" | "right";

/**
 * A lightweight annotation that sits flush beside a target element, looking
 * like part of the page margin rather than a floating popup. Supports both
 * plain text (body) and rich HTML+SVG (html).
 */
export function CatalogSideNote(props: {
  targetId: string;
  side?: Side;
  body?: string;
  html?: string;
  widthPx?: number;
}): React.JSX.Element | null {
  const rect = useTargetRect(props.targetId);
  const side = props.side ?? "right";
  const width = props.widthPx ?? 220;
  const gap = 12;

  const clean = React.useMemo(
    () => (props.html ? sanitizeEphemeralHtml(props.html) : null),
    [props.html],
  );

  if (!rect) return null;
  if (!props.body && !clean) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let left: number;
  if (side === "right") {
    left = rect.right + gap;
    if (left + width > vw - 8) {
      left = rect.left - gap - width;
    }
  } else {
    left = rect.left - gap - width;
    if (left < 8) {
      left = rect.right + gap;
    }
  }

  left = Math.min(vw - width - 8, Math.max(8, left));
  let top = rect.top;
  top = Math.min(vh - 40, Math.max(8, top));

  return (
    <div
      className="pointer-events-auto absolute"
      style={{ left, top, width, maxHeight: `calc(100vh - ${top + 8}px)` }}
    >
      <div className="overflow-auto rounded-md border-l-2 border-primary/40 bg-muted/60 px-3 py-2 text-sm leading-snug text-foreground/80 backdrop-blur-sm">
        {clean ? (
          <div
            className="[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:text-xs [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_h4]:mb-0.5 [&_h4]:text-xs [&_h4]:font-semibold [&_ol]:list-decimal [&_ol]:pl-4 [&_p+p]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-4"
            dangerouslySetInnerHTML={{ __html: clean }}
          />
        ) : (
          <p>{props.body}</p>
        )}
      </div>
    </div>
  );
}
