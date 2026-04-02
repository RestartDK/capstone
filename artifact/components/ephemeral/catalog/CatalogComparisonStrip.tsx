"use client";

import type { CSSProperties } from "react";

import { useTargetRect } from "../useTargetRect";

export function CatalogComparisonStrip(props: {
  leftTargetId: string;
  rightTargetId: string;
  headline?: string;
  body: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}): React.JSX.Element | null {
  const left = useTargetRect(props.leftTargetId);
  const right = useTargetRect(props.rightTargetId);

  if (!left || !right) return null;

  const minLeft = Math.min(left.left, right.left);
  const maxRight = Math.max(left.right, right.right);
  const unionBottom = Math.max(left.bottom, right.bottom);
  const centerX = (minLeft + maxRight) / 2;
  const width = Math.min(320, window.innerWidth - 16);

  const style: CSSProperties = {
    left: Math.min(window.innerWidth - width - 8, Math.max(8, centerX - width / 2)),
    top: unionBottom + 10,
  };

  return (
    <div
      className="pointer-events-auto absolute w-[min(320px,calc(100vw-2rem))] rounded-lg border border-amber-500/40 bg-popover p-3 text-popover-foreground shadow-lg"
      style={style}
    >
      {props.headline ? (
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
          {props.headline}
        </p>
      ) : null}
      <p className="text-sm leading-snug">{props.body}</p>
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
