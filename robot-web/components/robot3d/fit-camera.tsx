'use client';

import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { PerspectiveCamera } from 'three';

/**
 * Frames the whole reachable workspace regardless of how the panel is shaped.
 *
 * A fixed camera position looks fine at one aspect ratio and crops the arm at
 * another, and this panel is next to a sidebar that comes and goes. So the
 * distance is solved from the actual field of view: whichever of the vertical
 * or horizontal FOV is tighter decides how far back we need to be.
 *
 * This runs on mount and on resize only -- not per frame -- so the user keeps
 * whatever they orbit or zoom to.
 */
export function FitCamera({
  radius,
  margin = 1.35,
  height = 0.16,
}: {
  /** Radius to fit, in three.js units. */
  radius: number;
  margin?: number;
  /** Vertical offset of the look-at point. */
  height?: number;
}) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const controls = useThree((s) => s.controls) as
    | { target: { set: (x: number, y: number, z: number) => void }; update: () => void }
    | null;

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;

    // Bail out until the canvas has actually been measured. A zero width makes
    // the horizontal FOV zero, and the distance below divides by tan(0) -- the
    // camera lands at Infinity and the scene renders as an empty frame.
    if (size.width < 1 || size.height < 1) return;

    const aspect = size.width / size.height;
    const vFov = (camera.fov * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    const distance = (radius * margin) / Math.tan(Math.min(vFov, hFov) / 2);
    if (!Number.isFinite(distance) || distance <= 0) return;

    // Keep the existing viewing direction, just push out to the right distance.
    const dir = { x: 0.72, y: 0.52, z: 0.72 };
    const len = Math.hypot(dir.x, dir.y, dir.z);
    camera.position.set(
      (dir.x / len) * distance,
      (dir.y / len) * distance + height,
      (dir.z / len) * distance,
    );
    camera.updateProjectionMatrix();

    controls?.target.set(0, height, 0);
    controls?.update();

  }, [camera, size.width, size.height, radius, margin, height, controls]);

  return null;
}
