/**
 * Small localStorage-backed preference store.
 *
 * Exposed as an external store rather than component state so it can be read
 * with useSyncExternalStore: that gives a correct server snapshot during
 * prerender instead of a setState-in-effect to catch up after hydration.
 */

const SHOW_3D_KEY = 'robot.show3d';

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribePreferences(onChange: () => void) {
  listeners.add(onChange);
  // Keep multiple tabs of the console in step.
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function getShow3d(): boolean {
  try {
    return window.localStorage.getItem(SHOW_3D_KEY) !== 'off';
  } catch {
    return true;
  }
}

/** The 3D view is on by default, so prerender assumes it is showing. */
export function getShow3dServerSnapshot(): boolean {
  return true;
}

export function setShow3d(value: boolean): void {
  try {
    window.localStorage.setItem(SHOW_3D_KEY, value ? 'on' : 'off');
  } catch {
    // Storage blocked: the choice just won't survive a reload.
  }
  emit();
}
