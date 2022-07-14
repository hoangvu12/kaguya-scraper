/* eslint-disable @typescript-eslint/no-unused-vars */
import { VideoSource } from './AnimeScraper';

export interface FileStatus {
  id?: string | number;
  size: number;
  name: string;
  converted: boolean;
  progress?: number;
  thumbnail?: string;
  error?: boolean;
}

export interface RemoteStatus {
  id?: string | number;
  progress?: number;
  fileId: string | number;
  downloaded: boolean;
  error: boolean;
}

export default class VideoHosting {
  id: string;
  name: string;
  supportedUrlFormats: string[];

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;

    this.supportedUrlFormats = ['https://example.com/file.mp4'];
  }

  async uploadRemoteFile(
    _url: string,
    _name?: string,
  ): Promise<string | number> {
    throw new Error('Method not implemented.');
  }

  async getFileStatus(_fileId: string | number): Promise<FileStatus> {
    throw new Error('Method not implemented.');
  }

  async getRemoteStatus(_remoteId: string | number): Promise<RemoteStatus> {
    throw new Error('Method not implemented.');
  }

  async getStreamingUrl(_fileId: string | number): Promise<VideoSource[]> {
    throw new Error('Method not implemented.');
  }
}
