/*
  Warnings:

  - Added the required column `universityId` to the `PensumTemplate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `universityId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PensumTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "universityId" TEXT NOT NULL,
    "universityName" TEXT,
    "careerName" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PensumTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PensumTemplate" ("careerName", "createdAt", "createdById", "id", "universityName") SELECT "careerName", "createdAt", "createdById", "id", "universityName" FROM "PensumTemplate";
DROP TABLE "PensumTemplate";
ALTER TABLE "new_PensumTemplate" RENAME TO "PensumTemplate";
CREATE INDEX "PensumTemplate_careerName_idx" ON "PensumTemplate"("careerName");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "email", "id", "matricula", "name", "passwordHash") SELECT "createdAt", "email", "id", "matricula", "name", "passwordHash" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
