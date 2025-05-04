import { valueOrDefault, valueOrThrow } from '@/values';

type BotPersona = {
  botToken: string;
  personality: string;
  role: string;
  words: string[];
};

/* eslint-disable node/no-process-env */
export const config = {
  env: valueOrDefault(process.env.ENV, 'development'),
  grokApiKey: valueOrDefault(process.env.GROK_API_KEY, ''),
  openaiApiKey: valueOrDefault(process.env.OPENAI_API_KEY, ''),
  personas: JSON.parse(
    valueOrThrow(process.env.PERSONAS, 'personas'),
  ) as BotPersona[],
  randomEncounterChance: valueOrDefault(
    Number(process.env.RANDOM_ENCOUNTER_CHANCE),
    0.1,
  ),
};
/* eslint-enable node/no-process-env */

export const isProduction = () => config.env === 'production';
