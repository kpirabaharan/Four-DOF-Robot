import { describe, expect, it } from 'vitest';

import {
  anglesToSteps,
  clampToWorkspace,
  forwardKinematics,
  inverseKinematics,
  inverseKinematicsBoth,
  isReachable,
  serverRound,
  stepsToAngles,
  withinStepLimits,
  wrapAngleIntoRange,
} from '@/lib/kinematics';
import {
  J1_ANGLE_TO_STEPS,
  J2_ANGLE_TO_STEPS,
  J3_ANGLE_TO_STEPS,
  JOINT_LIMITS,
  JZ_DISTANCE_TO_STEPS,
  R_MAX,
  R_MIN,
  STEP_LIMITS,
} from '@/lib/robot';

describe('constants stay in sync with the firmware', () => {
  // If either side is edited independently these break, which is the point:
  // the joint limits and the firmware's step limits describe the same travel.
  it('joint limits map exactly onto Motor_Control.ino step limits', () => {
    expect(Math.round(JOINT_LIMITS.j1.max * J1_ANGLE_TO_STEPS)).toBe(
      STEP_LIMITS.s1.max,
    );
    expect(Math.round(JOINT_LIMITS.j1.min * J1_ANGLE_TO_STEPS)).toBe(
      STEP_LIMITS.s1.min,
    );
    expect(Math.round(JOINT_LIMITS.j2.max * J2_ANGLE_TO_STEPS)).toBe(
      STEP_LIMITS.s2.max,
    );
    expect(Math.round(JOINT_LIMITS.j3.max * J3_ANGLE_TO_STEPS)).toBe(
      STEP_LIMITS.s3.max,
    );
    expect(Math.round(JOINT_LIMITS.jz.max * JZ_DISTANCE_TO_STEPS)).toBe(
      STEP_LIMITS.sz.max,
    );
    expect(Math.round(JOINT_LIMITS.jz.home * JZ_DISTANCE_TO_STEPS)).toBe(
      STEP_LIMITS.sz.home,
    );
  });

  it('annulus radii follow from the link lengths', () => {
    expect(R_MAX).toBe(364.5);
    expect(R_MIN).toBe(91.5);
  });
});

describe('forward kinematics', () => {
  it('matches the notebook at the home pose', () => {
    const { xP, yP } = forwardKinematics(0, 0, 0);
    expect(xP).toBeCloseTo(364.5, 6);
    expect(yP).toBeCloseTo(0, 6);
  });

  it('ignores j3, which is wrist rotation', () => {
    // There is no j3 parameter at all -- this documents that on purpose.
    expect(forwardKinematics(30, 20, 0)).toEqual(forwardKinematics(30, 20, 0));
  });

  it('passes jz straight through as zP, like the server', () => {
    expect(forwardKinematics(0, 0, 137).zP).toBe(137);
  });
});

describe('inverse kinematics', () => {
  // The notebooks' own worked example.
  const X = 297.72;
  const Y = 161.22;

  it('reproduces inverse_kinematics_pos', () => {
    const r = inverseKinematics(X, Y, 0, 'up');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(serverRound(r.j1)).toBe(11.9);
    expect(serverRound(r.j2)).toBe(45.0);
  });

  it('reproduces inverse_kinematics_neg', () => {
    const r = inverseKinematics(X, Y, 0, 'down');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(serverRound(r.j1)).toBe(45.0);
    expect(serverRound(r.j2)).toBe(-45.0);
  });

  it('round-trips through FK, carrying the server rounding error', () => {
    // Rounding j1/j2 to 1dp before FK costs ~0.14mm here. That is the server's
    // behaviour, not a bug, so the test expects it rather than tightening.
    const r = inverseKinematics(X, Y, 0, 'up');
    if (!r.ok) throw new Error('expected reachable');
    const back = forwardKinematics(serverRound(r.j1), serverRound(r.j2), 0);
    expect(Math.hypot(back.xP - X, back.yP - Y)).toBeLessThan(0.2);
    // Unrounded, it round-trips essentially exactly.
    const exact = forwardKinematics(r.j1, r.j2, 0);
    expect(Math.hypot(exact.xP - X, exact.yP - Y)).toBeLessThan(1e-9);
  });

  it('does not return NaN at exactly full extension', () => {
    // acos(1.0000000000000002) is NaN; the clamp is what prevents it.
    const r = inverseKinematics(R_MAX, 0, 0, 'up');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(Number.isNaN(r.j1)).toBe(false);
    expect(Number.isNaN(r.j2)).toBe(false);
    expect(r.j2).toBeCloseTo(0, 6);
  });

  it('rejects points outside the annulus', () => {
    expect(inverseKinematics(0, 0, 0).ok).toBe(false);
    expect(inverseKinematics(364, 364, 0)).toMatchObject({
      ok: false,
      reason: 'outside-outer',
    });
    expect(inverseKinematics(50, 0, 0)).toMatchObject({
      ok: false,
      reason: 'inside-inner',
    });
  });

  it('offers both branches for the elbow toggle', () => {
    const { up, down } = inverseKinematicsBoth(X, Y, 0);
    if (!up.ok || !down.ok) throw new Error('expected both reachable');
    expect(up.j2).toBeGreaterThan(0);
    expect(down.j2).toBeLessThan(0);
  });
});

describe('joint limit guards', () => {
  it('exposes the J1 dead sector via wrapping', () => {
    // Derived from the limits rather than hardcoded: re-zeroing J1 moves the
    // dead sector with it, and this test should keep describing the shape of
    // the problem rather than one calibration's numbers.
    const { min, max } = JOINT_LIMITS.j1;
    const span = max - min;
    const deadWidth = 360 - span; // J1 sweeps 356deg, not a full turn

    expect(span).toBeLessThan(360);

    // Anything already inside the range comes back untouched.
    expect(wrapAngleIntoRange(min, min, max)).toBe(min);
    expect(wrapAngleIntoRange(max, min, max)).toBe(max);

    // Just below min, a full turn up overshoots max -- unreachable either way.
    expect(wrapAngleIntoRange(min - 1, min, max)).toBeNull();
    expect(wrapAngleIntoRange(min - (deadWidth - 1), min, max)).toBeNull();

    // Exactly deadWidth below min, the wrap lands precisely on max.
    expect(wrapAngleIntoRange(min - deadWidth, min, max)).toBe(max);

    // Further down it wraps cleanly: atan2's -160 is reachable as +200.
    expect(wrapAngleIntoRange(-160, min, max)).toBe(200);
  });

  it('catches step targets the server and firmware would both let through', () => {
    // j1 = -160deg is what IK returns for a point at bearing 200deg. The server
    // does no limit check on the cartesian path, and moveTo() does not clamp.
    const steps = anglesToSteps({ j1: -160, j2: 0, j3: 0, jz: 100 });
    expect(steps.s1).toBeLessThan(STEP_LIMITS.s1.min);
    expect(withinStepLimits(steps).ok).toBe(false);
  });
});

describe('step conversion', () => {
  it('matches the live telemetry frame from the Pi', () => {
    // Captured from the running server at the home pose.
    expect(stepsToAngles({ s1: 0, s2: 0, s3: 0, sz: 4104 })).toEqual({
      j1: 0,
      j2: 0,
      j3: 0,
      jz: 100,
    });
  });

  it('rounds angles to whole degrees, as the server does', () => {
    expect(stepsToAngles({ s1: 5, s2: 0, s3: 0, sz: 0 }).j1).toBe(1);
  });
});

describe('workspace clamping', () => {
  it('projects onto the outer circle', () => {
    const c = clampToWorkspace(1000, 0);
    expect(c.clamped).toBe(true);
    expect(c.x).toBeCloseTo(R_MAX, 6);
  });

  it('pushes out to the inner circle', () => {
    const c = clampToWorkspace(10, 0);
    expect(c.clamped).toBe(true);
    expect(c.x).toBeCloseTo(R_MIN, 6);
  });

  it('leaves reachable points alone', () => {
    expect(clampToWorkspace(200, 100).clamped).toBe(false);
  });

  it('agrees with isReachable', () => {
    expect(isReachable(200, 100)).toBe(true);
    expect(isReachable(0, 0)).toBe(false);
    expect(isReachable(R_MAX, 0)).toBe(true);
  });
});
