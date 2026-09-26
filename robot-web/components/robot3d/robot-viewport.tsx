'use client';

import { Box, Eye } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { RobotSceneProps } from '@/components/robot3d/robot-scene';

/**
 * <Canvas> needs `window`, and a 'use client' component is still prerendered on
 * the server in the App Router, so the scene has to be loaded with ssr: false.
 */
const RobotScene = dynamic(
  () => import('@/components/robot3d/robot-scene').then((m) => m.RobotScene),
  {
    ssr: false,
    loading: () => <Skeleton className="size-full rounded-xl" />,
  },
);

/**
 * Reports the element's size, but only once it is actually non-zero.
 *
 * r3f builds its three.js root lazily, the first time it measures a non-zero
 * size -- and if its own ResizeObserver happens to fire before layout it latches
 * onto 0 and never initialises: the canvas sits at its 300x150 default and the
 * scene never appears. Rather than race it, we withhold the <Canvas> until we
 * know the box is real, so r3f's first measurement cannot be the bad one.
 */
function useReadyToRender(ref: React.RefObject<HTMLElement | null>) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = (width: number, height: number) => {
      if (width > 0 && height > 0) setReady(true);
    };

    const observer = new ResizeObserver(([entry]) => {
      check(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(el);

    // Prime from the current layout too, in case the box is already settled and
    // no further resize is coming. A timer rather than requestAnimationFrame:
    // rAF does not run while the document is hidden, so a tab restored from the
    // background would never mount the scene. Timers still fire when hidden.
    const timer = setTimeout(() => {
      const rect = el.getBoundingClientRect();
      check(rect.width, rect.height);
    }, 0);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [ref]);

  return ready;
}

export function RobotViewport({
  enabled,
  onEnable,
  ...sceneProps
}: RobotSceneProps & {
  enabled: boolean;
  onEnable: () => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const ready = useReadyToRender(boxRef);

  // Unmount rather than hide. A hidden canvas keeps its WebGL context and keeps
  // running useFrame every tick, so display:none would cost exactly as much as
  // showing it -- the whole point of the toggle is to stop the render loop.
  if (!enabled) {
    return (
      <div className="bg-muted/20 text-muted-foreground flex items-center justify-between gap-4 rounded-xl border border-dashed px-5 py-4">
        <div className="flex items-center gap-3">
          <Box className="size-4 shrink-0" aria-hidden />
          <div>
            <p className="text-foreground text-sm font-medium">
              3D view is off
            </p>
            <p className="text-xs">
              Nothing is rendering. Controls and telemetry are unaffected.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onEnable}>
          <Eye className="size-3.5" />
          Show
        </Button>
      </div>
    );
  }

  return (
    // The height must be DEFINITE. r3f's <Canvas> wrapper is height:100%, and
    // with an auto-height parent its observer and the canvas grow each other on
    // every measure -- the canvas had ballooned to 807x1692, which at dpr 2 is
    // 5.4 megapixels of shadowed scene per frame.
    <div className="bg-muted/20 relative h-[26rem] overflow-hidden rounded-xl border xl:h-[calc(100dvh-9rem)] xl:min-h-[30rem]">
      <div ref={boxRef} className="absolute inset-0">
        {ready ? <RobotScene {...sceneProps} /> : null}
      </div>
    </div>
  );
}
