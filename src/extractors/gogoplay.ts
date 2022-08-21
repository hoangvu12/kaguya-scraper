import axios from 'axios';
import { load } from 'cheerio';
import CryptoJS from 'crypto-js';

// Thanks https://github.com/riimuru for gogoanime's extraction code :)

const ENCRYPTION_KEYS_URL =
  'https://raw.githubusercontent.com/justfoolingaround/animdl-provider-benchmarks/master/api/gogoanime.json';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36';
const BASE_URL = 'https://gogoanime.sk';
const GOLOAD_STREAM_URL = 'https://goload.pro/streaming.php';

let iv = null;
let key = null;
let second_key = null;

const fetch_keys = async () => {
  const { data } = await axios.get(ENCRYPTION_KEYS_URL);

  return {
    iv: CryptoJS.enc.Utf8.parse(data.iv),
    key: CryptoJS.enc.Utf8.parse(data.key),
    second_key: CryptoJS.enc.Utf8.parse(data.second_key),
  };
};

function decryptEncryptAjaxResponse(obj: { data: string }) {
  const decrypted = CryptoJS.enc.Utf8.stringify(
    CryptoJS.AES.decrypt(obj.data, second_key, {
      iv: iv,
    }),
  );

  return JSON.parse(decrypted);
}

async function generateEncryptAjaxParameters($, id) {
  const keys = await fetch_keys();
  iv = keys.iv;
  key = keys.key;
  second_key = keys.second_key;

  // encrypt the key
  const encrypted_key = CryptoJS.AES['encrypt'](id, key, {
    iv: iv,
  });

  const script = $("script[data-name='episode']").data().value;
  const token = CryptoJS.AES['decrypt'](script, key, {
    iv: iv,
  }).toString(CryptoJS.enc.Utf8);

  return 'id=' + encrypted_key + '&alias=' + id + '&' + token;
}

type Source = {
  file: string;
  label: string;
  type: string;
};

const gogoExtractor = async (id: string) => {
  const sources = [];
  const sources_bk = [];
  try {
    let epPage, server, $, serverUrl;

    if (id.includes('episode')) {
      epPage = await axios.get(BASE_URL + '/' + id);
      $ = load(epPage.data);

      server = $('#load_anime > div > div > iframe').attr('src');
      serverUrl = new URL('https:' + server);
    } else serverUrl = new URL(`${GOLOAD_STREAM_URL}?id=${id}`);

    const goGoServerPage = await axios.get(serverUrl.href, {
      headers: { 'User-Agent': USER_AGENT },
    });
    const $$ = load(goGoServerPage.data);

    const params = await generateEncryptAjaxParameters(
      $$,
      serverUrl.searchParams.get('id'),
    );

    const fetchRes = await axios.get(
      `
      ${serverUrl.protocol}//${serverUrl.hostname}/encrypt-ajax.php?${params}`,
      {
        headers: {
          'User-Agent': USER_AGENT,
          'X-Requested-With': 'XMLHttpRequest',
        },
      },
    );

    const res = decryptEncryptAjaxResponse(fetchRes.data);

    if (!res.source) return { error: 'No source found' };

    res.source.forEach((source) => sources.push(source));
    res.source_bk.forEach((source) => sources_bk.push(source));

    return {
      Referer: serverUrl.href as string,
      sources: sources as Source[],
      sources_bk: sources_bk as Source[],
    };
  } catch (err) {
    return { error: err };
  }
};

export default gogoExtractor;
