import { database } from '@/database';

type CreateMessageData = {
  botRole?: string | null;
  dialogId: number;
  telegramId: string;
  text: string;
  userId: string;
};

export const create = async ({
  telegramId,
  text,
  userId,
  botRole,
  dialogId,
}: CreateMessageData) => {
  return await database.message.create({
    data: { botRole: botRole ?? null, dialogId, telegramId, text, userId },
  });
};

export const getByChatAndTelegramId = async (
  chatId: string,
  telegramId: string,
) => {
  return await database.message.findFirst({
    where: { dialog: { chatId }, telegramId },
  });
};

export const listByDialogId = async (dialogId: number) => {
  return await database.message.findMany({
    orderBy: { createdAt: 'asc' },
    where: { dialogId },
  });
};
