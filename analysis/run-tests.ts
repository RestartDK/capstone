/**
 * Run all statistical tests for the ephemeral UI user study.
 *
 * Reads CSVs exported by export-csv.ts and prints test results
 * ready to paste into results.tex.
 *
 * Usage (from this directory):
 *   bun install
 *   bun run stats
 *
 * After exporting: `bun run analyze` (export + stats), or `bun run analyse` for export + stats + figures.
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";

const CSV_DIR = join(dirname(new URL(import.meta.url).pathname), "csv");

// ---------------------------------------------------------------------------
// CSV parser
// ---------------------------------------------------------------------------

function readCsv(filename: string): Record<string, string>[] {
  const raw = readFileSync(join(CSV_DIR, filename), "utf-8").trim();
  const [headerLine, ...dataLines] = raw.split("\n");
  if (!headerLine) return [];
  const headers = headerLine.split(",");
  return dataLines.map((line) => {
    const vals = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = vals[i] ?? ""));
    return row;
  });
}

// ---------------------------------------------------------------------------
// Statistical helpers
// ---------------------------------------------------------------------------

function median(arr: number[]): number {
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 !== 0 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

function quantile(arr: number[], q: number): number {
  const s = [...arr].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return s[lo]!;
  return s[lo]! + (s[hi]! - s[lo]!) * (pos - lo);
}

function iqrStr(arr: number[]): string {
  return `${quantile(arr, 0.25).toFixed(1)}–${quantile(arr, 0.75).toFixed(1)}`;
}

/**
 * Wilcoxon signed-rank test (two-sided, exact for small n, normal approx otherwise).
 * Returns { W, p, r, n } where n is the number of non-zero differences.
 */
function wilcoxonSignedRank(
  baseline: number[],
  ephemeral: number[],
): { W: number; p: number; r: number; n: number } {
  const diffs: number[] = [];
  for (let i = 0; i < baseline.length; i++) {
    const d = ephemeral[i]! - baseline[i]!;
    if (d !== 0) diffs.push(d);
  }

  const n = diffs.length;
  if (n === 0) return { W: 0, p: 1, r: 0, n: 0 };

  const absDiffs = diffs.map((d) => ({ abs: Math.abs(d), sign: Math.sign(d) }));
  absDiffs.sort((a, b) => a.abs - b.abs);

  const ranks: number[] = [];
  let i = 0;
  while (i < absDiffs.length) {
    let j = i;
    while (j < absDiffs.length && absDiffs[j]!.abs === absDiffs[i]!.abs) j++;
    const avgRank = (i + 1 + j) / 2;
    for (let k = i; k < j; k++) ranks.push(avgRank);
    i = j;
  }

  let wPlus = 0;
  let wMinus = 0;
  for (let k = 0; k < n; k++) {
    if (absDiffs[k]!.sign > 0) wPlus += ranks[k]!;
    else wMinus += ranks[k]!;
  }

  const W = Math.min(wPlus, wMinus);
  const maxW = (n * (n + 1)) / 2;

  let p: number;
  if (n <= 25) {
    p = wilcoxonExactP(W, n);
  } else {
    const meanW = maxW / 2;
    const sdW = Math.sqrt((n * (n + 1) * (2 * n + 1)) / 24);
    const z = (W - meanW) / sdW;
    p = 2 * normalCdf(-Math.abs(z));
  }

  const r = 1 - (2 * W) / maxW;

  return { W, p: Math.min(p, 1), r: Math.abs(r), n };
}

/** Normal CDF approximation (Abramowitz & Stegun). */
function normalCdf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1.0 + sign * y);
}

/**
 * Exact two-sided p-value for the Wilcoxon signed-rank test via enumeration.
 * Feasible for n <= 25.
 */
function wilcoxonExactP(W: number, n: number): number {
  const maxSum = (n * (n + 1)) / 2;
  const counts = new Float64Array(maxSum + 1);
  counts[0] = 1;
  for (let rank = 1; rank <= n; rank++) {
    for (let s = maxSum; s >= rank; s--) {
      const prev = counts[s - rank] ?? 0;
      counts[s] = (counts[s] ?? 0) + prev;
    }
  }
  const total = Math.pow(2, n);
  let pTail = 0;
  for (let s = 0; s <= W; s++) pTail += counts[s]! / total;
  return Math.min(2 * pTail, 1);
}

/** Two-sided binomial test: P(X >= k) or P(X <= k) under H0: p = 0.5. */
function binomialTest(successes: number, trials: number): number {
  if (trials === 0) return 1;
  let pTail = 0;
  const target = Math.min(successes, trials - successes);
  for (let k = 0; k <= target; k++) {
    pTail += binomialPmf(k, trials, 0.5);
  }
  return Math.min(2 * pTail, 1);
}

function binomialPmf(k: number, n: number, p: number): number {
  let coeff = 1;
  for (let i = 0; i < k; i++) coeff *= ((n - i) / (i + 1));
  return coeff * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

function section(title: string) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${"=".repeat(60)}`);
}

function wilcoxonReport(baseline: number[], ephemeral: number[], label: string) {
  const result = wilcoxonSignedRank(baseline, ephemeral);
  console.log(`\n  ${label}`);
  console.log(`    Baseline  — Mdn: ${median(baseline).toFixed(1)}, IQR: ${iqrStr(baseline)}`);
  console.log(`    Ephemeral — Mdn: ${median(ephemeral).toFixed(1)}, IQR: ${iqrStr(ephemeral)}`);
  if (result.n === 0) {
    console.log(`    All differences are zero — no test possible.`);
    return;
  }
  console.log(`    Wilcoxon W = ${result.W}, p = ${result.p.toFixed(4)}, r = ${result.r.toFixed(3)}, n_pairs = ${result.n}`);
  console.log(`    ${result.p < 0.05 ? "** Significant at α=.05 **" : "Not significant at α=.05"}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  section("1. McNemar's Exact Test — Task Completion");
  try {
    const rows = readCsv("mcnemar_completion.csv");
    let bothCorrect = 0, bothWrong = 0, baselineOnly = 0, ephemeralOnly = 0;
    for (const r of rows) {
      const b = Number(r.baseline_correct);
      const e = Number(r.ephemeral_correct);
      if (b && e) bothCorrect++;
      else if (!b && !e) bothWrong++;
      else if (b && !e) baselineOnly++;
      else ephemeralOnly++;
    }
    console.log(`\n  Contingency: both correct=${bothCorrect}, both wrong=${bothWrong}, baseline-only=${baselineOnly}, ephemeral-only=${ephemeralOnly}`);
    console.log(`  Baseline rate: ${(((baselineOnly + bothCorrect) / rows.length) * 100).toFixed(1)}%`);
    console.log(`  Ephemeral rate: ${(((ephemeralOnly + bothCorrect) / rows.length) * 100).toFixed(1)}%`);
    const discordant = baselineOnly + ephemeralOnly;
    if (discordant > 0) {
      const p = binomialTest(Math.min(baselineOnly, ephemeralOnly), discordant);
      console.log(`  McNemar exact p = ${p.toFixed(4)} (discordant pairs: ${discordant})`);
    } else {
      console.log("  No discordant pairs — McNemar's test not applicable.");
    }
  } catch {
    console.log("  [SKIP] mcnemar_completion.csv not found");
  }

  section("2. Wilcoxon Signed-Rank — Task Completion Time");
  try {
    const rows = readCsv("paired_time.csv");
    wilcoxonReport(
      rows.map((r) => Number(r.baseline_sec)),
      rows.map((r) => Number(r.ephemeral_sec)),
      "Completion time (seconds)",
    );
  } catch {
    console.log("  [SKIP] paired_time.csv not found");
  }

  section("3. Wilcoxon Signed-Rank — Interaction Count");
  try {
    const rows = readCsv("paired_interactions.csv");
    wilcoxonReport(
      rows.map((r) => Number(r.baseline_interactions)),
      rows.map((r) => Number(r.ephemeral_interactions)),
      "Interaction count",
    );
  } catch {
    console.log("  [SKIP] paired_interactions.csv not found");
  }

  section("4. Wilcoxon Signed-Rank — Post-Trial Likert Ratings");
  try {
    const rows = readCsv("paired_likert.csv");
    for (const key of ["helpfulness", "intrusiveness", "control"]) {
      const sub = rows.filter((r) => r.question_key === key);
      if (sub.length === 0) { console.log(`\n  ${key}: no data`); continue; }
      wilcoxonReport(
        sub.map((r) => Number(r.baseline_rating)),
        sub.map((r) => Number(r.ephemeral_rating)),
        key.charAt(0).toUpperCase() + key.slice(1),
      );
    }
  } catch {
    console.log("  [SKIP] paired_likert.csv not found");
  }

  section("5. Binomial Test — Overall Preference");
  try {
    const rows = readCsv("final_preference_mapped.csv");
    for (const key of ["final_preference", "final_helpfulness", "final_intrusiveness", "final_real_life"]) {
      const sub = rows.filter((r) => r.question_key === key);
      const nB = Number(sub.find((r) => r.actual_preference === "baseline")?.n ?? 0);
      const nE = Number(sub.find((r) => r.actual_preference === "ephemeral")?.n ?? 0);
      const nN = Number(sub.find((r) => r.actual_preference === "no_preference")?.n ?? 0);
      console.log(`\n  ${key}`);
      console.log(`    Baseline: ${nB}, Ephemeral: ${nE}, No preference: ${nN}`);
      const total = nB + nE;
      if (total > 0) {
        const p = binomialTest(Math.min(nB, nE), total);
        console.log(`    Binomial p = ${p.toFixed(4)} (excluding no-preference)`);
        console.log(`    ${p < 0.05 ? "** Significant at α=.05 **" : "Not significant at α=.05"}`);
      } else {
        console.log("    No directional choices — test not applicable.");
      }
    }
  } catch {
    console.log("  [SKIP] final_preference_mapped.csv not found");
  }

  section("6. Ephemeral Support Engagement Summary");
  try {
    const rows = readCsv("ephemeral_engagement.csv");
    const byType: Record<string, { participants: Set<string>; total: number }> = {};
    for (const r of rows) {
      const t = r.event_type!;
      if (!byType[t]) byType[t] = { participants: new Set(), total: 0 };
      byType[t].participants.add(r.participant_id!);
      byType[t].total += Number(r.event_count);
    }
    console.log(`\n  ${"Event Type".padEnd(30)} Participants  Total Events`);
    for (const [type, data] of Object.entries(byType).sort((a, b) => b[1].total - a[1].total)) {
      console.log(`  ${type.padEnd(30)} ${String(data.participants.size).padStart(12)}  ${String(data.total).padStart(12)}`);
    }
  } catch {
    console.log("  [SKIP] ephemeral_engagement.csv not found");
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("  Done. Copy the numbers above into results.tex.");
  console.log(`${"=".repeat(60)}\n`);
}

main();
