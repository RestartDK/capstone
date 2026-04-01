"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import type { SupportPayload } from "@/lib/support-schema";

import { ArrowCue } from "./ArrowCue";
import { HighlightRing } from "./HighlightRing";
import { InlineBubble } from "./InlineBubble";

function queryTarget(targetId: string): Element | null {
  return document.querySelector(`[data-ephemeral-id="${targetId}"]`);
}

export function EphemeralLayer(props: {
  support: SupportPayload | null;
  onDismiss: () => void;
}): React.ReactElement | null {
  const [box, setBox] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!props.support) {
      return;
    }
    const targetId = props.support.targetId;
    const update = (): void => {
      const el = queryTarget(targetId);
      setBox(el?.getBoundingClientRect() ?? null);
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    const id = window.setInterval(update, 400);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      window.clearInterval(id);
      setBox(null);
    };
  }, [props.support]);

  if (typeof document === "undefined" || !props.support) {
    return null;
  }

  const s = props.support;
  const showArrow = s.effectType === "arrow" || s.effectType === "arrow-highlight";
  const showHighlight = s.effectType === "highlight" || s.effectType === "arrow-highlight";
  const showBubble = s.effectType === "inline_bubble" || s.effectType === "arrow-highlight";

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-50" aria-live="polite">
      {box && showHighlight ? <HighlightRing rect={box} /> : null}
      {box && showArrow ? <ArrowCue rect={box} /> : null}
      {box && showBubble ? (
        <InlineBubble
          rect={box}
          message={s.message}
          dismissible={s.dismissible}
          onDismiss={props.onDismiss}
        />
      ) : null}
      {!box ? (
        <div className="pointer-events-auto fixed bottom-4 left-4 right-4 rounded-lg border border-border bg-card p-3 text-sm shadow-lg sm:left-auto sm:max-w-sm">
          <p className="text-muted-foreground">{s.message}</p>
          {s.dismissible ? (
            <button
              type="button"
              className="pointer-events-auto mt-2 text-xs font-medium text-primary underline"
              onClick={props.onDismiss}
            >
              Dismiss
            </button>
          ) : null}
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
