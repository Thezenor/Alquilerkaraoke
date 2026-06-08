-- CreateTable
CREATE TABLE "SongBrand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quality" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SongBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Song" (
    "id" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "code" TEXT,
    "title" TEXT NOT NULL,
    "performer" TEXT NOT NULL,
    "brandId" TEXT,
    "dedupKey" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SongBrand_name_key" ON "SongBrand"("name");

-- CreateIndex
CREATE INDEX "Song_languageCode_isPrimary_idx" ON "Song"("languageCode", "isPrimary");

-- CreateIndex
CREATE INDEX "Song_dedupKey_idx" ON "Song"("dedupKey");

-- CreateIndex
CREATE INDEX "Song_isPrimary_idx" ON "Song"("isPrimary");

-- AddForeignKey
ALTER TABLE "Song" ADD CONSTRAINT "Song_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "SongBrand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
