import { database } from '@/database';
import { logger } from '@/logger';
import { initBots, wireBots } from 'bots';

const start = async () => {
  await database.$connect();
  logger.info('database connected');

  const bots = await initBots();
  if (bots.length === 0) {
    logger.info('no personas found; no bots started');
    return;
  }

  wireBots(bots);
  for (const { bot, name } of bots) {
    try {
      logger.info(`bot ${name} started`);
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
