'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { ApiUrlDialog } from '@/components/api-url-dialog';
import { CartesianControlPanel } from '@/components/cartesian-control-panel';
import { ConnectionBadge } from '@/components/connection-badge';
import { HoldButton } from '@/components/hold-button';
import { HomeButton } from '@/components/home-button';
import { JointControlPanel } from '@/components/joint-control-panel';
import { RobotViewport } from '@/components/robot3d/robot-viewport';
import { TelemetryCard } from '@/components/telemetry-card';
import { ThemeToggle } from '@/components/theme-toggle';
import { ViewToggle } from '@/components/view-toggle';
import { useRobotSocket } from '@/context/robot-socket-provider';
import { useSeededForm } from '@/hooks/use-seeded-form';
import { useShow3d } from '@/hooks/use-show-3d';
import { getJointSetpoint } from '@/lib/api';
import { clampToWorkspace } from '@/lib/kinematics';
import { CARTESIAN_LIMITS, JOINT_LIMITS } from '@/lib/robot';
import type { CartesianTarget, Elbow, JointTarget } from '@/lib/types';

// zod v4: no z.coerce -- AxisControl hands the form real numbers already.
const jointSchema = z.object({
  j1: z.number().min(JOINT_LIMITS.j1.min).max(JOINT_LIMITS.j1.max),
  j2: z.number().min(JOINT_LIMITS.j2.min).max(JOINT_LIMITS.j2.max),
  j3: z.number().min(JOINT_LIMITS.j3.min).max(JOINT_LIMITS.j3.max),
  jz: z.number().min(JOINT_LIMITS.jz.min).max(JOINT_LIMITS.jz.max),
});

const cartesianSchema = z.object({
  xP: z.number().min(CARTESIAN_LIMITS.xP.min).max(CARTESIAN_LIMITS.xP.max),
  yP: z.number().min(CARTESIAN_LIMITS.yP.min).max(CARTESIAN_LIMITS.yP.max),
  zP: z.number().min(CARTESIAN_LIMITS.zP.min).max(CARTESIAN_LIMITS.zP.max),
});

export function Dashboard() {
  const { position } = useRobotSocket();
  const [show3d, setShow3d] = useShow3d();

  const live = useMemo<JointTarget | null>(
    () =>
      position
        ? { j1: position.j1, j2: position.j2, j3: position.j3, jz: position.jz }
        : null,
    [position],
  );

  // The joint form lives here so the 3D ghost can watch the same values the
  // control panel edits.
  const jointForm = useForm<JointTarget>({
    resolver: zodResolver(jointSchema),
    defaultValues: {
      j1: JOINT_LIMITS.j1.home,
      j2: JOINT_LIMITS.j2.home,
      j3: JOINT_LIMITS.j3.home,
      jz: JOINT_LIMITS.jz.home,
    },
  });

  const fallback = useCallback(() => getJointSetpoint(), []);
  const { resync } = useSeededForm({ form: jointForm, live, fallback });

  const cartesianForm = useForm<CartesianTarget>({
    resolver: zodResolver(cartesianSchema),
    defaultValues: { xP: 250, yP: 0, zP: JOINT_LIMITS.jz.home },
  });
  const [elbow, setElbow] = useState<Elbow>('up');

  const target = useWatch({ control: jointForm.control }) as JointTarget;

  // Clicking the workspace floor sets an XY goal, pulled into the annulus so
  // the value is always one the arm can actually solve.
  const handlePick = useCallback(
    (x: number, y: number) => {
      const c = clampToWorkspace(x, y);
      cartesianForm.setValue('xP', Math.round(c.x), { shouldValidate: true });
      cartesianForm.setValue('yP', Math.round(c.y), { shouldValidate: true });
    },
    [cartesianForm],
  );

  const loadIntoJoints = useCallback(
    (t: Pick<JointTarget, 'j1' | 'j2' | 'jz'>) => {
      jointForm.setValue('j1', t.j1, { shouldValidate: true, shouldDirty: true });
      jointForm.setValue('j2', t.j2, { shouldValidate: true, shouldDirty: true });
      jointForm.setValue('jz', t.jz, { shouldValidate: true, shouldDirty: true });
    },
    [jointForm],
  );

  // Only draw the ghost when the commanded pose differs from where the arm is.
  const differs =
    !!live &&
    (['j1', 'j2', 'j3', 'jz'] as const).some(
      (k) => Math.abs((target?.[k] ?? 0) - live[k]) > 0.5,
    );

  return (
    <div className="mx-auto flex min-h-screen max-w-[110rem] flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            4-DOF Robot Control
          </h1>
          <p className="text-muted-foreground text-sm">SCARA arm console</p>
        </div>
        <div className="flex items-center gap-2">
          <ConnectionBadge />
          <HoldButton />
          <HomeButton />
          <ViewToggle show3d={show3d} onChange={setShow3d} />
          <ApiUrlDialog />
          <ThemeToggle />
        </div>
      </header>

      <div
        className={
          show3d
            ? 'grid flex-1 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]'
            : 'flex flex-1 flex-col gap-6'
        }
      >
        <RobotViewport
          enabled={show3d}
          onEnable={() => setShow3d(true)}
          pose={live}
          ghostPose={differs ? target : null}
          onPick={handlePick}
        />
        <div
          className={
            show3d
              ? 'flex flex-col gap-6'
              : 'grid gap-6 md:grid-cols-2 xl:grid-cols-3'
          }
        >
          <JointControlPanel form={jointForm} onResync={resync} />
          <CartesianControlPanel
            form={cartesianForm}
            elbow={elbow}
            onElbowChange={setElbow}
            onLoadIntoJoints={loadIntoJoints}
          />
          <TelemetryCard />
        </div>
      </div>
    </div>
  );
}
