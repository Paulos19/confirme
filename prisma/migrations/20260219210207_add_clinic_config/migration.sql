-- CreateTable
CREATE TABLE "Config" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "messageTemplate" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);
