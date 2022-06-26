import apicache from 'apicache';
import 'dotenv/config';
import express from 'express';
import videoUploadController from './controllers/videoUploadController';
import imageSourceController from './controllers/imageSourceController';
import videoSourceController from './controllers/videoSourceController';
import auth from './middlewares/auth';
import checkUploadPermission from './middlewares/checkUploadPermission';
import validate from './middlewares/validate';
import scrapers from './scrapers';
import { videoRemoteUploadValidation } from './validations/videoRemoteUploadValidation';
import { videoUploadValidation } from './validations/videoUploadValidation';
import videoRemoteUploadController from './controllers/videoRemoteUploadController';
import { uploadEpisodeValidation } from './validations/uploadEpisodeValidation';

const cache = apicache.middleware;

const successCache = (duration: string) =>
  cache(duration, (_req, res) => res.statusCode === 200);

const router = express.Router();

router.get('/', (_, res) => {
  res.send('Working yo');
});

router.get('/proxy/sources', (_, res) => {
  const allScrapers = { ...scrapers.anime, ...scrapers.manga };

  const proxySources = Object.entries(allScrapers).map(([key, value]) => ({
    headers: value.proxy.headers,
    id: key,
  }));

  res.json({
    success: true,
    sources: proxySources,
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
router.post(
  '/upload/video/remote',
  validate(videoRemoteUploadValidation),
  auth,
  checkUploadPermission,
  videoRemoteUploadController,
);
router.post(
  '/upload/episodes',
  validate(uploadEpisodeValidation),
  auth,
  checkUploadPermission,
  videoUploadController,
);

export default router;
