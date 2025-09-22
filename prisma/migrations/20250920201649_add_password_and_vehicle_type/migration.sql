-- AlterTable
ALTER TABLE "users" ADD COLUMN "password" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_bookings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "driverId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "pickupLocation" TEXT NOT NULL,
    "pickupLat" REAL NOT NULL,
    "pickupLng" REAL NOT NULL,
    "dropLocation" TEXT,
    "dropLat" REAL,
    "dropLng" REAL,
    "vehicleType" TEXT NOT NULL DEFAULT 'CAR_ECONOMY',
    "estimatedPrice" REAL NOT NULL,
    "finalPrice" REAL,
    "distance" REAL,
    "duration" INTEGER,
    "bookingType" TEXT NOT NULL DEFAULT 'MANUAL',
    "aiSessionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bookings_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_bookings" ("aiSessionId", "bookingType", "completedAt", "createdAt", "distance", "driverId", "dropLat", "dropLng", "dropLocation", "duration", "estimatedPrice", "finalPrice", "id", "pickupLat", "pickupLng", "pickupLocation", "status", "updatedAt", "userId") SELECT "aiSessionId", "bookingType", "completedAt", "createdAt", "distance", "driverId", "dropLat", "dropLng", "dropLocation", "duration", "estimatedPrice", "finalPrice", "id", "pickupLat", "pickupLng", "pickupLocation", "status", "updatedAt", "userId" FROM "bookings";
DROP TABLE "bookings";
ALTER TABLE "new_bookings" RENAME TO "bookings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
