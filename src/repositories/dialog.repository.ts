import { database } from '@/database';

export const create = async ({ chatId }: { chatId: string }) => {
  return await database.dialog.create({ data: { chatId } });
};

export const getById = async (id: number) => {
  return await database.dialog.findUnique({ where: { id } });
};
