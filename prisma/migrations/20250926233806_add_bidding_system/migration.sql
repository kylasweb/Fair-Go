-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('ACTIVE', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "biddingEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "biddingEndTime" TIMESTAMP(3),
ADD COLUMN     "winningBidId" TEXT;

-- CreateTable
CREATE TABLE "ride_bids" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "bidAmount" DOUBLE PRECISION NOT NULL,
    "estimatedArrivalTime" INTEGER NOT NULL,
    "bidStatus" "BidStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ride_bids_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ride_bids" ADD CONSTRAINT "ride_bids_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ride_bids" ADD CONSTRAINT "ride_bids_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
