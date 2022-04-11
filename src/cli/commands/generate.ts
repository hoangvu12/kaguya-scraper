import { Command } from 'commander';
import { prompt } from 'inquirer';
import { readFile, writeFile } from '../../utils';
import { replaceTemplate } from '../../utils/template';

export default (program: Command) => {
  return program
    .command('generate')
    .description('Generate scraper file.')
    .action(async () => {
      const answers = await prompt([
        {
          type: 'list',
          message: 'What is the type of the scraper?',
          name: 'type',
          choices: [
            {
              name: 'Anime',
              value: 'anime',
            },
            {
              name: 'Manga',
              value: 'manga',
            },
          ],
        },
        {
          type: 'input',
          message: 'What is the ID of the scraper?',
          name: 'id',
        },
        {
          type: 'input',
          message: 'What is the name of the scraper?',
          name: 'name',
        },
      ]);

      const templateFileName =
        answers.type === 'anime' ? 'AnimeScraper.ts' : 'MangaScraper.ts';

      const template = readFile(
        `./src/cli/templates/${templateFileName}`,
        process.cwd(),
      );

      const scraperDirectory =
        answers.type === 'anime'
          ? './src/scrapers/anime/'
          : './src/scrapers/manga/';

      const scraperFile = `${scraperDirectory}${answers.id}.ts`;

      const replacedTemplate = replaceTemplate(template, [
        {
          replacer: '__name__',
          value: answers.name,
        },
        {
          replacer: '__id__',
          value: answers.id,
        },
      ]);

      writeFile(scraperFile, replacedTemplate, process.cwd());

      console.log(`Scraper file generated at ${scraperFile}`);
    });
};
