import { config } from '@/config';
import MistralClient from '@mistralai/mistralai';
import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: config.openaiApiKey,
});
export const openai = new OpenAIApi(configuration);

export const mistral = new MistralClient(config.mistralApiKey);
