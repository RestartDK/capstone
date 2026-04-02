import { isScenarioId } from "@/lib/scenarios/ids";
import { getScenarioEntry } from "@/lib/scenarios/registry";
import { buildFallbackSpec } from "@/lib/support-schema";

import type { EphemeralSpec } from "./spec";

export type EphemeralDebugPresetId =
  | "viewport_flow"
  | "target_offset_flow"
  | "anchored_html"
  | "relational_classic";

/** Human-readable labels for the debug panel `<select>`. */
export const EPHEMERAL_DEBUG_PRESET_OPTIONS: { id: EphemeralDebugPresetId; label: string }[] = [
  { id: "viewport_flow", label: "Viewport % panel + FlowHtml" },
  { id: "target_offset_flow", label: "Target offset panel + FlowHtml" },
  { id: "anchored_html", label: "AnchoredHtml (rich tooltip)" },
  { id: "relational_classic", label: "Relational classic (fallback-shaped)" },
];

export function buildEphemeralDebugPreset(
  scenarioId: string,
  preset: EphemeralDebugPresetId,
): EphemeralSpec | null {
  if (!isScenarioId(scenarioId)) return null;

  if (preset === "relational_classic") {
    return buildFallbackSpec(scenarioId).spec;
  }

  const entry = getScenarioEntry(scenarioId);
  if (!entry) return null;
  const ids = entry.ephemeralTargets;
  const t0 = ids[0] ?? "";
  const t1 = ids[1] ?? t0;
  const t2 = ids[2] ?? t0;

  const baseMeta = { dismissible: true, autoHideMs: null };

  if (preset === "viewport_flow") {
    return {
      version: 1,
      meta: baseMeta,
      root: {
        type: "Stack",
        props: { gap: "sm" },
        children: [
          {
            type: "ViewportPanel",
            props: { topPct: 6, leftPct: 4, widthPct: 40, maxHeightVh: 42 },
            children: [
              {
                type: "FlowHtml",
                props: {
                  html: "<p><strong>Preset: ViewportPanel + FlowHtml</strong></p><p>Placed with top/left/width percentages on the overlay.</p><ul><li>Sanitized list item</li><li>Second item</li></ul>",
                },
              },
            ],
          },
          { type: "HighlightRing", props: { targetId: t0 } },
        ],
      },
    };
  }

  if (preset === "target_offset_flow") {
    return {
      version: 1,
      meta: baseMeta,
      root: {
        type: "Stack",
        props: { gap: "sm" },
        children: [
          {
            type: "TargetOffsetPanel",
            props: {
              targetId: t0,
              widthPx: 300,
              shiftXPx: 0,
              shiftYPx: 12,
              edge: "bottom",
            },
            children: [
              {
                type: "FlowHtml",
                props: {
                  html: "<p><strong>Preset: TargetOffsetPanel</strong></p><p>Offset from an allowlisted node + HTML body.</p>",
                },
              },
            ],
          },
          { type: "ArrowCue", props: { targetId: t0 } },
        ],
      },
    };
  }

  if (preset === "anchored_html") {
    return {
      version: 1,
      meta: baseMeta,
      root: {
        type: "Stack",
        props: { gap: "sm" },
        children: [
          {
            type: "AnchoredHtml",
            props: {
              targetId: t1,
              placement: "bottom",
              html: "<p><strong>AnchoredHtml</strong> preset</p><p>Uses <code>targetId</code> + <strong>sanitized</strong> HTML.</p>",
            },
          },
          { type: "PulseRing", props: { targetId: t1 } },
          { type: "ConnectorLine", props: { fromTargetId: t0, toTargetId: t2 } },
        ],
      },
    };
  }

  return null;
}
