-- AlterTable
ALTER TABLE "Highlight" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'underline';

-- CreateTable
CREATE TABLE "Glossary" (
    "id" SERIAL NOT NULL,
    "term" TEXT NOT NULL,
    "page" INTEGER NOT NULL,
    "coords" JSONB NOT NULL,
    "roomId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Glossary_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Glossary" ADD CONSTRAINT "Glossary_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
