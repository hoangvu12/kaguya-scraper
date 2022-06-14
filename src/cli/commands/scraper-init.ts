import { Command } from 'commander';
import { prompt } from 'inquirer';
import AnimeScraper from '../../core/AnimeScraper';
import scrapers, { getScraper } from '../../scrapers';
import { animeActions } from '../../actions/anime';
import { mangaActions } from '../../actions/manga';
import MangaScraper from '../../core/MangaScraper';
import { readFile } from '../../utils';
import { insertData } from '../../core/Action';

export default (program: Command) => {
  return program
    .command('scraper:init')
    .description('Init a scraper (If the scraper just created)')
    .action(async () => {
      try {
        const { id, type } = await prompt([
          {
            type: 'list',
            message: "What's the scraper type?",
            name: 'type',
            choices: [
              { name: 'Anime', value: 'anime' },
              { name: 'Manga', value: 'manga' },
            ],
          },
          {
            type: 'list',
            message: "What's the ID of the scraper?",
            name: 'id',
            choices: (answers) => {
              const allScrapers =
                answers.type === 'anime' ? scrapers.anime : scrapers.manga;

              return Object.values(allScrapers).map((value) => ({
                name: value.name,
                value: value.id,
              }));
            },
          },
        ]);

        const scraper = getScraper(id);

        console.log('Pushing scraper info to database');

        await scraper.init();

        console.log('Pushed scraper info to database');

        console.log(
          'Start scraping (This might take a few hours based on data)',
        );

        if (type === 'anime') {
          const animeScraper = scraper as AnimeScraper;

          const sources = await readFileAndFallback(`./data/${id}.json`, () =>
            animeScraper.scrapeAllAnimePages(),
          );

          const mergedSources = await readFileAndFallback(
            `./data/${id}-full.json`,
            () => animeScraper.scrapeAnilist(sources),
          );

          await insertData(mergedSources, animeActions, 'anilistId');
        } else {
          const mangaScraper = scraper as MangaScraper;

          const sources = await readFileAndFallback(`./data/${id}.json`, () =>
            mangaScraper.scrapeAllMangaPages(),
          );

          const mergedSources = await readFileAndFallback(
            `./data/${id}-full.json`,
            () => mangaScraper.scrapeAnilist(sources),
          );

          await insertData(mergedSources, mangaActions, 'anilistId');
        }

        console.log('Scraper init successfully');
      } catch (err) {
        console.error(err);
        program.error(err.message);
      }
    });
};

const readFileAndFallback = <T>(
  path: string,
  fallbackFn?: () => Promise<T>,
) => {
  const fileContent: T = JSON.parse(readFile(path));

  console.log(path, !!fileContent);

  if (!fileContent) return fallbackFn();

  return fileContent;
};
