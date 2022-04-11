import axios from 'axios';
import { load } from 'cheerio';
import { VideoSource } from '../core/AnimeScraper';

const okruExtractor = async (url: string): Promise<VideoSource[]> => {
  const { data } = await axios.get(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.109 Safari/537.36 OPR/84.0.4316.52',
    },
  });

  const $ = load(data);

  const options: any = $('[data-module="OKVideo"]').data('options');

  if (!options?.flashvars?.metadata) return [];

  const metadata = JSON.parse(options.flashvars.metadata);

  if (!metadata?.hlsManifestUrl) return [];

  return [
    {
      file: metadata.hlsManifestUrl,
      useProxy: true,
    },
  ];
};

export default okruExtractor;
