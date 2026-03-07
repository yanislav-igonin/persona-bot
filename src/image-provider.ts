import { imageModel } from '@/ai';
import { config } from '@/config';
import { valueOrThrow } from '@/values';

export type GeneratedImage = {
  filename: string;
  image: Uint8Array;
  mimeType: string;
};

export type ImageProvider = {
  generateImage: (data: {
    prompt: string;
    userId?: string;
  }) => Promise<GeneratedImage>;
};

export class OpenAIImageProvider implements ImageProvider {
  private static readonly OUTPUT_FORMAT = 'jpeg';

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
      // output_format: OpenAIImageProvider.OUTPUT_FORMAT,
      prompt,
      quality: 'high',
      size: '1024x1024',
      user: userId,
    });

    const imageBase64 = response.data?.[0]?.b64_json;
    if (!imageBase64) {
      throw new Error('image provider did not return a usable base64 image');
    }

    const imageBuffer = Buffer.from(imageBase64, 'base64');

    return {
      filename: `generated-image.${OpenAIImageProvider.OUTPUT_FORMAT}`,
      image: new Uint8Array(imageBuffer),
      mimeType: 'image/jpeg',
    };
  }
}

export const imageProvider: ImageProvider = new OpenAIImageProvider();
