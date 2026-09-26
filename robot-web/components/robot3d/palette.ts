'use client';

import { useTheme } from 'next-themes';
import { useMemo } from 'react';

/**
 * Three.js needs concrete colours, not CSS custom properties, and the theme
 * tokens are OKLCH which three cannot parse reliably. So the 3D view carries
 * its own small palette, tuned to sit alongside the shadcn neutral base.
 *
 * The ghost differs from the live arm in hue, not just lightness, so the two
 * stay distinguishable when the theme inverts.
 */
export type RobotPalette = {
  structure: string;
  link: string;
  joint: string;
  effector: string;
  ghost: string;
  workspace: string;
  workspaceEdge: string;
  deadSector: string;
  grid: string;
  gridSection: string;
  background: string;
  ambient: number;
};

const LIGHT: RobotPalette = {
  structure: '#8b8f96',
  link: '#3f434a',
  joint: '#22262c',
  effector: '#d97706',
  ghost: '#0ea5e9',
  workspace: '#64748b',
  workspaceEdge: '#475569',
  deadSector: '#dc2626',
  grid: '#c2c7ce',
  gridSection: '#9aa1aa',
  background: '#f4f5f7',
  ambient: 1.1,
};

const DARK: RobotPalette = {
  structure: '#6b7280',
  link: '#cbd5e1',
  joint: '#94a3b8',
  effector: '#fbbf24',
  ghost: '#38bdf8',
  workspace: '#94a3b8',
  workspaceEdge: '#cbd5e1',
  deadSector: '#f87171',
  grid: '#2a2f37',
  gridSection: '#3d444e',
  background: '#0b0d10',
  ambient: 0.9,
};

export function useRobotPalette(): RobotPalette {
  const { resolvedTheme } = useTheme();
  return useMemo(
    () => (resolvedTheme === 'light' ? LIGHT : DARK),
    [resolvedTheme],
  );
}
