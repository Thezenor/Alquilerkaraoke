-- AlterTable
ALTER TABLE "ContactRequest" ADD COLUMN     "acceptedTerms" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "consentAt" TIMESTAMP(3),
ADD COLUMN     "consentVersion" TEXT,
ADD COLUMN     "marketingConsent" BOOLEAN NOT NULL DEFAULT false;
