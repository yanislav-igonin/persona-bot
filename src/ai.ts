import { config } from '@/config';
import OpenAI from 'openai';

// const configuration = new Configuration({
//   apiKey: config.openaiApiKey,
// });
// export const openai = new OpenAIApi(configuration);

export const textModel = new OpenAI({
  apiKey: config.grokApiKey,
  baseURL: 'https://api.x.ai/v1',
});

export const imageModel = new OpenAI({
  apiKey: config.openaiApiKey,
  baseURL: config.imageApiBaseUrl,
});
