import { Command } from 'commander';
import { prompt } from 'inquirer';
import videoHostings, { getVideoHosting } from '../../hostings';
import supabase from '../../lib/supabase';

export default (program: Command) => {
  return program
    .command('hosting:init')
    .description('Init a hosting (If the hosting just created)')
    .action(async () => {
      try {
        const { id } = await prompt([
          {
            type: 'list',
            message: "What's the ID of the hosting?",
            name: 'id',
            choices: () => {
              return Object.values(videoHostings).map((value) => ({
                name: value.name,
                value: value.id,
              }));
            },
          },
        ]);

        const hosting = getVideoHosting(id);

        console.log('Pushing hosting info to database');

        const { error } = await supabase.from('kaguya_hostings').upsert(
          {
            id: hosting.id,
            name: hosting.name,
            supportedUrlFormats: hosting.supportedUrlFormats,
          },
          { returning: 'minimal' },
        );

        if (error) throw error;

        console.log('Pushed hosting info to database');
      } catch (err) {
        console.error(err);
        program.error(err.message);
      }
    });
};
