/* eslint-disable @typescript-eslint/no-unused-vars */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { errorLogger } from 'axios-logger';
import axiosRetry from 'axios-retry';
import { match, Path } from 'node-match-path';
import supabase from '../lib/supabase';
import logger from '../logger';
import { SourceAnime, SourceManga } from '../types/data';
import { RequireAtLeastOne } from '../types/utils';
import { isHTML, isValidUrl, isVietnamese } from '../utils';
import Monitor from './Monitor';

export interface Proxy {
  ignoreReqHeaders?: boolean;
  followRedirect?: boolean;
  redirectWithProxy?: boolean;
  decompress?: boolean;
  appendReqHeaders?: Record<string, string>;
  appendResHeaders?: Record<string, string>;
  deleteReqHeaders?: string[];
  deleteResHeaders?: string[];
}

interface Server {
  name: string;
}

export default class Scraper {
  client: AxiosInstance;
  id: string;
  name: string;
  baseURL: string;
  blacklistTitles: string[];
  proxy: Proxy;
  locales: string[];
  scrapingPages: number;
  monitor: Monitor;

  constructor(
    id: string,
    name: string,
    axiosConfig?: RequireAtLeastOne<AxiosRequestConfig, 'baseURL'>,
  ) {
    const config = {
      headers: {
        referer: axiosConfig.baseURL,
        origin: axiosConfig.baseURL,
      },
      timeout: 20000,
      ...axiosConfig,
    };

    this.client = axios.create(config);
    this.baseURL = axiosConfig.baseURL;

    const defaultMonitorRequest = async () => {
      const { data } = await this.client.get('/');

      return data;
    };

    this.monitor = new Monitor(
      defaultMonitorRequest,
      this.shouldMonitorChange.bind(this),
    );
    this.id = id;
    this.name = name;
    this.blacklistTitles = ['live action'];
    this.scrapingPages = 2;

    axiosRetry(this.client, { retries: 3 });

    const axiosErrorLogger = (error: AxiosError) => {
      return errorLogger(error, {
        logger: logger.error.bind(logger),
        data: !isHTML(error?.response?.data),
      });
    };

    this.client.interceptors.request.use((config) => config, axiosErrorLogger);

    this.client.interceptors.response.use(
      (response) => response,
      axiosErrorLogger,
    );
  }

  /**
   * Run this method to push scraper's info to Supabase
   */
  init() {
    return supabase.from('kaguya_sources').upsert(
      {
        id: this.id,
        name: this.name,
        locales: this.locales,
      },
      { ignoreDuplicates: true, returning: 'minimal' },
    );
  }

  /**
   * The monitor will run this method to check if the monitor should run onChange
   * (defined in cron/fetch)
   * @param oldPage old page that the monitor requested before
   * @param newPage new page that the monitor just requested
   * @returns boolean to let the monitor decided if the onChange function should run.
   */
  shouldMonitorChange(_oldPage: any, _newPage: any): boolean {
    return false;
  }

  /**
   *
   * @param titles an array of titles
   * @returns titles that are not Vietnamese and a Vietnamese title
   */
  protected filterTitles(titles: string[]) {
    const totalTitles = [...new Set(titles)].filter(
      (title) => !this.blacklistTitles.includes(title.toLowerCase()),
    );

    const vietnameseTitle = totalTitles.filter(isVietnamese)[0] || null;
    const nonVietnameseTitles = totalTitles.filter(
      (title) => !isVietnamese(title),
    );

    return {
      titles: nonVietnameseTitles,
      vietnameseTitle,
    };
  }

  /**
   * Separate the title in case the title has multiple titles (e.g. "One Piece | Vua Hải Tặc")
   * @param title string
   * @param separators an array of separators
   * @returns an array of titles
   */
  parseTitle(title: string, separators = ['|', ',', ';', '-', '/']) {
    const separator = separators.find((separator) => title.includes(separator));

    const regex = new RegExp(`\\${separator}\\s+`);

    return title
      .split(regex)
      .map((title) => title.trim())
      .filter((title) => title);
  }

  protected async scrapePages(
    scrapeFn: (page: number) => Promise<any>,
    numOfPages: number,
  ) {
    const list = [];

    for (let page = 1; page <= numOfPages; page++) {
      const result = await scrapeFn(page);
      console.log(`Scraped page ${page} [${this.id}]`);

      // @ts-ignore
      if (result?.length === 0) {
        break;
      }

      list.push(result);
    }

    return this.removeBlacklistSources(list.flat());
  }

  protected async scrapeAllPages(scrapeFn: (page: number) => Promise<any>) {
    const list = [];
    let isEnd = false;
    let page = 1;

    while (!isEnd) {
      try {
        const result = await scrapeFn(page).catch((err) =>
          logger.error('error', err),
        );

        if (!result) {
          isEnd = true;

          break;
        }

        console.log(`Scraped page ${page} - ${this.id}`);

        if (result.length === 0) {
          isEnd = true;

          break;
        }

        page++;

        list.push(result);
      } catch (err) {
        isEnd = true;
      }
    }

    return this.removeBlacklistSources(list.flat());
  }

  /**
   * Get the best server based on the priority list
   * @param servers an array of servers
   * @param priorityServers an array of servers that define the priority of them (E.g. ['Server 1', 'Server 2', 'Server 3'])
   * @param getSources a function that returns the sources of the best server
   * @returns sources
   */
  protected async getBestSources<T extends Server, R>(
    servers: T[],
    priorityServers: string[],
    getSources: (server: T) => Promise<R>,
  ) {
    const availablePriorityServers = priorityServers.filter((priority) =>
      servers.map((server) => server.name).includes(priority),
    );

    if (!availablePriorityServers?.length) return null;

    for (const priorityServer of availablePriorityServers) {
      const server = servers.find((server) => server.name === priorityServer);

      const sources = await getSources(server);

      if (sources) return sources;
    }

    return null;
  }

  /**
   *
   * @param path pattern of the parser (e.g. /anime/:id)
   * @param url the url or path (e.g. /anime/23)
   * @returns object with the matched params (e.g. { id: 23 })
   */
  protected parseString(path: Path, url: string) {
    if (isValidUrl(url)) {
      url = new URL(url).pathname;
    }

    return match(path, url).params;
  }

  protected async removeBlacklistSources<T extends SourceAnime | SourceManga>(
    sources: T[],
  ) {
    return sources.filter((source) =>
      source?.titles.some((title) => !this.blacklistTitles.includes(title)),
    );
  }
}
