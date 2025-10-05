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
import {
  dialog as dialogRepo,
  message as messageRepo,
  persona as personaRepo,
} from '@/repositories';
import { Bot } from 'grammy';

export type InitedBot = {
  bot: Bot;
  description: string;
  name: string;
  words: string[];
};

export const initBots = async (): Promise<InitedBot[]> => {
  const personas = await personaRepo.list();
  return personas.map(
    (persona: {
      botToken: string;
      description: string;
      name: string;
      words: string[];
    }) => ({
      bot: new Bot(persona.botToken),
      description: persona.description,
      name: persona.name,
      words: persona.words,
    }),
  );
};

export const wireBots = (bots: InitedBot[]) => {
  for (const { bot, name, description, words } of bots) {
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
      const userMessageTelegramId = context.message.message_id.toString();
      const replyTo = context.message.reply_to_message;

      try {
        // If user replies to our bot message -> continue dialog with history
        if (replyTo?.from?.is_bot) {
          await context.replyWithChatAction('typing');

          const parentId = replyTo.message_id.toString();
          const parent = await messageRepo.getByChatAndTelegramId(
            chatId,
            parentId,
          );
          const existingOrNewDialogId = parent?.dialogId
            ? parent.dialogId
            : (await dialogRepo.create({ chatId })).id;

          // Save incoming user message
          await messageRepo.create({
            botRole: null,
            chatId,
            dialogId: existingOrNewDialogId,
            telegramId: userMessageTelegramId,
            text,
            userId,
          });

          // Build history and get completion
          const history = await messageRepo.listByDialogId(
            existingOrNewDialogId,
          );
          const messages = buildHistoryMessages(
            history as unknown as Array<{
              botRole: string | null;
              text: string;
            }>,
            description,
            words,
            text,
          );
          const replyWithHistoryText = await getCompletionWithHistory({
            messages,
          });

          const historyReplyOptions = {
            reply_to_message_id: context.message.message_id,
          };
          const sentHistoryReply = await context.reply(
            replyWithHistoryText,
            historyReplyOptions,
          );
          await messageRepo.create({
            botRole: name,
            chatId,
            dialogId: existingOrNewDialogId,
            telegramId: sentHistoryReply.message_id.toString(),
            text: replyWithHistoryText,
            userId: '0',
          });
          return;
        }

        // Otherwise use random encounter gate for new dialog
        const shouldNotTrigger = !shouldMakeRandomEncounter();
        if (shouldNotTrigger) {
          return;
        }

        await context.replyWithChatAction('typing');

        const dialog = await dialogRepo.create({ chatId });
        const newDialogId = dialog.id;

        // Save incoming user message
        await messageRepo.create({
          botRole: null,
          chatId,
          dialogId: newDialogId,
          telegramId: userMessageTelegramId,
          text,
          userId,
        });

        const prompt = preparePrompt(text);
        const replySingleTurnText = await getCompletion({
          personality: description,
          prompt,
          words,
        });
        const singleTurnReplyOptions = {
          reply_to_message_id: context.message.message_id,
        };
        const sentSingleTurnReply = await context.reply(
          replySingleTurnText,
          singleTurnReplyOptions,
        );
        await messageRepo.create({
          botRole: name,
          chatId,
          dialogId: newDialogId,
          telegramId: sentSingleTurnReply.message_id.toString(),
          text: replySingleTurnText,
          userId: '0',
        });
      } catch (error) {
        await context.reply(replies.error);
        throw error;
      }
    });
  }
};
