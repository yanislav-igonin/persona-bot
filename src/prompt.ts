import { openai } from '@/ai';
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

// History-aware helpers

type HistoryRecord = { botRole: string | null | undefined; text: string };

export const buildHistoryMessages = (
  history: HistoryRecord[],
  personality: string,
  words: string[],
  latestUserText: string,
): ChatCompletionMessageParam[] => {
  const personalityMessage = getSystemMessage(personality);
  const wordsListPrompt = `Используй иногда в своей речи разные слова из этого списка: ${words} - и подобные, которые подходят по контексту, чтобы не было слишком однообразно.`;
  const wordsListMessage = getSystemMessage(wordsListPrompt);
  const answerRequestMessage = getSystemMessage(
    'Тебе не понравилось сообщение пользователя, ответь на него.',
  );
  const shortAnswerRequestMessage = getSystemMessage(
    'Ответ на сообщение пользователя должен быть коротким, не более 500 символов.',
  );

  const mappedHistory: ChatCompletionMessageParam[] = history.map((h) =>
    h.botRole
      ? { content: h.text, role: 'assistant' }
      : { content: h.text, role: 'user' },
  );

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
  const response = await openai.chat.completions.create({
    messages,
    model: 'grok-3-latest',
  });
  const text = response.choices[0].message.content;
  return trimText(text ?? replies.error);
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
  const wordsListPrompt = `Используй иногда в своей речи разные слова из этого списка: ${words} - и подобные, которые подходят по контексту, чтобы не было слишком однообразно.`;
  const wordsListMessage = getSystemMessage(wordsListPrompt);
  const answerRequestMessage = getSystemMessage(
    'Тебе не понравилось сообщение пользователя, ответь на него.',
  );
  const shortAnswerRequestMessage = getSystemMessage(
    'Ответ на сообщение пользователя должен быть коротким, не более 500 символов.',
  );
  const userPromptMessage = getUserMessage(prompt);
  const messages = [
    personalityMessage,
    wordsListMessage,
    answerRequestMessage,
    shortAnswerRequestMessage,
    userPromptMessage,
  ];
  const response = await openai.chat.completions.create({
    messages,
    model: 'grok-3-latest',
  });
  const text = response.choices[0].message.content;
  return trimText(text ?? replies.error);
};

export const preparePrompt = (text: string) => {
  return trimText(text);
};

export const joinWithReply = (originalText: string, text: string) =>
  `Мое предыдущие сообщение:\n${originalText}\n\nСообщение пользователя:\n${text}`;

export const shouldMakeRandomEncounter = () =>
  Math.random() < config.randomEncounterChance;
