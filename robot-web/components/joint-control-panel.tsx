'use client';

import { RotateCcw, Send } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { AxisControl } from '@/components/axis-control';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { useRobotSocket } from '@/context/robot-socket-provider';
import { setJoints } from '@/lib/api';
import { anglesToSteps, withinStepLimits } from '@/lib/kinematics';
import { JOINT_LIMITS } from '@/lib/robot';
import type { JointTarget } from '@/lib/types';

export function JointControlPanel({
  form,
  onResync,
}: {
  /** Owned by the dashboard so the 3D ghost can watch the same values. */
  form: UseFormReturn<JointTarget>;
  onResync: () => void;
}) {
  const { position } = useRobotSocket();

  const onSubmit = async (values: JointTarget) => {
    // Last line of defence: the firmware's moveTo() does not clamp, so a step
    // target outside the physical travel would just be driven into the stop.
    const steps = anglesToSteps(values);
    const stepCheck = withinStepLimits(steps);
    if (!stepCheck.ok) {
      const v = stepCheck.violations[0];
      toast.error('Refusing to send: outside stepper travel', {
        description: `${v.axis} would be ${v.value} steps (limit ${v.min} … ${v.max}).`,
      });
      return;
    }

    await toast.promise(setJoints(values), {
      loading: 'Sending move…',
      success: (r) =>
        `Moving to J1 ${r.j1}° · J2 ${r.j2}° · J3 ${r.j3}° · JZ ${r.jz}mm`,
      error: (e: Error) =>
        `Send failed: ${e.message}. Check telemetry — the arm may have accepted the move anyway.`,
    });

    form.reset(values, { keepDirty: false });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Joint control</CardTitle>
        <CardDescription>
          Drives the arm directly. Each axis is clamped to its real travel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FieldGroup>
            <AxisControl
              control={form.control}
              name="j1"
              label="J1 · base"
              limit={JOINT_LIMITS.j1}
              actual={position?.j1}
            />
            <AxisControl
              control={form.control}
              name="j2"
              label="J2 · elbow"
              limit={JOINT_LIMITS.j2}
              actual={position?.j2}
            />
            <AxisControl
              control={form.control}
              name="j3"
              label="J3 · wrist"
              limit={JOINT_LIMITS.j3}
              actual={position?.j3}
            />
            <AxisControl
              control={form.control}
              name="jz"
              label="JZ · lift"
              limit={JOINT_LIMITS.jz}
              actual={position?.jz}
            />
          </FieldGroup>

          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onResync}
              disabled={!position}
            >
              <RotateCcw className="size-3.5" />
              Sync from robot
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              <Send className="size-3.5" />
              Send move
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
