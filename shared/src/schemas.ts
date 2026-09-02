import { z } from "zod";
import { SUBJECT_STATUSES } from "./types.js";

export const subjectStatusSchema = z.enum(SUBJECT_STATUSES);

export const parsedSubjectSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  credits: z.number().int().positive(),
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
  careerName: z.string().min(1),
  quarters: z.array(parsedQuarterSchema).min(1),
});

export const subjectProgressUpdateSchema = z.object({
  status: subjectStatusSchema.optional(),
  finalScore: z.number().min(0).max(100).nullable().optional(),
  teacher: z.string().nullable().optional(),
  completedDate: z.string().nullable().optional(),
});

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
