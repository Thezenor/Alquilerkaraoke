-- CreateEnum
CREATE TYPE "PriceModifierType" AS ENUM ('FIXED', 'PERCENT');

-- CreateEnum
CREATE TYPE "SurchargeType" AS ENUM ('WEEKEND', 'NIGHT', 'SPECIAL_DATE', 'HIGH_DEMAND', 'EXTERIOR', 'DIFFICULT_SETUP', 'EVENT_TYPE', 'OTHER');

-- CreateTable
CREATE TABLE "Pack" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortDescription" TEXT,
    "description" TEXT,
    "basePrice" INTEGER NOT NULL,
    "includedHours" INTEGER NOT NULL DEFAULT 4,
    "extraHourPrice" INTEGER NOT NULL DEFAULT 0,
    "isPerDay" BOOLEAN NOT NULL DEFAULT false,
    "depositType" "PriceModifierType" NOT NULL DEFAULT 'PERCENT',
    "depositValue" INTEGER NOT NULL DEFAULT 30,
    "securityDeposit" INTEGER NOT NULL DEFAULT 0,
    "translations" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Extra" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "translations" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Extra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProvinceSupplement" (
    "id" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProvinceSupplement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Surcharge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SurchargeType" NOT NULL,
    "valueType" "PriceModifierType" NOT NULL DEFAULT 'PERCENT',
    "value" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,

    CONSTRAINT "Surcharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "vatPercent" INTEGER NOT NULL DEFAULT 21,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pack_slug_key" ON "Pack"("slug");

-- CreateIndex
CREATE INDEX "Pack_isActive_sortOrder_idx" ON "Pack"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Extra_slug_key" ON "Extra"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProvinceSupplement_province_key" ON "ProvinceSupplement"("province");
