import { config } from '@/config';
import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: config.openaiApiKey,
});
export const openai = new OpenAIApi(configuration);
