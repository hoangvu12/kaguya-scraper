import { User } from '@supabase/supabase-js';
import { Server } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { logError } from './errors/errorHandler';
import supabase from './lib/supabase';

type RoomQuery = {
  roomId: number;
  userId: string;
  socketId: string;
};

type Event = {
  eventType: string;
  user: User;
};

type RoomCache = {
  timeoutId?: NodeJS.Timeout;
  currentPlayerTime?: number;
};

type VideoState = {
  type: string;
  currentTime: number;
  hostTime: number;
};

// 30 minutes ms
const ROOM_DELETE_TIME = 30 * 60 * 1000;

const updateEpisode = async (roomId: number, episodeId: string) => {
  const { data, error } = await supabase
    .from('kaguya_rooms')
    .update({
      episodeId,
    })
    .match({ id: roomId });

  if (error) throw error;

  return data;
};

const joinRoom = async ({ roomId, socketId, userId }: RoomQuery) => {
  const { data, error } = await supabase.from('kaguya_room_users').upsert(
    {
      roomId,
      userId,
      id: socketId,
    },
    {
      returning: 'minimal',
    },
  );

  if (error) throw error;

  return data;
};

const leaveRoom = async (socketId: string) => {
  const { data, error } = await supabase
    .from('kaguya_room_users')
    .delete({ returning: 'minimal' })
    .match({
      id: socketId,
    });

  if (error) throw error;

  return data;
};

const deleteRoom = async (roomId: number) => {
  const { data, error } = await supabase
    .from('kaguya_rooms')
    .delete()
    .match({ id: roomId });

  if (error) throw error;

  return data;
};

const getGlobalTime = () => {
  const date = new Date();
  const time = date.getTime() / 1000;

  return time;
};

const rooms: Record<string, RoomCache> = {};

const handleSocket = (
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
) => {
  io.on('connection', (socket) => {
    socket.on('join', async (roomId: number, user: User) => {
      if (!rooms[roomId]) {
        rooms[roomId] = {};
      }

      const roomCache = rooms[roomId];

      if (roomCache.timeoutId) {
        clearTimeout(roomCache.timeoutId);
      }

      const roomEmit = (event: string, ...args: any[]) => {
        socket.to(roomId.toString()).emit.apply(socket, [event, ...args]);
      };

      const roomBroadcastEmit = (event: string, ...args: any[]) => {
        socket.broadcast
          .to(roomId.toString())
          .emit.apply(socket, [event, ...args]);
      };

      const eventEmit = (event: Event) => {
        roomEmit('event', event);
      };

      const invalidate = () => {
        console.log('invalidate');
        roomEmit('invalidate');
      };

      await socket.join(roomId.toString());

      await joinRoom({
        roomId,
        socketId: socket.id,
        userId: user?.id || null,
      }).catch(logError);

      eventEmit({ eventType: 'join', user });

      console.log(`${user?.user_metadata.name} joined room ${roomId}`);

      invalidate();

      socket.on('disconnect', async () => {
        const sockets = await io.in(roomId.toString()).fetchSockets();

        console.log(`${user?.user_metadata.name} left room ${roomId}`);

        await leaveRoom(socket.id).catch(logError);

        eventEmit({ eventType: 'leave', user });

        if (!sockets.length) {
          roomCache.timeoutId = setTimeout(() => {
            deleteRoom(roomId).catch(logError);
          }, ROOM_DELETE_TIME); // 10 minutes

          return;
        }

        invalidate();
      });

      socket.on('getCurrentTime', () => {
        socket.emit('currentTime', roomCache?.currentPlayerTime || 0);
      });

      socket.on('sendMessage', (message: string) => {
        roomEmit('message', { body: message, user });
      });

      socket.on('sendEvent', (eventType: string) => {
        eventEmit({ eventType, user });
      });

      socket.on('changeEpisode', async (episodeId) => {
        await updateEpisode(roomId, episodeId).catch(logError);
        invalidate();
      });

      socket.on('changeVideoState', (videoState: VideoState) => {
        if (videoState.type === 'timeupdate') {
          const { currentTime } = videoState;

          roomCache.currentPlayerTime = currentTime;
        }

        roomBroadcastEmit('videoState', videoState);
      });

      socket.on('getTimeSync-backward', () => {
        const time = getGlobalTime();

        socket.emit('timeSync-backward', time);
      });

      socket.on('getTimeSync-forward', (timeAtClient: number) => {
        const time = getGlobalTime();

        socket.emit('timeSync-forward', time - timeAtClient);
      });
    });
  });
};

export default handleSocket;
