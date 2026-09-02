import type { PensumImportPayload } from "@epensum/shared";
import { prisma } from "../db.js";
import { HttpError } from "../middleware/errorHandler.js";

export async function importPensumForUser(userId: string, parsed: PensumImportPayload) {
  const existing = await prisma.userPensum.findUnique({ where: { userId } });
  if (existing) {
    throw new HttpError(409, "Ya tienes un pensum activo. Elimínalo desde ajustes antes de importar otro.");
  }

  return prisma.$transaction(async (tx) => {
    const template = await tx.pensumTemplate.create({
      data: {
        careerName: parsed.careerName,
        createdById: userId,
        quarters: {
          create: parsed.quarters.map((quarter) => ({
            order: quarter.order,
            name: quarter.name,
            subjects: {
              create: quarter.subjects.map((subject, index) => ({
                order: index,
                code: subject.code,
                name: subject.name,
                credits: subject.credits,
                prerequisiteCode: subject.prerequisiteCode,
              })),
            },
          })),
        },
      },
      include: { quarters: { include: { subjects: true } } },
    });

    const userPensum = await tx.userPensum.create({
      data: { userId, templateId: template.id },
    });

    const subjectByCode = new Map(
      template.quarters.flatMap((q) => q.subjects.map((s) => [s.code, s] as const)),
    );

    const progressData = parsed.quarters.flatMap((quarter) =>
      quarter.subjects.map((subject) => {
        const dbSubject = subjectByCode.get(subject.code);
        if (!dbSubject) throw new HttpError(500, `No se pudo mapear la asignatura ${subject.code}`);
        return {
          userPensumId: userPensum.id,
          subjectId: dbSubject.id,
          status: subject.status,
          finalScore: subject.finalScore,
          teacher: subject.teacher,
          completedDate: subject.completedDate ? new Date(subject.completedDate) : null,
        };
      }),
    );

    await tx.subjectProgress.createMany({ data: progressData });

    return { templateId: template.id };
  });
}

export async function attachUserToTemplate(userId: string, templateId: string) {
  const existing = await prisma.userPensum.findUnique({ where: { userId } });
  if (existing) {
    throw new HttpError(409, "Ya tienes un pensum activo. Elimínalo desde ajustes antes de elegir otro.");
  }

  const template = await prisma.pensumTemplate.findUnique({
    where: { id: templateId },
    include: { quarters: { include: { subjects: true } } },
  });
  if (!template) throw new HttpError(404, "Pensum no encontrado");

  return prisma.$transaction(async (tx) => {
    const userPensum = await tx.userPensum.create({
      data: { userId, templateId },
    });

    const subjects = template.quarters.flatMap((q) => q.subjects);
    await tx.subjectProgress.createMany({
      data: subjects.map((subject) => ({
        userPensumId: userPensum.id,
        subjectId: subject.id,
        status: "PENDIENTE" as const,
      })),
    });

    return { templateId: template.id };
  });
}

export async function detachUserPensum(userId: string) {
  const existing = await prisma.userPensum.findUnique({ where: { userId } });
  if (!existing) throw new HttpError(404, "No tienes un pensum activo");
  await prisma.userPensum.delete({ where: { userId } });
}
