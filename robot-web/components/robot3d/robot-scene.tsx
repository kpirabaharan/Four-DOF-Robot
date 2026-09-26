'use client';

import {
  ContactShadows,
  GizmoHelper,
  GizmoViewport,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { useEffect } from 'react';

import { FitCamera } from '@/components/robot3d/fit-camera';
import { useRobotPalette } from '@/components/robot3d/palette';
import { RobotArm } from '@/components/robot3d/robot-arm';
import { WorkspaceFloor } from '@/components/robot3d/workspace-floor';
import { R_MAX } from '@/lib/robot';
import type { JointTarget } from '@/lib/types';

/** Robot mm -> three.js units. Keeps the scene ~0.4 units across. */
const MM = 0.001;

export type RobotSceneProps = {
  pose: JointTarget | null;
  ghostPose?: JointTarget | null;
  onPick?: (x: number, y: number) => void;
};

/**
 * Re-measures when the document becomes visible again.
 *
 * r3f sizes itself from a ResizeObserver, and observers (like rAF) are
 * suspended while a document is hidden -- so a console opened in a background
 * tab initialises with a 300x150 canvas and keeps it after you switch to it,
 * because no resize ever *changes*. Reading the box and calling setSize on
 * visibilitychange corrects that without waiting for a window resize.
 */
function ResizeOnVisible() {
  const gl = useThree((state) => state.gl);
  const setSize = useThree((state) => state.setSize);

  useEffect(() => {
    const onVisible = () => {
      if (document.hidden) return;
      const parent = gl.domElement.parentElement;
      if (!parent) return;
      const { width, height } = parent.getBoundingClientRect();
      if (width > 0 && height > 0) setSize(width, height);
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [gl, setSize]);

  return null;
}

export function RobotScene({ pose, ghostPose, onPick }: RobotSceneProps) {
  const palette = useRobotPalette();

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      // offsetSize makes r3f measure the container with offsetWidth/Height
      // rather than the observer's contentRect, which can report 0 on the
      // first pass in a grid cell and leave the canvas at its 300x150 default.
      resize={{ offsetSize: true }}
      className="rounded-xl"
    >
      <color attach="background" args={[palette.background]} />

      <PerspectiveCamera makeDefault position={[0.62, 0.46, 0.62]} fov={42} />
      <FitCamera radius={R_MAX * MM} />
      <ResizeOnVisible />
      <OrbitControls
        makeDefault
        target={[0, 0.16, 0]}
        minDistance={0.2}
        maxDistance={3}
        maxPolarAngle={Math.PI / 2.02}
        enableDamping
      />

      {/* Explicit lights rather than drei's <Environment>, which fetches HDRIs
          from a CDN -- wrong for a console that may run with no internet. */}
      <ambientLight intensity={palette.ambient} />
      <directionalLight
        position={[0.5, 0.9, 0.6]}
        intensity={2.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-0.6}
        shadow-camera-right={0.6}
        shadow-camera-top={0.6}
        shadow-camera-bottom={-0.6}
        shadow-camera-far={3}
      />
      <directionalLight position={[-0.6, 0.4, -0.5]} intensity={0.7} />

      <ContactShadows
        position={[0, 0.001, 0]}
        scale={1.1}
        blur={2.4}
        opacity={0.35}
        far={0.5}
      />

      {/*
        One rotation puts the robot's own frame on screen: -90deg about X maps
        robot +Z to three's +Y, so everything inside is authored in millimetres
        with Z up, exactly like server.py's maths.
      */}
      <group rotation={[-Math.PI / 2, 0, 0]} scale={MM}>
        <WorkspaceFloor palette={palette} onPick={onPick} />
        <RobotArm pose={pose} palette={palette} />
        {ghostPose ? (
          <RobotArm
            pose={ghostPose}
            palette={palette}
            ghost
            showStructure={false}
          />
        ) : null}
      </group>

      <GizmoHelper alignment="bottom-right" margin={[64, 64]}>
        <GizmoViewport
          axisColors={['#ef4444', '#22c55e', '#3b82f6']}
          labelColor={palette.link}
        />
      </GizmoHelper>
    </Canvas>
  );
}
