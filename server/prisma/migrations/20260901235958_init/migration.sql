-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PensumTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "careerName" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PensumTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Quarter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Quarter_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PensumTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quarterId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "prerequisiteCode" TEXT,
    CONSTRAINT "Subject_quarterId_fkey" FOREIGN KEY ("quarterId") REFERENCES "Quarter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserPensum" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserPensum_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserPensum_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PensumTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubjectProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userPensumId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "finalScore" REAL,
    "teacher" TEXT,
    "completedDate" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SubjectProgress_userPensumId_fkey" FOREIGN KEY ("userPensumId") REFERENCES "UserPensum" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SubjectProgress_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "PensumTemplate_careerName_idx" ON "PensumTemplate"("careerName");

-- CreateIndex
CREATE UNIQUE INDEX "Quarter_templateId_order_key" ON "Quarter"("templateId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_quarterId_code_key" ON "Subject"("quarterId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "UserPensum_userId_key" ON "UserPensum"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectProgress_userPensumId_subjectId_key" ON "SubjectProgress"("userPensumId", "subjectId");
