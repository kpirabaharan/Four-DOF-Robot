'use client';

import { useCallback, useSyncExternalStore } from 'react';

import {
  getShow3d,
  getShow3dServerSnapshot,
  setShow3d,
  subscribePreferences,
} from '@/lib/preferences';

export function useShow3d(): [boolean, (value: boolean) => void] {
  const show3d = useSyncExternalStore(
    subscribePreferences,
    getShow3d,
    getShow3dServerSnapshot,
  );
  const set = useCallback((value: boolean) => setShow3d(value), []);
  return [show3d, set];
}
