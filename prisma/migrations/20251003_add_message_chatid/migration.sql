-- Add chatId column as NOT NULL without backfilling
ALTER TABLE "messages" ADD COLUMN "chatId" TEXT NOT NULL;

-- Create index for chatId and unique constraint on (chatId, telegramId)
CREATE INDEX IF NOT EXISTS "messages_chatId_idx" ON "messages"("chatId");

-- Drop old unique index and add new one
DROP INDEX IF EXISTS "messages_dialogId_telegramId_key";
CREATE UNIQUE INDEX "chat_message_unique" ON "messages"("chatId", "telegramId");
