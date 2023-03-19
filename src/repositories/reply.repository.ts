import { type Reply } from '@/database';
import { database } from '@/database';

export const create = async (data: Omit<Reply, 'createdAt' | 'id'>) =>
  await database.reply.create({ data });
