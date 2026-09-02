import {
  buildQuarterView,
  computeLetterGrade,
  computePensumSummary,
  computePrerequisiteMet,
  getUniversityProfile,
  type PensumView,
  type SubjectStatus,
  type SubjectView,
} from "@epensum/shared";
import { prisma } from "../db.js";
import { HttpError } from "../middleware/errorHandler.js";

export async function getPensumViewForUser(userId: string): Promise<PensumView> {
  const userPensum = await prisma.userPensum.findUnique({
    where: { userId },
    include: {
      template: {
        include: {
          quarters: {
            orderBy: { order: "asc" },
            include: { subjects: { orderBy: { order: "asc" } } },
          },
        },
      },
      progress: true,
    },
  });

  if (!userPensum) {
    throw new HttpError(404, "No tienes un pensum activo");
  }

  const progressBySubjectId = new Map(userPensum.progress.map((p) => [p.subjectId, p]));
  const allSubjectRows = userPensum.template.quarters.flatMap((q) => q.subjects);

  const statusByCode = new Map<string, SubjectStatus>(
    allSubjectRows.map((subject) => [
      subject.code,
      (progressBySubjectId.get(subject.id)?.status as SubjectStatus) ?? "PENDIENTE",
    ]),
  );

  const quarterViews = userPensum.template.quarters.map((quarter) => {
    const subjectViews: SubjectView[] = quarter.subjects.map((subject) => {
      const progress = progressBySubjectId.get(subject.id);
      const status: SubjectStatus = (progress?.status as SubjectStatus) ?? "PENDIENTE";
      const finalScore = progress?.finalScore ?? null;
      return {
        id: subject.id,
        code: subject.code,
        name: subject.name,
        credits: subject.credits,
        order: subject.order,
        prerequisiteCode: subject.prerequisiteCode,
        prerequisiteMet: computePrerequisiteMet(subject.prerequisiteCode, statusByCode),
        status,
        finalScore,
        letterGrade: computeLetterGrade(finalScore),
        teacher: progress?.teacher ?? null,
        completedDate: progress?.completedDate ? progress.completedDate.toISOString() : null,
      };
    });
    return buildQuarterView(quarter.id, quarter.order, quarter.name, subjectViews);
  });

  const allSubjects = quarterViews.flatMap((q) => q.subjects);
  const summary = computePensumSummary(
    userPensum.template.universityName,
    getUniversityProfile(userPensum.template.universityId).extraField,
    userPensum.template.careerName,
    allSubjects,
  );

  return { summary, quarters: quarterViews };
}
