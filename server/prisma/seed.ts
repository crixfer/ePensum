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
      passwordHash: await hashPassword("seedpassword"),
    },
  });

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
