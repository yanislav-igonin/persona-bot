import { database } from '@/database';

export const list = async () => {
  return await database.persona.findMany();
};
