import AnimeScraper, {
  AnimeSource,
  GetSourcesQuery,
} from '../../core/AnimeScraper';
import streamtapeExtractor from '../../extractors/streamtape';
import supabase from '../../lib/supabase';
import { createAttachmentUrl } from '../../utils';
import { DiscordAttachment } from '../../utils/discord';
import { FileInfo, FileResponse } from '../../utils/streamtape';

type Video = {
  video: FileResponse | FileInfo;
  subtitles: DiscordAttachment[];
  fonts: DiscordAttachment[];
  episodeId: string;
};

// Custom scraper for user uploading
export default class AnimeCustomScraper extends AnimeScraper {
  constructor() {
    super('custom', 'Custom', { baseURL: 'https://streamlare.com' });

    this.disableMonitor = true;
  }

  async getSources(query: GetSourcesQuery): Promise<AnimeSource> {
    const { episode_id, source_id, request } = query;

    const BASE_URL = `${request.protocol}://${request.get('host')}/${
      process.env.BASE_ROUTE
    }`;

    const { data, error } = await supabase
      .from<Video>('kaguya_videos')
      .select('video, subtitles, fonts')
      .eq('episodeId', `${source_id}-${episode_id}`)
      .single();

    if (!data?.video?.id || error) {
      return {
        sources: [],
        subtitles: [],
        fonts: [],
      };
    }

    const source = await streamtapeExtractor(data.video.id);

    return {
      sources: [{ file: source, useProxy: true }],
      subtitles: data.subtitles.map((subtitle) => ({
        file: createAttachmentUrl(BASE_URL, subtitle.url),
        lang: subtitle.ctx.locale || 'vi',
        language: subtitle.ctx.name || subtitle.filename,
      })),
      fonts: data.fonts.map((font) => ({
        file: createAttachmentUrl(BASE_URL, font.url),
      })),
    };
  }
}
