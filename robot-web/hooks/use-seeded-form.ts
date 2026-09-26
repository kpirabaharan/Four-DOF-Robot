'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';

/**
 * Seeds a form exactly once, then gets out of the way.
 *
 * The old app re-ran `form.reset(data)` on a 1s SWR poll, so anything you typed
 * was wiped a second later. It also seeded from `GET /api/joint-controls`,
 * which returns the last *commanded* set-point rather than where the arm
 * actually is -- not what you want for a jog-style control.
 *
 * So: seed from the first telemetry frame, fall back to a fetch if telemetry
 * is quiet, and after that the form belongs to the user. `resync` is the
 * explicit, user-driven version of what the old auto-reset was reaching for.
 */
export function useSeededForm<T extends FieldValues>({
  form,
  live,
  fallback,
  fallbackAfterMs = 1500,
}: {
  form: UseFormReturn<T>;
  /** Current values from telemetry, or null until the first frame. */
  live: T | null;
  /** Used only if telemetry has not arrived by `fallbackAfterMs`. */
  fallback?: () => Promise<T>;
  fallbackAfterMs?: number;
}) {
  const seeded = useRef(false);
  const [isSeeded, setIsSeeded] = useState(false);

  const seed = useCallback(
    (values: T) => {
      seeded.current = true;
      form.reset(values);
      setIsSeeded(true);
    },
    [form],
  );

  // Preferred path: the first telemetry frame.
  useEffect(() => {
    if (seeded.current || !live) return;
    seed(live);
  }, [live, seed]);

  // Fallback path: telemetry never showed up.
  useEffect(() => {
    if (!fallback) return;
    const id = setTimeout(async () => {
      if (seeded.current) return;
      try {
        seed(await fallback());
      } catch {
        // Server unreachable; leave the defaults in place and let the
        // connection badge explain why.
      }
    }, fallbackAfterMs);
    return () => clearTimeout(id);
  }, [fallback, fallbackAfterMs, seed]);

  /** Pull the live values back into the form on demand. */
  const resync = useCallback(() => {
    if (live) form.reset(live);
  }, [form, live]);

  return { isSeeded, resync };
}
