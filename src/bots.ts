import { imageProvider } from './image-provider';
import { logger } from './logger';
import { saveChatMiddleware, saveUserMiddleware } from './middlewares';
import {
  decideReplyMode,
  generateImagePrompt,
  generateTextReply,
  getImageCaption,
  type HistoryRecord,
  preparePrompt,
  shouldMakeRandomEncounter,
  shouldTrySpontaneousImageReply,
} from './prompt';
import { replies } from './replies';
import {
  dialog as dialogRepo,
  message as messageRepo,
  persona as personaRepo,
} from '@/repositories';
import { Bot, InputFile } from 'grammy';

type StoredHistoryRecord = {
  botRole: string | null;
  text: string;
  type?: 'image' | 'text';
};

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
        const sendTextReply = async ({
          dialogId,
          replyText,
        }: {
          dialogId: number;
          replyText: string;
        }) => {
          const sentReply = await context.reply(replyText, {
            reply_to_message_id: context.message.message_id,
          });

          await messageRepo.create({
            botRole: name,
            chatId,
            dialogId,
            telegramId: sentReply.message_id.toString(),
            text: replyText,
            type: 'text',
            userId: '0',
          });
        };

        const sendImageReply = async ({
          dialogId,
          imagePrompt,
          replyText,
        }: {
          dialogId: number;
          imagePrompt: string;
          replyText: string;
        }) => {
          const caption = getImageCaption(replyText);
          await context.replyWithChatAction('upload_photo');
          const generatedImage = await imageProvider.generateImage({
            prompt: imagePrompt,
            userId,
          });
          const sentReply = await context.replyWithPhoto(
            new InputFile(generatedImage.image, generatedImage.filename),
            {
              caption,
              reply_to_message_id: context.message.message_id,
            },
          );
          const largestPhoto = sentReply.photo[sentReply.photo.length - 1];

          await messageRepo.create({
            botRole: name,
            chatId,
            dialogId,
            mediaFileId: largestPhoto?.file_id ?? null,
            mediaUrl: null,
            telegramId: sentReply.message_id.toString(),
            text: caption,
            type: 'image',
            userId: '0',
          });
        };

        const resolveReply = async ({
          dialogId,
          history,
        }: {
          dialogId: number;
          history: StoredHistoryRecord[];
        }) => {
          const prompt = preparePrompt(text);
          const normalizedHistory: HistoryRecord[] = history.map((record) => ({
            botRole: record.botRole,
            text: record.text,
            type: record.type,
          }));
          const textReply = await generateTextReply({
            history: normalizedHistory,
            personality: description,
            prompt,
            words,
          });
          const replyMode = await decideReplyMode({
            history: normalizedHistory,
            latestUserText: text,
            personality: description,
            textReply,
            userCanReceiveSpontaneousImage: shouldTrySpontaneousImageReply(),
            words,
          });

          if (replyMode === 'image') {
            try {
              const imagePrompt = await generateImagePrompt({
                history: normalizedHistory,
                latestUserText: text,
                personality: description,
                textReply,
                words,
              });
              await sendImageReply({
                dialogId,
                imagePrompt,
                replyText: textReply,
              });
              return;
            } catch (error) {
              logger.warn(
                { chatId, dialogId, error, name },
                'image reply failed, falling back to text reply',
              );
            }
          }

          await sendTextReply({
            dialogId,
            replyText: textReply,
          });
        };

        // If user replies to our bot message -> continue dialog with history
        if (replyTo?.from?.is_bot) {
          const parentId = replyTo.message_id.toString();
          const parent = await messageRepo.getByChatAndTelegramId(
            chatId,
            parentId,
          );

          if (parent === null) {
            logger.warn(
              { chatId, name, parentId },
              'reply to bot but parent message not found',
            );
            return;
          }

          // Only the bot that authored the parent message should handle the reply
          if (parent.botRole !== name) {
            return;
          }

          await context.replyWithChatAction('typing');

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
          await resolveReply({
            dialogId: existingOrNewDialogId,
            history: history as StoredHistoryRecord[],
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

        await resolveReply({
          dialogId: newDialogId,
          history: [],
        });
      } catch (error) {
        await context.reply(replies.error);
        throw error;
      }
    });
  }
};
