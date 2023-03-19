import { openai } from '@/ai';
import { config } from '@/config';
import { replies } from '@/replies';
import { type ChatCompletionRequestMessage } from 'openai';

const trimText = (text: string) => {
  return text.trim();
};

export const getCompletion = async (prompt: string) => {
  const personaMessage: ChatCompletionRequestMessage = {
    content: config.botPersona,
    role: 'system',
  };
  const wordsListPrompt =
    'Используй иногда в своей речи разные слова из этого списка: ' +
    config.botWordsList +
    ' - и подобные, которые подходят по контексту, чтобы не было слишком однообразно.';
  const wordsListMessage: ChatCompletionRequestMessage = {
    content: wordsListPrompt,
    role: 'system',
  };
  const answerRequestMessage: ChatCompletionRequestMessage = {
    content: 'Тебе не понравилось сообщение ниже, ответь на него.',
    role: 'system',
  };
  const response = await openai.createChatCompletion({
    messages: [
      personaMessage,
      wordsListMessage,
      answerRequestMessage,
      {
        content: prompt,
        role: 'user',
      },
    ],
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
