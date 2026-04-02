import { z } from "zod";

import {
  EPHEMERAL_COMPONENT_TYPES,
  MAX_CHILDREN,
  MAX_HINT_LINES,
  MAX_MESSAGE_LENGTH,
  MAX_SPEC_DEPTH,
  type EphemeralComponentType,
} from "./catalog";

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

const stackProps = z.object({
  gap: z.enum(["none", "sm", "md"]).optional(),
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
 * Tree validation happens post-hoc in parseEphemeralSpec.
 */
export const ephemeralSpecSchemaForModel = z.object({
  version: z.literal(1),
  root: z.object({
    type: z.enum(EPHEMERAL_COMPONENT_TYPES),
    props: z.record(z.string(), z.unknown()),
    children: z
      .array(
        z.object({
          type: z.enum(EPHEMERAL_COMPONENT_TYPES),
          props: z.record(z.string(), z.unknown()),
          children: z
            .array(
              z.object({
                type: z.enum(EPHEMERAL_COMPONENT_TYPES),
                props: z.record(z.string(), z.unknown()),
              }),
            )
            .max(MAX_CHILDREN)
            .optional(),
        }),
      )
      .max(MAX_CHILDREN)
      .optional(),
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
    targetIds.every((id) => allowedTargets.includes(id));
  return { valid, targetIds, componentTypes };
}

export function parseEphemeralSpec(raw: unknown): EphemeralSpec | null {
  const envelope = specEnvelopeSchema.safeParse(raw);
  if (!envelope.success) return null;

  const root = parseNodeTree(envelope.data.root, 1);
  if (!root) return null;

  return {
    version: 1,
    root,
    meta: envelope.data.meta,
  };
}
