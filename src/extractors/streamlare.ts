import axios from 'axios';

export interface File {
  label: string;
  file: string;
  type: string;
}

export interface Result {
  [key: string]: File;
}

export interface StreamlareResponse {
  status: string;
  message: string;
  type: string;
  token: string;
  result: Result;
}

const streamlareExtractor = async (file_code: string) => {
  const { data } = await axios.post<StreamlareResponse>(
    'https://slwatch.co/api/video/stream/get',
    { id: file_code },
  );

  if (!data?.result) return [];

  return Object.keys(data.result).map((key) => data.result[key]);
};

export default streamlareExtractor;
