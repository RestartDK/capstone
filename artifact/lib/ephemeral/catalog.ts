export const CATALOG_VERSION = "catalog-v3";

export const EPHEMERAL_COMPONENT_TYPES = [
  "Stack",
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
  "ViewportPanel",
  "TargetOffsetPanel",
  "FlowHtml",
  "AnchoredHtml",
] as const;

export type EphemeralComponentType = (typeof EPHEMERAL_COMPONENT_TYPES)[number];

export const MAX_SPEC_DEPTH = 4;
export const MAX_CHILDREN = 6;
export const MAX_MESSAGE_LENGTH = 400;
export const MAX_HINT_LINES = 4;
export const MAX_COMPARISON_HEADLINE = 100;
export const MAX_INSPECT_TITLE = 120;
export const MAX_INSPECT_SUMMARY = 280;
export const MAX_INSPECT_DETAIL_LINES = 4;
export const MAX_INSPECT_DETAIL_LENGTH = 200;
export const MAX_CONSEQUENCE_LINE = 220;
/** Rich HTML inside ViewportPanel only (sanitized server + client). */
export const MAX_FLOW_HTML_LENGTH = 3000;
/** Rich HTML anchored near a target (sanitized). */
export const MAX_ANCHORED_HTML_LENGTH = 1800;
