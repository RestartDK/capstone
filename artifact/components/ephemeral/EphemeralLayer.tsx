"use client";

import type { CSSProperties, ReactElement } from "react";
import { createPortal } from "react-dom";

import { normalizeHueDegrees } from "@/lib/ephemeral/debug-settings";
import { cn } from "@/lib/utils";
import type { EphemeralSpec, EphemeralSupportInteraction } from "@/lib/ephemeral/spec";

import { EphemeralRenderer } from "./EphemeralRenderer";

import "./ephemeral-debug.css";

function stressBand(stress: number): "0" | "1" | "2" | "3" {
  if (stress <= 0) return "0";
  if (stress < 0.34) return "1";
  if (stress < 0.67) return "2";
  return "3";
}

export function EphemeralLayer(props: {
  spec: EphemeralSpec | null;
  onDismiss: () => void;
  onSupportInteraction?: (interaction: EphemeralSupportInteraction) => void;
  /** 0–1 debug visual intensity (borders, radius, type). */
  visualStress?: number;
  /** 0–360° CSS hue-rotate on overlay subtree; orthogonal to stress. */
  chromaticShiftDegrees?: number;
}): ReactElement | null {
  if (typeof document === "undefined" || !props.spec) {
    return null;
  }

  const stress = props.visualStress ?? 0;
  const hue = normalizeHueDegrees(props.chromaticShiftDegrees ?? 0);
  const band = stressBand(stress);
  const showStress = stress > 0;
  const hueActive = hue !== 0;

  return createPortal(
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-50",
        showStress && "ephemeral-layer-stress",
        !showStress && hueActive && "ephemeral-layer-hue-only",
      )}
      aria-live="polite"
      data-ephemeral-layer-root
      data-stress-band={band}
      style={
        {
          "--e-stress": String(stress),
          "--e-hue": `${hue}deg`,
        } as CSSProperties
      }
    >
      <EphemeralRenderer
        root={props.spec.root}
        dismissible={props.spec.meta.dismissible}
        onDismiss={props.onDismiss}
        onSupportInteraction={props.onSupportInteraction}
      />
    </div>,
    document.body,
  );
}
