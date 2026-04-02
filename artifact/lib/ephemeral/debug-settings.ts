export type EphemeralDebugSettings = {
  /** Delay before auto support_triggered + fetch (0 = off). */
  hesitationMs: number;
  /** If true, next trial bootstrap also requests support with "initial" immediately. */
  supportOnTrialStart: boolean;
  /** 0 = production-like visuals; 1 = strongest stress-test styling on the ephemeral layer (and optionally targets). */
  visualStress: number;
  /** When visualStress is high, restyle elements that carry `data-ephemeral-id` (cards, alerts, etc.). */
  skinAllowlistedTargets: boolean;
  /** Send debugForceFallback to /api/support (requires NEXT_PUBLIC_DEBUG_SUPPORT=1). */
  forceApiFallback: boolean;
  /**
   * Global hue rotation for debug visuals (0–360°). Orthogonal to `visualStress`: same “shape”
   * language, different color wheel position—no named theme.
   */
  chromaticShiftDegrees: number;
  /** When true and targets are skinned, apply the same `--e-hue` to `[data-ephemeral-id]` nodes. */
  chromaticOnSkinnedTargets: boolean;
};

export const EPHEMERAL_DEBUG_STORAGE_KEY = "ephemeral-debug-settings-v1";

export const DEFAULT_EPHEMERAL_DEBUG_SETTINGS: EphemeralDebugSettings = {
  hesitationMs: 14_000,
  supportOnTrialStart: false,
  visualStress: 0,
  skinAllowlistedTargets: false,
  forceApiFallback: false,
  chromaticShiftDegrees: 0,
  chromaticOnSkinnedTargets: false,
};

export function loadEphemeralDebugSettings(): EphemeralDebugSettings {
  if (typeof window === "undefined") return DEFAULT_EPHEMERAL_DEBUG_SETTINGS;
  try {
    const raw = sessionStorage.getItem(EPHEMERAL_DEBUG_STORAGE_KEY);
    if (!raw) return DEFAULT_EPHEMERAL_DEBUG_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<EphemeralDebugSettings>;
    const chromaticRaw =
      typeof parsed.chromaticShiftDegrees === "number" && Number.isFinite(parsed.chromaticShiftDegrees)
        ? parsed.chromaticShiftDegrees
        : DEFAULT_EPHEMERAL_DEBUG_SETTINGS.chromaticShiftDegrees;
    const chromaticShiftDegrees = normalizeHueDegrees(chromaticRaw);
    return {
      hesitationMs:
        typeof parsed.hesitationMs === "number" && parsed.hesitationMs >= 0 && parsed.hesitationMs <= 600_000
          ? parsed.hesitationMs
          : DEFAULT_EPHEMERAL_DEBUG_SETTINGS.hesitationMs,
      supportOnTrialStart: Boolean(parsed.supportOnTrialStart),
      visualStress:
        typeof parsed.visualStress === "number" && parsed.visualStress >= 0 && parsed.visualStress <= 1
          ? parsed.visualStress
          : DEFAULT_EPHEMERAL_DEBUG_SETTINGS.visualStress,
      skinAllowlistedTargets: Boolean(parsed.skinAllowlistedTargets),
      forceApiFallback: Boolean(parsed.forceApiFallback),
      chromaticShiftDegrees,
      chromaticOnSkinnedTargets: Boolean(parsed.chromaticOnSkinnedTargets),
    };
  } catch {
    return DEFAULT_EPHEMERAL_DEBUG_SETTINGS;
  }
}

/** Maps 0–1 stress to CSS `data-target-stress` / `data-stress-band` tiers. */
/** Wraps any finite value to [0, 360). */
export function normalizeHueDegrees(deg: number): number {
  const x = Math.round(deg) % 360;
  return x < 0 ? x + 360 : x;
}

export function ephemeralStressBand(stress: number): "0" | "1" | "2" | "3" {
  if (stress <= 0.05) return "0";
  if (stress < 0.34) return "1";
  if (stress < 0.67) return "2";
  return "3";
}

export function saveEphemeralDebugSettings(settings: EphemeralDebugSettings): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(EPHEMERAL_DEBUG_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}
