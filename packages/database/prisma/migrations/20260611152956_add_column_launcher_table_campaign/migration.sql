-- CreateEnum
CREATE TYPE "LauncherType" AS ENUM ('PLAYWRIGHT', 'CRAWLEE');

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "launcherType" "LauncherType" NOT NULL DEFAULT 'PLAYWRIGHT';
