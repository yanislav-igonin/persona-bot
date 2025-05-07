import { config } from '@/config';
import OpenAI from 'openai';

// const configuration = new Configuration({
//   apiKey: config.openaiApiKey,
// });
// export const openai = new OpenAIApi(configuration);

export const openai = new OpenAI({
  apiKey: config.grokApiKey,
  baseURL: 'https://api.x.ai/v1',
});
