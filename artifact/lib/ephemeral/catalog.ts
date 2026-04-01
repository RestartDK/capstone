export const CATALOG_VERSION = "catalog-v1";

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
] as const;

export type EphemeralComponentType = (typeof EPHEMERAL_COMPONENT_TYPES)[number];

export const MAX_SPEC_DEPTH = 3;
export const MAX_CHILDREN = 6;
export const MAX_MESSAGE_LENGTH = 400;
export const MAX_HINT_LINES = 4;
