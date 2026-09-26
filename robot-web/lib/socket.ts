/**
 * Module-scope Socket.IO singleton.
 *
 * The old app created the socket inside a `useEffect`, which under React 19
 * StrictMode runs create -> destroy -> create on every dev mount and churns
 * reconnects against the Pi. It also called `useSocket()` from two components,
 * opening two connections. Holding one instance here fixes both: the provider
 * only attaches and detaches listeners.
 */

import { io, type Socket } from 'socket.io-client';

import { getApiBaseUrl } from '@/lib/config';

let socket: Socket | null = null;
let socketUrl: string | null = null;

export function getSocket(): Socket {
  const url = getApiBaseUrl();

  // If the base URL changed under us (settings dialog), rebuild the socket.
  if (socket && socketUrl !== url) {
    socket.close();
    socket = null;
  }

  if (!socket) {
    socketUrl = url;
    socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnectionDelayMax: 5000,
    });
  }

  return socket;
}
