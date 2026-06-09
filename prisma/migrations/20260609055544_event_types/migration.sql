-- CreateTable
CREATE TABLE "EventType" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortDescription" TEXT,
    "intro" TEXT,
    "description" TEXT,
    "features" JSONB,
    "faq" JSONB,
    "heroImageUrl" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "translations" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventType_slug_key" ON "EventType"("slug");

-- CreateIndex
CREATE INDEX "EventType_isActive_sortOrder_idx" ON "EventType"("isActive", "sortOrder");
