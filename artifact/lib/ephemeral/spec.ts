import { z } from "zod";

import {
  EPHEMERAL_COMPONENT_TYPES,
  MAX_CHILDREN,
  MAX_COMPARISON_HEADLINE,
  MAX_CONSEQUENCE_LINE,
  MAX_HINT_LINES,
  MAX_INSPECT_DETAIL_LENGTH,
  MAX_INSPECT_DETAIL_LINES,
  MAX_INSPECT_SUMMARY,
  MAX_INSPECT_TITLE,
  MAX_ANCHORED_HTML_LENGTH,
  MAX_FLOW_HTML_LENGTH,
  MAX_MESSAGE_LENGTH,
  MAX_SPEC_DEPTH,
  type EphemeralComponentType,
} from "./catalog";
import { sanitizeEphemeralHtml } from "./sanitize-html";

const placementEnum = z.enum(["top", "bottom", "left", "right"]);

const focusMaskProps = z.object({
  targetId: z.string().min(1).max(120),
  strength: z.number().min(0).max(1).optional(),
});

const highlightRingProps = z.object({
  targetId: z.string().min(1).max(120),
});

const pulseRingProps = z.object({
  targetId: z.string().min(1).max(120),
  durationMs: z.number().int().min(500).max(5000).optional(),
});

const arrowCueProps = z.object({
  targetId: z.string().min(1).max(120),
});

const anchoredTooltipProps = z.object({
  targetId: z.string().min(1).max(120),
  body: z.string().min(1).max(MAX_MESSAGE_LENGTH),
  placement: placementEnum.optional(),
});

const hintStackProps = z.object({
  targetId: z.string().min(1).max(120),
  lines: z.array(z.string().min(1).max(200)).min(1).max(MAX_HINT_LINES),
  placement: placementEnum.optional(),
});

const stepRailProps = z.object({
  targetIds: z.array(z.string().min(1).max(120)).min(2).max(6),
});

const connectorLineProps = z.object({
  fromTargetId: z.string().min(1).max(120),
  toTargetId: z.string().min(1).max(120),
});

const comparisonStripProps = z.object({
  leftTargetId: z.string().min(1).max(120),
  rightTargetId: z.string().min(1).max(120),
  headline: z.string().min(1).max(MAX_COMPARISON_HEADLINE).optional(),
  body: z.string().min(1).max(MAX_MESSAGE_LENGTH),
});

const inspectPanelProps = z.object({
  targetId: z.string().min(1).max(120),
  title: z.string().min(1).max(MAX_INSPECT_TITLE),
  summary: z.string().min(1).max(MAX_INSPECT_SUMMARY),
  details: z
    .array(z.string().min(1).max(MAX_INSPECT_DETAIL_LENGTH))
    .max(MAX_INSPECT_DETAIL_LINES)
    .optional(),
  placement: placementEnum.optional(),
});

const consequenceNoteProps = z.object({
  targetId: z.string().min(1).max(120),
  line: z.string().min(1).max(MAX_CONSEQUENCE_LINE),
  placement: placementEnum.optional(),
});

const stackProps = z.object({
  gap: z.enum(["none", "sm", "md"]).optional(),
});

const edgeEnum = z.enum(["top", "bottom", "left", "right", "center"]);

const viewportPanelProps = z.object({
  topPct: z.number().min(0).max(100),
  leftPct: z.number().min(0).max(100),
  widthPct: z.number().min(15).max(96),
  maxHeightVh: z.number().min(12).max(88).optional(),
  zIndex: z.number().int().min(1).max(100).optional(),
  pointerEvents: z.enum(["auto", "none"]).optional(),
});

const targetOffsetPanelProps = z.object({
  targetId: z.string().min(1).max(120),
  widthPx: z.number().int().min(200).max(520),
  shiftXPx: z.number().int().min(-480).max(480),
  shiftYPx: z.number().int().min(-480).max(480),
  edge: edgeEnum,
});

const flowHtmlProps = z.object({
  html: z.string().min(1).max(MAX_FLOW_HTML_LENGTH),
});

const anchoredHtmlProps = z.object({
  targetId: z.string().min(1).max(120),
  html: z.string().min(1).max(MAX_ANCHORED_HTML_LENGTH),
  placement: placementEnum.optional(),
});

export const COMPONENT_PROPS_MAP: Record<EphemeralComponentType, z.ZodType> = {
  Stack: stackProps,
  FocusMask: focusMaskProps,
  HighlightRing: highlightRingProps,
  PulseRing: pulseRingProps,
  ArrowCue: arrowCueProps,
  AnchoredTooltip: anchoredTooltipProps,
  HintStack: hintStackProps,
  StepRail: stepRailProps,
  ConnectorLine: connectorLineProps,
  ComparisonStrip: comparisonStripProps,
  InspectPanel: inspectPanelProps,
  ConsequenceNote: consequenceNoteProps,
  ViewportPanel: viewportPanelProps,
  TargetOffsetPanel: targetOffsetPanelProps,
  FlowHtml: flowHtmlProps,
  AnchoredHtml: anchoredHtmlProps,
};

export type EphemeralNode = {
  type: EphemeralComponentType;
  props: Record<string, unknown>;
  children?: EphemeralNode[];
};

export type EphemeralSpecMeta = {
  dismissible: boolean;
  autoHideMs?: number | null;
};

export type EphemeralSpec = {
  version: 1;
  root: EphemeralNode;
  meta: EphemeralSpecMeta;
};

/**
 * Zod schema for a single node (non-recursive). Children are validated
 * procedurally via parseNodeTree to avoid z.lazy compatibility issues.
 */
const flatNodeSchema = z.object({
  type: z.enum(EPHEMERAL_COMPONENT_TYPES),
  props: z.record(z.string(), z.unknown()),
  children: z.array(z.unknown()).max(MAX_CHILDREN).optional(),
});

function parseNodeTree(raw: unknown, depth: number): EphemeralNode | null {
  if (depth > MAX_SPEC_DEPTH) return null;
  const parsed = flatNodeSchema.safeParse(raw);
  if (!parsed.success) return null;

  const node: EphemeralNode = {
    type: parsed.data.type,
    props: parsed.data.props,
  };

  if (parsed.data.children && parsed.data.children.length > 0) {
    const children: EphemeralNode[] = [];
    for (const child of parsed.data.children) {
      const childNode = parseNodeTree(child, depth + 1);
      if (!childNode) return null;
      children.push(childNode);
    }
    node.children = children;
  }

  return node;
}

const specMetaSchema = z.object({
  dismissible: z.boolean(),
  autoHideMs: z.number().int().positive().nullable().optional(),
});

const specEnvelopeSchema = z.object({
  version: z.literal(1),
  root: z.unknown(),
  meta: specMetaSchema,
});

/**
 * Non-recursive Zod schema for structured model output (generateText + Output.object).
 * Depth matches MAX_SPEC_DEPTH = 4 (deepest nodes are leaves with no children).
 */
/**
 * AI structured output: max parse depth matches MAX_SPEC_DEPTH (4).
 * Root (1) → L1 (2) → L2 (3) → leaf (4); leaves have no children in JSON.
 */
const specModelLeaf = z.object({
  type: z.enum(EPHEMERAL_COMPONENT_TYPES),
  props: z.record(z.string(), z.unknown()),
});

const specModelL2 = z.object({
  type: z.enum(EPHEMERAL_COMPONENT_TYPES),
  props: z.record(z.string(), z.unknown()),
  children: z.array(specModelLeaf).max(MAX_CHILDREN).optional(),
});

const specModelL1 = z.object({
  type: z.enum(EPHEMERAL_COMPONENT_TYPES),
  props: z.record(z.string(), z.unknown()),
  children: z.array(specModelL2).max(MAX_CHILDREN).optional(),
});

export const ephemeralSpecSchemaForModel = z.object({
  version: z.literal(1),
  root: z.object({
    type: z.enum(EPHEMERAL_COMPONENT_TYPES),
    props: z.record(z.string(), z.unknown()),
    children: z.array(specModelL1).max(MAX_CHILDREN).optional(),
  }),
  meta: specMetaSchema,
});

function validateNodeProps(node: EphemeralNode): boolean {
  const schemaForType = COMPONENT_PROPS_MAP[node.type];
  if (!schemaForType) return false;
  const result = schemaForType.safeParse(node.props);
  if (!result.success) return false;
  if (node.children) {
    return node.children.every(validateNodeProps);
  }
  return true;
}

function collectTargetIds(node: EphemeralNode): string[] {
  const ids: string[] = [];
  const props = node.props;
  if (typeof props.targetId === "string") ids.push(props.targetId);
  if (typeof props.fromTargetId === "string") ids.push(props.fromTargetId);
  if (typeof props.toTargetId === "string") ids.push(props.toTargetId);
  if (typeof props.leftTargetId === "string") ids.push(props.leftTargetId);
  if (typeof props.rightTargetId === "string") ids.push(props.rightTargetId);
  if (Array.isArray(props.targetIds)) {
    for (const t of props.targetIds) {
      if (typeof t === "string") ids.push(t);
    }
  }
  if (node.children) {
    for (const c of node.children) {
      ids.push(...collectTargetIds(c));
    }
  }
  return ids;
}

function collectComponentTypes(node: EphemeralNode): string[] {
  const types: string[] = [node.type];
  if (node.children) {
    for (const c of node.children) {
      types.push(...collectComponentTypes(c));
    }
  }
  return types;
}

export function allowlistWalk(
  spec: EphemeralSpec,
  allowedTargets: readonly string[],
) {
  const targetIds = collectTargetIds(spec.root);
  const componentTypes = [...new Set(collectComponentTypes(spec.root))];
  const valid =
    validateNodeProps(spec.root) &&
    targetIds.every((id) => allowedTargets.includes(id)) &&
    validateFlowHtmlAncestors(spec.root);
  return { valid, targetIds, componentTypes };
}

/** FlowHtml may only appear under a ViewportPanel (any depth below it). */
export function validateFlowHtmlAncestors(root: EphemeralNode): boolean {
  function walk(node: EphemeralNode, underViewport: boolean): boolean {
    if (node.type === "FlowHtml" && !underViewport) {
      return false;
    }
    const next = underViewport || node.type === "ViewportPanel";
    if (node.children) {
      for (const c of node.children) {
        if (!walk(c, next)) return false;
      }
    }
    return true;
  }
  return walk(root, false);
}

export function sanitizeHtmlFieldsInTree(node: EphemeralNode): EphemeralNode {
  const props = { ...node.props };
  if (node.type === "FlowHtml" || node.type === "AnchoredHtml") {
    const raw = props.html;
    if (typeof raw === "string") {
      props.html = sanitizeEphemeralHtml(raw);
    }
  }
  const children = node.children?.map(sanitizeHtmlFieldsInTree);
  const out: EphemeralNode = { type: node.type, props };
  if (children?.length) out.children = children;
  return out;
}

/** Logged when the participant opens the optional detail block on InspectPanel. */
export type EphemeralSupportInteraction = { kind: "inspect_expanded" };

export function parseEphemeralSpec(raw: unknown): EphemeralSpec | null {
  const envelope = specEnvelopeSchema.safeParse(raw);
  if (!envelope.success) return null;

  const root = parseNodeTree(envelope.data.root, 1);
  if (!root) return null;

  return {
    version: 1,
    root: sanitizeHtmlFieldsInTree(root),
    meta: envelope.data.meta,
  };
}
