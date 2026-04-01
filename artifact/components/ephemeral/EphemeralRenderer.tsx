"use client";

import type { EphemeralNode } from "@/lib/ephemeral/spec";

import {
  AnchoredTooltip,
  CatalogArrowCue,
  CatalogHighlightRing,
  ConnectorLine,
  FocusMask,
  HintStack,
  PulseRing,
  StepRail,
} from "./catalog";

function RenderNode(props: {
  node: EphemeralNode;
  dismissible: boolean;
  onDismiss: () => void;
}) {
  const { node, dismissible, onDismiss } = props;
  const p = node.props as Record<string, unknown>;

  switch (node.type) {
    case "FocusMask":
      return (
        <FocusMask
          targetId={p.targetId as string}
          strength={p.strength as number | undefined}
        />
      );

    case "HighlightRing":
      return <CatalogHighlightRing targetId={p.targetId as string} />;

    case "PulseRing":
      return (
        <PulseRing
          targetId={p.targetId as string}
          durationMs={p.durationMs as number | undefined}
        />
      );

    case "ArrowCue":
      return <CatalogArrowCue targetId={p.targetId as string} />;

    case "AnchoredTooltip":
      return (
        <AnchoredTooltip
          targetId={p.targetId as string}
          body={p.body as string}
          placement={p.placement as "top" | "bottom" | "left" | "right" | undefined}
          dismissible={dismissible}
          onDismiss={onDismiss}
        />
      );

    case "HintStack":
      return (
        <HintStack
          targetId={p.targetId as string}
          lines={p.lines as string[]}
          placement={p.placement as "top" | "bottom" | "left" | "right" | undefined}
        />
      );

    case "StepRail":
      return <StepRail targetIds={p.targetIds as string[]} />;

    case "ConnectorLine":
      return (
        <ConnectorLine
          fromTargetId={p.fromTargetId as string}
          toTargetId={p.toTargetId as string}
        />
      );

    case "Stack": {
      const children = node.children ?? [];
      return (
        <>
          {children.map((child, i) => (
            <RenderNode
              key={i}
              node={child}
              dismissible={dismissible}
              onDismiss={onDismiss}
            />
          ))}
        </>
      );
    }

    default:
      return null;
  }
}

export function EphemeralRenderer(props: {
  root: EphemeralNode;
  dismissible: boolean;
  onDismiss: () => void;
}) {
  return (
    <RenderNode
      node={props.root}
      dismissible={props.dismissible}
      onDismiss={props.onDismiss}
    />
  );
}
