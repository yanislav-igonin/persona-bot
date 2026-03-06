-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'image');

-- AlterTable
ALTER TABLE "messages"
ADD COLUMN "type" "MessageType" NOT NULL DEFAULT 'text',
ADD COLUMN "mediaFileId" TEXT,
ADD COLUMN "mediaUrl" TEXT;
