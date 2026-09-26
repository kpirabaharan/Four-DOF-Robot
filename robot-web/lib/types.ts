/** Telemetry frame emitted by the Pi on the `current_position` Socket.IO event. */
export type RobotPosition = {
  j1: number;
  j2: number;
  j3: number;
  jz: number;
  s1: number;
  s2: number;
  s3: number;
  sz: number;
  xP: number;
  yP: number;
  zP: number;
};

/** The four joint values, as the `/api/joint-controls` endpoint expects them. */
export type JointTarget = {
  j1: number;
  j2: number;
  j3: number;
  jz: number;
};

/** Stepper positions in steps. */
export type StepTarget = {
  s1: number;
  s2: number;
  s3: number;
  sz: number;
};

/** End-effector position in mm, as `/api/cartesian-controls` expects it. */
export type CartesianTarget = {
  xP: number;
  yP: number;
  zP: number;
};

export type Point2 = { x: number; y: number };

/**
 * Which of the two IK branches to take. `up` is the server's
 * `inverse_kinematics_pos` (t2 >= 0); `down` is `inverse_kinematics_neg`.
 */
export type Elbow = 'up' | 'down';

export type LimitViolation = {
  axis: string;
  value: number;
  min: number;
  max: number;
};
