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
    'https://corsproxy.io/?https%3A%2F%2Fslwatch.co%2Fapi%2Fvideo%2Fstream%2Fget',
    { id: file_code },
  );

  if (!data?.result) return [];

  return Object.keys(data.result)
    .reverse()
    .map((key) => {
      const result = data.result[key];

      return {
        ...result,
        file: `https://corsproxy.io/?${encodeURIComponent(result.file)}`,
      };
    });
};

export default streamlareExtractor;
