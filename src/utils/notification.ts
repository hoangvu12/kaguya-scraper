import axios from 'axios';
import dayjs from 'dayjs';
import { PushSubscription } from 'web-push';
import { getlatestMediaUnit, removeArrayOfObjectDup } from '.';
import supabase from '../lib/supabase';
import webPush from '../lib/webPush';
import logger from '../logger';
import { AiringSchedule, Media, MediaType, Page } from '../types/anilist';
import { Chapter } from '../types/data';
import nodeSchedule from 'node-schedule';

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

interface MediaWithChapters extends Omit<Media, 'chapters'> {
  chapters: Chapter[];
}

const notificationQuery = (page = 1) => {
  const startTimeOfADay = dayjs().startOf('day').unix();
  const endTimeOfADay = dayjs().endOf('day').unix();

  return `
    {
      Page(page: ${page}, perPage: 50) {
        airingSchedules(airingAt_lesser: ${endTimeOfADay}, airingAt_greater: ${startTimeOfADay}, notYetAired: true) {
          airingAt
          episode
          media {
            id
            title {
              userPreferred
            }
            coverImage {
              extraLarge
            }
            bannerImage
          }
        }
        pageInfo {
          hasNextPage
        }
      }
    }
  `;
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

export const getTodayAiringSchedules = async (): Promise<AiringSchedule[]> => {
  let list: AiringSchedule[] = [];

  let page = 1;

  const fetch = async () => {
    const body = {
      query: notificationQuery(page),
    };

    const { data } = await axios.post<{ data: { Page: Page } }>(
      'https://graphql.anilist.co/',
      body,
    );

    const response = data?.data?.Page;

    list = list.concat(response?.airingSchedules || []);

    if (response?.pageInfo?.hasNextPage) {
      page++;
      await fetch();
    }
  };

  await fetch();

  return removeArrayOfObjectDup(list, 'mediaId');
};

const sendNotification = async (
  userSubscription: Subscription,
  data: string,
) => {
  const { subscription, userAgent, userId } = userSubscription;

  try {
    await webPush.sendNotification(subscription, data);
  } catch (err) {
    logger.error(err.message);

    supabase
      .from('kaguya_subscriptions')
      .delete({ returning: 'minimal' })
      .match({ userAgent, userId: userId });
  }
};

export const handleAnimeNotification = async () => {
  const airingSchedules = await getTodayAiringSchedules();

  const notYetAiredSchedules = airingSchedules.filter(
    (schedule) => schedule.airingAt > dayjs().unix(),
  );

  const mediaIdList = airingSchedules.map(
    (airingSchedules) => airingSchedules.media.id,
  );

  const allSubscribers = await getSubscribers(MediaType.Anime, mediaIdList);

  if (!allSubscribers?.length) return;

  for (const schedule of notYetAiredSchedules) {
    const media = schedule.media;

    const airingDate = new Date(schedule.airingAt * 1000);

    const subscribers = allSubscribers.filter(
      (subscriber) => subscriber.mediaId === media.id,
    );

    if (!subscribers?.length) continue;

    const data = JSON.stringify({
      title: media.title.userPreferred,
      body: `Tập ${schedule.episode} đã bắt đầu phát sóng.`,
      image: media.bannerImage || media.coverImage.extraLarge,
      data: {
        redirectUrl: `/anime/details/${media.id}`,
      },
    });

    for (const subscriber of subscribers) {
      for (const userSubscription of subscriber.subscriptions) {
        const job = nodeSchedule.scheduleJob(airingDate, async () => {
          await sendNotification(userSubscription, data);

          job.cancel();
        });
      }
    }
  }
};

export const handleMangaNotification = async (list: MediaWithChapters[]) => {
  const sourceIds = list.map((item) => item.id);

  try {
    const allSubscribers = await getSubscribers(MediaType.Manga, sourceIds);

    if (!allSubscribers?.length) {
      return;
    }

    for (const media of list) {
      const subscribers = allSubscribers.filter(
        (subscriber) => subscriber.mediaId === media.id,
      );

      let mediaUnitName = 'mới';

      if (media?.chapters?.length) {
        const latestMediaUnit = getlatestMediaUnit(media.chapters);

        if (latestMediaUnit) {
          mediaUnitName = latestMediaUnit.name;
        }
      }

      const data = JSON.stringify({
        title: media.title.userPreferred,
        body: `Chapter ${mediaUnitName} đã ra mắt.`,
        image: media.bannerImage || media.coverImage.extraLarge,
        data: {
          redirectUrl: `/manga/details/${media.id}`,
        },
      });

      for (const subscriber of subscribers) {
        for (const userSubscription of subscriber.subscriptions) {
          await sendNotification(userSubscription, data);
        }
      }
    }
  } catch (err) {
    logger.error(err);
  }
};
