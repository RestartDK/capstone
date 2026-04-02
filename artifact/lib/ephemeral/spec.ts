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
});

const specEnvelopeSchema = z.object({
  version: z.literal(1),
  root: z.unknown(),
  meta: specMetaSchema,
});

function validateStructuralContainers(root: EphemeralNode): boolean {
  function walk(node: EphemeralNode): boolean {
    if (
      node.type === "Stack" ||
      node.type === "ViewportPanel" ||
      node.type === "TargetOffsetPanel"
    ) {
      if (!node.children || node.children.length === 0) {
        return false;
      }
    }
    if (node.children) {
      return node.children.every(walk);
    }
    return true;
  }
  return walk(root);
}

/**
 * Provider-friendly subset of the runtime schema for `Output.object`.
 *
 * Keep this much simpler than the full parser/validator tree:
 * - root is always a Stack for model output
 * - only one level of nested panel containers is allowed
 * - props use a single typed bag instead of a deep discriminated union
 *
 * Runtime acceptance still goes through `parseEphemeralSpec` + `allowlistWalk`, which apply the
 * strict per-component prop schemas and structural rules used by the app.
 */
const MODEL_LEAF_TYPES = [
  "FocusMask",
  "HighlightRing",
  "PulseRing",
  "ArrowCue",
  "AnchoredTooltip",
  "HintStack",
  "StepRail",
  "ConnectorLine",
  "ComparisonStrip",
  "InspectPanel",
  "ConsequenceNote",
  "FlowHtml",
  "AnchoredHtml",
] as const;

const modelPropsSchema = z
  .object({
    gap: z.enum(["none", "sm", "md"]).optional(),
    targetId: z.string().min(1).max(120).optional(),
    strength: z.number().min(0).max(1).optional(),
    durationMs: z.number().int().min(500).max(5000).optional(),
    body: z.string().min(1).max(MAX_MESSAGE_LENGTH).optional(),
    placement: placementEnum.optional(),
    lines: z.array(z.string().min(1).max(200)).min(1).max(MAX_HINT_LINES).optional(),
    targetIds: z.array(z.string().min(1).max(120)).min(2).max(6).optional(),
    fromTargetId: z.string().min(1).max(120).optional(),
    toTargetId: z.string().min(1).max(120).optional(),
    leftTargetId: z.string().min(1).max(120).optional(),
    rightTargetId: z.string().min(1).max(120).optional(),
    headline: z.string().min(1).max(MAX_COMPARISON_HEADLINE).optional(),
    title: z.string().min(1).max(MAX_INSPECT_TITLE).optional(),
    summary: z.string().min(1).max(MAX_INSPECT_SUMMARY).optional(),
    details: z
      .array(z.string().min(1).max(MAX_INSPECT_DETAIL_LENGTH))
      .max(MAX_INSPECT_DETAIL_LINES)
      .optional(),
    line: z.string().min(1).max(MAX_CONSEQUENCE_LINE).optional(),
    topPct: z.number().min(0).max(100).optional(),
    leftPct: z.number().min(0).max(100).optional(),
    widthPct: z.number().min(15).max(96).optional(),
    maxHeightVh: z.number().min(12).max(88).optional(),
    zIndex: z.number().int().min(1).max(100).optional(),
    pointerEvents: z.enum(["auto", "none"]).optional(),
    widthPx: z.number().int().min(200).max(520).optional(),
    shiftXPx: z.number().int().min(-480).max(480).optional(),
    shiftYPx: z.number().int().min(-480).max(480).optional(),
    edge: edgeEnum.optional(),
    html: z.string().min(1).max(MAX_FLOW_HTML_LENGTH).optional(),
  })
  .strict();

const modelNonEmptyPropsSchema = modelPropsSchema.refine(
  (props) => Object.keys(props).length > 0,
  "props must include at least one field",
);

const modelLeafNode = z.object({
  type: z.enum(MODEL_LEAF_TYPES),
  props: modelNonEmptyPropsSchema,
});

const modelViewportPanelNode = z.object({
  type: z.literal("ViewportPanel"),
  props: modelNonEmptyPropsSchema,
  children: z.array(modelLeafNode).min(1).max(MAX_CHILDREN),
});

const modelTargetOffsetPanelNode = z.object({
  type: z.literal("TargetOffsetPanel"),
  props: modelNonEmptyPropsSchema,
  children: z.array(modelLeafNode).min(1).max(MAX_CHILDREN),
});

const modelRootChildNode = z.discriminatedUnion("type", [
  modelLeafNode,
  modelViewportPanelNode,
  modelTargetOffsetPanelNode,
]);

const modelRootStack = z.object({
  type: z.literal("Stack"),
  props: stackProps,
  children: z.array(modelRootChildNode).min(1).max(MAX_CHILDREN),
});

/**
 * Zod schema for `generateText(..., Output.object({ schema }))` with Gemini.
 * Gemini's `response_schema` rejects integer `enum` values (e.g. `version: 1`);
 * use string `"1"` here and coerce before `parseEphemeralSpec` (which expects `version: 1`).
 */
export const ephemeralSpecSchemaForModel = z.object({
  version: z.literal("1"),
  root: modelRootStack,
  meta: specMetaSchema,
});

/** Normalizes model JSON (version `"1"`) to app `EphemeralSpec` envelope (`version: 1`). */
export function coerceEphemeralSpecVersionFromModel(raw: unknown): unknown {
  if (raw === null || raw === undefined || typeof raw !== "object" || Array.isArray(raw)) {
    return raw;
  }
  const o = raw as Record<string, unknown>;
  if (o.version === "1") {
    return { ...o, version: 1 };
  }
  return raw;
}

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
    validateStructuralContainers(spec.root) &&
    targetIds.every((id) => allowedTargets.includes(id)) &&
    validateFlowHtmlAncestors(spec.root);
  return { valid, targetIds, componentTypes };
}

/**
 * Human-oriented detail when `parseEphemeralSpec` returns null (envelope vs tree).
 * For server logs only.
 */
export function describeEphemeralSpecParseFailure(raw: unknown): string {
  const envelope = specEnvelopeSchema.safeParse(raw);
  if (!envelope.success) {
    return envelope.error.issues
      .slice(0, 6)
      .map((i) => `${i.path.join(".") || "root"}: ${i.message}`)
      .join("; ");
  }
  const root = parseNodeTree(envelope.data.root, 1);
  if (!root) {
    return "root subtree invalid (node shape, child count, or depth > MAX_SPEC_DEPTH)";
  }
  return "";
}

/**
 * Why `allowlistWalk` would be false for an already-parsed spec (props, targets, FlowHtml rule).
 */
export function getSpecRuleViolations(
  spec: EphemeralSpec,
  allowedTargets: readonly string[],
): string[] {
  const issues: string[] = [];
  if (!validateNodeProps(spec.root)) {
    issues.push("props_schema_mismatch_on_one_or_more_nodes");
  }
  const targetIds = collectTargetIds(spec.root);
  const disallowed = [...new Set(targetIds.filter((id) => !allowedTargets.includes(id)))];
  if (disallowed.length > 0) {
    issues.push(`targets_not_allowlisted: ${disallowed.join(", ")}`);
  }
  if (!validateFlowHtmlAncestors(spec.root)) {
    issues.push("flow_html_not_under_viewport_panel");
  }
  if (!validateStructuralContainers(spec.root)) {
    issues.push("stack_viewport_or_target_offset_missing_children");
  }
  return issues;
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
