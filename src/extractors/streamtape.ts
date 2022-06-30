import axios from 'axios';
import { parseBetween } from '../utils';

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

const streamtapeExtractor = async (file_code: string) => {
  const { data } = await axios.get(`https://streamtape.com/v/${file_code}`);

  const urlString = eval(
    parseBetween(
      data,
      "document.getElementById('norobotlink').innerHTML =",
      '</script>',
    ),
  );

  const sourceUrl = 'https:' + urlString;

  return sourceUrl;
};

export default streamtapeExtractor;
