import { z } from "zod";
import { SUBJECT_STATUSES } from "./types.js";
import { UNIVERSITY_PROFILES } from "./universities.js";

/** Student ID format: 5 digits, hyphen, 4 digits — e.g. "20263-0001". */
export const MATRICULA_PATTERN = /^\d{5}-\d{4}$/;

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
  matricula: z.string().regex(MATRICULA_PATTERN, "Formato esperado: 20263-0001"),
  universityId: universityIdSchema,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
