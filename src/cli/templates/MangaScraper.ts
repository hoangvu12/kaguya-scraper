import MangaScraper, {
  GetImagesQuery,
  ImageSource,
} from '../../core/MangaScraper';
import { SourceManga } from '../../types/data';

export default class Manga__name__Scraper extends MangaScraper {
  constructor() {
    // Pass axiosConfig to the parent class
    super('__id__', '__name__', { baseURL: '' });
  }

  shouldMonitorChange(oldPage: string, newPage: string): boolean {}

  async scrapeMangaPage(page: number): Promise<SourceManga[]> {}

  async scrapeManga(sourceId: string): Promise<SourceManga> {}

  async getImages(query: GetImagesQuery): Promise<ImageSource[]> {}
}
