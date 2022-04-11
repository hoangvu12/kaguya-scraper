import axios from 'axios';
import { VideoSource } from '../core/AnimeScraper';
import { isValidUrl } from '../utils';
import { match, Path } from 'node-match-path';

const fembedExtractor = async (url: string): Promise<VideoSource[]> => {
  const { hash } = parseString('/v/:hash', url);

  const initialResponse = await axios.get(url);

  const afterRedirectionUrl = initialResponse.request.res.responseUrl;

  const { origin } = new URL(afterRedirectionUrl);

  const { data } = await axios.post(
    `${origin}/api/source/${hash}`,
    'r=&d=femax20.com',
    {
      headers: {
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
        Connection: 'keep-alive',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Origin: 'https://femax20.com',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36 OPR/83.0.4254.70',
      },
    },
  );

  return data.data.map((source) => ({ ...source, useProxy: true }));
};

const parseString = (path: Path, url: string) => {
  if (isValidUrl(url)) {
    url = new URL(url).pathname;
  }

  return match(path, url).params;
};

export default fembedExtractor;
