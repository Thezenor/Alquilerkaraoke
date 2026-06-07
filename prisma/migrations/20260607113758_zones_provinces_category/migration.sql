/*
  Warnings:

  - You are about to drop the `ProvinceSupplement` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Extra" ADD COLUMN     "category" TEXT;

-- AlterTable
ALTER TABLE "Pack" ADD COLUMN     "category" TEXT;

-- DropTable
DROP TABLE "ProvinceSupplement";

-- CreateTable
CREATE TABLE "TariffZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "supplement" INTEGER NOT NULL DEFAULT 0,
    "pendingConfig" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TariffZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Province" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "zoneId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Province_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TariffZone_name_key" ON "TariffZone"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Province_name_key" ON "Province"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Province_slug_key" ON "Province"("slug");

-- CreateIndex
CREATE INDEX "Province_zoneId_idx" ON "Province"("zoneId");

-- AddForeignKey
ALTER TABLE "Province" ADD CONSTRAINT "Province_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "TariffZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
