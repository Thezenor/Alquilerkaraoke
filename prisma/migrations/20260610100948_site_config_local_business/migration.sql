-- AlterTable
ALTER TABLE "SiteConfig" ADD COLUMN     "addressCity" TEXT,
ADD COLUMN     "addressPostalCode" TEXT,
ADD COLUMN     "addressRegion" TEXT,
ADD COLUMN     "addressStreet" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "openingHours" TEXT;
