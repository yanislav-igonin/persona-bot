import { logger } from './logger';
import { saveChatMiddleware, saveUserMiddleware } from './middlewares';
import personas from './personas.json';
import {
  getCompletion,
  preparePrompt,
  shouldMakeRandomEncounter,
} from './prompt';
import { replies } from './replies';
import { reply as replyRepo } from '@/repositories';
import { Bot } from 'grammy';

type BotPersona = {
  botToken: string;
  personality: string;
  role: string;
  words: string[];
};

const bots = (personas as BotPersona[]).map((persona) => ({
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
      const reply = await getCompletion({ personality, prompt, words });
      await context.reply(reply, {
        reply_to_message_id: replyToMessageId,
      });
      await replyRepo.create({
        botRole: role,
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
}

export { bots };
