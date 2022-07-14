import axios, { AxiosInstance } from 'axios';
import { load } from 'cheerio';
import { VideoSource } from '../../core/AnimeScraper';
import VideoHosting, {
  FileStatus,
  RemoteStatus,
} from '../../core/VideoHosting';
import { convertSizeToBytes, parseBetween } from '../../utils';

export default class SSPlayHosting extends VideoHosting {
  client: AxiosInstance;

  constructor() {
    super('ssplay', 'SSPlay');
  }

  async login() {
    const EMAIL = encodeURIComponent(process.env.SSPLAY_EMAIL);
    const PASSWORD = encodeURIComponent(process.env.SSPLAY_PASSWORD);

    const response = await axios.post(
      'https://dashboard.ssplay.net/login.php',
      `email=${EMAIL}&password=${PASSWORD}&login=`,
    );

    const [cookiesString] = response.headers['set-cookie'];
    const cookies = cookiesString.split('; ');

    const sessionCookie = cookies.find((cookie) =>
      cookie.includes('PHPSESSID'),
    );
    const session = sessionCookie.split('=')[1];

    this.client = axios.create({
      baseURL: 'https://dashboard.ssplay.net',
      headers: {
        cookie: `PHPSESSID=${session}`,
      },
    });
  }

  async getClient() {
    if (this.client) return this.client;

    await this.login();

    return this.client;
  }

  async getFileStatus(fileId: string): Promise<FileStatus> {
    const client = await this.getClient();

    const { data } = await client.get(`/dashboard.php?q=${fileId}`);

    const $ = load(data);

    const humanFileSize = $('tr td:nth-child(5)').text();
    const fileSize = convertSizeToBytes(humanFileSize);

    const status = $('tr td:nth-child(7)').text().trim();
    const fileName = $('tr td:nth-child(2)').text().trim();

    const isConverted = status === 'Ready';

    const progress = status.includes('%')
      ? Number(status.replace('%', ''))
      : isConverted
      ? 100
      : 0;

    return {
      converted: isConverted,
      id: fileId,
      name: fileName,
      progress,
      size: fileSize,
      error: status === 'Error',
    };
  }

  async uploadRemoteFile(url: string): Promise<string | number> {
    const allowedUrlTypes = [
      'drive.google.com/file/d/',
      'drive.google.com/uc?',
    ];

    if (!allowedUrlTypes.some((type) => url.includes(type))) {
      throw new Error('Only Google Drive supported');
    }

    let driveFileId: string;

    if (url.includes(allowedUrlTypes[0])) {
      driveFileId = url.split('/')[5];
    } else {
      const { searchParams } = new URL(url);

      driveFileId = searchParams.get('id');
    }

    if (!driveFileId) {
      throw new Error('Invalid URL');
    }

    const client = await this.getClient();

    const body = `link=${encodeURIComponent(url)}&folder=0&add=`;

    const { data } = await client.post('/addlinks.php', body);

    const $ = load(data);

    const fileRow = $(`td:contains(${driveFileId})`).parent('tr');

    const fileId = fileRow.find('td:nth-child(3)').text().trim();

    return fileId;
  }

  async getRemoteStatus(remoteId: string): Promise<RemoteStatus> {
    const data = await this.getFileStatus(remoteId);

    return {
      fileId: remoteId,
      progress: data.progress,
      downloaded: data.converted,
      error: data.error,
    };
  }

  async getStreamingUrl(fileId: string): Promise<VideoSource[]> {
    try {
      const { data } = await axios.get(`https://ssplay.net/v/${fileId}.html`);

      const nextIframeUrl = parseBetween(
        data,
        '<iframe id="hh3d" width="100%" height="100%" src="',
        '"',
      );

      const { data: iframeData } = await axios.get(nextIframeUrl, {
        headers: { referer: 'https://ssplay.net' },
      });

      const source = parseBetween(
        iframeData.replace(/(\r\n|\n|\r)/gm, ''),
        '[{"file":"',
        '"',
      );

      return [
        {
          file: `https://play.vnupload.net${source}`,
          useProxy: true,
          proxy: {
            ignoreReqHeaders: true,
            appendReqHeaders: {
              referer: 'https://play.vnupload.net',
            },
            redirectWithProxy: true,
          },
        },
      ];
    } catch (err) {
      throw new Error('Video is not exist');
    }
  }
}
