-- AlterTable
ALTER TABLE "Extra" ADD COLUMN     "appliesToCategories" TEXT[] DEFAULT ARRAY[]::TEXT[];
