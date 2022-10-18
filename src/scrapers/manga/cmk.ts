import MangaScraper, {
  GetImagesQuery,
  ImageSource,
} from '../../core/MangaScraper';
import { SourceManga, SourceChapter } from '../../types/data';
import { fulfilledPromises, sleep } from '../../utils';

import uniqBy from 'lodash/uniqBy';
import sortBy from 'lodash/sortBy';

const BASE_IMAGE_URL = 'https://meo3.comick.pictures';

export default class MangaCMKScraper extends MangaScraper {
  constructor() {
    // Pass axiosConfig to the parent class
    super('cmk', 'Comick', { baseURL: 'https://api.comick.fun' });

    // Languages that the source supports (Two letter code)
    // See more: https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
    this.locales = ['en'];
    this.monitor.onRequest = async () => {
      const { data } = await this.client.get('/chapter', {
        params: {
          lang: 'en',
          page: 1,
          order: 'new',
        },
      });

      return data;
    };
  }

  async statusCheck(): Promise<boolean> {
    const response = await this.client.get('/chapter', {
      params: {
        lang: 'en',
        page: 1,
        order: 'new',
      },
    });

    return response.status === 200;
  }

  shouldMonitorChange(oldPage: any, newPage: any): boolean {
    if (!oldPage || !newPage) return;

    const oldManga = oldPage[0];
    const newManga = newPage[0];

    return oldManga?.md_comics?.id !== newManga?.md_comics?.id;
  }

  async scrapeMangaPage(page: number): Promise<SourceManga[]> {
    const { data } = await this.client.get('/chapter', {
      params: {
        lang: 'en',
        page,
        order: 'new',
      },
    });

    return fulfilledPromises<Promise<SourceManga>>(
      data.map(async (manga, index) => {
        await sleep(index * 1000);

        const { slug, id, title } = manga.md_comics;

        const mangaInfo = await this.scrapeMangaBySlug(slug);
        const chapters = await this.getChapters(id);

        const anilistId = mangaInfo?.links?.al;

        return {
          chapters,
          titles: [title],
          sourceMediaId: id.toString(),
          sourceId: this.id,
          anilistId: anilistId ? Number(anilistId) : null,
        };
      }),
    );
  }

  async scrapeMangaBySlug(slug: string) {
    const { data } = await this.client(`/comic/${slug}`);

    return data?.comic;
  }

  async getChapters(sourceId: string): Promise<SourceChapter[]> {
    const { data } = await this.client.get(`/comic/${sourceId}/chapter`, {
      params: { lang: 'en', limit: 10000 },
    });

    const uniqChapters = uniqBy(sortBy(data.chapters, 'up_count'), 'chap');

    return uniqChapters.map((chapter) => {
      const chapterName: string = chapter.title
        ? `${chapter.chap} - ${chapter.title}`
        : chapter.chap;

      return {
        name: chapterName || 'Unknown',
        sourceChapterId: chapter.hid as string,
        sourceMediaId: sourceId,
      };
    });
  }

  async getImages(query: GetImagesQuery): Promise<ImageSource[]> {
    const { chapter_id } = query;

    const { data } = await this.client.get(`/chapter/${chapter_id}`);

    return data.chapter?.md_images?.map((image) => ({
      image: `${BASE_IMAGE_URL}/${image.b2key}`,
    }));
  }
}
