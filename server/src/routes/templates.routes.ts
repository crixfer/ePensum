import { Router } from "express";
import { pensumImportSchema } from "@epensum/shared";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../middleware/errorHandler.js";
import { attachUserToTemplate, deletePensumTemplate, importPensumForUser } from "../services/importService.js";

export const templatesRouter = Router();

templatesRouter.post(
  "/import",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = pensumImportSchema.parse(req.body);
    const result = await importPensumForUser(req.userId!, parsed);
    res.status(201).json(result);
  }),
);

templatesRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const [templates, requestingUser] = await Promise.all([
      prisma.pensumTemplate.findMany({
        include: {
          quarters: { include: { subjects: true } },
          userPensums: { where: { active: true }, select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findUnique({ where: { id: req.userId! } }),
    ]);
    const isAdmin = requestingUser?.isAdmin ?? false;

    res.json(
      templates.map((t) => {
        const subjects = t.quarters.flatMap((q) => q.subjects);
        return {
          id: t.id,
          universityName: t.universityName,
          careerName: t.careerName,
          totalCredits: subjects.reduce((sum, s) => sum + s.credits, 0),
          subjectCount: subjects.length,
          createdAt: t.createdAt.toISOString(),
          canDelete: (t.createdById === req.userId || isAdmin) && t.userPensums.length === 0,
        };
      }),
    );
  }),
);

templatesRouter.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const template = await prisma.pensumTemplate.findUnique({
      where: { id: req.params.id },
      include: { quarters: { orderBy: { order: "asc" }, include: { subjects: { orderBy: { order: "asc" } } } } },
    });
    if (!template) throw new HttpError(404, "Pensum no encontrado");
    res.json(template);
  }),
);

templatesRouter.post(
  "/:id/attach",
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await attachUserToTemplate(req.userId!, req.params.id);
    res.status(201).json(result);
  }),
);

templatesRouter.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    await deletePensumTemplate(req.userId!, req.params.id);
    res.status(204).end();
  }),
);
