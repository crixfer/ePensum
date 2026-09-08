import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password.js";

const prisma = new PrismaClient();

async function main() {
  const owner = await prisma.user.upsert({
    where: { email: "seed@epensum.local" },
    update: {},
    create: {
      email: "seed@epensum.local",
      name: "Seed Owner",
      matricula: "20263-0000",
      universityId: "unicaribe",
      passwordHash: await hashPassword("seedpassword"),
    },
  });

  const psychologyCareer = "PSICOLOGIA EDUCATIVA";
  const psychologyExists = await prisma.pensumTemplate.findFirst({ where: { careerName: psychologyCareer } });
  if (!psychologyExists) {
    await prisma.pensumTemplate.create({
      data: {
        careerName: psychologyCareer,
        universityId: "unicaribe",
        universityName: "Universidad del Caribe (UNICARIBE)",
        createdById: owner.id,
        quarters: {
          create: [
            { order: 1, name: "PRIMER CUATRIMESTRE", subjects: { create: [
              { order: 1, code: "FGC-101", name: "ORIENTACIÓN ACADÉMICA INSTITUCIONAL", credits: 2 },
              { order: 2, code: "FGC-102", name: "MÉTODO DEL TRABAJO ACADÉMICO", credits: 2 },
              { order: 3, code: "FGC-103", name: "METODOLOGÍA DE LA INVESTIGACIÓN", credits: 3 },
              { order: 4, code: "BIO-110", name: "BIOLOGIA GENERAL", credits: 3 },
              { order: 5, code: "PSI-113", name: "HISTORIA DE LA PSICOLOGIA", credits: 3 },
            ] } },
            { order: 2, name: "SEGUNDO CUATRIMESTRE", subjects: { create: [
              { order: 1, code: "FGC-104", name: "LENGUA ESPAÑOLA I", credits: 3 },
              { order: 2, code: "FGC-105", name: "MATEMÁTICA BÁSICA I", credits: 3 },
              { order: 3, code: "FGC-106", name: "TECNOLOGÍA DE LA INFORMACIÓN Y COMUNICACIÓN I", credits: 3 },
              { order: 4, code: "PSI-123", name: "PSICOLOGIA GENERAL", credits: 3 },
            ] } },
            { order: 3, name: "TERCER CUATRIMESTRE", subjects: { create: [
              { order: 1, code: "FGC-107", name: "HISTORIA SOCIAL DOMINICANA", credits: 3 },
              { order: 2, code: "FGC-108", name: "INGLÉS I", credits: 3 },
              { order: 3, code: "MAT-241", name: "ESTADISTICA 1", credits: 3, prerequisiteCode: "FGC-105" },
              { order: 4, code: "PSI-124", name: "PSICOLOGIA GENERAL II", credits: 3, prerequisiteCode: "PSI-123" },
              { order: 5, code: "PSI-104", name: "BASES BIOLOGICAS DE LA CONDUCTA", credits: 3, prerequisiteCode: "BIO-110" },
            ] } },
            { order: 4, name: "CUARTO CUATRIMESTRE", subjects: { create: [
              { order: 1, code: "FGC-109", name: "FILOSOFÍA", credits: 3 },
              { order: 2, code: "FGC-110", name: "DESARROLLO SOSTENIBLE Y GESTIÓN DE RIESGOS", credits: 2, prerequisiteCode: "BIO-110" },
              { order: 3, code: "FSE-133", name: "ANTROPOLOGIA SOCIOCULTURAL", credits: 3, prerequisiteCode: "PSI-104" },
              { order: 4, code: "PSI-216", name: "ANALISIS CONDUCTUAL", credits: 3, prerequisiteCode: "PSI-104" },
            ] } },
            { order: 5, name: "QUINTO CUATRIMESTRE", subjects: { create: [
              { order: 1, code: "PSI-134", name: "PSICOLOGIA DEL DESARROLLO I", credits: 3, prerequisiteCode: "PSI-124" },
              { order: 2, code: "PSE-313", name: "PSICOLOGIA EDUCATIVA I", credits: 3, prerequisiteCode: "PSI-124" },
              { order: 3, code: "PSI-219", name: "METODOLOGIA CUANTITATIVA", credits: 3, prerequisiteCode: "FGC-103" },
              { order: 4, code: "PSI-226", name: "TEORIAS DE LA PERSONALIDAD", credits: 3, prerequisiteCode: "PSI-216" },
              { order: 5, code: "PSI-135", name: "NEUROPSICOLOGIA", credits: 3, prerequisiteCode: "PSI-124" },
            ] } },
            { order: 6, name: "SEXTO CUATRIMESTRE", subjects: { create: [
              { order: 1, code: "PSI-218", name: "PSICOLOGIA DEL DESARROLLO II", credits: 3, prerequisiteCode: "PSI-134" },
              { order: 2, code: "PSI-224", name: "INTELIGENCIA EMOCIONAL Y COMPETENCIA SOCIAL", credits: 3, prerequisiteCode: "PSI-216" },
              { order: 3, code: "PSI-326", name: "ENFOQUES PSICOLOGICOS", credits: 3, prerequisiteCode: "PSI-226" },
              { order: 4, code: "PSI-332", name: "TEORIAS DEL DESARROLLO COGNITIVO", credits: 3, prerequisiteCode: "PSI-134" },
              { order: 5, code: "PSI-311", name: "TEORIAS DE LOS TESTS", credits: 3, prerequisiteCode: "PSI-219" },
            ] } },
            { order: 7, name: "SÉPTIMO CUATRIMESTRE", subjects: { create: [
              { order: 1, code: "PSC-332", name: "PSICOMETRIA: PRUEBAS PSICOLOGICAS", credits: 4, prerequisiteCode: "PSI-311" },
              { order: 2, code: "PSI-328", name: "PSICOLOGIA INDUSTRIAL Y ORGANIZACIONAL", credits: 3, prerequisiteCode: "PSI-226" },
              { order: 3, code: "PSI-333", name: "PSICOLOGIA DEL APRENDIZAJE", credits: 3, prerequisiteCode: "PSI-332" },
              { order: 4, code: "PSI-217", name: "PSICOLOGIA SOCIAL", credits: 3, prerequisiteCode: "PSI-216" },
              { order: 5, code: "PSI-232", name: "PSICOLOGIA DIFERENCIAL", credits: 3, prerequisiteCode: "PSI-218" },
            ] } },
            { order: 8, name: "OCTAVO CUATRIMESTRE", subjects: { create: [
              { order: 1, code: "PSI-312", name: "PSICOPATOLOGIA I", credits: 3, prerequisiteCode: "PSI-135" },
              { order: 2, code: "PSI-421", name: "PSICOFARMACOLOGIA", credits: 3 },
              { order: 3, code: "PSE-413", name: "PSICOMETRIA ESCOLAR", credits: 3, prerequisiteCode: "PSC-332" },
              { order: 4, code: "PSE-322", name: "PSICOLOGIA EDUCATIVA II", credits: 3, prerequisiteCode: "PSE-313" },
              { order: 5, code: "PSE-222", name: "NEUROCIENCIA Y APRENDIZAJE", credits: 3, prerequisiteCode: "PSI-135" },
            ] } },
            { order: 9, name: "NOVENO CUATRIMESTRE", subjects: { create: [
              { order: 1, code: "PSI-424", name: "PSICOTERAPIA DEL BIENESTAR EMOCIONAL", credits: 3, prerequisiteCode: "PSI-312" },
              { order: 2, code: "PSI-234", name: "VIOLENCIA DE GENERO", credits: 2, prerequisiteCode: "PSI-217" },
              { order: 3, code: "PSE-331", name: "EVALUACION E INTERVENCION PSICOPEDAGOGICA", credits: 3, prerequisiteCode: "PSI-311" },
              { order: 4, code: "PSE-333", name: "ADECUACION CURRICULAR Y APRENDIZAJE DIFERENCIADO", credits: 3, prerequisiteCode: "PSI-232" },
              { order: 5, code: "PSE-232", name: "DINAMICA Y PORCESOS DE GRUPO EN AMBIENTES ESCOLARES", credits: 3, prerequisiteCode: "PSC-332" },
            ] } },
            { order: 10, name: "DÉCIMO CUATRIMESTRE", subjects: { create: [
              { order: 1, code: "PSE-411", name: "EVALUACION DEL APRENDIZAJE", credits: 3, prerequisiteCode: "PSE-333" },
              { order: 2, code: "PSE-332", name: "INTRODUCCION AL SISTEMA EDUCATIVO Y GESTION ESCOLAR", credits: 3, prerequisiteCode: "PSE-322" },
              { order: 3, code: "PSE-414", name: "MANEJO DE CRISIS EN NINOS Y ADOLESCENTES", credits: 3, prerequisiteCode: "PSI-218" },
              { order: 4, code: "PSE-324", name: "ORIENTACION VOCACIONAL Y OCUPACIONAL", credits: 3, prerequisiteCode: "PSC-332" },
              { order: 5, code: "PSI-330", name: "ETICA PARA PSICOLOGOS", credits: 3, prerequisiteCode: "FGC-102" },
            ] } },
            { order: 11, name: "UNDÉCIMO CUATRIMESTRE", subjects: { create: [
              { order: 1, code: "PSE-233", name: "NECESIDADES EDUCATIVAS ESPECIALES", credits: 3, prerequisiteCode: "IND-335" },
              { order: 2, code: "PSE-422", name: "SALUD Y ESCUELA", credits: 3, prerequisiteCode: "IND-335" },
              { order: 3, code: "PSE-423", name: "TERAPIA FAMILIAR", credits: 3, prerequisiteCode: "IND-401" },
              { order: 4, code: "PSE-334", name: "MOTIVACION Y SENSOPERCEPCION", credits: 3, prerequisiteCode: "ISW-321" },
              { order: 5, code: "FGC-111", name: "SEMINARIO DE GRADO", credits: 3, prerequisiteCode: "FGC-103" },
            ] } },
            { order: 12, name: "DUODÉCIMO CUATRIMESTRE", subjects: { create: [
              { order: 1, code: "PSE-425", name: "LEGISLACION EDUCATIVA", credits: 3, prerequisiteCode: "IND-414" },
              { order: 2, code: "FGC-400", name: "SEMINARIO DE INVESTIGACION", credits: 3, prerequisiteCode: "ISW-321" },
              { order: 3, code: "PSE-431", name: "TERAPIA DE APRENDIZAJE", credits: 3, prerequisiteCode: "IND-413" },
              { order: 4, code: "PSE-432", name: "SALUD SEXUAL Y REPRODUCTIVA", credits: 3, prerequisiteCode: "FGC-111,IND-402" },
            ] } },
            { order: 13, name: "DECIMOTERCER CUATRIMESTRE", subjects: { create: [
              { order: 1, code: "FGC-500", name: "PRACTICAS SUPERVISADAS", credits: 6 },
              { order: 2, code: "FGC-600", name: "TRABAJO DE GRADO", credits: 6 },
            ] } },
          ],
        },
      },
    });
    console.log("Psicología Educativa template created.");
  }

  const existing = await prisma.pensumTemplate.findFirst({
    where: { careerName: "Ingeniería de Software (ejemplo)" },
  });
  if (existing) {
    console.log("Seed template already exists, skipping.");
    return;
  }

  await prisma.pensumTemplate.create({
    data: {
      careerName: "Ingeniería de Software (ejemplo)",
      universityId: "unicaribe",
      createdById: owner.id,
      quarters: {
        create: [
          {
            order: 1,
            name: "PRIMER CUATRIMESTRE",
            subjects: {
              create: [
                { order: 0, code: "FGC-101", name: "Orientación Académica Institucional", credits: 2, prerequisiteCode: null },
                { order: 1, code: "FGC-102", name: "Método del Trabajo Académico", credits: 2, prerequisiteCode: null },
                { order: 2, code: "FGC-103", name: "Metodología de la Investigación", credits: 3, prerequisiteCode: null },
                { order: 3, code: "ADE-101", name: "Administración I", credits: 3, prerequisiteCode: null },
              ],
            },
          },
          {
            order: 2,
            name: "SEGUNDO CUATRIMESTRE",
            subjects: {
              create: [
                { order: 0, code: "FGC-104", name: "Lengua Española I", credits: 3, prerequisiteCode: "FGC-102" },
                { order: 1, code: "FGC-105", name: "Matemática Básica I", credits: 3, prerequisiteCode: "FGC-102" },
                { order: 2, code: "FGC-106", name: "Tecnología de la Información y Comunicación I", credits: 3, prerequisiteCode: null },
                { order: 3, code: "ING-101", name: "Introducción a la Ingeniería", credits: 3, prerequisiteCode: null },
              ],
            },
          },
        ],
      },
    },
  });

  console.log("Seed template created.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
