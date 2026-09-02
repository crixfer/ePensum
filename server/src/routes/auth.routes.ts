import { Router } from "express";
import { loginSchema, signupSchema } from "@epensum/shared";
import { prisma } from "../db.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS, signSession } from "../lib/jwt.js";
import { asyncHandler, HttpError } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const { email, password, name } = signupSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new HttpError(409, "Ya existe una cuenta con este correo");
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
    });

    const token = signSession({ userId: user.id });
    res.cookie(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
    res.status(201).json({ id: user.id, email: user.email, name: user.name });
  }),
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new HttpError(401, "Correo o contraseña incorrectos");
    }

    const token = signSession({ userId: user.id });
    res.cookie(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
    res.json({ id: user.id, email: user.email, name: user.name });
  }),
);

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE_NAME);
  res.status(204).end();
});

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) throw new HttpError(401, "No autenticado");
    res.json({ id: user.id, email: user.email, name: user.name });
  }),
);
