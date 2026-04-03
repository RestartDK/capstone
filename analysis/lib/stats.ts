/**
 * Descriptive statistics and paired tests from exported CSVs.
 * Used by run-tests.ts and generate-results-tex.ts.
 */

import { readCsv } from "./csv.ts";

export type WilcoxonResult = { W: number; p: number; r: number; n: number };

export type StudyStats = {
  overview: { totalAccessed: number; consented: number; validN: number };
  demographics: {
    ageSummary: string;
    webMdn: number;
    webIqr: string;
    aiMdn: number;
    aiIqr: string;
    baselineFirstN: number;
    ephemeralFirstN: number;
  };
  completion: {
    nValid: number;
    nBaselineCorrect: number;
    nEphemeralCorrect: number;
    pctBaseline: number;
    pctEphemeral: number;
    mcnemarP: number | null;
  };
  time: {
    baselineMdn: number;
    baselineIqr: string;
    ephemeralMdn: number;
    ephemeralIqr: string;
    wilcoxon: WilcoxonResult | null;
  };
  interactions: {
    baselineMdn: number;
    baselineIqr: string;
    ephemeralMdn: number;
    ephemeralIqr: string;
    wilcoxon: WilcoxonResult | null;
  };
  likert: Record<
    string,
    {
      baselineMdn: number;
      baselineIqr: string;
      ephemeralMdn: number;
      ephemeralIqr: string;
      wilcoxon: WilcoxonResult | null;
    }
  >;
  preference: Record<
    string,
    { baseline: number; ephemeral: number; noPreference: number; binomialP: number | null }
  >;
  engagement: {
    nValid: number;
    nTriggeredOrRequested: number;
    pctTriggered: number;
    nUsed: number;
    nDismissed: number;
    nIgnored: number;
    nExpanded: number;
    totalGenerations: number;
    fallbackCount: number;
    fallbackPct: number;
  };
  summary: {
    completionPctBaseline: number;
    completionPctEphemeral: number;
    mcnemarP: number | null;
    prefOverallBinomialP: number | null;
  };
};

export function median(arr: number[]): number {
  if (arr.length === 0) return NaN;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 !== 0 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

export function quantile(arr: number[], q: number): number {
  const s = [...arr].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return s[lo]!;
  return s[lo]! + (s[hi]! - s[lo]!) * (pos - lo);
}

export function iqrStr(arr: number[]): string {
  return `${quantile(arr, 0.25).toFixed(1)}--${quantile(arr, 0.75).toFixed(1)}`;
}

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

export function wilcoxonSignedRank(
  baseline: number[],
  ephemeral: number[],
): WilcoxonResult {
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

export function binomialTest(successes: number, trials: number): number {
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
  for (let i = 0; i < k; i++) coeff *= (n - i) / (i + 1);
  return coeff * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

function mcnemarExactP(baselineOnly: number, ephemeralOnly: number): number | null {
  const discordant = baselineOnly + ephemeralOnly;
  if (discordant === 0) return null;
  return binomialTest(Math.min(baselineOnly, ephemeralOnly), discordant);
}

function num(row: Record<string, string>, key: string): number {
  const v = Number(row[key]);
  return Number.isFinite(v) ? v : NaN;
}

export function computeStudyStats(csvDir: string): StudyStats {
  const overviewRows = readCsv(csvDir, "overview.csv");
  const o0 = overviewRows[0];
  const totalAccessed = o0 ? num(o0, "total_accessed") : 0;
  const consented = o0 ? num(o0, "consented") : 0;
  const validFromOverview = o0 ? num(o0, "valid_completed") : 0;

  const demoRows = readCsv(csvDir, "demographics.csv");
  const ageSummary = demoRows
    .map((r) => {
      const ar = r.age_range ?? "?";
      const n = r.n ?? "?";
      return `${ar} (${n})`;
    })
    .join("; ");

  const fp = readCsv(csvDir, "full_paired.csv");
  const webVals = fp.map((r) => Number(r.web_app_familiarity)).filter((x) => !Number.isNaN(x));
  const aiVals = fp.map((r) => Number(r.ai_tool_familiarity)).filter((x) => !Number.isNaN(x));

  const cbRows = readCsv(csvDir, "counterbalancing.csv");
  const baselineFirstN = cbRows[0] ? num(cbRows[0]!, "baseline_first") : 0;
  const ephemeralFirstN = cbRows[0] ? num(cbRows[0]!, "ephemeral_first") : 0;

  const mcnemar = readCsv(csvDir, "mcnemar_completion.csv");
  let bothCorrect = 0,
    bothWrong = 0,
    baselineOnly = 0,
    ephemeralOnly = 0;
  for (const r of mcnemar) {
    const b = Number(r.baseline_correct);
    const e = Number(r.ephemeral_correct);
    if (b && e) bothCorrect++;
    else if (!b && !e) bothWrong++;
    else if (b && !e) baselineOnly++;
    else ephemeralOnly++;
  }
  const nValid = mcnemar.length;
  const nBC = baselineOnly + bothCorrect;
  const nEC = ephemeralOnly + bothCorrect;
  const pctBaseline = nValid > 0 ? (100 * nBC) / nValid : 0;
  const pctEphemeral = nValid > 0 ? (100 * nEC) / nValid : 0;
  const mcnemarP = mcnemarExactP(baselineOnly, ephemeralOnly);

  const timeRows = readCsv(csvDir, "paired_time.csv");
  const bSec = timeRows.map((r) => Number(r.baseline_sec));
  const eSec = timeRows.map((r) => Number(r.ephemeral_sec));
  const timeWilcoxon =
    bSec.length > 0 ? wilcoxonSignedRank(bSec, eSec) : null;

  const intRows = readCsv(csvDir, "paired_interactions.csv");
  const bInt = intRows.map((r) => Number(r.baseline_interactions));
  const eInt = intRows.map((r) => Number(r.ephemeral_interactions));
  const intWilcoxon =
    bInt.length > 0 ? wilcoxonSignedRank(bInt, eInt) : null;

  const likertRows = readCsv(csvDir, "paired_likert.csv");
  const likert: StudyStats["likert"] = {};
  for (const key of ["helpfulness", "intrusiveness", "control"]) {
    const sub = likertRows.filter((r) => r.question_key === key);
    const bb = sub.map((r) => Number(r.baseline_rating)).filter((x) => !Number.isNaN(x));
    const ee = sub.map((r) => Number(r.ephemeral_rating)).filter((x) => !Number.isNaN(x));
    likert[key] = {
      baselineMdn: median(bb),
      baselineIqr: iqrStr(bb),
      ephemeralMdn: median(ee),
      ephemeralIqr: iqrStr(ee),
      wilcoxon: bb.length > 0 && ee.length === bb.length ? wilcoxonSignedRank(bb, ee) : null,
    };
  }

  const prefKeys = ["final_preference", "final_helpfulness", "final_intrusiveness", "final_real_life"] as const;
  const prefRows = readCsv(csvDir, "final_preference_mapped.csv");
  const preference: StudyStats["preference"] = {};
  for (const key of prefKeys) {
    const sub = prefRows.filter((r) => r.question_key === key);
    const nB = Number(sub.find((r) => r.actual_preference === "baseline")?.n ?? 0);
    const nE = Number(sub.find((r) => r.actual_preference === "ephemeral")?.n ?? 0);
    const nN = Number(sub.find((r) => r.actual_preference === "no_preference")?.n ?? 0);
    const total = nB + nE;
    preference[key] = {
      baseline: nB,
      ephemeral: nE,
      noPreference: nN,
      binomialP: total > 0 ? binomialTest(Math.min(nB, nE), total) : null,
    };
  }

  const engRows = readCsv(csvDir, "ephemeral_engagement.csv");
  const byP = new Map<string, Set<string>>();
  for (const r of engRows) {
    const pid = r.participant_id!;
    const et = r.event_type!;
    if (!byP.has(et)) byP.set(et, new Set());
    byP.get(et)!.add(pid);
  }
  const hasTrigger = new Set<string>();
  for (const r of engRows) {
    if (r.event_type === "support_triggered" || r.event_type === "support_requested") {
      hasTrigger.add(r.participant_id!);
    }
  }
  const nTriggered = hasTrigger.size;
  const pctTrig = nValid > 0 ? (100 * nTriggered) / nValid : 0;

  const fallbackRows = readCsv(csvDir, "fallback_rate.csv");
  const totalGen = fallbackRows[0] ? num(fallbackRows[0]!, "total_generations") : 0;
  const fbCount = fallbackRows[0] ? num(fallbackRows[0]!, "fallback_count") : 0;
  const fbPct = fallbackRows[0] ? num(fallbackRows[0]!, "fallback_pct") : 0;

  const engagement: StudyStats["engagement"] = {
    nValid,
    nTriggeredOrRequested: nTriggered,
    pctTriggered: pctTrig,
    nUsed: byP.get("support_used")?.size ?? 0,
    nDismissed: byP.get("support_dismissed")?.size ?? 0,
    nIgnored: byP.get("support_ignored")?.size ?? 0,
    nExpanded: byP.get("support_inspect_expanded")?.size ?? 0,
    totalGenerations: totalGen,
    fallbackCount: fbCount,
    fallbackPct: fbPct,
  };

  return {
    overview: {
      totalAccessed,
      consented,
      validN: validFromOverview || nValid,
    },
    demographics: {
      ageSummary: ageSummary || "—",
      webMdn: median(webVals),
      webIqr: webVals.length ? iqrStr(webVals) : "—",
      aiMdn: median(aiVals),
      aiIqr: aiVals.length ? iqrStr(aiVals) : "—",
      baselineFirstN,
      ephemeralFirstN,
    },
    completion: {
      nValid,
      nBaselineCorrect: nBC,
      nEphemeralCorrect: nEC,
      pctBaseline,
      pctEphemeral,
      mcnemarP,
    },
    time: {
      baselineMdn: median(bSec),
      baselineIqr: bSec.length ? iqrStr(bSec) : "—",
      ephemeralMdn: median(eSec),
      ephemeralIqr: eSec.length ? iqrStr(eSec) : "—",
      wilcoxon: timeWilcoxon,
    },
    interactions: {
      baselineMdn: median(bInt),
      baselineIqr: bInt.length ? iqrStr(bInt) : "—",
      ephemeralMdn: median(eInt),
      ephemeralIqr: eInt.length ? iqrStr(eInt) : "—",
      wilcoxon: intWilcoxon,
    },
    likert,
    preference,
    engagement,
    summary: {
      completionPctBaseline: pctBaseline,
      completionPctEphemeral: pctEphemeral,
      mcnemarP,
      prefOverallBinomialP: preference.final_preference?.binomialP ?? null,
    },
  };
}
