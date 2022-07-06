import { handlePath } from '../utils';

import fs from 'fs';
import VideoHosting from '../core/VideoHosting';

const readHostings = (path: string) => {
  const hostingFiles = fs
    .readdirSync(handlePath(path))
    .filter((file) => file.endsWith('.js'))
    .map((file) => file.replace('.js', ''));

  const hostings = {};

  for (const file of hostingFiles) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { default: Hosting } = require(handlePath(`${path}/${file}`));

    hostings[file] = new Hosting();
  }

  return hostings;
};

const hostings: Record<string, VideoHosting> = readHostings('./hostings');

export const getHosting = (id: string): VideoHosting => {
  if (!(id in hostings)) {
    throw new Error(`Unknown hosting id: ${id}`);
  }

  return hostings[id];
};

export default hostings;
