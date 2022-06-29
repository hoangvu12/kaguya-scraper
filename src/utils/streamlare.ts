import axios from 'axios';
import { UploadedFile } from 'express-fileupload';
import FormData from 'form-data';
import {
  getFilenameFromUrl,
  randomArrayElement,
  randomFilename,
  supportedVideoExtensions,
} from '.';
import { decode } from 'he';

export type FileResponse = {
  hashid: string;
  folder?: any;
  name: string;
  ext: string;
  mimeType: string;
  size: number;
  status: string;
  uploaded_at: Date;
};

export type FileInfo = {
  hashid: string;
  name: string;
  size: number;
  views: number;
  poster: string;
  status: string;
  created_at: Date;
};

export type CreateUploadResponse = {
  status: string;
  message: string;
  result: string;
};

export type CreateRemoteUploadResponse = {
  status: string;
  message: string;
  result: string[];
};

export type UploadResponse = {
  status: string;
  message: string;
  result: FileResponse;
};

export type FileStatusResponse = {
  status: string;
  message: string;
  result: FileInfo;
};

export type RemoteUploadResponse = {
  status: string;
  message: string;
  result: {
    id: number;
    url: string;
    name: string;
  };
};

export type RemoteStatusResponse = {
  status: string;
  message: string;
  result: {
    id: number;
    url: string;
    name: string;
    data: {
      fileId: string;
      percentage: number;
      size: number;
    };
    status: string;
    created_at: Date;
    updated_at: Date;
  };
};

const client = axios.create({
  baseURL: 'https://api.streamlare.com/api',
  params: {
    login: process.env.STREAMLARE_LOGIN,
    key: process.env.STREAMLARE_API_KEY,
  },
});

export const getFile = async (id: string) => {
  const { data } = await client.get<FileStatusResponse>(`/file/get/${id}`);

  return data.result;
};

export const uploadFile = async (file: Pick<UploadedFile, 'data' | 'name'>) => {
  const form = new FormData();

  form.append('file', file.data, file.name);
  form.append('login', process.env.STREAMLARE_LOGIN);
  form.append('key', process.env.STREAMLARE_API_KEY);

  const { data } = await client.get<CreateUploadResponse>(
    '/file/upload/generate',
  );

  const uploadUrl = data?.result;

  if (!uploadUrl) throw new Error('No upload url');

  const { data: response } = await client.post<UploadResponse>(
    uploadUrl,
    form,
    {
      headers: {
        ...form.getHeaders(),
      },
    },
  );

  if (!response?.result) throw new Error('No upload result');

  return response.result;
};

export const getRemoteStatus = async (remoteId: string) => {
  const { data: remoteResponse } = await client.get<RemoteStatusResponse>(
    '/remote/status',
    {
      params: {
        id: remoteId,
      },
    },
  );

  return remoteResponse?.result;
};

export const uploadByUrl = async (url: string, name: string) => {
  url = decode(url);

  if (!name) {
    name = getFilenameFromUrl(url);
  }

  if (!name || !supportedVideoExtensions.some((ext) => name.endsWith(ext))) {
    name = randomFilename('mp4');
  }

  const { data } = await client.get<CreateRemoteUploadResponse>(
    '/remote/generate',
  );

  const uploadUrl = randomArrayElement(data.result);

  if (!uploadUrl) throw new Error('No upload url');

  const { data: uploadResponse } = await client.get<RemoteUploadResponse>(
    uploadUrl,
    {
      params: {
        name,
        url,
      },
    },
  );

  if (!uploadResponse?.result) throw new Error('No upload result');

  return uploadResponse.result;
};
