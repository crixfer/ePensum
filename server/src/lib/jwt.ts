import jwt from "jsonwebtoken";

const COOKIE_NAME = "epensum_session";
const EXPIRES_IN = "30d";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be configured in production");
  }
  return "dev-secret-change-me";
}

export interface SessionPayload {
  userId: string;
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: EXPIRES_IN });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as SessionPayload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};
