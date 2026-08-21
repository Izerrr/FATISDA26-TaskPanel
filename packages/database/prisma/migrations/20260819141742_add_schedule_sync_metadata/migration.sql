/*
  Warnings:

  - A unique constraint covering the columns `[prodi,spreadsheetId,sheetGid]` on the table `ScheduleSync` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `courseName` to the `Schedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prodi` to the `ScheduleSync` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sheetGid` to the `ScheduleSync` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Guild" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "courseName" TEXT NOT NULL,
ADD COLUMN     "markers" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "rawClassCode" TEXT,
ADD COLUMN     "sourceSlots" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ALTER COLUMN "kelas" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ScheduleSync" ADD COLUMN     "normalizedEntries" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "prodi" "Prodi" NOT NULL,
ADD COLUMN     "rawEntries" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sheetGid" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Schedule_prodi_kelas_day_idx" ON "Schedule"("prodi", "kelas", "day");

-- CreateIndex
CREATE INDEX "ScheduleSync_prodi_idx" ON "ScheduleSync"("prodi");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleSync_prodi_spreadsheetId_sheetGid_key" ON "ScheduleSync"("prodi", "spreadsheetId", "sheetGid");
