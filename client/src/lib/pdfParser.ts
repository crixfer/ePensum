import type { TextItem } from "pdfjs-dist/types/src/display/api";
import type { ParsedPensum, ParsedQuarter, ParsedSubject } from "@epensum/shared";
import { getUniversityProfile, type UniversityProfile } from "@epensum/shared";
import {
  QUARTER_PATTERN,
  matchHeaderKey,
  normalizeText,
  extractQuarterName,
  resolveUniversityAndCareerName,
  buildParsedSubject,
  deduplicateSubjectCodes,
  type HeaderKey,
} from "./pensumParser";

// pdfjs-dist (plus its worker) is ~1.7MB — load it only when a PDF is actually
// uploaded rather than on every page load.
let pdfjsReady: ReturnType<typeof loadPdfjs> | null = null;

async function loadPdfjs() {
  const [pdfjsLib, { default: workerUrl }] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
  return pdfjsLib;
}

interface Phrase {
  text: string;
  x: number;
}

type PdfLine = Phrase[];

/** key is null for a recognized-but-ignored header column (e.g. hour breakdowns) — its
 * position still fences off neighboring real columns so their text doesn't bleed in. */
interface Anchor {
  key: HeaderKey | null;
  x: number;
}

interface RawItem {
  text: string;
  x: number;
  y: number;
  height: number;
  page: number;
}

/**
 * PDFs have no cell grid — just positioned text runs. We reconstruct rows by
 * clustering text items with close y-coordinates (scoped per page, so nothing
 * accidentally merges across a page break). Each item is kept as its own phrase
 * (not merged by x-gap): once column anchors are known, bucketing by position
 * naturally regroups a cell's words even if a PDF splits them into several runs.
 */
async function extractPdfItems(buffer: ArrayBuffer): Promise<RawItem[]> {
  pdfjsReady ??= loadPdfjs();
  const pdfjsLib = await pdfjsReady;
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const items: RawItem[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    const pageItems: RawItem[] = content.items
      .filter((it): it is TextItem => "transform" in it && it.str.trim().length > 0)
      .map((it) => ({
        text: it.str.trim(),
        x: it.transform[4],
        y: it.transform[5],
        height: it.height || Math.abs(it.transform[3]) || 10,
        page: pageNum,
      }));

    pageItems.sort((a, b) => b.y - a.y || a.x - b.x);
    items.push(...pageItems);
  }

  return items;
}

function groupIntoLines(items: RawItem[]): PdfLine[] {
  const lines: PdfLine[] = [];
  let currentGroup: RawItem[] = [];

  for (const item of items) {
    const anchor = currentGroup[0];
    const tolerance = Math.max(2, item.height * 0.5);
    if (anchor && anchor.page === item.page && Math.abs(item.y - anchor.y) <= tolerance) {
      currentGroup.push(item);
    } else {
      if (currentGroup.length > 0) lines.push(toLine(currentGroup));
      currentGroup = [item];
    }
  }
  if (currentGroup.length > 0) lines.push(toLine(currentGroup));

  return lines;
}

function toLine(group: RawItem[]): PdfLine {
  return [...group].sort((a, b) => a.x - b.x).map((item) => ({ text: item.text, x: item.x }));
}

function lineHasQuarterMarker(line: PdfLine): boolean {
  return line.some((p) => QUARTER_PATTERN.test(p.text));
}

const SUBJECT_CODE_PATTERN = /^[A-Z]{2,5}-\s?\d{2,4}$/;

/** True when the line has a subject-code-shaped token (e.g. "CGO-100") sitting near
 * the clave column — a strong signal that real data has started, not another header line. */
function lineLooksLikeSubjectData(line: PdfLine, claveX: number): boolean {
  return line.some((p) => Math.abs(p.x - claveX) < 20 && SUBJECT_CODE_PATTERN.test(p.text.toUpperCase()));
}

function lineIsTotalRow(line: PdfLine): boolean {
  return line.some((p) => normalizeText(p.text) === "total");
}

/** Every phrase on the line becomes an anchor — matched ones by HeaderKey, unmatched
 * ones as position fences (key: null) so their column doesn't bleed into a neighbor. */
function anchorsFromLine(line: PdfLine): Anchor[] {
  return line.map((phrase) => ({ key: matchHeaderKey(phrase.text), x: phrase.x }));
}

/** "Clave" alone is enough to recognize a header row — some source documents omit the
 * "Asignatura" label on later quarter blocks even though the data column is still there;
 * mergeAnchors() falls back to the last known asignatura position in that case. */
function hasRequiredHeaderKeys(anchors: Anchor[]): boolean {
  return anchors.some((a) => a.key === "clave");
}

/** Same rationale as the Excel parser's column fallback: reuse the last known anchor
 * position for any recognized key missing from this block's own header. */
function mergeAnchors(current: Anchor[], previous: Anchor[] | null): Anchor[] {
  const byKey = new Map<HeaderKey, Anchor>();
  for (const a of previous ?? []) if (a.key) byKey.set(a.key, a);
  for (const a of current) if (a.key) byKey.set(a.key, a);
  const known = Array.from(byKey.values());
  const ignored = current.filter((a) => a.key === null);
  const combined = dropCrowdingIgnoreAnchors([...known, ...ignored], 15);
  return refineAsignaturaAnchor(combined.sort((a, b) => a.x - b.x));
}

/**
 * "Asignatura" header labels are often centered over a wide column while subject codes
 * (short, fixed-width) are left-aligned right after "Clave" — so the name's actual text
 * can start well left of its own header label, past the clave/asignatura midpoint. Since
 * codes are consistently short across these pensums, clamp the asignatura anchor to a
 * sane distance from clave instead of trusting a possibly far-right label position.
 */
function refineAsignaturaAnchor(anchors: Anchor[]): Anchor[] {
  const clave = anchors.find((a) => a.key === "clave");
  const asignatura = anchors.find((a) => a.key === "asignatura");
  if (!clave || !asignatura || asignatura.x - clave.x <= 45) return anchors;
  return anchors.map((a) => (a === asignatura ? { ...a, x: clave.x + 32 } : a)).sort((a, b) => a.x - b.x);
}

/**
 * Ignore-anchors that sit very close to a real anchor (e.g. "CT"/"CP"/"CI" packed right
 * next to "CR") squeeze that column's zone down to almost nothing, so a data value a few
 * points off from its header label's exact x can miss the zone entirely. Those tight
 * sub-columns aren't columns we read anyway, so just drop ignore-anchors that crowd a
 * real one instead of fencing with them.
 */
function dropCrowdingIgnoreAnchors(anchors: Anchor[], minGap: number): Anchor[] {
  const knownX = anchors.filter((a) => a.key !== null).map((a) => a.x);
  return anchors.filter((a) => a.key !== null || knownX.every((x) => Math.abs(a.x - x) >= minGap));
}

/**
 * Assigns each phrase to a column using the midpoint between adjacent anchors as the
 * boundary — not raw proximity to the anchor's own x. A header label is often centered
 * over a wide column while its data is left-aligned, so the data can start noticeably
 * left of its own header label (but still right of the *previous* column's label);
 * midpoint boundaries handle that correctly where a fixed-tolerance proximity check can't.
 */
function bucketLine(line: PdfLine, anchors: Anchor[]): Partial<Record<HeaderKey, string>> {
  const sorted = [...anchors].sort((a, b) => a.x - b.x);
  const boundaries = sorted.map((a, idx) => (idx === 0 ? -Infinity : (sorted[idx - 1].x + a.x) / 2));

  const result: Partial<Record<HeaderKey, string>> = {};
  for (const phrase of line) {
    let assignedIdx = -1;
    for (let idx = 0; idx < boundaries.length; idx++) {
      if (boundaries[idx] <= phrase.x) assignedIdx = idx;
      else break;
    }
    if (assignedIdx === -1) continue;
    const key = sorted[assignedIdx].key;
    if (!key) continue;
    result[key] = result[key] ? `${result[key]} ${phrase.text}` : phrase.text;
  }
  return result;
}

function mergeBuckets(buckets: Partial<Record<HeaderKey, string>>[]): Partial<Record<HeaderKey, string>> {
  const result: Partial<Record<HeaderKey, string>> = {};
  for (const bucket of buckets) {
    for (const [k, v] of Object.entries(bucket)) {
      const key = k as HeaderKey;
      if (!v) continue;
      result[key] = result[key] ? `${result[key]} ${v}` : v;
    }
  }
  return result;
}

function findHeaderLineIndex(lines: PdfLine[], from: number, maxScan: number): number | null {
  for (let idx = from; idx < lines.length && idx < from + maxScan; idx++) {
    if (hasRequiredHeaderKeys(anchorsFromLine(lines[idx]))) return idx;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Strategy 1: "flat" — one subject per visual line (e.g. UNICARIBE-style exports).
// ---------------------------------------------------------------------------

async function parsePensumPdfFlat(buffer: ArrayBuffer, profile: UniversityProfile): Promise<ParsedPensum> {
  const items = await extractPdfItems(buffer);
  const lines = groupIntoLines(items);
  const warnings: string[] = [];
  const quarters: ParsedQuarter[] = [];

  let quarterOrder = 0;
  let i = 0;
  let lastAnchors: Anchor[] | null = null;

  const preQuarterTexts: string[] = [];
  for (; i < lines.length; i++) {
    if (lineHasQuarterMarker(lines[i])) break;
    for (const phrase of lines[i]) preQuarterTexts.push(phrase.text);
  }
  const names = resolveUniversityAndCareerName(preQuarterTexts);

  while (i < lines.length) {
    const line = lines[i];

    if (!lineHasQuarterMarker(line)) {
      i++;
      continue;
    }

    quarterOrder++;
    const quarterName = extractQuarterName(
      line.map((p) => p.text),
      quarterOrder,
    );

    const headerIdx = findHeaderLineIndex(lines, i + 1, 6);
    if (headerIdx === null) {
      warnings.push(`No se encontraron las columnas de la tabla para "${quarterName}".`);
      i++;
      continue;
    }

    const anchors = mergeAnchors(anchorsFromLine(lines[headerIdx]), lastAnchors);
    lastAnchors = anchors;

    const subjects: ParsedSubject[] = [];
    let j = headerIdx + 1;
    let subjectIndex = 0;
    while (j < lines.length && !lineHasQuarterMarker(lines[j])) {
      if (lineIsTotalRow(lines[j])) {
        j++;
        continue;
      }
      const bucketed = bucketLine(lines[j], anchors);
      const code = bucketed.clave ?? "";
      const creditsRaw = bucketed.credito ?? "";
      const credits = Number(creditsRaw);

      if (!code || !Number.isFinite(credits) || credits <= 0) {
        j++;
        continue;
      }

      subjects.push(
        buildParsedSubject(
          {
            code,
            name: bucketed.asignatura ?? "",
            credits: creditsRaw,
            order: subjectIndex,
            prerequisite: bucketed.prereq ?? "",
            status: bucketed.estatus ?? "",
            score: bucketed.nota ?? "",
            teacher: bucketed.docente ?? "",
            date: bucketed.fecha ?? "",
          },
          warnings,
        ),
      );

      subjectIndex++;
      j++;
    }

    quarters.push({ order: quarterOrder, name: quarterName, subjects });
    i = j;
  }

  if (quarters.length === 0) {
    warnings.push("No se pudo encontrar ningún cuatrimestre en el archivo. Revisa el formato del PDF.");
  }
  deduplicateSubjectCodes(quarters, warnings);

  return {
    universityId: profile.id,
    universityName: names.universityName ?? (profile.id !== "otra" ? profile.name : null),
    careerName: names.careerName,
    quarters,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Strategy 2: "sequential-numbered" — subjects may wrap across several sub-lines
// (e.g. ISFODOSU-style curriculum plans). The "N°" column is strictly sequential
// and unique per subject, so it anchors each row; every line is then assigned to
// its nearest N°-anchor (ties favor the following anchor, since a wrapped name's
// leading lines appear before its own N° marker in reading order).
// ---------------------------------------------------------------------------

async function parsePensumPdfNumbered(buffer: ArrayBuffer, profile: UniversityProfile): Promise<ParsedPensum> {
  const items = await extractPdfItems(buffer);
  const lines = groupIntoLines(items);
  const warnings: string[] = [];
  const quarters: ParsedQuarter[] = [];

  let quarterOrder = 0;
  let i = 0;
  let lastAnchors: Anchor[] | null = null;

  const preQuarterTexts: string[] = [];
  for (; i < lines.length; i++) {
    if (lineHasQuarterMarker(lines[i])) break;
    for (const phrase of lines[i]) preQuarterTexts.push(phrase.text);
  }
  const names = resolveUniversityAndCareerName(preQuarterTexts);

  while (i < lines.length) {
    const line = lines[i];

    if (!lineHasQuarterMarker(line)) {
      i++;
      continue;
    }

    quarterOrder++;
    const quarterName = extractQuarterName(
      line.map((p) => p.text),
      quarterOrder,
    );

    const headerIdx = findHeaderLineIndex(lines, i + 1, 6);
    if (headerIdx === null) {
      warnings.push(`No se encontraron las columnas de la tabla para "${quarterName}".`);
      i++;
      continue;
    }

    // Multi-line column headers (e.g. "Créditos Académicos" above "CR CT CP CI")
    // scatter across several sub-lines around the clave+asignatura line — gather them
    // all, but stop the forward scan the moment a line looks like actual subject data
    // (a code like "CGO-100" sitting in the clave column) rather than another header
    // sub-line, so real rows never get mistaken for header continuations.
    const primaryAnchors = anchorsFromLine(lines[headerIdx]);
    const claveX = primaryAnchors.find((a) => a.key === "clave")?.x;
    let headerAnchors: Anchor[] = [...primaryAnchors];

    const backStart = Math.max(headerIdx - 3, i + 1);
    for (let h = headerIdx - 1; h >= backStart; h--) {
      headerAnchors = headerAnchors.concat(anchorsFromLine(lines[h]));
    }

    let windowEnd = headerIdx + 1;
    for (; windowEnd < lines.length && windowEnd < headerIdx + 4; windowEnd++) {
      if (claveX !== undefined && lineLooksLikeSubjectData(lines[windowEnd], claveX)) break;
      headerAnchors = headerAnchors.concat(anchorsFromLine(lines[windowEnd]));
    }

    const anchors = mergeAnchors(headerAnchors, lastAnchors);
    lastAnchors = anchors;

    // Bound this quarter's data region: up to the next quarter marker or "Total" row.
    let regionEnd = windowEnd;
    while (regionEnd < lines.length && !lineHasQuarterMarker(lines[regionEnd]) && !lineIsTotalRow(lines[regionEnd])) {
      regionEnd++;
    }
    const regionLines = lines.slice(windowEnd, regionEnd);

    // Find anchor lines: ones carrying both a valid "orden" and a valid "credito" value.
    const anchorLineIndices: number[] = [];
    const regionBuckets = regionLines.map((regionLine) => bucketLine(regionLine, anchors));
    regionBuckets.forEach((bucket, idx) => {
      const orden = Number(bucket.orden);
      const credito = Number(bucket.credito);
      if (bucket.orden && Number.isFinite(orden) && bucket.credito && Number.isFinite(credito) && credito > 0) {
        anchorLineIndices.push(idx);
      }
    });

    if (anchorLineIndices.length === 0) {
      warnings.push(`No se encontraron asignaturas para "${quarterName}".`);
      i = regionEnd;
      continue;
    }

    // Assign every region line to its nearest anchor (ties favor the later anchor).
    const subjects: ParsedSubject[] = [];
    for (let a = 0; a < anchorLineIndices.length; a++) {
      const anchorIdx = anchorLineIndices[a];
      const prevAnchorIdx = a > 0 ? anchorLineIndices[a - 1] : -1;
      const nextAnchorIdx = a < anchorLineIndices.length - 1 ? anchorLineIndices[a + 1] : regionLines.length;

      const rangeStart = a === 0 ? 0 : Math.floor((prevAnchorIdx + anchorIdx) / 2) + 1;
      const rangeEnd = a === anchorLineIndices.length - 1 ? regionLines.length : Math.ceil((anchorIdx + nextAnchorIdx) / 2);

      const merged = mergeBuckets(regionBuckets.slice(rangeStart, rangeEnd));
      const code = merged.clave ?? "";
      const creditsRaw = merged.credito ?? "";
      const ordenRaw = merged.orden ?? "";
      const credits = Number(creditsRaw);

      if (!code || !Number.isFinite(credits) || credits <= 0) continue;

      subjects.push(
        buildParsedSubject(
          {
            code,
            name: merged.asignatura ?? "",
            credits: creditsRaw,
            order: Number(ordenRaw) || subjects.length,
            prerequisite: merged.prereq ?? "",
            status: "",
            score: "",
            teacher: "",
            date: "",
          },
          warnings,
        ),
      );
    }

    quarters.push({ order: quarterOrder, name: quarterName, subjects });
    i = regionEnd;
  }

  if (quarters.length === 0) {
    warnings.push("No se pudo encontrar ningún cuatrimestre en el archivo. Revisa el formato del PDF.");
  }
  deduplicateSubjectCodes(quarters, warnings);

  return {
    universityId: profile.id,
    universityName: names.universityName ?? (profile.id !== "otra" ? profile.name : null),
    careerName: names.careerName,
    quarters,
    warnings,
  };
}

export async function parsePensumPdf(buffer: ArrayBuffer, universityId: string | null): Promise<ParsedPensum> {
  const profile = getUniversityProfile(universityId);
  return profile.parserStrategy === "sequential-numbered"
    ? parsePensumPdfNumbered(buffer, profile)
    : parsePensumPdfFlat(buffer, profile);
}
