"use client";

import { createPortal } from "react-dom";

import type { EphemeralSpec } from "@/lib/ephemeral/spec";

import { EphemeralRenderer } from "./EphemeralRenderer";

export function EphemeralLayer(props: {
  spec: EphemeralSpec | null;
  onDismiss: () => void;
}): React.ReactElement | null {
  if (typeof document === "undefined" || !props.spec) {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-50" aria-live="polite">
      <EphemeralRenderer
        root={props.spec.root}
        dismissible={props.spec.meta.dismissible}
        onDismiss={props.onDismiss}
      />
    </div>,
    document.body,
  );
}
