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

const videoHostings: Record<string, VideoHosting> =
  readHostings('./hostings/video');

export const getVideoHosting = (id: string): VideoHosting => {
  if (!(id in videoHostings)) {
    throw new Error(`Unknown hosting id: ${id}`);
  }

  return videoHostings[id];
};

export default videoHostings;
