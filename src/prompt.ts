import { openai } from '@/ai';
import { config } from '@/config';
import { replies } from '@/replies';

export const getCompletion = async (prompt: string) => {
  const response = await openai.createChatCompletion({
    messages: [
      {
        content: prompt,
        role: 'user',
      },
    ],
    model: 'gpt-4',
  });
  const text = response.data.choices[0].message?.content;
  return text?.trim() ?? replies.noAnswer;
};

const cleanPrompt = (text: string) => {
  return text.trim();
};

export const preparePrompt = (text: string) => {
  return cleanPrompt(text);
};

export const joinWithReply = (originalText: string, text: string) =>
  'Мое предыдущие сообщение:\n' +
  originalText +
  '\n\nСообщение пользователя:\n' +
  text;

export const shouldMakeRandomEncounter = () =>
  Math.random() < config.randomEncounterChance;
