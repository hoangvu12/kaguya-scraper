import axios from 'axios';
import { UploadedFile } from 'express-fileupload';
import FormData from 'form-data';
import { decode } from 'he';
import {
  getFilenameFromUrl,
  randomFilename,
  supportedVideoExtensions,
} from '.';

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
      extid: boolean;
      url: boolean;
    }
  >;
};

const client = axios.create({
  baseURL: 'https://api.streamtape.com',
  params: {
    login: process.env.STREAMTAPE_LOGIN,
    key: process.env.STREAMTAPE_API_KEY,
  },
});

export const getFile = async (id: string) => {
  const { data } = await client.get<FileStatusResponse>(`/file/info`, {
    params: { file: id },
  });

  return data.result[id];
};

export const uploadFile = async (file: Pick<UploadedFile, 'data' | 'name'>) => {
  const form = new FormData();

  form.append('file', file.data, file.name);

  const { data } = await client.get<CreateUploadResponse>('/file/ul');

  const uploadUrl = data?.result?.url;

  if (!uploadUrl) throw new Error('No upload url');

  const { data: response } = await axios.post<UploadResponse>(uploadUrl, form, {
    headers: {
      Accept: '*/*',
      'Content-Length': form.getLengthSync(),
      ...form.getHeaders(),
    },
  });

  if (!response?.result) throw new Error('No upload result');

  return response.result;
};

export const getRemoteStatus = async (remoteId: string) => {
  const { data: remoteResponse } = await client.get<RemoteStatusResponse>(
    '/remotedl/status',
    {
      params: {
        id: remoteId,
      },
    },
  );

  return remoteResponse?.result[remoteId];
};

export const uploadByUrl = async (url: string, name: string) => {
  url = decode(url);

  if (!name) {
    name = getFilenameFromUrl(url);
  }

  if (!name || !supportedVideoExtensions.some((ext) => name.endsWith(ext))) {
    name = randomFilename('mp4');
  }

  const { data: uploadResponse } = await client.get<RemoteUploadResponse>(
    '/remotedl/add',
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
