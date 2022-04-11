import type { SlashCommandBuilder } from '@discordjs/builders';

import type { Collection, Interaction } from 'discord.js';

export interface Permission {
  id: string;
  type: string;
  permission: boolean;
}

export interface Command {
  data: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
  execute(interaction: Interaction): Promise<void>;
  permissions: Permission[];
}

declare module 'discord.js' {
  export interface Client {
    commands: Collection<string, Command>;
  }
}
