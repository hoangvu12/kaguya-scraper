import AnimeScraper, {
  AnimeSource,
  GetSourcesQuery,
} from '../../core/AnimeScraper';
import streamlareExtractor from '../../extractors/streamlare';
import supabase from '../../lib/supabase';
import { DiscordAttachment } from '../../utils/discord';
import { FileInfo, FileResponse } from '../../utils/streamlare';

type Video = {
  video: FileResponse | FileInfo;
  subtitles: DiscordAttachment[];
  fonts: DiscordAttachment[];
  episodeId: string;
};

// Custom scraper for user uploading
export default class AnimeCustomScraper extends AnimeScraper {
  constructor() {
    super('custom', 'Custom', { baseURL: '' });

    this.disableMonitor = true;
  }

  async getSources(query: GetSourcesQuery): Promise<AnimeSource> {
    const { episode_id } = query;

    const { data, error } = await supabase
      .from<Video>('kaguya_videos')
      .select('video, subtitles, fonts')
      .eq('episodeId', episode_id)
      .single();

    if (!data?.video?.hashid || error) {
      return {
        sources: [],
        subtitles: [],
        fonts: [],
      };
    }

    const sources = await streamlareExtractor(data.video.hashid);

    return {
      sources,
      subtitles: data.subtitles.map((subtitle) => ({
        file: subtitle.url,
        lang: subtitle.ctx.locale || 'vi',
        language: subtitle.ctx.name || subtitle.filename,
      })),
      fonts: data.fonts.map((font) => ({ file: font.url })),
    };
  }
}
