import type { NextFunction, Request, Response } from "express";
import { SESSION_COOKIE_NAME, verifySession } from "../lib/jwt.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  const session = token ? verifySession(token) : null;
  if (!session) {
    return res.status(401).json({ error: "No autenticado" });
  }
  req.userId = session.userId;
  next();
}
