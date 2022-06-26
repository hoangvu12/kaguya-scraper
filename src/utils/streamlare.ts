import axios from 'axios';
import { UploadedFile } from 'express-fileupload';
import FormData from 'form-data';
import { getFilenameFromUrl, randomArrayElement, randomFilename } from '.';

type FileResponse = {
  hashid: string;
  folder?: any;
  name: string;
  ext: string;
  mimeType: string;
  size: number;
  status: string;
  uploaded_at: Date;
};

type CreateUploadResponse = {
  status: string;
  message: string;
  result: string;
};

type CreateRemoteUploadResponse = {
  status: string;
  message: string;
  result: string[];
};

type UploadResponse = {
  status: string;
  message: string;
  result: FileResponse;
};

type FileStatusResponse = {
  status: string;
  message: string;
  result: {
    hashid: string;
    name: string;
    size: number;
    views: number;
    poster: string;
    status: string;
    created_at: Date;
  };
};

type RemoteUploadResponse = {
  status: string;
  message: string;
  result: {
    id: number;
    url: string;
    name: string;
  };
};

type RemoteStatusResponse = {
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

export const uploadByUrl = async (
  url: string,
  name = getFilenameFromUrl(url),
) => {
  if (!name) {
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

  const { id: remoteId } = uploadResponse.result;

  const { data: remoteResponse } = await client.get<RemoteStatusResponse>(
    '/remote/status',
    {
      params: {
        id: remoteId,
      },
    },
  );

  if (!remoteResponse?.result?.data?.fileId)
    throw new Error('No remote result');

  return getFile(remoteResponse.result.data.fileId);
};
