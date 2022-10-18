import AnimeScraper, {
  AnimeSource,
  GetSourcesQuery,
} from '../../core/AnimeScraper';
import { FileStatus } from '../../core/VideoHosting';
import { getVideoHosting } from '../../hostings';
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
    super('custom', 'Custom', { baseURL: '' });

    this.monitor.isDisabled = true;
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

    const hosting = getVideoHosting(data.hostingId);

    const sources = await hosting.getStreamingUrl(data.video.id);

    const subtitles = data.subtitles || [];
    const fonts = data.fonts || [];

    return {
      sources,
      subtitles: subtitles.map((subtitle) => ({
        file: createAttachmentUrl(BASE_URL, subtitle.url),
        lang: subtitle.ctx.locale || 'vi',
        language: subtitle.ctx.name || subtitle.filename,
      })),
      fonts: fonts.map((font) => ({
        file: createAttachmentUrl(BASE_URL, font.url),
      })),
    };
  }
}
