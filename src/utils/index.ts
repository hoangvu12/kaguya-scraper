import fs from 'fs';
import pick from 'lodash/pick';
import path from 'path';
import { VideoSource } from '../core/AnimeScraper';
import { ImageSource } from '../core/MangaScraper';
import { MediaUnit } from '../types/data';

export const pickArrayOfObject = <T, K extends keyof T>(data: T[], keys: K[]) =>
  data.map((each) => pick(each, keys));

export const isVietnamese = (text: string) => {
  const REGEX =
    /à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ|è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ|ì|í|ị|ỉ|ĩ|ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ|ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ|ỳ|ý|ỵ|ỷ|ỹ|đ/g;

  return REGEX.test(text.toLowerCase());
};

export const fulfilledPromises = <T extends Promise<any>>(promises: T[]) =>
  Promise.allSettled(promises).then((results) =>
    results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => (result as PromiseFulfilledResult<Awaited<T>>).value),
  );

export const handlePath = (
  filePath: string,
  baseUrl: string = path.resolve(process.cwd(), './build/src'),
) => path.join(baseUrl, filePath);

export const writeFile = (
  filePath: string,
  data: string,
  basePath?: string,
) => {
  const pathname = filePath.replace(/^\.*\/|\/?[^/]+\.[a-z]+|\/$/g, ''); // Remove leading directory markers, and remove ending /file-name.extension

  const pathDir = handlePath(pathname, basePath);

  if (!fs.existsSync(pathDir)) {
    fs.mkdirSync(pathDir, { recursive: true });
  }

  const fileDir = handlePath(filePath, basePath);

  fs.writeFileSync(fileDir, data, { flag: 'w' });
};

export const readFile = (filePath: string, basePath?: string) => {
  const fileDir = handlePath(filePath, basePath);

  if (!fs.existsSync(fileDir)) return null;

  return fs.readFileSync(fileDir, 'utf-8');
};

export const parseBetween = (str: string, start: string, end: string) => {
  let strArr = [];

  strArr = str.split(start);
  strArr = strArr[1].split(end);

  return strArr[0];
};

export const parseNumberFromString = (text: string, fallbackNumber = null) => {
  const matches = text.match(/\d+([.,][\d{1,2}])?/g);

  if (!matches) return fallbackNumber;

  return Number(matches[0]);
};

export const getlatestMediaUnit = <T extends MediaUnit>(unit: T[]) => {
  return unit.sort((a, b) => {
    return parseNumberFromString(b.name, 0) - parseNumberFromString(a.name, 0);
  })[0];
};

export const serialize = <T extends object>(obj: T) =>
  Object.entries(obj)
    .map(([key, val]) => `${key}=${val}`)
    .join('&');

// check if the url is valid
export const isValidUrl = (text: string) => {
  let url: URL;

  try {
    url = new URL(text);
  } catch (_) {
    return false;
  }

  return url.protocol === 'http:' || url.protocol === 'https:';
};

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

type StringSimilarityOptions = {
  trimByString: string | RegExp;
  caseSensitive: boolean;
};

// https://github.com/17gstyron/useless-utils/blob/master/stringSimilarity.js
export const stringSimilarity = (
  stringOne: string,
  stringTwo: string,
  options: StringSimilarityOptions = {
    caseSensitive: true,
    trimByString: /\s/g,
  },
) => {
  const { trimByString = /\s/g, caseSensitive = true } = options;

  stringOne = stringOne.replace(trimByString, '');
  stringTwo = stringTwo.replace(trimByString, '');

  if (!caseSensitive) {
    stringOne = stringOne.toLowerCase();
    stringTwo = stringTwo.toLowerCase();
  }

  if (!stringOne.length && !stringTwo.length) return 1;
  if (!stringOne.length || !stringTwo.length) return 0;
  if (stringOne === stringTwo) return 1;
  if (stringOne.length === 1 && stringTwo.length === 1) return 0;
  if (stringOne.length < 2 || stringTwo.length < 2) return 0;

  const firstBigrams = new Map();
  for (let i = 0; i < stringOne.length - 1; i++) {
    const bigram = stringOne.substring(i, i + 2);
    const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) + 1 : 1;

    firstBigrams.set(bigram, count);
  }

  let intersectionSize = 0;
  for (let i = 0; i < stringTwo.length - 1; i++) {
    const bigram = stringTwo.substring(i, i + 2);
    const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) : 0;

    if (count > 0) {
      firstBigrams.set(bigram, count - 1);
      intersectionSize++;
    }
  }

  return (2.0 * intersectionSize) / (stringOne.length + stringTwo.length - 2);
};

// https://github.com/aceakash/string-similarity/blob/2718c82bbbf5190ebb8e9c54d4cbae6d1259527a/compare-strings.js#L42
export const findBestMatch = (mainString: string, targetStrings: string[]) => {
  targetStrings = targetStrings.filter((title) => title);

  type Rating = {
    target: string;
    rating: number;
  };

  const ratings: Rating[] = [];
  let bestMatchIndex = 0;

  for (let i = 0; i < targetStrings.length; i++) {
    const currentTargetString = targetStrings[i];
    const currentRating = stringSimilarity(mainString, currentTargetString);

    ratings.push({ target: currentTargetString, rating: currentRating });

    if (currentRating > ratings[bestMatchIndex].rating) {
      bestMatchIndex = i;
    }
  }

  const bestMatch = ratings[bestMatchIndex];

  return { ratings, bestMatch, bestMatchIndex };
};

// https://stackoverflow.com/questions/18799685/string-conversion-to-undefined-null-number-boolean
export const convertType = function (value: string) {
  const values = { undefined: undefined, null: null, true: true, false: false };

  const isNumber = !isNaN(+value);

  return (isNumber && +value) || (!(value in values) && value) || values[value];
};

export const randomArrayElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

export const getFilenameFromUrl = (url: string) => {
  const filename = url.split('/').pop();

  if (!filename) return '';

  return filename.split('?')[0];
};

export const randomFilename = (extension: string) => {
  const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
  const random = ('' + Math.random()).substring(2, 8);
  const random_number = timestamp + random;
  return random_number + '.' + extension;
};

export const supportedVideoExtensions = [
  'ogm',
  'wmv',
  'mpg',
  'webm',
  'ogv',
  'mov',
  'asx',
  'mpeg',
  'mp4',
  'm4v',
  'avi',
];

export const createAttachmentUrl = (baseUrl: string, attachmentUrl: string) =>
  `${baseUrl}/file/${attachmentUrl}`;

export const removeArrayOfObjectDup = <T extends object, K extends keyof T>(
  arr: T[],
  property: K,
) => {
  return arr.filter(
    (obj, index, self) =>
      index === self.findIndex((t) => t[property] === obj[property]),
  );
};

// Convert 5GB to 5000000000
export const convertSizeToBytes = (size: string) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const sizeInBytes = size.split(' ')[0];
  const unit = size.split(' ')[1];

  if (unit === 'B') return +sizeInBytes;

  const index = units.indexOf(unit);

  if (index === -1) return 0;

  return +sizeInBytes * Math.pow(1024, index);
};

export const handleProxy = <T extends VideoSource | ImageSource>(
  sources: T[],
): T[] => {
  const sourcesWithProxy = sources.map((source: VideoSource | ImageSource) => {
    if (source.proxy) return source;

    source.proxy = {
      redirectWithProxy: true,
      followRedirect: true,
    };

    return source;
  });

  // @ts-ignore
  return sourcesWithProxy;
};

export const isHTML = (str: string) => {
  return /<[a-z][\s\S]*>/i.test(str);
};
