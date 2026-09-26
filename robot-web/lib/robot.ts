/**
 * Single source of truth for the robot's physical constants.
 *
 * Every value here mirrors `Raspberry-Pi/server.py` (lines 14-56) and
 * `Robot_Control/Motor_Control/Motor_Control.ino`. If you change one of those,
 * change this file too -- `lib/__tests__/kinematics.test.ts` asserts that the
 * joint limits still map exactly onto the firmware's step limits, which is the
 * cheapest guard we have against the two drifting apart.
 */

/** Link lengths in mm. */
export const L1 = 228.0;
export const L2 = 136.5;

/** Reachable annulus in the XY plane, in mm. */
export const R_MAX = L1 + L2; // 364.5
export const R_MIN = Math.abs(L1 - L2); // 91.5

/**
 * Vertical offsets between link planes, in mm, taken from the DH table in
 * `Calculations/Old-DH/Scara_Math.py` (d3, d4, d5). Used only by the 3D model
 * so the links stack at realistic heights instead of sitting coplanar; the
 * kinematics themselves are planar and ignore these.
 */
export const D_SHOULDER = 60;
export const D_ELBOW = 25;
export const D_EFFECTOR = 105;

/**
 * Structural dimensions for the 3D model only, in mm. These are not measured
 * from the real machine -- they are chosen so the rendered arm is proportioned
 * plausibly around the dimensions that ARE real (L1, L2, the DH offsets and the
 * 150mm Z travel).
 */
export const MODEL = {
  baseRadius: 95,
  baseHeight: 18,
  columnRadius: 38,
  columnHeight: 340,
  leadScrewRadius: 7,
  carriageRadius: 52,
  carriageHeight: 46,
  /** Height of the link-1 plane when JZ is at 0. */
  armPlaneAtZeroZ: 140,
  link1Width: 46,
  link1Thickness: 22,
  link2Width: 36,
  link2Thickness: 18,
  jointBossRadius: 26,
  wristRadius: 9,
  gripperLength: 40,
};

/** Angle -> step conversion factors. */
export const J1_ANGLE_TO_STEPS = 9.8707865169;
export const J2_ANGLE_TO_STEPS = 8.4133333333;
export const J3_ANGLE_TO_STEPS = 2.5679012346;
export const JZ_DISTANCE_TO_STEPS = 41.04;

export type AxisLimit = {
  min: number;
  max: number;
  home: number;
  /** Unit label for display. */
  unit: '°' | 'mm';
  /** Sensible jog increment for the +/- buttons. */
  step: number;
};

/**
 * Joint limits, in degrees (j1-j3) and mm (jz).
 *
 * Re-referenced Sep 2026 so 0 lands square with the table: every j1-j3 range
 * shifted by -13/-12/-26 degrees. The travel span is unchanged -- only where
 * zero sits moved.
 */
export const JOINT_LIMITS: Record<'j1' | 'j2' | 'j3' | 'jz', AxisLimit> = {
  j1: { min: -103, max: 253, home: 0, unit: '°', step: 1 },
  j2: { min: -162, max: 138, home: 0, unit: '°', step: 1 },
  j3: { min: -188, max: 136, home: 0, unit: '°', step: 1 },
  jz: { min: 0, max: 150, home: 100, unit: 'mm', step: 1 },
};

/** Stepper limits, in steps. */
export const STEP_LIMITS: Record<'s1' | 's2' | 's3' | 'sz', AxisLimit> = {
  s1: { min: -1017, max: 2497, home: 0, unit: '°', step: 1 },
  s2: { min: -1363, max: 1161, home: 0, unit: '°', step: 1 },
  s3: { min: -483, max: 349, home: 0, unit: '°', step: 1 },
  sz: { min: 0, max: 6156, home: 4104, unit: 'mm', step: 1 },
};

/** Cartesian bounds the server's zod-equivalent check enforces (a box, not the annulus). */
export const CARTESIAN_LIMITS = {
  xP: { min: -364, max: 364 },
  yP: { min: -364, max: 364 },
  zP: { min: 0, max: 150 },
};

/**
 * Firmware motion profile, from Motor_Control.ino. Used to tell the truth about
 * what the Hold button can actually do: decelerating from ROTATIONAL_MAX_SPEED
 * at ROTATIONAL_ACCELERATION takes v/a seconds and v^2/(2a) steps.
 */
export const MOTION = {
  rotationalMaxSpeed: 100, // steps/s
  rotationalAcceleration: 25, // steps/s^2
  zMaxSpeed: 200,
  zAcceleration: 25,
};

/** ~4 s and ~200 steps (about 20 deg on J1). Surfaced in the Hold button's copy. */
export const HOLD_STOP_SECONDS =
  MOTION.rotationalMaxSpeed / MOTION.rotationalAcceleration;
export const HOLD_STOP_STEPS =
  (MOTION.rotationalMaxSpeed * MOTION.rotationalMaxSpeed) /
  (2 * MOTION.rotationalAcceleration);
export const HOLD_STOP_DEGREES_J1 = HOLD_STOP_STEPS / J1_ANGLE_TO_STEPS;
