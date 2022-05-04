import AnimeScraper, {
  AnimeSource,
  GetSourcesQuery,
} from '../../core/AnimeScraper';
import { SourceAnime } from '../../types/data';

export default class Anime__name__Scraper extends AnimeScraper {
  constructor() {
    super('__id__', '__name__', { baseURL: '' });

    // Languages that the source supports (Two letter code)
    // See more: https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
    this.locales = [];
  }

  shouldMonitorChange(oldPage: string, newPage: string): boolean {}

  async scrapeAnimePage(page: number): Promise<SourceAnime[]> {}

  async scrapeAnime(sourceId: string): Promise<SourceAnime> {}

  async getSources(query: GetSourcesQuery): Promise<AnimeSource> {}
}
