#!/usr/bin/env bun

import {
  PDFArray,
  PDFBool,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFRef,
  PDFString,
} from "pdf-lib";

type AnnotationSummary = {
  page: number;
  ref: string;
  subtype: string | null;
  author: string | null;
  subject: string | null;
  contents: string | null;
  modifiedAt: string | null;
  createdAt: string | null;
  rect: [number, number, number, number] | null;
  parentRef: string | null;
  inReplyToRef: string | null;
  isOpen: boolean | null;
};

const usage = `Usage:
  bun run pdf-comments -- <file.pdf> [--json] [--comments-only]

Examples:
  bun run pdf-comments -- ../main-review-done.pdf
  bun run pdf-comments -- ../main-review-done.pdf --comments-only
  bun run pdf-comments -- ../main-review-done.pdf --json
`;

const decodeText = (value: unknown): string | null => {
  if (value instanceof PDFString || value instanceof PDFHexString) return value.decodeText();
  if (value instanceof PDFName) return value.decodeText();
  return null;
};

const decodeNumber = (value: unknown): number | null => {
  if (value instanceof PDFNumber) return value.asNumber();
  return null;
};

const decodeRefString = (value: unknown): string | null => {
  if (value instanceof PDFRef) return value.toString();
  return null;
};

const decodeBoolean = (value: unknown): boolean | null => {
  if (value instanceof PDFBool) return value.asBoolean();
  return null;
};

const readRect = (dict: PDFDict): [number, number, number, number] | null => {
  const rect = dict.lookupMaybe(PDFName.of("Rect"), PDFArray);
  if (!rect || rect.size() !== 4) return null;

  const values = [0, 1, 2, 3].map((index) => decodeNumber(rect.lookupMaybe(index, PDFNumber)));
  if (values.some((value) => value === null)) return null;

  return values as [number, number, number, number];
};

const readAnnotation = (page: number, ref: PDFRef | null, dict: PDFDict): AnnotationSummary => ({
  page,
  ref: ref?.toString() ?? "direct-object",
  subtype: decodeText(dict.lookupMaybe(PDFName.of("Subtype"), PDFName)),
  author: decodeText(dict.lookupMaybe(PDFName.of("T"), PDFString, PDFHexString)),
  subject: decodeText(dict.lookupMaybe(PDFName.of("Subj"), PDFString, PDFHexString)),
  contents: decodeText(dict.lookupMaybe(PDFName.of("Contents"), PDFString, PDFHexString)),
  modifiedAt: decodeText(dict.lookupMaybe(PDFName.of("M"), PDFString, PDFHexString)),
  createdAt: decodeText(dict.lookupMaybe(PDFName.of("CreationDate"), PDFString, PDFHexString)),
  rect: readRect(dict),
  parentRef: decodeRefString(dict.lookupMaybe(PDFName.of("Parent"), PDFRef)),
  inReplyToRef: decodeRefString(dict.lookupMaybe(PDFName.of("IRT"), PDFRef)),
  isOpen: decodeBoolean(dict.lookupMaybe(PDFName.of("Open"), PDFBool)),
});

const formatRect = (rect: AnnotationSummary["rect"]): string => {
  if (!rect) return "n/a";
  return `[${rect.map((value) => value.toFixed(2)).join(", ")}]`;
};

const isCommentLike = (annotation: AnnotationSummary): boolean => {
  const subtype = annotation.subtype?.toLowerCase() ?? "";
  const commentSubtypes = new Set([
    "text",
    "highlight",
    "underline",
    "squiggly",
    "strikeout",
    "freetext",
    "caret",
    "stamp",
    "popup",
    "ink",
  ]);

  if (!commentSubtypes.has(subtype)) return false;
  return Boolean(annotation.author || annotation.contents || annotation.subject);
};

const args = Bun.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  await Bun.write(Bun.stdout, usage);
  process.exit(0);
}

const jsonMode = args.includes("--json");
const commentsOnly = args.includes("--comments-only");
const positional = args.filter((arg) => arg !== "--json" && arg !== "--comments-only");
const inputPath = positional[0];

if (!inputPath) {
  await Bun.write(Bun.stderr, usage);
  throw new Error("Missing required argument: <file.pdf>");
}

const file = Bun.file(inputPath);
if (!(await file.exists())) {
  throw new Error(`File not found: ${inputPath}`);
}

const pdf = await PDFDocument.load(await file.arrayBuffer());
const annotations: AnnotationSummary[] = [];

for (const [index, page] of pdf.getPages().entries()) {
  const annots = page.node.Annots();
  if (!annots) continue;

  for (let annotIndex = 0; annotIndex < annots.size(); annotIndex++) {
    const rawObject = annots.get(annotIndex);
    const rawRef = rawObject instanceof PDFRef ? rawObject : null;
    const dict = annots.lookupMaybe(annotIndex, PDFDict);
    if (!dict) continue;
    annotations.push(readAnnotation(index + 1, rawRef, dict));
  }
}

const filteredAnnotations = commentsOnly ? annotations.filter(isCommentLike) : annotations;

if (jsonMode) {
  await Bun.write(
    Bun.stdout,
    `${JSON.stringify({ file: inputPath, count: filteredAnnotations.length, annotations: filteredAnnotations }, null, 2)}\n`,
  );
  process.exit(0);
}

if (filteredAnnotations.length === 0) {
  await Bun.write(Bun.stdout, `No PDF annotations found in ${inputPath}\n`);
  process.exit(0);
}

const lines: string[] = [];
lines.push(`Found ${filteredAnnotations.length} annotation${filteredAnnotations.length === 1 ? "" : "s"} in ${inputPath}`);

for (const annotation of filteredAnnotations) {
  lines.push("");
  lines.push(`Page ${annotation.page} | ${annotation.subtype ?? "Unknown"} | ref ${annotation.ref}`);
  if (annotation.author) lines.push(`Author: ${annotation.author}`);
  if (annotation.subject) lines.push(`Subject: ${annotation.subject}`);
  if (annotation.contents) lines.push(`Contents: ${annotation.contents}`);
  if (annotation.modifiedAt) lines.push(`Modified: ${annotation.modifiedAt}`);
  if (annotation.createdAt) lines.push(`Created: ${annotation.createdAt}`);
  if (annotation.parentRef) lines.push(`Parent: ${annotation.parentRef}`);
  if (annotation.inReplyToRef) lines.push(`In reply to: ${annotation.inReplyToRef}`);
  if (annotation.isOpen !== null) lines.push(`Open: ${annotation.isOpen}`);
  lines.push(`Rect: ${formatRect(annotation.rect)}`);
}

await Bun.write(Bun.stdout, `${lines.join("\n")}\n`);
