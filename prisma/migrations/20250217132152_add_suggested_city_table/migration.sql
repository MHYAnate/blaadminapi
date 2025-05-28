-- CreateTable
CREATE TABLE "SuggestedCity" (
    "id" SERIAL NOT NULL,
    "cityName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuggestedCity_pkey" PRIMARY KEY ("id")
);
