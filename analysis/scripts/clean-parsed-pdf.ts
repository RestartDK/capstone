#!/usr/bin/env bun

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import path from "node:path";

const defaultInput = path.resolve(import.meta.dir, "../../main.pdf");
const defaultOutput = path.resolve(import.meta.dir, "../../main.parsed.txt");

const usage = `Usage:
  bun run clean-pdf-text
  bun run clean-pdf-text -- <input.pdf> <output.txt>
  bun run clean-pdf-text -- <input.txt> <output.txt>

Default behavior with no arguments:
  input:  ../main.pdf
  output: ../main.parsed.txt

Supported inputs:
  1. A PDF file, which will be parsed page by page
  2. Raw parser output containing markers like:
     <PARSED TEXT FOR PAGE: 1 / 60>
     <IMAGE FOR PAGE: 1 / 60>
`;

const isPageMarker = (line: string): boolean => /^<PARSED TEXT FOR PAGE:\s*\d+\s*\/\s*\d+>$/.test(line.trim());
const isImageMarker = (line: string): boolean => /^<IMAGE FOR PAGE:\s*\d+\s*\/\s*\d+>$/.test(line.trim());
const isRunningHeader = (line: string): boolean => /^Ephemeral Interfaces: Task-Scoped Generative UI\s+\d+$/.test(line.trim());
const isStandalonePageNumber = (line: string): boolean => /^\d+$/.test(line.trim());
const isContentsPage = (page: string[]): boolean => page.some((line) => line.trim() === "Contents");
const isFirstBodyPage = (page: string[]): boolean => page.some((line) => line.trim() === "1 Introduction");

const looksLikeHeading = (line: string): boolean => {
  const trimmed = line.trim();
  return (
    !!trimmed &&
    (/^(Abstract|Acknowledgements|References|Appendix)$/.test(trimmed) ||
      /^[A-Z]\.\d+(\.\d+)*\s+/.test(trimmed) ||
      /^\d+(\.\d+)*\s+/.test(trimmed))
  );
};

const looksLikeTableRow = (line: string): boolean => {
  const trimmed = line.trim();
  return /^Table\s+\d+:/.test(trimmed) || /^Figure\s+\d+:/.test(trimmed);
};

const normalizeWhitespace = (text: string): string =>
  text
    .replace(/\r\n/g, "\n")
    .replace(/\u00ad/g, "")
    .replace(/[\u2010\u2011\u2012\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u00a0/g, " ")
    .replace(/\u00b4/g, "'");

const toRawPageText = async (pdfPath: string): Promise<string> => {
  const data = await Bun.file(pdfPath).arrayBuffer();
  const loadingTask = getDocument({ data, useWorkerFetch: false, isEvalSupported: false, disableWorker: true });
  const pdf = await loadingTask.promise;
  const chunks: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const rows = new Map<number, Array<{ x: number; text: string }>>();

    for (const item of content.items) {
      if (!("str" in item) || !("transform" in item)) continue;
      const text = item.str?.trim();
      if (!text) continue;
      const x = item.transform[4] ?? 0;
      const y = Math.round(item.transform[5] ?? 0);
      const row = rows.get(y) ?? [];
      row.push({ x, text });
      rows.set(y, row);
    }

    const pageLines = [...rows.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, row]) => row.sort((a, b) => a.x - b.x).map(({ text }) => text).join(" "));

    chunks.push(`<PARSED TEXT FOR PAGE: ${pageNumber} / ${pdf.numPages}>`, "", ...pageLines, "");
  }

  return `${chunks.join("\n")}\n`;
};

const splitPages = (text: string): string[][] => {
  const pages: string[][] = [];
  let current: string[] = [];

  for (const rawLine of normalizeWhitespace(text).split("\n")) {
    const line = rawLine.trimEnd();

    if (isPageMarker(line)) {
      if (current.length > 0) pages.push(current);
      current = [];
      continue;
    }

    if (isImageMarker(line)) continue;
    current.push(line);
  }

  if (current.length > 0) pages.push(current);
  return pages;
};

const stripPageNoise = (page: string[]): string[] => {
  const cleaned = [...page];

  while (cleaned[0]?.trim() === "") cleaned.shift();
  while (cleaned.at(-1)?.trim() === "") cleaned.pop();
  if (isStandalonePageNumber(cleaned[0] ?? "")) cleaned.shift();
  if (isRunningHeader(cleaned[0] ?? "")) cleaned.shift();
  while (cleaned[0]?.trim() === "") cleaned.shift();

  return cleaned;
};

const shouldStartNewParagraph = (prev: string, next: string): boolean => {
  if (!prev) return true;
  if (looksLikeHeading(next)) return true;
  if (looksLikeTableRow(next)) return true;
  if (/^[1-9]\./.test(next.trim())) return true;
  if (/[.:!?]$/.test(prev.trim())) return true;
  return false;
};

const stitchLines = (lines: string[]): string => {
  const output: string[] = [];
  let paragraph = "";

  const flush = () => {
    const value = paragraph.trim();
    if (value) output.push(value);
    paragraph = "";
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flush();
      continue;
    }

    if (looksLikeHeading(line) || looksLikeTableRow(line) || /^[1-9]\./.test(line)) {
      flush();
      output.push(line);
      continue;
    }

    if (!paragraph || shouldStartNewParagraph(paragraph, line)) {
      flush();
      paragraph = line;
      continue;
    }

    paragraph = `${paragraph} ${line}`;
  }

  flush();

  return `${output.join("\n\n").replace(/\n{3,}/g, "\n\n").trim()}\n`;
};

const args = Bun.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  await Bun.write(Bun.stdout, usage);
} else {
  const input = args[0] ? path.resolve(process.cwd(), args[0]) : defaultInput;
  const output = args[1] ? path.resolve(process.cwd(), args[1]) : defaultOutput;

  if (!(await Bun.file(input).exists())) {
    await Bun.write(Bun.stderr, usage);
    throw new Error(`Input file not found: ${input}`);
  }

  const source = input.toLowerCase().endsWith(".pdf")
    ? await toRawPageText(input)
    : await Bun.file(input).text();
  const pages = splitPages(source);
  const keptPages: string[][] = [];
  let skippingContents = false;

  for (const page of pages) {
    const cleanedPage = stripPageNoise(page);
    if (cleanedPage.length === 0) continue;

    if (isContentsPage(cleanedPage)) {
      skippingContents = true;
      continue;
    }

    if (skippingContents && !isFirstBodyPage(cleanedPage)) {
      continue;
    }

    if (isFirstBodyPage(cleanedPage)) {
      skippingContents = false;
    }

    keptPages.push(cleanedPage);
  }

  const flattened = keptPages.flatMap((page: string[], index: number) =>
    index === keptPages.length - 1 ? page : [...page, ""],
  );

  await Bun.write(output, stitchLines(flattened));
  await Bun.write(Bun.stdout, `Wrote cleaned text to ${output}\n`);
}
