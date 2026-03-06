import { textModel } from '@/ai';
import { config } from '@/config';
import { replies } from '@/replies';
import { type ChatCompletionMessageParam } from 'openai/resources';

const trimText = (text: string) => {
  return text.trim();
};

const getSystemMessage = (content: string): ChatCompletionMessageParam => ({
  content,
  role: 'system',
});

const getUserMessage = (content: string): ChatCompletionMessageParam => ({
  content,
  role: 'user',
});

export type ReplyMode = 'text' | 'image';
export type HistoryRecord = {
  botRole: string | null | undefined;
  text: string;
  type?: ReplyMode;
};

const TEXT_REPLY_MAX_LENGTH = 500;
const IMAGE_CAPTION_MAX_LENGTH = 220;

const serializeHistoryRecord = ({ botRole, text, type }: HistoryRecord) => {
  if (!botRole) {
    return text;
  }

  if (type === 'image') {
    return `Бот отправил изображение с подписью: ${text}`;
  }

  return text;
};

const getWordsListMessage = (words: string[]) =>
  getSystemMessage(
    `Используй иногда в своей речи разные слова из этого списка: ${words} - и подобные, которые подходят по контексту, чтобы не было слишком однообразно.`,
  );

const getRelevantHistory = (
  history: HistoryRecord[],
  latestUserText?: string,
): HistoryRecord[] => {
  const lastRecord = history[history.length - 1];
  if (
    latestUserText !== undefined &&
    lastRecord &&
    !lastRecord.botRole &&
    trimText(lastRecord.text) === trimText(latestUserText)
  ) {
    return history.slice(0, -1);
  }

  return history;
};

const getHistoryMessages = (
  history: HistoryRecord[],
  latestUserText?: string,
): ChatCompletionMessageParam[] =>
  getRelevantHistory(history, latestUserText).map((record) => ({
    content: serializeHistoryRecord(record),
    role: record.botRole ? 'assistant' : 'user',
  }));

const getTextFromCompletion = async ({
  messages,
}: {
  messages: ChatCompletionMessageParam[];
}) => {
  const response = await textModel.chat.completions.create({
    messages,
    model: 'grok-3-latest',
  });
  const text = response.choices[0].message.content;
  return trimText(text ?? replies.error);
};

const parseJsonResponse = <T>(rawText: string): T => {
  const normalized = rawText
    .replace(/^```json\s*/u, '')
    .replace(/^```\s*/u, '')
    .replace(/\s*```$/u, '')
    .trim();

  return JSON.parse(normalized) as T;
};

export const buildHistoryMessages = (
  history: HistoryRecord[],
  personality: string,
  words: string[],
  latestUserText: string,
): ChatCompletionMessageParam[] => {
  const personalityMessage = getSystemMessage(personality);
  const wordsListMessage = getWordsListMessage(words);
  const answerRequestMessage = getSystemMessage(
    'Тебе не понравилось сообщение пользователя, ответь на него.',
  );
  const shortAnswerRequestMessage = getSystemMessage(
    `Ответ на сообщение пользователя должен быть коротким, не более ${TEXT_REPLY_MAX_LENGTH} символов.`,
  );
  const mappedHistory = getHistoryMessages(history, latestUserText);

  const userPromptMessage = getUserMessage(latestUserText);

  return [
    personalityMessage,
    wordsListMessage,
    answerRequestMessage,
    shortAnswerRequestMessage,
    ...mappedHistory,
    userPromptMessage,
  ];
};

export const getCompletionWithHistory = async ({
  messages,
}: {
  messages: ChatCompletionMessageParam[];
}) => {
  return await getTextFromCompletion({ messages });
};

// Existing single-turn helpers

type GetCompletionData = {
  personality: string;
  prompt: string;
  words: string[];
};
export const getCompletion = async ({
  prompt,
  personality,
  words,
}: GetCompletionData) => {
  const personalityMessage = getSystemMessage(personality);
  const wordsListMessage = getWordsListMessage(words);
  const answerRequestMessage = getSystemMessage(
    'Тебе не понравилось сообщение пользователя, ответь на него.',
  );
  const shortAnswerRequestMessage = getSystemMessage(
    `Ответ на сообщение пользователя должен быть коротким, не более ${TEXT_REPLY_MAX_LENGTH} символов.`,
  );
  const userPromptMessage = getUserMessage(prompt);
  const messages = [
    personalityMessage,
    wordsListMessage,
    answerRequestMessage,
    shortAnswerRequestMessage,
    userPromptMessage,
  ];
  return await getTextFromCompletion({ messages });
};

export const preparePrompt = (text: string) => {
  return trimText(text);
};

export const joinWithReply = (originalText: string, text: string) =>
  `Мое предыдущие сообщение:\n${originalText}\n\nСообщение пользователя:\n${text}`;

export const shouldMakeRandomEncounter = () =>
  Math.random() < config.randomEncounterChance;

export const shouldTrySpontaneousImageReply = () =>
  config.imageRepliesEnabled && Math.random() < config.imageReplyChance;

export const generateTextReply = async ({
  history,
  personality,
  prompt,
  words,
}: {
  history?: HistoryRecord[];
  personality: string;
  prompt: string;
  words: string[];
}) => {
  if (history && history.length > 0) {
    return await getCompletionWithHistory({
      messages: buildHistoryMessages(history, personality, words, prompt),
    });
  }

  return await getCompletion({
    personality,
    prompt,
    words,
  });
};

export const decideReplyMode = async ({
  history,
  latestUserText,
  personality,
  textReply,
  userCanReceiveSpontaneousImage,
  words,
}: {
  history: HistoryRecord[];
  latestUserText: string;
  personality: string;
  textReply: string;
  userCanReceiveSpontaneousImage: boolean;
  words: string[];
}): Promise<ReplyMode> => {
  if (!config.imageRepliesEnabled) {
    return 'text';
  }

  const messages: ChatCompletionMessageParam[] = [
    getSystemMessage(personality),
    getWordsListMessage(words),
    getSystemMessage(
      'Ты решаешь, нужно ли ответить пользователю изображением вместо обычного текстового сообщения. Отвечай только JSON без пояснений.',
    ),
    getSystemMessage(
      `Если пользователь явно просит фото, картинку, мем, пикчу, рисунок, изображение или что-то визуальное, выбирай image. Если явной просьбы нет, image можно выбирать только когда canSendSpontaneousImage=true и картинка естественно подходит под настроение ответа.`,
    ),
    getSystemMessage(
      'Верни объект формата {"mode":"text"} или {"mode":"image"}. Никаких других ключей не добавляй.',
    ),
    getSystemMessage(
      `canSendSpontaneousImage=${String(userCanReceiveSpontaneousImage)}`,
    ),
    ...getHistoryMessages(history, latestUserText),
    getUserMessage(`Сообщение пользователя: ${latestUserText}`),
    getSystemMessage(`Уже подготовленный текстовый ответ бота: ${textReply}`),
  ];

  try {
    const rawResponse = await getTextFromCompletion({ messages });
    const parsed = parseJsonResponse<{ mode?: ReplyMode }>(rawResponse);
    return parsed.mode === 'image' ? 'image' : 'text';
  } catch {
    return 'text';
  }
};

export const generateImagePrompt = async ({
  history,
  latestUserText,
  personality,
  textReply,
  words,
}: {
  history: HistoryRecord[];
  latestUserText: string;
  personality: string;
  textReply: string;
  words: string[];
}) => {
  const messages: ChatCompletionMessageParam[] = [
    getSystemMessage(personality),
    getWordsListMessage(words),
    getSystemMessage(
      'Сгенерируй один prompt для image-model. Он должен отражать характер бота, контекст диалога и смысл ответа бота.',
    ),
    getSystemMessage(
      'Верни только готовый prompt на английском языке, без кавычек, без Markdown, без комментариев.',
    ),
    ...getHistoryMessages(history, latestUserText),
    getUserMessage(`Latest user message: ${latestUserText}`),
    getSystemMessage(`Bot reply that the image should express: ${textReply}`),
  ];

  return await getTextFromCompletion({ messages });
};

export const getImageCaption = (textReply: string) => {
  const trimmedReply = trimText(textReply);
  if (trimmedReply.length <= IMAGE_CAPTION_MAX_LENGTH) {
    return trimmedReply;
  }

  return `${trimmedReply.slice(0, IMAGE_CAPTION_MAX_LENGTH - 1).trimEnd()}…`;
};
