"use client";

import * as React from "react";

import { useTargetRect } from "../useTargetRect";

type Edge = "top" | "bottom" | "left" | "right" | "center";

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function computeStyle(
  rect: DOMRect,
  edge: Edge,
  width: number,
  shiftXPx: number,
  shiftYPx: number,
): React.CSSProperties {
  const gap = 10;
  let left = 0;
  let top = 0;
  let transform: string | undefined;

  switch (edge) {
    case "bottom":
      left = rect.left + rect.width / 2 - width / 2 + shiftXPx;
      top = rect.bottom + gap + shiftYPx;
      break;
    case "top":
      left = rect.left + rect.width / 2 - width / 2 + shiftXPx;
      top = rect.top - gap + shiftYPx;
      transform = "translateY(-100%)";
      break;
    case "right":
      left = rect.right + gap + shiftXPx;
      top = rect.top + rect.height / 2 + shiftYPx;
      transform = "translateY(-50%)";
      break;
    case "left":
      left = rect.left - gap - width + shiftXPx;
      top = rect.top + rect.height / 2 + shiftYPx;
      transform = "translateY(-50%)";
      break;
    case "center":
    default:
      left = rect.left + rect.width / 2 - width / 2 + shiftXPx;
      top = rect.top + rect.height / 2 + shiftYPx;
      transform = "translateY(-50%)";
      break;
  }

  const vw = typeof window !== "undefined" ? window.innerWidth : 800;
  const vh = typeof window !== "undefined" ? window.innerHeight : 600;
  left = clamp(left, 8, vw - width - 8);
  top = clamp(top, 8, vh - 24);

  return {
    position: "absolute",
    left,
    top,
    width,
    transform,
  };
}

export function CatalogTargetOffsetPanel(props: {
  targetId: string;
  widthPx: number;
  shiftXPx: number;
  shiftYPx: number;
  edge: Edge;
  children?: React.ReactNode;
}): React.JSX.Element | null {
  const rect = useTargetRect(props.targetId);

  if (!rect) return null;

  const style = computeStyle(rect, props.edge, props.widthPx, props.shiftXPx, props.shiftYPx);

  return (
    <div
      className="pointer-events-auto overflow-auto rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg"
      style={style}
    >
      {props.children}
    </div>
  );
}
