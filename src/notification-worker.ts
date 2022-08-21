import { User } from '@supabase/supabase-js';
import { logError } from './errors/errorHandler';
import supabase from './lib/supabase';
import { sendNotification, Subscription } from './utils/notification';

type Notification = {
  id: number;
  senderId: string;
  sender: User;
  receiverId: string;
  entityId: string;
  parentEntityId: string;
  entityType: string;
  updated_at: string;
  created_at: string;
};

type NotificationEntity = {
  message: string;
  redirectUrl: string;
};

const NOTIFICATION_ENTITIES: Record<
  string,
  (notification: Notification) => NotificationEntity
> = {
  comment_mention: (notification) => {
    const [mediaType, mediaId] = notification.parentEntityId.split('-');

    return {
      message: `${notification?.sender?.user_metadata?.name} đã nhắc tới bạn trong một bình luận`,
      redirectUrl: `/${mediaType}/details/${mediaId}?commentId=${notification.entityId}`,
    };
  },
  comment_reaction: (notification) => {
    const [mediaType, mediaId] = notification.parentEntityId.split('-');

    return {
      message: `${notification?.sender?.user_metadata?.name} đã bảy tỏ cảm xúc về bình luận của bạn`,
      redirectUrl: `/${mediaType}/details/${mediaId}?commentId=${notification.entityId}`,
    };
  },
};

const getUser = async (userId: string) => {
  const { data, error } = await supabase
    .from<User>('users')
    .select('user_metadata')
    .eq('id', userId)
    .single();

  if (error) throw error;

  return data;
};

const getSubscriptions = async (userId: string) => {
  const { data, error } = await supabase
    .from<Subscription>('kaguya_subscriptions')
    .select('userAgent, subscription')
    .eq('userId', userId);

  if (error) throw error;

  return data;
};

supabase
  .from<Notification>('kaguya_notifications')
  .on('INSERT', async (payload) => {
    try {
      const { new: notification } = payload;

      const subscriptions = await getSubscriptions(notification.receiverId);

      if (!subscriptions?.length) return;

      const senderUser = await getUser(notification.senderId);

      notification.sender = senderUser;

      const notificationEntity =
        NOTIFICATION_ENTITIES[notification.entityType](notification);

      const notificationPayload = JSON.stringify({
        title: notificationEntity.message,
        body: `Nhấn vào để xem thêm.`,
        data: {
          redirectUrl: notificationEntity.redirectUrl,
        },
      });

      for (const subscription of subscriptions) {
        await sendNotification(subscription, notificationPayload);
      }
    } catch (err) {
      logError(err);
    }
  })
  .subscribe();

console.log('Registered notification changes');
