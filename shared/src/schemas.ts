import { z } from "zod";
import { SUBJECT_STATUSES } from "./types.js";
import { UNIVERSITY_PROFILES } from "./universities.js";

/** Student ID: letters and numbers only, without separators. */
export const MATRICULA_PATTERN = /^[A-Za-z0-9]+$/;

export const universityIdSchema = z.enum(
  UNIVERSITY_PROFILES.map((p) => p.id) as [string, ...string[]],
);

export const subjectStatusSchema = z.enum(SUBJECT_STATUSES);

export const parsedSubjectSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  credits: z.number().int().positive(),
  totalHours: z.number().int().nonnegative().nullable(),
  order: z.number().int(),
  prerequisiteCode: z.string().nullable(),
  status: subjectStatusSchema,
  finalScore: z.number().min(0).max(100).nullable(),
  teacher: z.string().nullable(),
  completedDate: z.string().nullable(),
});

export const parsedQuarterSchema = z.object({
  order: z.number().int().positive(),
  name: z.string().min(1),
  subjects: z.array(parsedSubjectSchema),
});

export const pensumImportSchema: z.ZodType<import("./types.js").PensumImportPayload> = z.object({
  universityId: universityIdSchema.nullable(),
  universityName: z.string().nullable(),
  careerName: z.string().min(1),
  quarters: z.array(parsedQuarterSchema).min(1),
});

export const subjectProgressUpdateSchema = z.object({
  status: subjectStatusSchema.optional(),
  finalScore: z.number().min(0).max(100).nullable().optional(),
  teacher: z.string().nullable().optional(),
  completedDate: z.string().nullable().optional(),
});

export const updateUniversityNameSchema = z.object({
  universityName: z.string().min(1).nullable(),
});

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  matricula: z.string().regex(MATRICULA_PATTERN, "Usa solo letras y números, sin guiones ni espacios"),
  universityId: universityIdSchema,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateAccountSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1),
  matricula: z.string().trim().regex(MATRICULA_PATTERN, "Usa solo letras y números, sin guiones ni espacios"),
});

export const changePasswordSchema = z.object({
  password: z.string().min(8),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
