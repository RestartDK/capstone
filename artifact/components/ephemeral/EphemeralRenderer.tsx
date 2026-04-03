"use client";

import type { EphemeralNode, EphemeralSupportInteraction } from "@/lib/ephemeral/spec";

import {
  AnchoredTooltip,
  CatalogAnchoredHtml,
  CatalogArrowCue,
  CatalogComparisonStrip,
  CatalogConsequenceNote,
  CatalogFlowHtml,
  CatalogHighlightRing,
  CatalogInspectPanel,
  CatalogSideNote,
  CatalogTargetOffsetPanel,
  CatalogViewportPanel,
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
  onSupportInteraction?: (interaction: EphemeralSupportInteraction) => void;
}) {
  const { node, dismissible, onDismiss, onSupportInteraction } = props;
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
          variant={p.variant as "popover" | "inline" | undefined}
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

    case "ComparisonStrip":
      return (
        <CatalogComparisonStrip
          leftTargetId={p.leftTargetId as string}
          rightTargetId={p.rightTargetId as string}
          headline={p.headline as string | undefined}
          body={p.body as string}
          dismissible={dismissible}
          onDismiss={onDismiss}
        />
      );

    case "InspectPanel":
      return (
        <CatalogInspectPanel
          targetId={p.targetId as string}
          title={p.title as string}
          summary={p.summary as string}
          details={p.details as string[] | undefined}
          placement={p.placement as "top" | "bottom" | "left" | "right" | undefined}
          dismissible={dismissible}
          onDismiss={onDismiss}
          onInspectExpanded={() => onSupportInteraction?.({ kind: "inspect_expanded" })}
        />
      );

    case "ConsequenceNote":
      return (
        <CatalogConsequenceNote
          targetId={p.targetId as string}
          line={p.line as string}
          placement={p.placement as "top" | "bottom" | "left" | "right" | undefined}
        />
      );

    case "ViewportPanel": {
      const c = node.children ?? [];
      return (
        <CatalogViewportPanel
          topPct={p.topPct as number}
          leftPct={p.leftPct as number}
          widthPct={p.widthPct as number}
          maxHeightVh={p.maxHeightVh as number | undefined}
          zIndex={p.zIndex as number | undefined}
          pointerEvents={p.pointerEvents as "auto" | "none" | undefined}
        >
          {c.map((child, i) => (
            <RenderNode
              key={i}
              node={child}
              dismissible={dismissible}
              onDismiss={onDismiss}
              onSupportInteraction={onSupportInteraction}
            />
          ))}
        </CatalogViewportPanel>
      );
    }

    case "TargetOffsetPanel": {
      const c = node.children ?? [];
      return (
        <CatalogTargetOffsetPanel
          targetId={p.targetId as string}
          widthPx={p.widthPx as number}
          shiftXPx={p.shiftXPx as number}
          shiftYPx={p.shiftYPx as number}
          edge={p.edge as "top" | "bottom" | "left" | "right" | "center"}
        >
          {c.length > 0
            ? c.map((child, i) => (
                <RenderNode
                  key={i}
                  node={child}
                  dismissible={dismissible}
                  onDismiss={onDismiss}
                  onSupportInteraction={onSupportInteraction}
                />
              ))
            : null}
        </CatalogTargetOffsetPanel>
      );
    }

    case "FlowHtml":
      return <CatalogFlowHtml html={p.html as string} />;

    case "AnchoredHtml":
      return (
        <CatalogAnchoredHtml
          targetId={p.targetId as string}
          html={p.html as string}
          placement={p.placement as "top" | "bottom" | "left" | "right" | undefined}
          variant={p.variant as "popover" | "inline" | undefined}
          dismissible={dismissible}
          onDismiss={onDismiss}
        />
      );

    case "SideNote":
      return (
        <CatalogSideNote
          targetId={p.targetId as string}
          side={p.side as "left" | "right" | undefined}
          body={p.body as string | undefined}
          html={p.html as string | undefined}
          widthPx={p.widthPx as number | undefined}
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
              onSupportInteraction={onSupportInteraction}
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
  onSupportInteraction?: (interaction: EphemeralSupportInteraction) => void;
}) {
  return (
    <RenderNode
      node={props.root}
      dismissible={props.dismissible}
      onDismiss={props.onDismiss}
      onSupportInteraction={props.onSupportInteraction}
    />
  );
}
