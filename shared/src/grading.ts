import type { HonorClassification, LetterGrade, QuarterView, SubjectStatus, SubjectView } from "./types.js";

/** Mirrors the source spreadsheet's INDICE formula: derived from the score, never stored. */
export function computeLetterGrade(score: number | null | undefined): LetterGrade {
  if (score === null || score === undefined || score === 0) return null;
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export function computeQuarterStatus(subjects: { status: SubjectStatus }[]): SubjectStatus {
  if (subjects.length === 0) return "PENDIENTE";
  if (subjects.every((s) => s.status === "COMPLETADO")) return "COMPLETADO";
  if (subjects.some((s) => s.status === "EN_CURSO" || s.status === "INSCRITA" || s.status === "COMPLETADO")) {
    return "EN_CURSO";
  }
  return "PENDIENTE";
}

export function computeHonor(weightedIndex: number | null): HonorClassification {
  if (weightedIndex === null) return null;
  if (weightedIndex >= 95) return "Summa Cum Laude";
  if (weightedIndex >= 90) return "Magna Cum Laude";
  if (weightedIndex >= 85) return "Cum Laude";
  return null;
}

interface SubjectForSummary {
  credits: number;
  status: SubjectStatus;
  finalScore: number | null;
}

export function computePensumSummary(careerName: string, subjects: SubjectForSummary[]) {
  const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
  const approved = subjects.filter((s) => s.status === "COMPLETADO");
  const pending = subjects.filter((s) => s.status !== "COMPLETADO");

  const creditsApproved = approved.reduce((sum, s) => sum + s.credits, 0);
  const creditsPending = totalCredits - creditsApproved;

  const subjectsTotal = subjects.length;
  const subjectsApproved = approved.length;
  const subjectsPending = pending.length;

  const scores = approved.map((s) => s.finalScore).filter((v): v is number => v !== null && v !== undefined);
  const weightedIndex = scores.length > 0 ? scores.reduce((sum, v) => sum + v, 0) / scores.length : null;

  return {
    careerName,
    totalCredits,
    creditsApproved,
    creditsPending,
    creditsApprovedPct: totalCredits > 0 ? (creditsApproved / totalCredits) * 100 : 0,
    subjectsTotal,
    subjectsApproved,
    subjectsPending,
    subjectsApprovedPct: subjectsTotal > 0 ? (subjectsApproved / subjectsTotal) * 100 : 0,
    weightedIndex,
    honor: computeHonor(weightedIndex),
  };
}

export function buildQuarterView(
  id: string,
  order: number,
  name: string,
  subjects: SubjectView[],
): QuarterView {
  return {
    id,
    order,
    name,
    status: computeQuarterStatus(subjects),
    subjects,
  };
}
