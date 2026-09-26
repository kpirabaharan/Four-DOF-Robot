'use client';

import { RoundedBox } from '@react-three/drei';

import type { RobotPalette } from '@/components/robot3d/palette';
import { MODEL } from '@/lib/robot';

/**
 * Everything here is authored in the robot's own frame: millimetres, +Z up.
 * The parent group in <RobotScene> rotates and scales that into three.js
 * world space, so nothing below needs to think about it.
 *
 * three's CylinderGeometry runs along local Y, so anything vertical carries
 * rotation={[Math.PI / 2, 0, 0]} to stand it up along local Z.
 */

const STAND_UP: [number, number, number] = [Math.PI / 2, 0, 0];

type PartProps = { palette: RobotPalette; ghost?: boolean };

/**
 * Ghost parts all take the ghost hue rather than their own colour, so the
 * target pose reads as one object instead of a dimmed copy of the arm. The
 * emissive term keeps it visible against both the light and dark backgrounds,
 * and depthWrite:false stops the transparent shells from occluding each other.
 */
function surface(
  palette: RobotPalette,
  color: string,
  ghost: boolean | undefined,
  rough = 0.45,
) {
  if (ghost) {
    return {
      color: palette.ghost,
      emissive: palette.ghost,
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      roughness: 0.9,
      metalness: 0,
    };
  }
  return { color, roughness: rough, metalness: 0.25 };
}

export function BaseAndColumn({ palette, ghost }: PartProps) {
  return (
    <group>
      <mesh
        position={[0, 0, MODEL.baseHeight / 2]}
        rotation={STAND_UP}
        castShadow
        receiveShadow
      >
        <cylinderGeometry
          args={[MODEL.baseRadius, MODEL.baseRadius, MODEL.baseHeight, 48]}
        />
        <meshStandardMaterial {...surface(palette, palette.structure, ghost, 0.6)} />
      </mesh>

      <mesh
        position={[0, 0, MODEL.columnHeight / 2]}
        rotation={STAND_UP}
        castShadow
      >
        <cylinderGeometry
          args={[MODEL.columnRadius, MODEL.columnRadius, MODEL.columnHeight, 32]}
        />
        <meshStandardMaterial {...surface(palette, palette.structure, ghost, 0.5)} />
      </mesh>

      {/* Lead screw, offset to the side of the column like the real machine. */}
      <mesh
        position={[MODEL.columnRadius + 14, 0, MODEL.columnHeight / 2]}
        rotation={STAND_UP}
      >
        <cylinderGeometry
          args={[
            MODEL.leadScrewRadius,
            MODEL.leadScrewRadius,
            MODEL.columnHeight - 20,
            16,
          ]}
        />
        <meshStandardMaterial {...surface(palette, palette.joint, ghost, 0.3)} />
      </mesh>
    </group>
  );
}

export function Carriage({ palette, ghost }: PartProps) {
  return (
    <mesh rotation={STAND_UP} castShadow>
      <cylinderGeometry
        args={[
          MODEL.carriageRadius,
          MODEL.carriageRadius,
          MODEL.carriageHeight,
          32,
        ]}
      />
      <meshStandardMaterial {...surface(palette, palette.structure, ghost, 0.35)} />
    </mesh>
  );
}

export function JointBoss({
  palette,
  ghost,
  radius = MODEL.jointBossRadius,
  height = 30,
}: PartProps & { radius?: number; height?: number }) {
  return (
    <mesh rotation={STAND_UP} castShadow>
      <cylinderGeometry args={[radius, radius, height, 32]} />
      <meshStandardMaterial {...surface(palette, palette.joint, ghost, 0.35)} />
    </mesh>
  );
}

/** A link slab running from the local origin out along +X. */
export function Link({
  palette,
  ghost,
  length,
  width,
  thickness,
}: PartProps & { length: number; width: number; thickness: number }) {
  return (
    <RoundedBox
      args={[length, width, thickness]}
      radius={Math.min(width, thickness) * 0.35}
      smoothness={4}
      position={[length / 2, 0, 0]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial {...surface(palette, palette.link, ghost, 0.5)} />
    </RoundedBox>
  );
}

/** Wrist shaft plus a simple two-finger gripper, hanging down by D_EFFECTOR. */
export function EndEffector({
  palette,
  ghost,
  drop,
}: PartProps & { drop: number }) {
  return (
    <group>
      <mesh position={[0, 0, -drop / 2]} rotation={STAND_UP} castShadow>
        <cylinderGeometry
          args={[MODEL.wristRadius, MODEL.wristRadius, drop, 20]}
        />
        <meshStandardMaterial {...surface(palette, palette.joint, ghost, 0.3)} />
      </mesh>

      {[-11, 11].map((offset) => (
        <mesh
          key={offset}
          position={[offset, 0, -drop - MODEL.gripperLength / 2 + 4]}
          castShadow
        >
          <boxGeometry args={[5, 14, MODEL.gripperLength]} />
          <meshStandardMaterial {...surface(palette, palette.effector, ghost, 0.4)} />
        </mesh>
      ))}
    </group>
  );
}
