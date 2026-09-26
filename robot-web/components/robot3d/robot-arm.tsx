'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { MathUtils, type Group } from 'three';

import {
  BaseAndColumn,
  Carriage,
  EndEffector,
  JointBoss,
  Link,
} from '@/components/robot3d/arm-parts';
import type { RobotPalette } from '@/components/robot3d/palette';
import { D_ELBOW, D_EFFECTOR, D_SHOULDER, L1, L2, MODEL } from '@/lib/robot';
import type { JointTarget } from '@/lib/types';

/**
 * The arm as a nested transform chain, which means three.js computes forward
 * kinematics for us -- the end effector lands where the maths says it should
 * without any FK call in this file.
 *
 * Telemetry arrives twice a second in whole degrees, so the transforms are
 * damped toward their targets each frame rather than set directly; otherwise
 * the model visibly stair-steps.
 *
 * Note the damping is plain linear interpolation, NOT shortest-angular-path.
 * These joints have hard limits (J1 travels -90..266) and physically cannot
 * wrap, so "go the short way round" would animate a motion the arm can't make.
 */

const LAMBDA_LIVE = 9;
const LAMBDA_GHOST = 14;

export function RobotArm({
  pose,
  palette,
  ghost = false,
  showStructure = true,
}: {
  pose: JointTarget | null;
  palette: RobotPalette;
  ghost?: boolean;
  showStructure?: boolean;
}) {
  const zRef = useRef<Group>(null);
  const j1Ref = useRef<Group>(null);
  const j2Ref = useRef<Group>(null);
  const j3Ref = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!pose) return;
    const lambda = ghost ? LAMBDA_GHOST : LAMBDA_LIVE;
    // Clamp delta so a backgrounded tab doesn't produce one giant jump.
    const dt = Math.min(delta, 0.1);

    if (zRef.current) {
      zRef.current.position.z = MathUtils.damp(
        zRef.current.position.z,
        MODEL.armPlaneAtZeroZ + pose.jz,
        lambda,
        dt,
      );
    }
    for (const [ref, target] of [
      [j1Ref, pose.j1],
      [j2Ref, pose.j2],
      [j3Ref, pose.j3],
    ] as const) {
      if (!ref.current) continue;
      ref.current.rotation.z = MathUtils.damp(
        ref.current.rotation.z,
        MathUtils.degToRad(target),
        lambda,
        dt,
      );
    }
  });

  return (
    <group>
      {showStructure ? (
        <BaseAndColumn palette={palette} ghost={ghost} />
      ) : null}

      {/* JZ: the whole arm rides the lead screw. */}
      <group ref={zRef} position={[0, 0, MODEL.armPlaneAtZeroZ]}>
        <Carriage palette={palette} ghost={ghost} />

        {/* J1: base rotation. */}
        <group ref={j1Ref}>
          <group position={[0, 0, D_SHOULDER / 2]}>
            <JointBoss palette={palette} ghost={ghost} height={36} />
            <Link
              palette={palette}
              ghost={ghost}
              length={L1}
              width={MODEL.link1Width}
              thickness={MODEL.link1Thickness}
            />

            {/* J2: elbow, at the far end of link 1 and one plane lower. */}
            <group ref={j2Ref} position={[L1, 0, -D_ELBOW]}>
              <JointBoss palette={palette} ghost={ghost} radius={21} />
              <Link
                palette={palette}
                ghost={ghost}
                length={L2}
                width={MODEL.link2Width}
                thickness={MODEL.link2Thickness}
              />

              {/* J3: wrist rotation, carrying the end effector. */}
              <group ref={j3Ref} position={[L2, 0, 0]}>
                <JointBoss
                  palette={palette}
                  ghost={ghost}
                  radius={15}
                  height={22}
                />
                <EndEffector
                  palette={palette}
                  ghost={ghost}
                  drop={D_EFFECTOR}
                />
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
