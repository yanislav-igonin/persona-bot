import { config } from '@/config';
import { Configuration, OpenAIApi } from 'openai';

// const configuration = new Configuration({
//   apiKey: config.openaiApiKey,
// });
// export const openai = new OpenAIApi(configuration);

const grokConfiguration = new Configuration({
  apiKey: config.grokApiKey,
  basePath: 'https://api.grok.com/v1',
});
export const openai = new OpenAIApi(grokConfiguration);
