import { valueOrDefault } from '@/values';

/* eslint-disable node/no-process-env */
export const config = {
  botPersona: valueOrDefault(process.env.BOT_PERSONA, 'bot'),
  botRole: valueOrDefault(process.env.BOT_ROLE, 'bot'),
  botToken: valueOrDefault(process.env.BOT_TOKEN, ''),
  botWordsList: valueOrDefault(process.env.BOT_WORDS_LIST, 'bot'),
  env: valueOrDefault(process.env.ENV, 'development'),
  openaiApiKey: valueOrDefault(process.env.OPENAI_API_KEY, ''),
  randomEncounterChance: valueOrDefault(
    Number(process.env.RANDOM_ENCOUNTER_CHANCE),
    0.1,
  ),
};
/* eslint-enable node/no-process-env */

export const isProduction = () => config.env === 'production';
