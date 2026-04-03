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

/** Trial order is always Version A first, then B; this maps the label to the underlying condition. */
export function conditionForVersionLetter(
  baselineIsVersionA: boolean,
  letter: "A" | "B",
): "baseline" | "ephemeral" {
  if (letter === "A") {
    return baselineIsVersionA ? "baseline" : "ephemeral";
  }
  return baselineIsVersionA ? "ephemeral" : "baseline";
}

/** Short copy for instruction / debrief: what A and B referred to for this participant. */
export function interfaceVersionLegend(baselineIsVersionA: boolean): {
  lineA: string;
  lineB: string;
} {
  if (baselineIsVersionA) {
    return {
      lineA:
        "Version A: no extra on-screen help — the interface on its own, without assistance.",
      lineB:
        "Version B: the same interface, but temporary on-screen assistance may appear (you can ignore or close it).",
    };
  }
  return {
    lineA:
      "Version A: the same interface, but temporary on-screen assistance may appear (you can ignore or close it).",
    lineB:
      "Version B: no extra on-screen help — the interface on its own, without assistance.",
  };
}
