-- CreateEnum
CREATE TYPE "ConfirmationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "externalId" INTEGER NOT NULL,
    "patientName" TEXT NOT NULL,
    "patientMobile" TEXT NOT NULL,
    "doctorName" TEXT NOT NULL,
    "dateSchedule" TEXT NOT NULL,
    "hourSchedule" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "confirmationStatus" "ConfirmationStatus" NOT NULL DEFAULT 'PENDING',
    "n8nNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_externalId_key" ON "Booking"("externalId");

-- CreateIndex
CREATE INDEX "Booking_dateSchedule_idx" ON "Booking"("dateSchedule");
