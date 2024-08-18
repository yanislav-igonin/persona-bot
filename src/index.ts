import { database } from '@/database';
import { logger } from '@/logger';
import { bots } from 'bots';

const start = async () => {
  await database.$connect();
  logger.info('database connected');
  for (const { bot, role } of bots) {
    try {
      logger.info(`bot ${role} started`);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      bot.start();
    } catch (error) {
      logger.error(error);
      await database.$disconnect();
    }
  }
};

start()
  .then(() => logger.info('all systems nominal'))
  .catch(logger.error);
