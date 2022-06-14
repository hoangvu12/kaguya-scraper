import { PushSubscription } from 'web-push';
import { getlatestMediaUnit } from '.';
import supabase from '../lib/supabase';
import webPush from '../lib/webPush';
import logger from '../logger';
import { Media, MediaType } from '../types/anilist';
import { Chapter, Episode } from '../types/data';

type Subscription = {
  userAgent: string;
  userId: string;
  subscription: PushSubscription;
};

type UserWithSubscriptions = {
  subscriptions: Subscription[];
};

type Subscriber = {
  mediaId: number;
  userId: string;
  user: UserWithSubscriptions;
};

export const getSubscribers = async (type: MediaType, sourceIds: number[]) => {
  const isAnime = MediaType.Anime === type;

  const subscribersName = isAnime
    ? 'kaguya_anime_subscribers'
    : 'kaguya_manga_subscribers';

  const { data, error } = await supabase
    .from<Subscriber>(subscribersName)
    .select(
      '*, user:userId(subscriptions:kaguya_subscriptions(subscription, userAgent))',
    )
    .in('mediaId', sourceIds);

  if (error) throw error;

  return data.map(({ user, ...item }) => ({
    subscriptions: user.subscriptions,
    ...item,
  }));
};

interface MediaWithEpisodes extends Omit<Media, 'episodes'> {
  episodes: Episode[];
}

interface MediaWithChapters extends Omit<Media, 'chapters'> {
  chapters: Chapter[];
}

type MediaWithMediaUnit<T> = T extends MediaType.Anime
  ? MediaWithEpisodes
  : MediaWithChapters;

export const handlePushNotification = async <
  T extends MediaWithMediaUnit<K>,
  K extends MediaType,
>(
  list: T[],
  type: K,
) => {
  const sourceIds = list.map((item) => item.id);

  try {
    const allSubscribers = await getSubscribers(type, sourceIds);

    if (!allSubscribers?.length) {
      return;
    }

    const isAnime = type === MediaType.Anime;

    const mediaName = isAnime ? 'tập' : 'chapter';

    for (const source of list) {
      const subscribers = allSubscribers.filter(
        (subscriber) => subscriber.mediaId === source.id,
      );

      const title = source.title.userPreferred;
      let mediaUnitName = '';

      if ('episodes' in source) {
        mediaUnitName = getlatestMediaUnit(source.episodes as Episode[]).name;
      }

      if ('chapters' in source) {
        mediaUnitName = getlatestMediaUnit(source.chapters as Chapter[]).name;
      }

      const mediaRedirectUrl = isAnime
        ? `/anime/details/${source.id}`
        : `/manga/details/${source.id}`;

      const data = JSON.stringify({
        title: `${title} ${mediaName} mới (${mediaUnitName}) tại Kaguya.`,
        body: `Bấm vào đây để xem.`,
        image: source.bannerImage || source.coverImage.extraLarge,
        data: {
          redirectUrl: mediaRedirectUrl,
        },
      });

      for (const subscriber of subscribers) {
        for (const { subscription, userAgent } of subscriber.subscriptions) {
          try {
            await webPush.sendNotification(subscription, data);
          } catch (err) {
            logger.log(err.message);

            supabase
              .from('kaguya_subscriptions')
              .delete({ returning: 'minimal' })
              .match({ userAgent, userId: subscriber.userId });
          }
        }
      }

      logger.info(
        `Sent ${subscribers.length} push notifications from ${title}`,
      );
    }
  } catch (err) {
    logger.error(err);
  }
};
