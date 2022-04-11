import { AxiosRequestHeaders } from 'axios';
import 'dotenv/config';

export type Headers = AxiosRequestHeaders;

export default class Proxy {
  headers: Headers;

  constructor(headers: Headers) {
    this.headers = headers;
  }
}
