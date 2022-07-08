/* eslint-disable @typescript-eslint/no-unused-vars */
import { UploadedFile } from 'express-fileupload';
import { VideoSource } from './AnimeScraper';

export interface FileStatus {
  id?: string | number;
  size: number;
  name: string;
  converted: boolean;
  progress?: number;
}

export interface RemoteStatus {
  id?: string | number;
  progress?: number;
  fileId: string | number;
}

export default class VideoHosting {
  id: string;
  name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  async uploadFile(_file: UploadedFile): Promise<string | number> {
    throw new Error('Method not implemented.');
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
