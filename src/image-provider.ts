import { imageModel } from '@/ai';
import { config } from '@/config';
import { valueOrThrow } from '@/values';

export type GeneratedImage = {
  mediaUrl: string;
};

export interface ImageProvider {
  generateImage: (data: { prompt: string; userId?: string }) => Promise<GeneratedImage>;
}

export class OpenAIImageProvider implements ImageProvider {
  public async generateImage({
    prompt,
    userId,
  }: {
    prompt: string;
    userId?: string;
  }): Promise<GeneratedImage> {
    valueOrThrow(config.openaiApiKey, 'OPENAI_API_KEY');

    const response = await imageModel.images.generate({
      model: config.imageGenerationModel,
      n: 1,
      prompt,
      response_format: 'url',
      size: '1024x1024',
      user: userId,
    });

    const mediaUrl = response.data?.[0]?.url;
    if (!mediaUrl) {
      throw new Error('image provider did not return a usable URL');
    }

    return { mediaUrl };
  }
}

export const imageProvider: ImageProvider = new OpenAIImageProvider();
