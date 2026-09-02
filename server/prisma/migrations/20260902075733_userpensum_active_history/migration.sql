-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserPensum" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserPensum_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserPensum_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PensumTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_UserPensum" ("createdAt", "id", "templateId", "userId") SELECT "createdAt", "id", "templateId", "userId" FROM "UserPensum";
DROP TABLE "UserPensum";
ALTER TABLE "new_UserPensum" RENAME TO "UserPensum";
CREATE INDEX "UserPensum_userId_active_idx" ON "UserPensum"("userId", "active");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
