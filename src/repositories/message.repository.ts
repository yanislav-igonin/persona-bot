import { database } from '@/database';

// Prisma error code for unique constraint violations
const PRISMA_UNIQUE_ERROR_CODE = 'P2002';

type CreateMessageData = {
  botRole?: string | null;
  chatId: string;
  dialogId: number;
  telegramId: string;
  text: string;
  userId: string;
};

export const create = async ({
  botRole,
  chatId,
  dialogId,
  telegramId,
  text,
  userId,
}: CreateMessageData) => {
  try {
    return await database.message.create({
      data: {
        botRole: botRole ?? null,
        chatId,
        dialogId,
        telegramId,
        text,
        userId,
      },
    });
  } catch (error: unknown) {
    // If another bot already inserted this message, return the existing one
    if (
      typeof error === 'object' &&
      error !== null &&
      // @ts-expect-error prisma code on error instance
      error.code === PRISMA_UNIQUE_ERROR_CODE
    ) {
      return await database.message.findFirst({
        where: { chatId, telegramId },
      });
    }

    throw error;
  }
};

export const getByChatAndTelegramId = (chatId: string, telegramId: string) => {
  return database.message.findFirst({
    where: { chatId, telegramId },
  });
};

export const listByDialogId = async (dialogId: number) => {
  return await database.message.findMany({
    orderBy: { createdAt: 'asc' },
    where: { dialogId },
  });
};
