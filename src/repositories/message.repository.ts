import { database } from '@/database';

type CreateMessageData = {
  botRole?: string | null;
  chatId: string;
  dialogId: number;
  telegramId: string;
  text: string;
  userId: string;
};

export const create = ({
  botRole,
  chatId,
  dialogId,
  telegramId,
  text,
  userId,
}: CreateMessageData) => {
  return database.message.create({
    data: {
      botRole: botRole ?? null,
      chatId,
      dialogId,
      telegramId,
      text,
      userId,
    },
  });
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
