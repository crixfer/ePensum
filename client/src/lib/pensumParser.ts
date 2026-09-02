import * as XLSX from "xlsx";
import type { ParsedPensum, ParsedQuarter, ParsedSubject, SubjectStatus } from "@epensum/shared";

export const QUARTER_PATTERN = /CUATRIMESTRE|SEMESTRE|TRIMESTRE/i;
export const UNIVERSITY_PATTERN = /UNIVERSIDAD|UNIVERSITY|INSTITUTO|INSTITUTE|COLEGIO|COLLEGE/i;
/** Dominican pensums near-universally name careers "Licenciatura en …" — a much more
 * reliable anchor than "first non-university text", since official pensum headers often
 * carry several administrative lines (vicerrectoría, decanato, plan de estudios, etc.)
 * before the actual career name appears. */
export const CAREER_NAME_PATTERN = /licenciatura en/i;

const STATUS_ALIASES: Record<string, SubjectStatus> = {
  pendiente: "PENDIENTE",
  inscrita: "INSCRITA",
  "en curso": "EN_CURSO",
  completado: "COMPLETADO",
};

const MONTH_ALIASES: Record<string, number> = {
  ene: 0, jan: 0,
  feb: 1,
  mar: 2,
  abr: 3, apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  ago: 7, aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dic: 11, dec: 11,
};

export const HEADER_ALIASES = {
  clave: ["clave"],
  asignatura: ["asignatura", "asignaturas"],
  credito: ["credito", "creditos", "cr"],
  orden: ["no", "no.", "n", "n°", "num", "numero"],
  prereq: ["pre-req", "prereq", "pre req", "prerrequisitos", "prerequisitos", "pre requisitos", "prerrequisito"],
  estatus: ["estatus", "estado"],
  nota: ["nota final", "nota"],
  docente: ["docente", "profesor"],
  fecha: ["fecha"],
} as const;

export type HeaderKey = keyof typeof HEADER_ALIASES;
export type ColumnMap = Partial<Record<HeaderKey, number>>;
type Row = unknown[];

export function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeText(value: unknown): string {
  return stripAccents(String(value ?? "")).trim().toLowerCase();
}

/** Matches a header cell's text against the known column aliases (accent/case-insensitive). */
export function matchHeaderKey(text: string): HeaderKey | null {
  const normalized = normalizeText(text);
  for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
    if ((aliases as readonly string[]).includes(normalized)) return key as HeaderKey;
  }
  return null;
}

export function normalizeStatus(raw: string): SubjectStatus | null {
  return STATUS_ALIASES[normalizeText(raw)] ?? null;
}

function excelSerialToDate(serial: number): Date {
  return new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
}

export function parseCompletedDate(raw: unknown, code: string, warnings: string[]): string | null {
  if (raw === undefined || raw === null || raw === "") return null;

  if (raw instanceof Date) {
    return raw.toISOString();
  }

  if (typeof raw === "number") {
    return excelSerialToDate(raw).toISOString();
  }

  const text = String(raw).trim();
  const monthYearMatch = /^([a-zA-Z]{3,})[.\s-]*(\d{2,4})$/.exec(text);
  if (monthYearMatch) {
    const monthKey = stripAccents(monthYearMatch[1].toLowerCase()).slice(0, 3);
    const month = MONTH_ALIASES[monthKey];
    if (month !== undefined) {
      let year = Number(monthYearMatch[2]);
      if (year < 100) year += 2000;
      return new Date(Date.UTC(year, month, 1)).toISOString();
    }
  }

  // Explicit dates as commonly seen in PDF exports (e.g. "01/09/2020", "2020-09-01", "Sep 1, 2020").
  const looksLikeDate =
    /^\d{1,4}[/-]\d{1,2}[/-]\d{1,4}$/.test(text) || /^[a-zA-Z]{3,}\.?\s+\d{1,2},?\s+\d{4}$/.test(text);
  if (looksLikeDate) {
    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }

  warnings.push(`Asignatura ${code}: no se reconoció la fecha "${text}".`);
  return null;
}

/** First cell whose text matches the quarter pattern, e.g. "SEGUNDO CUATRIMESTRE" — not just the first non-empty cell, since a quarter row can carry other text (a status marker, a page label) alongside the title. */
export function extractQuarterName(cellTexts: string[], quarterOrder: number): string {
  const match = cellTexts.find((t) => t.trim() && QUARTER_PATTERN.test(t));
  return match?.trim() || `Cuatrimestre ${quarterOrder}`;
}

/**
 * A subject code must be unique per quarter in the database, but source documents
 * occasionally reuse a code by mistake (a real typo in an official pensum, not a
 * parsing error). Rather than fail the whole import, rename later duplicates and
 * flag it so the student can fix the real code during review if they want to.
 */
export function deduplicateSubjectCodes(quarters: ParsedQuarter[], warnings: string[]): void {
  const seenCounts = new Map<string, number>();
  for (const quarter of quarters) {
    for (const subject of quarter.subjects) {
      const originalCode = subject.code;
      const occurrence = (seenCounts.get(originalCode) ?? 0) + 1;
      seenCounts.set(originalCode, occurrence);
      if (occurrence > 1) {
        subject.code = `${originalCode}-${occurrence}`;
        warnings.push(
          `El código "${originalCode}" aparece más de una vez en el archivo; esta asignatura se renombró a "${subject.code}".`,
        );
      }
    }
  }
}

/**
 * Scans every text cell that appears before the first quarter block for the university
 * name and the career name. The career name prefers a "Licenciatura en …" match (the
 * common Dominican pattern) over the first non-university text, since official pensum
 * headers often carry several administrative lines first.
 */
export function resolveUniversityAndCareerName(cellTexts: string[]): {
  universityName: string | null;
  careerName: string;
} {
  let universityName: string | null = null;
  let careerMatch: string | null = null;
  let firstOther: string | null = null;

  for (const raw of cellTexts) {
    const text = raw.trim();
    if (!text) continue;
    if (universityName === null && UNIVERSITY_PATTERN.test(text)) {
      universityName = text;
      continue;
    }
    if (careerMatch === null && CAREER_NAME_PATTERN.test(text)) {
      careerMatch = text;
    }
    if (firstOther === null) firstOther = text;
  }

  return { universityName, careerName: careerMatch ?? firstOther ?? "Mi carrera" };
}

export interface RawSubjectFields {
  code: string;
  name: string;
  credits: string;
  order: number;
  prerequisite: string;
  status: string;
  score: string;
  teacher: string;
  date: unknown;
}

/** A PDF can split a code like "INI-100" into two runs with a stray gap ("INI- 100");
 * collapse internal whitespace so codes compare equal for prerequisite matching. */
function normalizeCode(raw: string): string {
  const collapsed = raw.replace(/\s+/g, "");
  return /^[A-Z]{2,6}-\d{2,4}$/i.test(collapsed) ? collapsed : raw;
}

/** Shared normalization from raw extracted text (however it was extracted) into a ParsedSubject. */
export function buildParsedSubject(fields: RawSubjectFields, warnings: string[]): ParsedSubject {
  const status = fields.status ? normalizeStatus(fields.status) : "PENDIENTE";
  if (fields.status && !status) {
    warnings.push(`Asignatura ${fields.code}: estatus "${fields.status}" no reconocido, se marcó como Pendiente.`);
  }

  let finalScore: number | null = null;
  if (fields.score) {
    const parsedScore = Number(fields.score);
    if (Number.isFinite(parsedScore)) {
      finalScore = parsedScore;
    } else {
      warnings.push(`Asignatura ${fields.code}: la nota "${fields.score}" no es un número.`);
    }
  }

  const code = normalizeCode(fields.code);

  return {
    code,
    name: fields.name || code,
    credits: Number(fields.credits),
    order: fields.order,
    prerequisiteCode:
      !fields.prerequisite || normalizeText(fields.prerequisite) === "na"
        ? null
        : normalizeCode(fields.prerequisite),
    status: status ?? "PENDIENTE",
    finalScore,
    teacher: fields.teacher || null,
    completedDate: parseCompletedDate(fields.date, fields.code, warnings),
  };
}

function cellText(row: Row, col: number | undefined): string {
  if (col === undefined) return "";
  const value = row[col];
  return value === undefined || value === null ? "" : String(value).trim();
}

function rowContainsQuarterHeader(row: Row): boolean {
  return row.some((cell) => typeof cell === "string" && QUARTER_PATTERN.test(cell));
}

function mapColumns(row: Row): ColumnMap | null {
  const map: ColumnMap = {};
  row.forEach((cell, index) => {
    if (typeof cell !== "string") return;
    const key = matchHeaderKey(cell);
    if (key) map[key] = index;
  });
  return map.clave !== undefined && map.asignatura !== undefined ? map : null;
}

/**
 * Some source sheets drop a header label on a later quarter block (e.g. "NOTA FINAL"
 * only appears once) even though the column itself still holds real data further down.
 * Column position is stable across blocks, so fall back to the last-seen position for
 * any key missing from this block's own header row.
 */
function mergeColumns(current: ColumnMap, previous: ColumnMap | null): ColumnMap {
  return { ...previous, ...current };
}

export function parsePensumWorkbook(buffer: ArrayBuffer): ParsedPensum {
  const workbook = XLSX.read(buffer, { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Row>(sheet, { header: 1, defval: "" });

  const warnings: string[] = [];
  const quarters: ParsedQuarter[] = [];

  let quarterOrder = 0;
  let i = 0;
  let lastColumns: ColumnMap | null = null;

  const preQuarterTexts: string[] = [];
  for (; i < rows.length; i++) {
    if (rowContainsQuarterHeader(rows[i])) break;
    for (const cell of rows[i]) {
      if (typeof cell === "string") preQuarterTexts.push(cell);
    }
  }
  const { universityName, careerName } = resolveUniversityAndCareerName(preQuarterTexts);

  while (i < rows.length) {
    const row = rows[i];

    if (!rowContainsQuarterHeader(row)) {
      i++;
      continue;
    }

    quarterOrder++;
    const quarterName = extractQuarterName(
      row.filter((c): c is string => typeof c === "string"),
      quarterOrder,
    );

    let headerRowIndex = i + 1;
    let columns: ColumnMap | null = null;
    while (headerRowIndex < rows.length && headerRowIndex < i + 5) {
      columns = mapColumns(rows[headerRowIndex]);
      if (columns) break;
      headerRowIndex++;
    }

    if (!columns) {
      warnings.push(`No se encontraron las columnas de la tabla para "${quarterName}".`);
      i++;
      continue;
    }

    columns = mergeColumns(columns, lastColumns);
    lastColumns = columns;

    const subjects: ParsedSubject[] = [];
    let j = headerRowIndex + 1;
    let subjectIndex = 0;
    while (j < rows.length && !rowContainsQuarterHeader(rows[j])) {
      const subjectRow = rows[j];
      const code = cellText(subjectRow, columns.clave);
      const creditsRaw = cellText(subjectRow, columns.credito);
      const credits = Number(creditsRaw);

      if (!code || !Number.isFinite(credits) || credits <= 0) {
        j++;
        continue;
      }

      const ordenRaw = cellText(subjectRow, columns.orden);
      const parsedOrden = Number(ordenRaw);

      subjects.push(
        buildParsedSubject(
          {
            code,
            name: cellText(subjectRow, columns.asignatura),
            credits: creditsRaw,
            order: Number.isFinite(parsedOrden) && ordenRaw ? parsedOrden : subjectIndex,
            prerequisite: cellText(subjectRow, columns.prereq),
            status: cellText(subjectRow, columns.estatus),
            score: cellText(subjectRow, columns.nota),
            teacher: cellText(subjectRow, columns.docente),
            date: subjectRow[columns.fecha ?? -1],
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
    warnings.push("No se pudo encontrar ningún cuatrimestre en el archivo. Revisa el formato del Excel.");
  }
  deduplicateSubjectCodes(quarters, warnings);

  return { universityId: null, universityName, careerName, quarters, warnings };
}
