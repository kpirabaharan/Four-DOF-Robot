/**
 * The only module that knows where the robot server lives.
 *
 * `NEXT_PUBLIC_*` is inlined at build time, and this address has already moved
 * twice (192.168.100.149 -> 192.168.2.203 -> the Tailscale name), so a
 * localStorage override sits in front of it. That lets you repoint a built
 * bundle from the UI instead of rebuilding.
 */

const STORAGE_KEY = 'robot.apiUrl';

/** Tailscale MagicDNS name for the Pi. Reachable where the LAN address is not. */
const FALLBACK_URL = 'http://ubuntu5:5000';

function normalise(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    try {
      const override = window.localStorage.getItem(STORAGE_KEY);
      if (override) return normalise(override);
    } catch {
      // Private mode / blocked storage: fall through to the build-time value.
    }
  }
  return normalise(process.env.NEXT_PUBLIC_ROBOT_API_URL ?? FALLBACK_URL);
}

/** The build-time value, shown in the settings dialog for reference. */
export function getConfiguredApiBaseUrl(): string {
  return normalise(process.env.NEXT_PUBLIC_ROBOT_API_URL ?? FALLBACK_URL);
}

export function getApiBaseUrlOverride(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setApiBaseUrlOverride(url: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (url === null || url.trim() === '') {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, normalise(url));
    }
  } catch {
    // Nothing useful to do; the caller reloads and gets the build-time value.
  }
}
