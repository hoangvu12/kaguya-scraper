global.__basedir = __dirname;

import scrapers from './scrapers';

const totalScrapers = {
  ...scrapers.anime,
  ...scrapers.manga,
};

const main = async () => {
  try {
    for (const scraperId in totalScrapers) {
      const scraper = totalScrapers[scraperId];

      const { error } = await scraper.init();

      if (error) throw error;
    }

    console.log('Successfully init all scrapers');
  } catch (err) {
    console.error(err);
  }
};

main();
