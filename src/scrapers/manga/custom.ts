import MangaScraper, {
  GetImagesQuery,
  ImageSource,
} from '../../core/MangaScraper';
import supabase from '../../lib/supabase';
import { DiscordAttachment } from '../../utils/discord';

type Response = {
  images: DiscordAttachment[];
  chapterId: string;
};

// Custom scraper for user uploading
export default class MangaCustomScraper extends MangaScraper {
  constructor() {
    super('custom', 'Custom', { baseURL: '' });

    this.monitor.isDisabled = true;
  }

  async getImages(query: GetImagesQuery): Promise<ImageSource[]> {
    const { chapter_id, source_id } = query;

    const { data, error } = await supabase
      .from<Response>('kaguya_images')
      .select('images')
      .eq('chapterId', `${source_id}-${chapter_id}`)
      .single();

    if (!data?.images?.length || error) {
      return [];
    }

    return data.images.map((image) => ({
      image: 'https://media.discordapp.net/attachments/' + image.proxy_url,
      useProxy: false,
    }));
  }
}
