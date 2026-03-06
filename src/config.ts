import { valueOrDefault } from '@/values';

const numberOrDefault = (value: string | undefined, defaultValue: number) => {
  if (value === undefined || value === '') {
    return defaultValue;
  }

  const parsedValue = Number(value);
  return Number.isNaN(parsedValue) ? defaultValue : parsedValue;
};

/* eslint-disable node/no-process-env */
export const config = {
  env: valueOrDefault(process.env.ENV, 'development'),
  grokApiKey: valueOrDefault(process.env.GROK_API_KEY, ''),
  openaiApiKey: valueOrDefault(process.env.OPENAI_API_KEY, ''),
  imageRepliesEnabled: process.env.IMAGE_REPLIES_ENABLED === 'true',
  imageReplyChance: numberOrDefault(process.env.IMAGE_REPLY_CHANCE, 0.15),
  imageGenerationModel: valueOrDefault(
    process.env.IMAGE_GENERATION_MODEL,
    'dall-e-3',
  ),
  imageApiBaseUrl: process.env.IMAGE_API_BASE_URL || undefined,
  randomEncounterChance: numberOrDefault(
    process.env.RANDOM_ENCOUNTER_CHANCE,
    0.1,
  ),
};
/* eslint-enable node/no-process-env */

export const isProduction = () => config.env === 'production';
