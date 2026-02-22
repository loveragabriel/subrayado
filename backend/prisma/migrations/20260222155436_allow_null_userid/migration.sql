-- DropForeignKey
ALTER TABLE "Highlight" DROP CONSTRAINT "Highlight_userId_fkey";

-- AlterTable
ALTER TABLE "Highlight" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Highlight" ADD CONSTRAINT "Highlight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
