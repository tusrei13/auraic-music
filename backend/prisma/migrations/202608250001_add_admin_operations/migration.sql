CREATE TYPE "IngestionStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED');

CREATE TABLE "IngestionJob" (
  "id" TEXT NOT NULL,
  "status" "IngestionStatus" NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'jamendo',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "imported" INTEGER NOT NULL DEFAULT 0,
  "updated" INTEGER NOT NULL DEFAULT 0,
  "failed" INTEGER NOT NULL DEFAULT 0,
  "errorMessage" TEXT,
  "createdById" TEXT NOT NULL,
  CONSTRAINT "IngestionJob_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "IngestionJob_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "IngestionJob_startedAt_idx" ON "IngestionJob"("startedAt");

CREATE TABLE "SystemSetting" (
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedById" TEXT,
  CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);
