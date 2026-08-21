/*
  Warnings:

  - Made the column `kelas` on table `Schedule` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Schedule_prodi_kelas_day_idx";

-- DropIndex
DROP INDEX "Schedule_prodi_kelas_idx";

-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "semester" INTEGER,
ALTER COLUMN "kelas" SET NOT NULL,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "semester" INTEGER;

-- CreateIndex
CREATE INDEX "Schedule_prodi_kelas_semester_idx" ON "Schedule"("prodi", "kelas", "semester");
