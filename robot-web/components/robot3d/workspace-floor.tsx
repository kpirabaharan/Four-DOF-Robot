'use client';

import { Grid, Line } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { useMemo } from 'react';
import { DoubleSide, Shape } from 'three';

import type { RobotPalette } from '@/components/robot3d/palette';
import { JOINT_LIMITS, R_MAX, R_MIN } from '@/lib/robot';

/**
 * The floor plot: a grid, the reachable annulus, and the sliver of bearing the
 * arm cannot reach.
 *
 * J1 travels -90..266, which is 356 degrees -- not a full turn. The missing
 * 4 degrees (266..270) is a real dead sector: a target there has no reachable
 * J1 equivalent in either direction. Drawing it is the difference between a
 * decorative disc and an honest workspace plot.
 */

function useAnnulusShape() {
  return useMemo(() => {
    const shape = new Shape();
    shape.absarc(0, 0, R_MAX, 0, Math.PI * 2, false);
    const hole = new Shape();
    hole.absarc(0, 0, R_MIN, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    return shape;
  }, []);
}

function useDeadSectorShape() {
  return useMemo(() => {
    // Bearings with no valid J1: above the max, below the min + a full turn.
    const from = (JOINT_LIMITS.j1.max * Math.PI) / 180; // 266deg
    const to = ((JOINT_LIMITS.j1.min + 360) * Math.PI) / 180; // 270deg
    const shape = new Shape();
    shape.moveTo(0, 0);
    shape.absarc(0, 0, R_MAX, from, to, false);
    shape.lineTo(0, 0);
    return shape;
  }, []);
}

function circlePoints(radius: number, segments = 128): [number, number, number][] {
  return Array.from({ length: segments + 1 }, (_, i) => {
    const a = (i / segments) * Math.PI * 2;
    return [Math.cos(a) * radius, Math.sin(a) * radius, 0] as [
      number,
      number,
      number,
    ];
  });
}

export function WorkspaceFloor({
  palette,
  onPick,
}: {
  palette: RobotPalette;
  /** Called with robot-frame millimetres when the floor is clicked. */
  onPick?: (x: number, y: number) => void;
}) {
  const annulus = useAnnulusShape();
  const deadSector = useDeadSectorShape();
  const outer = useMemo(() => circlePoints(R_MAX), []);
  const inner = useMemo(() => circlePoints(R_MIN), []);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!onPick) return;
    e.stopPropagation();
    // The mesh lives in the robot frame, so its local point is already in mm.
    const local = e.object.worldToLocal(e.point.clone());
    onPick(local.x, local.y);
  };

  return (
    <group>
      <Grid
        args={[2000, 2000]}
        cellSize={50}
        cellThickness={0.6}
        cellColor={palette.grid}
        sectionSize={250}
        sectionThickness={1.1}
        sectionColor={palette.gridSection}
        fadeDistance={2600}
        fadeStrength={1.2}
        infiniteGrid
        position={[0, 0, -0.4]}
        rotation={[Math.PI / 2, 0, 0]}
      />

      {/* Reachable annulus. Also the click target for setting an XY goal. */}
      <mesh position={[0, 0, 0.2]} onClick={handleClick}>
        <shapeGeometry args={[annulus]} />
        <meshBasicMaterial
          color={palette.workspace}
          transparent
          opacity={0.1}
          side={DoubleSide}
        />
      </mesh>

      <mesh position={[0, 0, 0.4]}>
        <shapeGeometry args={[deadSector]} />
        <meshBasicMaterial
          color={palette.deadSector}
          transparent
          opacity={0.16}
          side={DoubleSide}
        />
      </mesh>

      <Line
        points={outer}
        color={palette.workspaceEdge}
        lineWidth={1.4}
        position={[0, 0, 0.6]}
      />
      <Line
        points={inner}
        color={palette.workspaceEdge}
        lineWidth={1.4}
        position={[0, 0, 0.6]}
      />
    </group>
  );
}
