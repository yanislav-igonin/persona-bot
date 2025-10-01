import { config } from './config';
import { logger } from './logger';
import { saveChatMiddleware, saveUserMiddleware } from './middlewares';
import {
  buildHistoryMessages,
  getCompletion,
  getCompletionWithHistory,
  preparePrompt,
  shouldMakeRandomEncounter,
} from './prompt';
import { replies } from './replies';
import { dialog as dialogRepo, message as messageRepo } from '@/repositories';
import { Bot } from 'grammy';

const bots = config.personas.map((persona) => ({
  bot: new Bot(persona.botToken),
  ...persona,
}));

for (const { bot, personality, role, words } of bots) {
  // eslint-disable-next-line promise/prefer-await-to-then
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
    const { text } = context.message;
    const chatId = context.chat.id.toString();
    const userId = context.from.id.toString();
    const messageId = context.message.message_id.toString();
    const replyTo = context.message.reply_to_message;

    try {
      await context.replyWithChatAction('typing');

      // If user replies to our bot message -> continue dialog with history
      if (replyTo?.from?.is_bot) {
        const parentId = replyTo.message_id.toString();
        const parent = await messageRepo.getByChatAndTelegramId(
          chatId,
          parentId,
        );
        const dialogId = parent?.dialogId
          ? parent.dialogId
          : (await dialogRepo.create({ chatId })).id;

        // Save incoming user message
        await messageRepo.create({
          botRole: null,
          dialogId,
          telegramId: messageId,
          text,
          userId,
        });

        // Build history and get completion
        const history = await messageRepo.listByDialogId(dialogId);
        const messages = buildHistoryMessages(
          history as unknown as Array<{ botRole: string | null; text: string }>,
          personality,
          words,
          text,
        );
        const reply = await getCompletionWithHistory({ messages });

        const sent = await context.reply(reply, {
          reply_to_message_id: context.message.message_id,
        });
        await messageRepo.create({
          botRole: role,
          dialogId,
          telegramId: sent.message_id.toString(),
          text: reply,
          userId: '0',
        });
        return;
      }

      // Otherwise use random encounter gate for new dialog
      const shouldNotTrigger = !shouldMakeRandomEncounter();
      if (shouldNotTrigger) {
        return;
      }

      const dialog = await dialogRepo.create({ chatId });
      const dialogId = dialog.id;

      // Save incoming user message
      await messageRepo.create({
        botRole: null,
        dialogId,
        telegramId: messageId,
        text,
        userId,
      });

      const prompt = preparePrompt(text);
      const reply = await getCompletion({ personality, prompt, words });
      const sent = await context.reply(reply, {
        reply_to_message_id: context.message.message_id,
      });
      await messageRepo.create({
        botRole: role,
        dialogId,
        telegramId: sent.message_id.toString(),
        text: reply,
        userId: '0',
      });
    } catch (error) {
      await context.reply(replies.error);
      throw error;
    }
  });
}

export { bots };
