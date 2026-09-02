import type { ExtraFieldType } from "./universities.js";

export const SUBJECT_STATUSES = ["PENDIENTE", "INSCRITA", "EN_CURSO", "COMPLETADO"] as const;
export type SubjectStatus = (typeof SUBJECT_STATUSES)[number];

export const STATUS_LABELS_ES: Record<SubjectStatus, string> = {
  PENDIENTE: "Pendiente",
  INSCRITA: "Inscrita",
  EN_CURSO: "En curso",
  COMPLETADO: "Completado",
};

export type LetterGrade = "A" | "B" | "C" | "D" | "F" | null;

export type HonorClassification = "Summa Cum Laude" | "Magna Cum Laude" | "Cum Laude" | null;

export interface ParsedSubject {
  code: string;
  name: string;
  credits: number;
  /** Position within the pensum (quarter-local index, or a real sequence number like ISFODOSU's N°). */
  order: number;
  prerequisiteCode: string | null;
  status: SubjectStatus;
  finalScore: number | null;
  teacher: string | null;
  completedDate: string | null; // ISO date string, or null if unparsed
}

export interface ParsedQuarter {
  order: number;
  name: string;
  subjects: ParsedSubject[];
}

export interface ParsedPensum {
  universityId: string | null;
  universityName: string | null;
  careerName: string;
  quarters: ParsedQuarter[];
  warnings: string[];
}

/** What actually gets persisted on import — warnings are a review-UI-only concern. */
export type PensumImportPayload = Omit<ParsedPensum, "warnings">;

export interface SubjectView {
  id: string;
  code: string;
  name: string;
  credits: number;
  order: number;
  prerequisiteCode: string | null;
  /** False only when prerequisiteCode names a known subject in this pensum that isn't COMPLETADO yet. */
  prerequisiteMet: boolean;
  status: SubjectStatus;
  finalScore: number | null;
  letterGrade: LetterGrade;
  teacher: string | null;
  completedDate: string | null;
}

export interface QuarterView {
  id: string;
  order: number;
  name: string;
  status: SubjectStatus;
  subjects: SubjectView[];
}

export interface PensumSummary {
  universityName: string | null;
  extraField: ExtraFieldType;
  careerName: string;
  totalCredits: number;
  creditsApproved: number;
  creditsPending: number;
  creditsApprovedPct: number;
  subjectsTotal: number;
  subjectsApproved: number;
  subjectsPending: number;
  subjectsApprovedPct: number;
  weightedIndex: number | null;
  honor: HonorClassification;
}

export interface PensumView {
  summary: PensumSummary;
  quarters: QuarterView[];
}

export interface PensumTemplateListItem {
  id: string;
  universityName: string | null;
  careerName: string;
  totalCredits: number;
  subjectCount: number;
  createdAt: string;
  /** True when the requesting user created this template and no one has attached to it. */
  canDelete: boolean;
}
