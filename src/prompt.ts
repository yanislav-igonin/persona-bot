import { openai } from '@/ai';
import { config } from '@/config';
import { replies } from '@/replies';
import { type ChatCompletionRequestMessage } from 'openai';

const trimText = (text: string) => {
  return text.trim();
};

const getSystemMessage = (content: string): ChatCompletionRequestMessage => ({
  content,
  role: 'system',
});

const getUserMessage = (content: string): ChatCompletionRequestMessage => ({
  content,
  role: 'user',
});

export const getCompletion = async (prompt: string) => {
  const personalityMessage = getSystemMessage(config.botPersonality);
  const wordsListPrompt =
    'Используй иногда в своей речи разные слова из этого списка: ' +
    config.botWordsList +
    ' - и подобные, которые подходят по контексту, чтобы не было слишком однообразно.';
  const wordsListMessage = getSystemMessage(wordsListPrompt);
  const answerRequestMessage = getSystemMessage(
    'Тебе не понравилось сообщение пользователя, ответь на него.'
  );
  const userPromptMessage = getUserMessage(prompt);
  const messages = [
    personalityMessage,
    wordsListMessage,
    answerRequestMessage,
    userPromptMessage,
  ];
  const response = await openai.createChatCompletion({
    messages,
    model: 'gpt-4',
  });
  const text = response.data.choices[0].message?.content;
  return trimText(text ?? replies.error);
};

export const preparePrompt = (text: string) => {
  return trimText(text);
};

export const joinWithReply = (originalText: string, text: string) =>
  'Мое предыдущие сообщение:\n' +
  originalText +
  '\n\nСообщение пользователя:\n' +
  text;

export const shouldMakeRandomEncounter = () =>
  Math.random() < config.randomEncounterChance;
