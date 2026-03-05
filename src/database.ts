import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

export type { Chat, Dialog, Message, User } from './generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? '',
});

export const database = new PrismaClient({
  adapter,
});
