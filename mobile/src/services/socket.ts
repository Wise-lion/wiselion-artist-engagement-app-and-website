// Socket.io client singleton, authenticated with the Firebase ID token.
import { io, Socket } from 'socket.io-client';
import { config, DEV_MODE } from '../config';
import { getIdToken } from './firebase';

let socket: Socket | null = null;

export async function connectSocket(): Promise<Socket> {
  if (socket?.connected) return socket;
  // DEV_MODE: authenticate the handshake with a dev uid instead of a token.
  const auth = DEV_MODE ? { uid: 'dev-uid' } : { token: await getIdToken() };
  socket = io(config.socketUrl, {
    auth,
    transports: ['websocket'],
    autoConnect: true,
  });
  return socket;
}

export function getSocket(): Socket {
  if (!socket) throw new Error('Socket not connected — call connectSocket() first');
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
