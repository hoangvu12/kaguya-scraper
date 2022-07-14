import axios, { AxiosInstance } from 'axios';
import { VideoSource } from '../../core/AnimeScraper';
import VideoHosting, {
  FileStatus,
  RemoteStatus,
} from '../../core/VideoHosting';
import streamtapeExtractor from '../../extractors/streamtape';
import {
  getFilenameFromUrl,
  randomFilename,
  supportedVideoExtensions,
} from '../../utils';

export type FileResponse = {
  url: string;
  sha256: string;
  name: string;
  size: string;
  content_type: string;
  id: string;
};

export type FileInfo = {
  id: string;
  status: number;
  name: string;
  size: number;
  converted: boolean;
  thumb: string;
};

export type CreateUploadResponse = {
  status: string;
  msg: string;
  result: {
    url: string;
    valid_until: string;
  };
};

export type CreateRemoteUploadResponse = {
  status: string;
  message: string;
  result: string[];
};

export type UploadResponse = {
  status: number;
  msg: string;
  result: FileResponse;
};

export type FileStatusResponse = {
  status: number;
  msg: string;
  result: Record<string, FileInfo>;
};

export type RemoteUploadResponse = {
  status: string;
  message: string;
  result: {
    id: string;
    folderid: string;
  };
};

export type RemoteStatusResponse = {
  status: string;
  message: string;
  result: Record<
    string,
    {
      id: string;
      remoteurl: string;
      status: string;
      bytes_loaded?: any;
      bytes_total?: any;
      folderid: string;
      added: string;
      last_update: string;
      extid: string | null;
      url: boolean;
    }
  >;
};

export default class StreamtapeHosting extends VideoHosting {
  client: AxiosInstance;

  constructor() {
    super('streamtape', 'Streamtape');

    this.client = axios.create({
      baseURL: 'https://api.streamtape.com',
      params: {
        login: process.env.STREAMTAPE_LOGIN,
        key: process.env.STREAMTAPE_API_KEY,
      },
    });
  }

  async getFileStatus(fileId: string): Promise<FileStatus> {
    const { data } = await this.client.get<FileStatusResponse>(`/file/info`, {
      params: { file: fileId },
    });

    const status = data.result[fileId];

    return {
      converted: status.converted,
      id: status.id,
      name: status.name,
      size: status.size,
      thumbnail: status.thumb,
    };
  }

  async uploadRemoteFile(url: string, name?: string): Promise<string | number> {
    if (!name) {
      name = getFilenameFromUrl(url);
    }

    if (!name || !supportedVideoExtensions.some((ext) => name.endsWith(ext))) {
      name = randomFilename('mp4');
    }

    const { data: uploadResponse } =
      await this.client.get<RemoteUploadResponse>('/remotedl/add', {
        params: {
          name,
          url,
        },
      });

    if (!uploadResponse?.result?.id) throw new Error('No upload result');

    return uploadResponse.result.id;
  }

  async getRemoteStatus(remoteId: string): Promise<RemoteStatus> {
    const { data: remoteResponse } =
      await this.client.get<RemoteStatusResponse>('/remotedl/status', {
        params: {
          id: remoteId,
        },
      });

    const remoteStatus = remoteResponse?.result[remoteId];

    return {
      fileId: remoteStatus.extid,
      id: remoteStatus.id,
      progress:
        (remoteStatus?.bytes_loaded / remoteStatus?.bytes_total) * 100 || 0,
      downloaded: remoteStatus?.status === 'finished',
      error:
        remoteStatus?.status !== 'downloading' &&
        remoteStatus?.status !== 'new',
    };
  }

  async getStreamingUrl(fileId: string): Promise<VideoSource[]> {
    const source = await streamtapeExtractor(fileId);

    return [{ file: source, useProxy: true }];
  }
}
