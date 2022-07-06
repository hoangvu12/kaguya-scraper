import AnimeScraper, {
  AnimeSource,
  GetSourcesQuery,
} from '../../core/AnimeScraper';
import { FileStatus } from '../../core/VideoHosting';
import { getHosting } from '../../hostings';
import supabase from '../../lib/supabase';
import { createAttachmentUrl } from '../../utils';
import { DiscordAttachment } from '../../utils/discord';

type Video = {
  video: FileStatus;
  subtitles: DiscordAttachment[];
  fonts: DiscordAttachment[];
  episodeId: string;
  hostingId: string;
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
      .select('video, subtitles, fonts, hostingId')
      .eq('episodeId', `${source_id}-${episode_id}`)
      .single();

    if (!data?.video?.id || error) {
      return {
        sources: [],
        subtitles: [],
        fonts: [],
      };
    }

    const hosting = getHosting(data.hostingId);

    const sources = await hosting.getStreamingUrl(data.video.id);

    return {
      sources,
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
