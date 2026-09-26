/**
 * Typed wrappers over the Flask endpoints in `Raspberry-Pi/server.py`.
 *
 * Plain `fetch` rather than axios: there is nothing here that needs
 * interceptors, and it keeps the client bundle smaller next to the three.js
 * payload the 3D view already costs us.
 */

import { getApiBaseUrl } from '@/lib/config';
import type { CartesianTarget, JointTarget } from '@/lib/types';

export class RobotApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'RobotApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
  } catch {
    throw new RobotApiError(
      `Cannot reach the robot server at ${getApiBaseUrl()}`,
      0,
    );
  }

  if (!res.ok) {
    // The server returns {"error": "..."} on failure; fall back to the status.
    let detail = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) detail = body.error;
    } catch {
      // Non-JSON error body; the status is all we have.
    }
    throw new RobotApiError(detail, res.status);
  }

  return (await res.json()) as T;
}

export function getJointSetpoint(): Promise<JointTarget> {
  return request<JointTarget>('/api/joint-controls');
}

export function getCartesianSetpoint(): Promise<CartesianTarget> {
  return request<CartesianTarget>('/api/cartesian-controls');
}

/** Drives the arm. The server validates joint limits and writes to the Arduino. */
export function setJoints(target: JointTarget): Promise<JointTarget> {
  return request<JointTarget>('/api/joint-controls', {
    method: 'POST',
    body: JSON.stringify(target),
  });
}

/**
 * Does NOT drive the arm. The server computes IK and step targets but its
 * `arduino.write` is commented out, so this only moves the stored set-point.
 */
export function setCartesian(
  target: CartesianTarget,
): Promise<CartesianTarget> {
  return request<CartesianTarget>('/api/cartesian-controls', {
    method: 'POST',
    body: JSON.stringify(target),
  });
}

export function home(): Promise<{ message: string }> {
  return request<{ message: string }>('/api/home', { method: 'POST' });
}
