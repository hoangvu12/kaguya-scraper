import axios, { AxiosInstance } from 'axios';
import { UploadedFile } from 'express-fileupload';
import FormData from 'form-data';
import { decode } from 'he';
import { VideoSource } from '../core/AnimeScraper';
import VideoHosting, { FileStatus, RemoteStatus } from '../core/VideoHosting';
import streamtapeExtractor from '../extractors/streamtape';
import {
  getFilenameFromUrl,
  randomFilename,
  supportedVideoExtensions,
} from '../utils';

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

  async uploadFile(file: UploadedFile): Promise<string | number> {
    const form = new FormData();

    form.append('file', file.data, file.name);

    const { data } = await this.client.get<CreateUploadResponse>('/file/ul');

    const uploadUrl = data?.result?.url;

    if (!uploadUrl) throw new Error('No upload url');

    const { data: response } = await axios.post<UploadResponse>(
      uploadUrl,
      form,
      {
        headers: {
          Accept: '*/*',
          'Content-Length': form.getLengthSync(),
          ...form.getHeaders(),
        },
      },
    );

    if (!response?.result?.id) throw new Error('No upload result');

    return response.result.id;
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
    };
  }

  async uploadRemoteFile(url: string, name?: string): Promise<string | number> {
    url = decode(url);

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

    const status = remoteResponse?.result[remoteId];

    return {
      fileId: status.extid,
      id: status.id,
      progress: (status.bytes_loaded / status.bytes_total) * 100,
    };
  }

  async getStreamingUrl(fileId: string): Promise<VideoSource[]> {
    const source = await streamtapeExtractor(fileId);

    return [{ file: source, useProxy: true }];
  }
}
