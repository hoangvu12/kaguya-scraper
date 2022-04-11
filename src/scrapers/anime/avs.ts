import { AxiosInstance } from 'axios';
import cheerio from 'cheerio';
import AnimeScraper, { GetSourcesQuery } from '../../core/AnimeScraper';
import { SourceAnime } from '../../types/data';
import { fulfilledPromises } from '../../utils';

type Server = {
  id: string;
  hash: string;
  name: string;
};
export default class AnimeVietsubScraper extends AnimeScraper {
  baseUrl: string;
  client: AxiosInstance;

  constructor() {
    super('avs', 'AVS', { baseURL: 'https://animevietsub.tv' });
  }

  shouldMonitorChange(oldPage: string, newPage: string): boolean {
    if (!oldPage || !newPage) return false;

    const selector = 'main .MovieList .TPostMv:first-child';

    const $old = cheerio.load(oldPage);
    const $new = cheerio.load(newPage);

    const oldTitle = $old(selector).find('h2.Title').text().trim();
    const newTitle = $new(selector).find('h2.Title').text().trim();

    return oldTitle !== newTitle;
  }

  async scrapeAnimePage(page: number) {
    const { data } = await this.client.get(`/anime-moi/trang-${page}.html`);

    const $ = cheerio.load(data);

    const list = await fulfilledPromises(
      $('.TPostMv')
        .toArray()
        .map((el) => {
          const source_id = urlToId($(el).find('a').attr('href'));

          return this.scrapeAnime(source_id);
        }),
    );

    return list.filter((a) => a);
  }

  async scrapeAnime(animeId: string): Promise<SourceAnime> {
    const { data } = await this.client.get(`/phim/a-a${animeId}/xem-phim.html`);
    const $ = cheerio.load(data);

    const title = $('header .Title').text().trim();
    const altTitles = this.parseTitle($('header .SubTitle').text().trim());

    const { titles, vietnameseTitle } = this.filterTitles([
      title,
      ...altTitles,
    ]);

    const description = $('header .Description').text().trim();

    const episodes = $('.episode a')
      .toArray()
      .map((episodeEl) => {
        const $el = $(episodeEl);
        const name = $el.attr('title');

        const sourceEpisodeId = $el.data('id').toString();

        if (!name || !sourceEpisodeId) return;

        return { name, sourceEpisodeId, sourceMediaId: animeId };
      })
      .filter((a) => a);

    return {
      titles,
      vietnameseTitle,
      description,
      episodes,
      sourceId: this.id,
      sourceMediaId: animeId,
    };
  }

  async getSources(query: GetSourcesQuery) {
    const { episode_id } = query;

    const priorityServers = ['AKR', 'DU', 'FB'];
    const servers = await this.getServers(Number(episode_id));
    const sources = await this.getBestSources(
      servers,
      priorityServers,
      (server) => this.getVideoUrl(server),
    );

    return { sources };
  }

  async getServers(episodeId: number) {
    const { data } = await this.client.post(
      '/ajax/player?v=2019a',
      `episodeId=${episodeId}&backup=1`,
      { validateStatus: () => true, maxRedirects: 0 },
    );

    const $ = cheerio.load(data.html);

    const servers = $('a')
      .toArray()
      .filter((el) => $(el).data('play') === 'api')
      .map((el) => {
        const $el = $(el);

        const id = $el.data('id') as string;
        const hash = $el.data('href') as string;
        const name = $el.text().trim();

        return {
          id,
          hash,
          name,
        };
      });

    return servers;
  }

  async getVideoUrl(server: Server) {
    const { data } = await this.client.post(
      '/ajax/player?v=2019a',
      `link=${server.hash}&id=${server.id}`,
      {
        validateStatus: () => true,
        maxRedirects: 0,
      },
    );

    const proxyServers = ['DU'];

    const sources = data.link;

    return sources.map((source) => {
      source.useProxy = proxyServers.includes(server.name);

      return source;
    });
  }
}

const urlToId = (url: string) => {
  const splitted = url.split('/').filter((a) => a);
  const lastSplit = splitted[splitted.length - 1];

  return lastSplit.split('-').slice(-1)[0].split('a')[1];
};
