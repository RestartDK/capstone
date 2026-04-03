/**
 * Build thesis-ready PDF figures from analysis/csv/ exports.
 *
 * Requires: bun run export (paired_time.csv, paired_interactions.csv, paired_likert.csv)
 *
 * Usage:
 *   cd analysis && bun run figures
 *
 * Writes to ../graphics/:
 *   - results-completion-time.pdf
 *   - results-interaction-count.pdf
 *   - results-likert-ratings.pdf
 */

import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";

const ANALYSIS_DIR = dirname(new URL(import.meta.url).pathname);
const CSV_DIR = join(ANALYSIS_DIR, "csv");
const GRAPHICS_DIR = join(ANALYSIS_DIR, "../graphics");

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (c === '"') {
      inQuote = !inQuote;
      continue;
    }
    if (c === "," && !inQuote) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out;
}

function readCsv(path: string): Record<string, string>[] {
  if (!existsSync(path)) return [];
  const raw = readFileSync(path, "utf-8").trim();
  if (!raw) return [];
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0]!);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCsvLine(lines[i]!);
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = vals[j] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function median(values: number[]): number {
  if (values.length === 0) return NaN;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 !== 0 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

function yToPdf(
  value: number,
  minY: number,
  maxY: number,
  chartBottom: number,
  chartTop: number,
): number {
  const t = (value - minY) / (maxY - minY || 1);
  return chartBottom + t * (chartTop - chartBottom);
}

async function drawPairedNumericPlot(
  pdf: PDFDocument,
  rows: Record<string, string>[],
  opts: {
    baselineKey: string;
    ephemeralKey: string;
    yLabel: string;
    title: string;
    leftLabel: string;
    rightLabel: string;
  },
): Promise<void> {
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([612, 396]);
  const { width, height } = page.getSize();

  const margin = { l: 72, r: 48, b: 72, t: 56 };
  const chartLeft = margin.l;
  const chartRight = width - margin.r;
  const chartBottom = margin.b;
  const chartTop = height - margin.t;

  const xLeft = chartLeft + (chartRight - chartLeft) * 0.28;
  const xRight = chartLeft + (chartRight - chartLeft) * 0.72;

  const baselineVals = rows.map((r) => Number(r[opts.baselineKey]));
  const ephemeralVals = rows.map((r) => Number(r[opts.ephemeralKey]));
  const all = [...baselineVals, ...ephemeralVals].filter((v) => !Number.isNaN(v));
  if (all.length === 0) {
    page.drawText("No numeric data to plot.", { x: margin.l, y: height / 2, size: 12, font });
    return;
  }

  let minY = Math.min(...all);
  let maxY = Math.max(...all);
  if (minY === maxY) {
    minY -= 1;
    maxY += 1;
  }
  const pad = (maxY - minY) * 0.08;
  minY -= pad;
  maxY += pad;

  page.drawText(opts.title, {
    x: margin.l,
    y: height - 40,
    size: 12,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawText(opts.leftLabel, {
    x: xLeft - 28,
    y: chartBottom - 28,
    size: 10,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });
  page.drawText(opts.rightLabel, {
    x: xRight - 38,
    y: chartBottom - 28,
    size: 10,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawLine({
    start: { x: chartLeft, y: chartBottom },
    end: { x: chartRight, y: chartBottom },
    thickness: 0.5,
    color: rgb(0.4, 0.4, 0.4),
  });
  page.drawLine({
    start: { x: chartLeft, y: chartBottom },
    end: { x: chartLeft, y: chartTop },
    thickness: 0.5,
    color: rgb(0.4, 0.4, 0.4),
  });

  const lineColor = rgb(0.35, 0.45, 0.65);
  const pointColor = rgb(0.15, 0.25, 0.45);

  for (let i = 0; i < rows.length; i++) {
    const b = baselineVals[i]!;
    const e = ephemeralVals[i]!;
    if (Number.isNaN(b) || Number.isNaN(e)) continue;
    const y1 = yToPdf(b, minY, maxY, chartBottom, chartTop);
    const y2 = yToPdf(e, minY, maxY, chartBottom, chartTop);
    page.drawLine({
      start: { x: xLeft, y: y1 },
      end: { x: xRight, y: y2 },
      thickness: 0.8,
      color: lineColor,
      opacity: 0.55,
    });
  }

  const rDot = 2.8;
  for (let i = 0; i < rows.length; i++) {
    const b = baselineVals[i]!;
    const e = ephemeralVals[i]!;
    if (Number.isNaN(b) || Number.isNaN(e)) continue;
    const y1 = yToPdf(b, minY, maxY, chartBottom, chartTop);
    const y2 = yToPdf(e, minY, maxY, chartBottom, chartTop);
    page.drawCircle({
      x: xLeft,
      y: y1,
      size: rDot,
      borderColor: pointColor,
      borderWidth: 0.6,
      color: rgb(1, 1, 1),
    });
    page.drawCircle({
      x: xRight,
      y: y2,
      size: rDot,
      borderColor: pointColor,
      borderWidth: 0.6,
      color: rgb(1, 1, 1),
    });
  }

  const tickCount = 5;
  for (let t = 0; t <= tickCount; t++) {
    const v = minY + (t / tickCount) * (maxY - minY);
    const y = yToPdf(v, minY, maxY, chartBottom, chartTop);
    page.drawLine({
      start: { x: chartLeft - 4, y },
      end: { x: chartLeft, y },
      thickness: 0.4,
      color: rgb(0.5, 0.5, 0.5),
    });
    const label = v.toFixed(v >= 10 ? 0 : 1);
    page.drawText(label, {
      x: chartLeft - 42,
      y: y - 3,
      size: 8,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });
  }

  page.drawText(opts.yLabel, {
    x: 28,
    y: chartBottom + (chartTop - chartBottom) * 0.35,
    size: 9,
    font,
    color: rgb(0.25, 0.25, 0.25),
    rotate: degrees(90),
  });

  const n = rows.length;
  page.drawText(`n = ${n} paired sessions`, {
    x: chartRight - 115,
    y: chartBottom - 44,
    size: 8,
    font,
    color: rgb(0.45, 0.45, 0.45),
  });
}

async function drawLikertMedians(
  pdf: PDFDocument,
  rows: Record<string, string>[],
): Promise<void> {
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([612, 396]);
  const { width, height } = page.getSize();
  const margin = { l: 64, r: 48, b: 72, t: 52 };
  const chartLeft = margin.l;
  const chartRight = width - margin.r;
  const chartBottom = margin.b;
  const chartTop = height - margin.t;

  page.drawText("Post-trial ratings (median, 1 = low, 7 = high)", {
    x: margin.l,
    y: height - 38,
    size: 12,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  const keys = ["helpfulness", "intrusiveness", "control"] as const;
  const labels: Record<string, string> = {
    helpfulness: "Helpfulness",
    intrusiveness: "Intrusiveness",
    control: "Perceived control",
  };

  const byKey = new Map<string, { b: number[]; e: number[] }>();
  for (const k of keys) byKey.set(k, { b: [], e: [] });
  for (const r of rows) {
    const q = r.question_key;
    if (!q || !byKey.has(q as (typeof keys)[number])) continue;
    const b = Number(r.baseline_rating);
    const e = Number(r.ephemeral_rating);
    if (!Number.isNaN(b)) byKey.get(q)!.b.push(b);
    if (!Number.isNaN(e)) byKey.get(q)!.e.push(e);
  }

  const minY = 1;
  const maxY = 7;
  const groupWidth = (chartRight - chartLeft) / keys.length;
  const barW = groupWidth * 0.18;
  const gap = groupWidth * 0.06;

  const baseFill = rgb(0.55, 0.55, 0.58);
  const ephFill = rgb(0.35, 0.48, 0.72);

  page.drawLine({
    start: { x: chartLeft, y: chartBottom },
    end: { x: chartRight, y: chartBottom },
    thickness: 0.5,
    color: rgb(0.4, 0.4, 0.4),
  });
  page.drawLine({
    start: { x: chartLeft, y: chartBottom },
    end: { x: chartLeft, y: chartTop },
    thickness: 0.5,
    color: rgb(0.4, 0.4, 0.4),
  });

  for (let t = 1; t <= 7; t++) {
    const y = yToPdf(t, minY, maxY, chartBottom, chartTop);
    page.drawLine({
      start: { x: chartLeft, y },
      end: { x: chartRight, y },
      thickness: 0.2,
      color: rgb(0.88, 0.88, 0.88),
    });
    page.drawText(String(t), {
      x: chartLeft - 18,
      y: y - 3,
      size: 8,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  keys.forEach((k, i) => {
    const g = chartLeft + i * groupWidth + groupWidth / 2;
    const mB = median(byKey.get(k)!.b);
    const mE = median(byKey.get(k)!.e);
    const xB = g - barW - gap / 2;
    const xE = g + gap / 2;
    const hB = (Number.isNaN(mB) ? 0 : (mB - minY) / (maxY - minY)) * (chartTop - chartBottom);
    const hE = (Number.isNaN(mE) ? 0 : (mE - minY) / (maxY - minY)) * (chartTop - chartBottom);
    if (!Number.isNaN(mB) && mB > 0) {
      page.drawRectangle({
        x: xB,
        y: chartBottom,
        width: barW,
        height: hB,
        color: baseFill,
      });
    }
    if (!Number.isNaN(mE) && mE > 0) {
      page.drawRectangle({
        x: xE,
        y: chartBottom,
        width: barW,
        height: hE,
        color: ephFill,
      });
    }
    const label = labels[k] ?? k;
    page.drawText(label, {
      x: g - label.length * 2.2,
      y: chartBottom - 22,
      size: 8,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
  });

  page.drawText("Baseline", {
    x: chartRight - 150,
    y: chartTop - 18,
    size: 8,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });
  page.drawRectangle({
    x: chartRight - 168,
    y: chartTop - 16,
    width: 10,
    height: 8,
    color: baseFill,
  });
  page.drawText("Ephemeral", {
    x: chartRight - 78,
    y: chartTop - 18,
    size: 8,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });
  page.drawRectangle({
    x: chartRight - 96,
    y: chartTop - 16,
    width: 10,
    height: 8,
    color: ephFill,
  });

  page.drawText("Median rating (paired participants)", {
    x: 24,
    y: chartBottom + (chartTop - chartBottom) * 0.38,
    size: 9,
    font,
    color: rgb(0.25, 0.25, 0.25),
    rotate: degrees(90),
  });
}

async function main(): Promise<void> {
  mkdirSync(GRAPHICS_DIR, { recursive: true });

  const timePath = join(CSV_DIR, "paired_time.csv");
  const intPath = join(CSV_DIR, "paired_interactions.csv");
  const likertPath = join(CSV_DIR, "paired_likert.csv");

  const missing: string[] = [];
  if (!existsSync(timePath)) missing.push("paired_time.csv");
  if (!existsSync(intPath)) missing.push("paired_interactions.csv");
  if (!existsSync(likertPath)) missing.push("paired_likert.csv");
  if (missing.length > 0) {
    console.error(
      "Missing CSV files in analysis/csv/:\n  " +
        missing.join("\n  ") +
        "\nRun `bun run export` first (from the analysis directory).",
    );
    process.exit(1);
  }

  const timeRows = readCsv(timePath);
  const intRows = readCsv(intPath);
  const likertRows = readCsv(likertPath);

  if (timeRows.length === 0) {
    console.error("paired_time.csv has no data rows.");
    process.exit(1);
  }

  const pdfTime = await PDFDocument.create();
  await drawPairedNumericPlot(pdfTime, timeRows, {
    baselineKey: "baseline_sec",
    ephemeralKey: "ephemeral_sec",
    yLabel: "Time (seconds)",
    title: "Paired task completion time",
    leftLabel: "Baseline",
    rightLabel: "Ephemeral",
  });
  const timeBytes = await pdfTime.save();
  const outTime = join(GRAPHICS_DIR, "results-completion-time.pdf");
  await Bun.write(outTime, timeBytes);
  console.log(`  ✓ ${outTime} (${timeRows.length} pairs)`);

  const pdfInt = await PDFDocument.create();
  await drawPairedNumericPlot(pdfInt, intRows, {
    baselineKey: "baseline_interactions",
    ephemeralKey: "ephemeral_interactions",
    yLabel: "Interaction count",
    title: "Paired interaction count",
    leftLabel: "Baseline",
    rightLabel: "Ephemeral",
  });
  const intBytes = await pdfInt.save();
  const outInt = join(GRAPHICS_DIR, "results-interaction-count.pdf");
  await Bun.write(outInt, intBytes);
  console.log(`  ✓ ${outInt} (${intRows.length} pairs)`);

  const pdfLikert = await PDFDocument.create();
  await drawLikertMedians(pdfLikert, likertRows);
  const likertBytes = await pdfLikert.save();
  const outLikert = join(GRAPHICS_DIR, "results-likert-ratings.pdf");
  await Bun.write(outLikert, likertBytes);
  console.log(`  ✓ ${outLikert}`);

  console.log("\nFigures written to graphics/. Uncomment \\includegraphics in sections/results.tex.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
