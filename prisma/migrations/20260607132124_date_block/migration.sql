-- CreateTable
CREATE TABLE "DateBlock" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DateBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DateBlock_date_idx" ON "DateBlock"("date");

-- CreateIndex
CREATE INDEX "Booking_eventDate_idx" ON "Booking"("eventDate");
