/**
 * Counterbalanced labeling (see `participants.baseline_is_version_a`).
 * Baseline = no ephemeral layer; ephemeral = temporary assistance may appear.
 */
export function interfaceVersionLetter(
  baselineIsVersionA: boolean,
  condition: "baseline" | "ephemeral",
): "A" | "B" {
  if (condition === "baseline") {
    return baselineIsVersionA ? "A" : "B";
  }
  return baselineIsVersionA ? "B" : "A";
}

/** Short copy for instruction / debrief: what A and B referred to for this participant. */
export function interfaceVersionLegend(baselineIsVersionA: boolean): {
  lineA: string;
  lineB: string;
} {
  if (baselineIsVersionA) {
    return {
      lineA: "Version A: interface without temporary on-screen assistance.",
      lineB: "Version B: interface where temporary assistance could appear.",
    };
  }
  return {
    lineA: "Version A: interface where temporary assistance could appear.",
    lineB: "Version B: interface without temporary on-screen assistance.",
  };
}
