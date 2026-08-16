/*
  Warnings:

  - The values [REVIEW] on the enum `TaskStatus` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `createdById` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Prodi" AS ENUM ('INFORMATIKA', 'SAINS_DATA');

-- CreateEnum
CREATE TYPE "Kelas" AS ENUM ('A', 'B', 'C', 'D', 'E');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'PJ_KELAS', 'PJ_MATKUL', 'ADMIN');

-- CreateEnum
CREATE TYPE "TaskScope" AS ENUM ('PERSONAL', 'CLASS');

-- AlterEnum
BEGIN;
CREATE TYPE "TaskStatus_new" AS ENUM ('TODO', 'IN_PROGRESS', 'NEED_REVIEW', 'DONE');
ALTER TABLE "Task" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Task" ALTER COLUMN "status" TYPE "TaskStatus_new" USING ("status"::text::"TaskStatus_new");
ALTER TYPE "TaskStatus" RENAME TO "TaskStatus_old";
ALTER TYPE "TaskStatus_new" RENAME TO "TaskStatus";
DROP TYPE "TaskStatus_old";
ALTER TABLE "Task" ALTER COLUMN "status" SET DEFAULT 'TODO';
COMMIT;

-- AlterTable
ALTER TABLE "Guild" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "courseId" TEXT,
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "kelas" "Kelas",
ADD COLUMN     "prodi" "Prodi",
ADD COLUMN     "scope" "TaskScope" NOT NULL DEFAULT 'PERSONAL';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "discordRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "kelas" "Kelas",
ADD COLUMN     "prodi" "Prodi",
ADD COLUMN     "roles" "Role"[] DEFAULT ARRAY['STUDENT']::"Role"[],
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prodi" "Prodi" NOT NULL,
    "kelas" "Kelas",
    "pjMatkulId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleSync" (
    "id" TEXT NOT NULL,
    "spreadsheetId" TEXT NOT NULL,
    "sheetName" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleSync_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Course_prodi_kelas_idx" ON "Course"("prodi", "kelas");

-- CreateIndex
CREATE UNIQUE INDEX "Course_code_prodi_kelas_key" ON "Course"("code", "prodi", "kelas");

-- CreateIndex
CREATE INDEX "Task_guildId_idx" ON "Task"("guildId");

-- CreateIndex
CREATE INDEX "Task_createdById_idx" ON "Task"("createdById");

-- CreateIndex
CREATE INDEX "Task_assignedTo_idx" ON "Task"("assignedTo");

-- CreateIndex
CREATE INDEX "Task_courseId_idx" ON "Task"("courseId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_scope_idx" ON "Task"("scope");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
