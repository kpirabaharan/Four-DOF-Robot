/**
 * Planar 2R kinematics for the SCARA arm, ported from
 * `Calculations/forward_kinematics.ipynb` and `inverse_kinematics.ipynb`
 * so the client can preview, validate and visualise moves before sending them.
 *
 * Deliberate differences from the Python, all of which matter:
 *
 *  - Nothing is rounded here. The server rounds FK output to whole mm and
 *    telemetry angles to whole degrees; near full extension that rounding costs
 *    several degrees of joint angle, so the 3D model and the reachability check
 *    work from unrounded values and only round at the submit boundary.
 *  - The `acos` argument is clamped to [-1, 1]. At exactly r = R_MAX it is
 *    analytically 1.0 and CPython lands there exactly, but float64 in JS can
 *    produce 1.0000000000000002, which would return NaN.
 *  - IK reports both the raw `j1` the server would command and a `j1Wrapped`
 *    equivalent inside the joint limits, because `atan2` returns (-180, 180]
 *    while J1 physically travels -90..266.
 */

import {
  J1_ANGLE_TO_STEPS,
  J2_ANGLE_TO_STEPS,
  J3_ANGLE_TO_STEPS,
  JOINT_LIMITS,
  JZ_DISTANCE_TO_STEPS,
  L1,
  L2,
  R_MAX,
  R_MIN,
  STEP_LIMITS,
} from '@/lib/robot';
import type {
  CartesianTarget,
  Elbow,
  JointTarget,
  LimitViolation,
  Point2,
  StepTarget,
} from '@/lib/types';

const DEG = 180 / Math.PI;
const RAD = Math.PI / 180;

/** Tolerance for boundary comparisons, in mm. */
const EPS = 1e-9;

export function toRadians(deg: number): number {
  return deg * RAD;
}

export function toDegrees(rad: number): number {
  return rad * DEG;
}

/** The server rounds joint angles to one decimal before converting to steps. */
export function serverRound(deg: number): number {
  return Math.round(deg * 10) / 10;
}

/**
 * Forward kinematics. Ignores j3 -- it is wrist rotation and does not move the
 * end-effector in XY -- which matches the server.
 */
export function forwardKinematics(
  j1: number,
  j2: number,
  jz: number,
): CartesianTarget {
  const t1 = toRadians(j1);
  const t2 = toRadians(j2);
  return {
    xP: L1 * Math.cos(t1) + L2 * Math.cos(t1 + t2),
    yP: L1 * Math.sin(t1) + L2 * Math.sin(t1 + t2),
    zP: jz,
  };
}

/** Position of the elbow joint, for drawing link 1. */
export function elbowJointPosition(j1: number): Point2 {
  const t1 = toRadians(j1);
  return { x: L1 * Math.cos(t1), y: L1 * Math.sin(t1) };
}

export function radiusOf(x: number, y: number): number {
  return Math.hypot(x, y);
}

export function isReachable(x: number, y: number): boolean {
  const r = radiusOf(x, y);
  return r >= R_MIN - EPS && r <= R_MAX + EPS;
}

export type IkFailure = {
  ok: false;
  reason: 'outside-outer' | 'inside-inner' | 'at-origin';
  radius: number;
};

export type IkSuccess = {
  ok: true;
  /** As the server would compute it: atan2-derived, so in (-180, 180]. */
  j1: number;
  j2: number;
  jz: number;
  elbow: Elbow;
  /** `j1` shifted by +/-360 into the joint's real range, or null if impossible. */
  j1Wrapped: number | null;
  withinLimits: boolean;
  violations: LimitViolation[];
};

export type IkResult = IkSuccess | IkFailure;

/**
 * Inverse kinematics for one elbow branch.
 *
 * `up` reproduces the server's `inverse_kinematics_pos` (t2 >= 0) -- the only
 * branch `server.py` actually uses. `down` is `inverse_kinematics_neg`.
 */
export function inverseKinematics(
  x: number,
  y: number,
  z: number,
  elbow: Elbow = 'up',
): IkResult {
  const r = radiusOf(x, y);

  if (r < EPS) {
    return { ok: false, reason: 'at-origin', radius: r };
  }
  if (r > R_MAX + EPS) {
    return { ok: false, reason: 'outside-outer', radius: r };
  }
  if (r < R_MIN - EPS) {
    return { ok: false, reason: 'inside-inner', radius: r };
  }

  const raw = (x * x + y * y - L1 * L1 - L2 * L2) / (2 * L1 * L2);
  const clamped = Math.min(1, Math.max(-1, raw));
  const sign = elbow === 'up' ? 1 : -1;
  const t2 = sign * Math.acos(clamped);
  const t1 =
    Math.atan2(y, x) - Math.atan2(L2 * Math.sin(t2), L1 + L2 * Math.cos(t2));

  const j1 = toDegrees(t1);
  const j2 = toDegrees(t2);
  const j1Wrapped = wrapAngleIntoRange(
    j1,
    JOINT_LIMITS.j1.min,
    JOINT_LIMITS.j1.max,
  );

  const violations = jointViolations({ j1, j2, j3: 0, jz: z }).filter(
    // j3 is not determined by IK, so never report it here.
    (v) => v.axis !== 'j3',
  );

  return {
    ok: true,
    j1,
    j2,
    jz: z,
    elbow,
    j1Wrapped,
    withinLimits: violations.length === 0,
    violations,
  };
}

/** Both branches at once, for the elbow toggle's preview. */
export function inverseKinematicsBoth(
  x: number,
  y: number,
  z: number,
): { up: IkResult; down: IkResult } {
  return {
    up: inverseKinematics(x, y, z, 'up'),
    down: inverseKinematics(x, y, z, 'down'),
  };
}

/**
 * Pull a point into the reachable annulus along its own radius.
 * A point at the exact origin has no direction, so it snaps to (R_MIN, 0).
 */
export function clampToWorkspace(
  x: number,
  y: number,
): { x: number; y: number; clamped: boolean } {
  const r = radiusOf(x, y);
  if (r < EPS) return { x: R_MIN, y: 0, clamped: true };
  if (r > R_MAX) {
    const k = R_MAX / r;
    return { x: x * k, y: y * k, clamped: true };
  }
  if (r < R_MIN) {
    const k = R_MIN / r;
    return { x: x * k, y: y * k, clamped: true };
  }
  return { x, y, clamped: false };
}

/**
 * Shift an angle by whole turns until it lands inside [min, max].
 * Returns null when no equivalent angle fits -- which is how the J1 dead sector
 * (266deg..270deg) becomes visible to the UI.
 */
export function wrapAngleIntoRange(
  deg: number,
  min: number,
  max: number,
): number | null {
  for (const candidate of [deg, deg + 360, deg - 360, deg + 720, deg - 720]) {
    if (candidate >= min && candidate <= max) return candidate;
  }
  return null;
}

/** Matches the server's `convert_angles_to_steps`. */
export function anglesToSteps(t: JointTarget): StepTarget {
  return {
    s1: Math.round(t.j1 * J1_ANGLE_TO_STEPS),
    s2: Math.round(t.j2 * J2_ANGLE_TO_STEPS),
    s3: Math.round(t.j3 * J3_ANGLE_TO_STEPS),
    sz: Math.round(t.jz * JZ_DISTANCE_TO_STEPS),
  };
}

/**
 * Matches the server's `convert_steps_to_angles`, including its rounding to
 * whole degrees -- which is why telemetry angles are integers.
 */
export function stepsToAngles(s: StepTarget): JointTarget {
  return {
    j1: Math.round(s.s1 / J1_ANGLE_TO_STEPS),
    j2: Math.round(s.s2 / J2_ANGLE_TO_STEPS),
    j3: Math.round(s.s3 / J3_ANGLE_TO_STEPS),
    jz: Math.round(s.sz / JZ_DISTANCE_TO_STEPS),
  };
}

export function jointViolations(t: JointTarget): LimitViolation[] {
  const out: LimitViolation[] = [];
  for (const axis of ['j1', 'j2', 'j3', 'jz'] as const) {
    const { min, max } = JOINT_LIMITS[axis];
    const value = t[axis];
    if (value < min || value > max) out.push({ axis, value, min, max });
  }
  return out;
}

export function withinJointLimits(t: JointTarget): {
  ok: boolean;
  violations: LimitViolation[];
} {
  const violations = jointViolations(t);
  return { ok: violations.length === 0, violations };
}

/**
 * The server never checks this on the cartesian path, and the firmware does not
 * clamp `moveTo` either, so this is the last line of defence before a step
 * target outside the physical travel gets sent.
 */
export function withinStepLimits(s: StepTarget): {
  ok: boolean;
  violations: LimitViolation[];
} {
  const violations: LimitViolation[] = [];
  for (const axis of ['s1', 's2', 's3', 'sz'] as const) {
    const { min, max } = STEP_LIMITS[axis];
    const value = s[axis];
    if (value < min || value > max) violations.push({ axis, value, min, max });
  }
  return { ok: violations.length === 0, violations };
}
