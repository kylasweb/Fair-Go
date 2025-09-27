/*
  Warnings:

  - You are about to drop the column `adminNotes` on the `wallet_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `processedBy` on the `wallet_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `referenceId` on the `wallet_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `wallet_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `accountDetails` on the `withdrawal_methods` table. All the data in the column will be lost.
  - You are about to drop the column `methodType` on the `withdrawal_methods` table. All the data in the column will be lost.
  - Added the required column `walletId` to the `wallet_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `withdrawal_methods` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "wallet_transactions" DROP CONSTRAINT "wallet_transactions_userId_fkey";

-- AlterTable
ALTER TABLE "wallet_transactions" DROP COLUMN "adminNotes",
DROP COLUMN "processedBy",
DROP COLUMN "referenceId",
DROP COLUMN "userId",
ADD COLUMN     "bookingId" TEXT,
ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "paymentReference" TEXT,
ADD COLUMN     "walletId" TEXT NOT NULL,
ADD COLUMN     "withdrawalMethodId" TEXT;

-- AlterTable
ALTER TABLE "withdrawal_methods" DROP COLUMN "accountDetails",
DROP COLUMN "methodType",
ADD COLUMN     "accountHolderName" TEXT,
ADD COLUMN     "accountNumber" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "ifscCode" TEXT,
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paypalEmail" TEXT,
ADD COLUMN     "stripeAccountId" TEXT,
ADD COLUMN     "type" "WithdrawalMethodType" NOT NULL,
ADD COLUMN     "upiId" TEXT;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_withdrawalMethodId_fkey" FOREIGN KEY ("withdrawalMethodId") REFERENCES "withdrawal_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
