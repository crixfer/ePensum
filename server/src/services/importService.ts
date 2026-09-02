import type { PensumImportPayload } from "@epensum/shared";
import { prisma } from "../db.js";
import { HttpError } from "../middleware/errorHandler.js";

export async function importPensumForUser(userId: string, parsed: PensumImportPayload) {
  const existing = await prisma.userPensum.findFirst({ where: { userId, active: true } });
  if (existing) {
    throw new HttpError(409, "Ya tienes un pensum activo. Cámbialo o elimínalo desde ajustes antes de importar otro.");
  }

  // Avoid piling up duplicate templates for the same university+career — reuse one that
  // already exists instead of creating another entry in the pensum list.
  const duplicate = await prisma.pensumTemplate.findFirst({
    where: {
      universityId: parsed.universityId ?? "otra",
      careerName: { equals: parsed.careerName, mode: "insensitive" },
    },
    include: { quarters: { include: { subjects: true } } },
  });
  if (duplicate) {
    return attachToExistingTemplate(userId, duplicate, parsed);
  }

  return prisma.$transaction(async (tx) => {
    const template = await tx.pensumTemplate.create({
      data: {
        universityId: parsed.universityId ?? "otra",
        universityName: parsed.universityName,
        careerName: parsed.careerName,
        createdById: userId,
        quarters: {
          create: parsed.quarters.map((quarter) => ({
            order: quarter.order,
            name: quarter.name,
            subjects: {
              create: quarter.subjects.map((subject) => ({
                order: subject.order,
                code: subject.code,
                name: subject.name,
                credits: subject.credits,
                totalHours: subject.totalHours,
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

type TemplateWithSubjects = {
  id: string;
  quarters: { subjects: { id: string; code: string }[] }[];
};

/** Attaches the user to an already-existing template instead of creating a duplicate,
 * carrying over whatever progress the parsed upload matches by subject code. */
async function attachToExistingTemplate(
  userId: string,
  template: TemplateWithSubjects,
  parsed: PensumImportPayload,
) {
  const subjectByCode = new Map(template.quarters.flatMap((q) => q.subjects.map((s) => [s.code, s] as const)));
  const parsedByCode = new Map(parsed.quarters.flatMap((q) => q.subjects.map((s) => [s.code, s] as const)));

  return prisma.$transaction(async (tx) => {
    const userPensum = await tx.userPensum.create({ data: { userId, templateId: template.id } });

    const allSubjects = template.quarters.flatMap((q) => q.subjects);
    await tx.subjectProgress.createMany({
      data: allSubjects.map((subject) => {
        const parsedSubject = parsedByCode.get(subject.code);
        return {
          userPensumId: userPensum.id,
          subjectId: subject.id,
          status: parsedSubject?.status ?? "PENDIENTE",
          finalScore: parsedSubject?.finalScore ?? null,
          teacher: parsedSubject?.teacher ?? null,
          completedDate: parsedSubject?.completedDate ? new Date(parsedSubject.completedDate) : null,
        };
      }),
    });

    return { templateId: template.id };
  });
}

export async function attachUserToTemplate(userId: string, templateId: string) {
  const existing = await prisma.userPensum.findFirst({ where: { userId, active: true } });
  if (existing) {
    throw new HttpError(409, "Ya tienes un pensum activo. Cámbialo o elimínalo desde ajustes antes de elegir otro.");
  }

  const template = await prisma.pensumTemplate.findUnique({
    where: { id: templateId },
    include: { quarters: { include: { subjects: true } } },
  });
  if (!template) throw new HttpError(404, "Pensum no encontrado");

  // Coming back to a pensum this student had before (and archived by switching away) —
  // reactivate it instead of creating a blank one, so their old progress isn't lost.
  const archived = await prisma.userPensum.findFirst({
    where: { userId, templateId, active: false },
    orderBy: { createdAt: "desc" },
  });
  if (archived) {
    await prisma.userPensum.update({ where: { id: archived.id }, data: { active: true } });
    return { templateId: template.id };
  }

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

/** Fully erases the active pensum and all its tracked progress — irreversible. */
export async function detachUserPensum(userId: string) {
  const existing = await prisma.userPensum.findFirst({ where: { userId, active: true } });
  if (!existing) throw new HttpError(404, "No tienes un pensum activo");
  await prisma.userPensum.delete({ where: { id: existing.id } });
}

/** Switching pensums: archives the current one (keeping all its progress) instead of deleting it. */
export async function archiveUserPensum(userId: string) {
  const existing = await prisma.userPensum.findFirst({ where: { userId, active: true } });
  if (!existing) throw new HttpError(404, "No tienes un pensum activo");
  await prisma.userPensum.update({ where: { id: existing.id }, data: { active: false } });
}

/** Renaming the university/institution only — much lower risk than editing subject
 * structure, but a shared template still shouldn't be renamed out from under other
 * students without being its sole user (or an admin doing cleanup). */
export async function updateActivePensumUniversityName(userId: string, universityName: string | null) {
  const userPensum = await prisma.userPensum.findFirst({ where: { userId, active: true } });
  if (!userPensum) throw new HttpError(404, "No tienes un pensum activo");

  const requestingUser = await prisma.user.findUnique({ where: { id: userId } });
  const isAdmin = requestingUser?.isAdmin ?? false;

  if (!isAdmin) {
    const otherUsers = await prisma.userPensum.findFirst({
      where: { templateId: userPensum.templateId, userId: { not: userId } },
    });
    if (otherUsers) {
      throw new HttpError(
        403,
        "No puedes editar un pensum que comparten otros estudiantes. Contacta a un administrador.",
      );
    }
  }

  await prisma.pensumTemplate.update({
    where: { id: userPensum.templateId },
    data: { universityName },
  });
}

export async function deletePensumTemplate(userId: string, templateId: string) {
  const template = await prisma.pensumTemplate.findUnique({ where: { id: templateId } });
  if (!template) throw new HttpError(404, "Pensum no encontrado");

  const requestingUser = await prisma.user.findUnique({ where: { id: userId } });
  const isAdmin = requestingUser?.isAdmin ?? false;
  if (template.createdById !== userId && !isAdmin) {
    throw new HttpError(403, "Solo quien subió este pensum (o un administrador) puede eliminarlo.");
  }

  const activeUse = await prisma.userPensum.findFirst({ where: { templateId, active: true } });
  if (activeUse && !isAdmin) {
    throw new HttpError(409, "No se puede eliminar: hay estudiantes usando este pensum.");
  }

  await prisma.$transaction(async (tx) => {
    // Any student attached to this template (active or archived) references it by
    // templateId, which would otherwise block the delete — drop those first. An admin
    // forcing removal of a pensum still in active use also drops whoever was attached.
    await tx.userPensum.deleteMany({ where: { templateId } });
    await tx.pensumTemplate.delete({ where: { id: templateId } });
  });
}
