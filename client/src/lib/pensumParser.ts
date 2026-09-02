import * as XLSX from "xlsx";
import type { ParsedPensum, ParsedQuarter, ParsedSubject, SubjectStatus } from "@epensum/shared";

const QUARTER_PATTERN = /CUATRIMESTRE|SEMESTRE|TRIMESTRE/i;

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

const HEADER_ALIASES: Record<string, string[]> = {
  clave: ["clave"],
  asignatura: ["asignatura"],
  credito: ["credito", "creditos"],
  prereq: ["pre-req", "prereq", "pre req"],
  estatus: ["estatus", "estado"],
  nota: ["nota final", "nota"],
  docente: ["docente", "profesor"],
  fecha: ["fecha"],
};

type ColumnMap = Partial<Record<keyof typeof HEADER_ALIASES, number>>;
type Row = unknown[];

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeText(value: unknown): string {
  return stripAccents(String(value ?? "")).trim().toLowerCase();
}

function cellText(row: Row, col: number | undefined): string {
  if (col === undefined) return "";
  const value = row[col];
  return value === undefined || value === null ? "" : String(value).trim();
}

function rowContainsQuarterHeader(row: Row): boolean {
  return row.some((cell) => typeof cell === "string" && QUARTER_PATTERN.test(cell));
}

function firstNonEmptyString(row: Row): string | null {
  for (const cell of row) {
    if (typeof cell === "string" && cell.trim()) return cell.trim();
  }
  return null;
}

function mapColumns(row: Row): ColumnMap | null {
  const map: ColumnMap = {};
  row.forEach((cell, index) => {
    if (typeof cell !== "string") return;
    const normalized = normalizeText(cell);
    for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.includes(normalized)) {
        map[key as keyof typeof HEADER_ALIASES] = index;
      }
    }
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

function normalizeStatus(raw: string): SubjectStatus | null {
  return STATUS_ALIASES[normalizeText(raw)] ?? null;
}

function excelSerialToDate(serial: number): Date {
  return new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
}

function parseCompletedDate(raw: unknown, code: string, warnings: string[]): string | null {
  if (raw === undefined || raw === null || raw === "") return null;

  if (raw instanceof Date) {
    return raw.toISOString();
  }

  if (typeof raw === "number") {
    return excelSerialToDate(raw).toISOString();
  }

  const text = String(raw).trim();
  const match = /^([a-zA-Z]{3,})[.\s-]*(\d{2,4})$/.exec(text);
  if (match) {
    const monthKey = stripAccents(match[1].toLowerCase()).slice(0, 3);
    const month = MONTH_ALIASES[monthKey];
    if (month !== undefined) {
      let year = Number(match[2]);
      if (year < 100) year += 2000;
      return new Date(Date.UTC(year, month, 1)).toISOString();
    }
  }

  warnings.push(`Asignatura ${code}: no se reconoció la fecha "${text}".`);
  return null;
}

export function parsePensumWorkbook(buffer: ArrayBuffer): ParsedPensum {
  const workbook = XLSX.read(buffer, { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Row>(sheet, { header: 1, defval: "" });

  const warnings: string[] = [];
  const quarters: ParsedQuarter[] = [];

  let careerName = "Mi carrera";
  let quarterOrder = 0;
  let i = 0;
  let lastColumns: ColumnMap | null = null;

  // Career name: first non-empty text cell before the first quarter block.
  for (; i < rows.length; i++) {
    if (rowContainsQuarterHeader(rows[i])) break;
    const text = firstNonEmptyString(rows[i]);
    if (text) {
      careerName = text;
      break;
    }
  }

  while (i < rows.length) {
    const row = rows[i];

    if (!rowContainsQuarterHeader(row)) {
      i++;
      continue;
    }

    quarterOrder++;
    const quarterName = firstNonEmptyString(row) ?? `Cuatrimestre ${quarterOrder}`;

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
    while (j < rows.length && !rowContainsQuarterHeader(rows[j])) {
      const subjectRow = rows[j];
      const code = cellText(subjectRow, columns.clave);
      const creditsRaw = cellText(subjectRow, columns.credito);
      const credits = Number(creditsRaw);

      if (!code || !Number.isFinite(credits) || credits <= 0) {
        j++;
        continue;
      }

      const name = cellText(subjectRow, columns.asignatura);
      const prereqRaw = cellText(subjectRow, columns.prereq);
      const statusRaw = cellText(subjectRow, columns.estatus);
      const scoreRaw = cellText(subjectRow, columns.nota);
      const teacherRaw = cellText(subjectRow, columns.docente);

      const status = statusRaw ? normalizeStatus(statusRaw) : "PENDIENTE";
      if (statusRaw && !status) {
        warnings.push(`Asignatura ${code}: estatus "${statusRaw}" no reconocido, se marcó como Pendiente.`);
      }

      let finalScore: number | null = null;
      if (scoreRaw) {
        const parsedScore = Number(scoreRaw);
        if (Number.isFinite(parsedScore)) {
          finalScore = parsedScore;
        } else {
          warnings.push(`Asignatura ${code}: la nota "${scoreRaw}" no es un número.`);
        }
      }

      subjects.push({
        code,
        name: name || code,
        credits,
        prerequisiteCode: !prereqRaw || normalizeText(prereqRaw) === "na" ? null : prereqRaw,
        status: status ?? "PENDIENTE",
        finalScore,
        teacher: teacherRaw || null,
        completedDate: parseCompletedDate(subjectRow[columns.fecha ?? -1], code, warnings),
      });

      j++;
    }

    quarters.push({ order: quarterOrder, name: quarterName, subjects });
    i = j;
  }

  if (quarters.length === 0) {
    warnings.push("No se pudo encontrar ningún cuatrimestre en el archivo. Revisa el formato del Excel.");
  }

  return { careerName, quarters, warnings };
}
