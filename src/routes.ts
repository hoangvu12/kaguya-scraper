import apicache from 'apicache';
import 'dotenv/config';
import express, { Request, Response } from 'express';

import scrapers from './scrapers';

import videoUploadController from './controllers/videoUploadController';
import imageSourceController from './controllers/imageSourceController';
import videoSourceController from './controllers/videoSourceController';
import animeEpisodeController from './controllers/animeEpisodeController';
import videoStatusController from './controllers/videoStatusController';
import videoRemoteStatusController from './controllers/videoRemoteStatusController';
import videoRemoteUploadController from './controllers/videoRemoteUploadController';
import fileUploadController from './controllers/fileUploadController';

import auth from './middlewares/auth';
import checkUploadPermission from './middlewares/checkUploadPermission';
import validate from './middlewares/validate';

import { videoRemoteUploadValidation } from './validations/videoRemoteUploadValidation';
import { videoUploadValidation } from './validations/videoUploadValidation';
import { uploadEpisodeValidation } from './validations/uploadEpisodeValidation';
import { fileUploadValidation } from './validations/fileUploadValidation';
import { videoStatusValidation } from './validations/videoStatusValidation';
import { videoRemoteStatusValidation } from './validations/videoRemoteStatusValidation';
import fileProxyController from './controllers/fileProxyController';
import { fileProxyValidation } from './validations/fileProxyValidation';
import supabase from './lib/supabase';
import { Source } from './types/data';

const cache = apicache.middleware;

const successCache = (duration: string) =>
  cache(duration, (_req: Request, res: Response) => res.statusCode === 200);

const router = express.Router();

router.get('/', (_, res) => {
  res.send('Working yo');
});

router.get('/proxy/sources', async (_, res) => {
  const allScrapers = { ...scrapers.anime, ...scrapers.manga };

  const { data: customSources = [] } = await supabase
    .from<Source>('kaguya_sources')
    .select('id')
    .eq('isCustomSource', true);

  const proxySources = Object.entries(allScrapers).map(([key, value]) => ({
    headers: value.proxy.headers,
    id: key,
  }));

  const customProxySources = customSources.map((source) => ({
    headers: allScrapers.custom.proxy.headers,
    id: source.id,
  }));

  res.json({
    success: true,
    sources: [...proxySources, ...customProxySources],
  });
});

router.get('/images', successCache('1 day'), imageSourceController);
router.get('/source', successCache('30 minutes'), videoSourceController);

router.post(
  '/upload/video',
  validate(videoUploadValidation),
  auth,
  checkUploadPermission,
  videoUploadController,
);

router.get(
  '/upload/video/:fileId/status',
  validate(videoStatusValidation),
  auth,
  checkUploadPermission,
  videoStatusController,
);

router.post(
  '/upload/video/remote',
  validate(videoRemoteUploadValidation),
  auth,
  checkUploadPermission,
  videoRemoteUploadController,
);

router.get(
  '/upload/video/remote/:remoteId/status',
  validate(videoRemoteStatusValidation),
  auth,
  checkUploadPermission,
  videoRemoteStatusController,
);

router.post(
  '/upload/file',
  validate(fileUploadValidation),
  auth,
  checkUploadPermission,
  fileUploadController,
);

router.post(
  '/upload/episodes/:mediaId',
  validate(uploadEpisodeValidation),
  auth,
  checkUploadPermission,
  animeEpisodeController,
);

router.get(
  '/file/:id1/:id2/:filename',
  successCache('1 day'),
  validate(fileProxyValidation),
  fileProxyController,
);

export default router;
