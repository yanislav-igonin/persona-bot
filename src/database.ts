import { PrismaClient } from '@prisma/client';

export type { Chat, Dialog, Message, Reply, User } from '@prisma/client';

export const database = new PrismaClient();
