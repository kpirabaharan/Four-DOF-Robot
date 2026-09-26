'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import { getSocket } from '@/lib/socket';
import type { RobotPosition } from '@/lib/types';

/** No frame for this long and we call the feed stale. Frames arrive every 500ms. */
const STALE_AFTER_MS = 2000;

export type SocketStatus = 'connecting' | 'connected' | 'disconnected';

export type RobotSocketValue = {
  status: SocketStatus;
  /**
   * `null` until the first frame lands. The old app seeded this with all
   * zeros, which renders a plausible but entirely fictional pose.
   */
  position: RobotPosition | null;
  /** Milliseconds since the last frame, or null if none has arrived. */
  ageMs: number | null;
  /**
   * True when frames stop arriving. Note this proves the *socket* is quiet,
   * not that the serial link is healthy: `read_position()` in server.py
   * re-emits the previous frame when a serial read fails, so a feed of
   * identical frames is possible.
   */
  isStale: boolean;
  reconnect: () => void;
};

const RobotSocketContext = createContext<RobotSocketValue | null>(null);

/**
 * Connection state is read with useSyncExternalStore rather than mirrored into
 * component state. The socket is an external store that may already be
 * connected before this component mounts, which is exactly the case
 * useSyncExternalStore exists for -- and it avoids a setState-in-effect to
 * catch up with the socket's current value.
 */
function subscribeToStatus(onChange: () => void) {
  const socket = getSocket();
  socket.on('connect', onChange);
  socket.on('disconnect', onChange);
  socket.io.on('reconnect_attempt', onChange);
  socket.io.on('error', onChange);
  return () => {
    socket.off('connect', onChange);
    socket.off('disconnect', onChange);
    socket.io.off('reconnect_attempt', onChange);
    socket.io.off('error', onChange);
  };
}

function readStatus(): SocketStatus {
  const socket = getSocket();
  if (socket.connected) return 'connected';
  return socket.active ? 'connecting' : 'disconnected';
}

function readServerStatus(): SocketStatus {
  return 'connecting';
}

export function RobotSocketProvider({ children }: { children: ReactNode }) {
  const status = useSyncExternalStore(
    subscribeToStatus,
    readStatus,
    readServerStatus,
  );

  const [position, setPosition] = useState<RobotPosition | null>(null);
  const [lastMessageAt, setLastMessageAt] = useState<number | null>(null);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const onPosition = (data: RobotPosition) => {
      setPosition(data);
      setLastMessageAt(Date.now());
    };
    socket.on('current_position', onPosition);

    // The server holds dead connections open (it runs Werkzeug in threading
    // mode and does not reap them), so close explicitly on unload rather than
    // leaving it to socket.io's 20s ping timeout.
    const onPageHide = () => socket.close();
    window.addEventListener('pagehide', onPageHide);

    return () => {
      socket.off('current_position', onPosition);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, []);

  // Staleness needs a clock of its own: if frames stop, nothing else would
  // re-render to notice.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const reconnect = useCallback(() => {
    getSocket().disconnect().connect();
  }, []);

  const ageMs =
    lastMessageAt === null || now === null ? null : now - lastMessageAt;
  const isStale =
    lastMessageAt === null
      ? status === 'connected'
      : (ageMs ?? 0) > STALE_AFTER_MS;

  const value = useMemo<RobotSocketValue>(
    () => ({ status, position, ageMs, isStale, reconnect }),
    [status, position, ageMs, isStale, reconnect],
  );

  return (
    <RobotSocketContext.Provider value={value}>
      {children}
    </RobotSocketContext.Provider>
  );
}

export function useRobotSocket(): RobotSocketValue {
  const ctx = useContext(RobotSocketContext);
  if (!ctx) {
    throw new Error('useRobotSocket must be used inside <RobotSocketProvider>');
  }
  return ctx;
}
