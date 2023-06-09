import { config } from '@/config';
import { database } from '@/database';
import { logger } from '@/logger';
import { saveChatMiddleware, saveUserMiddleware } from '@/middlewares';
import {
  getCompletion,
  preparePrompt,
  shouldMakeRandomEncounter,
} from '@/prompt';
import { replies } from '@/replies';
import { reply as replyRepo } from '@/repositories';
import { Bot } from 'grammy';

const bot = new Bot(config.botToken);
bot.catch(logger.error);
bot.use(saveUserMiddleware);
bot.use(saveChatMiddleware);

bot.command('start', async (context) => {
  await context.reply(replies.start);
});

bot.command('help', async (context) => {
  await context.reply(replies.help);
});

bot.on('message:text', async (context) => {
  const shouldNotTrigger = !shouldMakeRandomEncounter();
  if (shouldNotTrigger) {
    return;
  }

  const { text } = context.message;
  const { id: chatId } = context.chat;
  const { id: userId } = context.from;
  const { message_id: replyToMessageId } = context.message;

  const prompt = preparePrompt(text);

  try {
    await context.replyWithChatAction('typing');
    const reply = await getCompletion(prompt);
    await context.reply(reply, {
      reply_to_message_id: replyToMessageId,
    });
    await replyRepo.create({
      botRole: config.botRole,
      chatId: chatId.toString(),
      input: prompt,
      output: reply,
      userId: userId.toString(),
    });
  } catch (error) {
    await context.reply(replies.error);
    throw error;
  }
});

const start = async () => {
  await database.$connect();
  logger.info('database connected');
  // eslint-disable-next-line promise/prefer-await-to-then
  bot.start().catch(async (error) => {
    logger.error(error);
    await database.$disconnect();
  });
};

start()
  .then(() => logger.info('bot started'))
  .catch(logger.error);
