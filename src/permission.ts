global.__basedir = __dirname;

import { Client } from './lib/Discord';
import fs from 'fs';
import { handlePath } from './utils';
import 'dotenv/config';

const commands = [];
const commandFiles = fs
  .readdirSync(handlePath('./commands'))
  .filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { default: command } = require(handlePath(`./commands/${file}`));
  commands.push(command);
}

async function registerPermission() {
  const guild = Client.guilds.cache.get('906042713688928257');

  const serverCommands = await guild.commands.fetch();

  for (const command of commands) {
    if (!command.permissions) continue;
    const localCommand = command.data.toJSON();

    const serverCommand = serverCommands.find((cmd) => {
      return cmd.name === localCommand.name;
    });

    await serverCommand.permissions.add({ permissions: command.permissions });

    console.log('Added permissions to command: ' + localCommand.name);
  }
}

Client.on('ready', registerPermission);
