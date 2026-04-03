const MAX_HESITATION_MS = 600_000;

/** Default when `NEXT_PUBLIC_SUPPORT_HESITATION_MS` is unset (ms). */
const HESITATION_FALLBACK_MS = 3_500;

function clampHesitationMs(n: number): number {
  if (!Number.isFinite(n) || n < 0) return HESITATION_FALLBACK_MS;
  return Math.min(Math.trunc(n), MAX_HESITATION_MS);
}

/**
 * Hesitation delay before automatic assistance fetch (ephemeral trials).
 * Override with `NEXT_PUBLIC_SUPPORT_HESITATION_MS` (parsed at build time on the client).
 */
export function getDefaultSupportHesitationMs(): number {
  const raw = process.env.NEXT_PUBLIC_SUPPORT_HESITATION_MS;
  if (raw === undefined || raw === "") return HESITATION_FALLBACK_MS;
  const n = Number.parseInt(raw, 10);
  return clampHesitationMs(n);
}

export const DEFAULT_SUPPORT_HESITATION_MS = getDefaultSupportHesitationMs();
