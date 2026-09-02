import { Router } from "express";
import { subjectProgressUpdateSchema } from "@epensum/shared";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../middleware/errorHandler.js";
import { getPensumViewForUser } from "../services/pensumService.js";
import { archiveUserPensum, detachUserPensum } from "../services/importService.js";

export const meRouter = Router();

meRouter.use(requireAuth);

meRouter.get(
  "/pensum",
  asyncHandler(async (req, res) => {
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
