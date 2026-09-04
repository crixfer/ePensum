import { Router } from "express";
import { changePasswordSchema, subjectProgressUpdateSchema, updateAccountSchema, updateUniversityNameSchema } from "@epensum/shared";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../middleware/errorHandler.js";
import { getPensumViewForUser } from "../services/pensumService.js";
import { hashPassword } from "../lib/password.js";
import { archiveUserPensum, detachUserPensum, updateActivePensumUniversityName } from "../services/importService.js";

export const meRouter = Router();

meRouter.use(requireAuth);

meRouter.get(
  "/pensum",
  asyncHandler(async (req, res) => {
    const view = await getPensumViewForUser(req.userId!);
    res.json(view);
  }),
);

meRouter.patch(
  "/account",
  asyncHandler(async (req, res) => {
    const { email, name, matricula } = updateAccountSchema.parse(req.body);
    const existingUser = await prisma.user.findFirst({ where: { email, id: { not: req.userId! } } });
    if (existingUser) throw new HttpError(409, "Ya existe una cuenta con este correo");
    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: { email, name, matricula },
    });
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      matricula: user.matricula.replace(/[^a-zA-Z0-9]/g, ""),
      universityId: user.universityId,
      isAdmin: user.isAdmin,
    });
  }),
);

meRouter.patch(
  "/password",
  asyncHandler(async (req, res) => {
    const { password } = changePasswordSchema.parse(req.body);
    await prisma.user.update({
      where: { id: req.userId! },
      data: { passwordHash: await hashPassword(password) },
    });
    res.status(204).end();
  }),
);

meRouter.patch(
  "/pensum/university",
  asyncHandler(async (req, res) => {
    const { universityName } = updateUniversityNameSchema.parse(req.body);
    await updateActivePensumUniversityName(req.userId!, universityName);
    const view = await getPensumViewForUser(req.userId!);
    res.json(view);
  }),
);

meRouter.post(
  "/pensum/archive",
  asyncHandler(async (req, res) => {
    await archiveUserPensum(req.userId!);
    res.status(204).end();
  }),
);

meRouter.delete(
  "/pensum",
  asyncHandler(async (req, res) => {
    await detachUserPensum(req.userId!);
    res.status(204).end();
  }),
);

meRouter.patch(
  "/pensum/subjects/:subjectId",
  asyncHandler(async (req, res) => {
    const update = subjectProgressUpdateSchema.parse(req.body);

    const userPensum = await prisma.userPensum.findFirst({ where: { userId: req.userId!, active: true } });
    if (!userPensum) throw new HttpError(404, "No tienes un pensum activo");

    await prisma.subjectProgress.upsert({
      where: {
        userPensumId_subjectId: {
          userPensumId: userPensum.id,
          subjectId: req.params.subjectId,
        },
      },
      create: {
        userPensumId: userPensum.id,
        subjectId: req.params.subjectId,
        status: update.status ?? "PENDIENTE",
        finalScore: update.finalScore ?? null,
        teacher: update.teacher ?? null,
        completedDate: update.completedDate ? new Date(update.completedDate) : null,
      },
      update: {
        ...(update.status !== undefined ? { status: update.status } : {}),
        ...(update.finalScore !== undefined ? { finalScore: update.finalScore } : {}),
        ...(update.teacher !== undefined ? { teacher: update.teacher } : {}),
        ...(update.completedDate !== undefined
          ? { completedDate: update.completedDate ? new Date(update.completedDate) : null }
          : {}),
      },
    });

    const view = await getPensumViewForUser(req.userId!);
    res.json(view);
  }),
);
