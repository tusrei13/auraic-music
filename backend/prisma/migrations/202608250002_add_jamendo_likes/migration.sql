CREATE TABLE "JamendoLike" (
  "userId" TEXT NOT NULL,
  "trackId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "artistName" TEXT NOT NULL,
  "image" TEXT NOT NULL,
  "audioUrl" TEXT NOT NULL,
  "duration" INTEGER,
  "licenseUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JamendoLike_pkey" PRIMARY KEY ("userId", "trackId"),
  CONSTRAINT "JamendoLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "JamendoLike_userId_createdAt_idx" ON "JamendoLike"("userId", "createdAt");
