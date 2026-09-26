'use client';

import { CircleAlert, MoveRight, Send, TriangleAlert } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { AxisControl } from '@/components/axis-control';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { setCartesian } from '@/lib/api';
import { inverseKinematics, radiusOf, serverRound } from '@/lib/kinematics';
import { CARTESIAN_LIMITS, JOINT_LIMITS, R_MAX, R_MIN } from '@/lib/robot';
import type { CartesianTarget, Elbow, JointTarget } from '@/lib/types';

const X_LIMIT = {
  ...CARTESIAN_LIMITS.xP,
  home: 0,
  unit: 'mm' as const,
  step: 1,
};
const Y_LIMIT = {
  ...CARTESIAN_LIMITS.yP,
  home: 0,
  unit: 'mm' as const,
  step: 1,
};
const Z_LIMIT = { ...JOINT_LIMITS.jz };

export function CartesianControlPanel({
  form,
  elbow,
  onElbowChange,
  onLoadIntoJoints,
}: {
  form: UseFormReturn<CartesianTarget>;
  elbow: Elbow;
  onElbowChange: (e: Elbow) => void;
  onLoadIntoJoints: (target: Pick<JointTarget, 'j1' | 'j2' | 'jz'>) => void;
}) {
  const values = useWatch({ control: form.control }) as CartesianTarget;
  const x = values?.xP ?? 0;
  const y = values?.yP ?? 0;
  const z = values?.zP ?? 0;

  const radius = radiusOf(x, y);
  const ik = inverseKinematics(x, y, z, elbow);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cartesian target</CardTitle>
        <CardDescription>
          Pick a point in the workspace, or click the floor in the 3D view.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Alert>
          <CircleAlert />
          <AlertTitle>The server will not move the arm from here</AlertTitle>
          <AlertDescription>
            <p>
              <code>/api/cartesian-controls</code> computes the inverse
              kinematics and stores the set-point, but its{' '}
              <code>arduino.write</code> is commented out in{' '}
              <code>server.py</code>. To actually move, load the solution into
              joint control below and send it from there.
            </p>
          </AlertDescription>
        </Alert>

        <FieldGroup>
          <AxisControl
            control={form.control}
            name="xP"
            label="X"
            limit={X_LIMIT}
          />
          <AxisControl
            control={form.control}
            name="yP"
            label="Y"
            limit={Y_LIMIT}
          />
          <AxisControl
            control={form.control}
            name="zP"
            label="Z"
            limit={Z_LIMIT}
          />
        </FieldGroup>

        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Elbow
          </p>
          <ToggleGroup
            type="single"
            variant="outline"
            value={elbow}
            onValueChange={(v) => v && onElbowChange(v as Elbow)}
            className="w-full"
          >
            <ToggleGroupItem value="up" className="flex-1">
              Up
            </ToggleGroupItem>
            <ToggleGroupItem value="down" className="flex-1">
              Down
            </ToggleGroupItem>
          </ToggleGroup>
          <p className="text-muted-foreground text-xs">
            The server only ever solves elbow-up. Elbow-down is reachable, but
            only by sending joint angles.
          </p>
        </div>

        <Separator />

        <IkPreview ik={ik} radius={radius} />

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              toast.promise(setCartesian({ xP: x, yP: y, zP: z }), {
                loading: 'Storing set-point…',
                success: 'Set-point stored (the arm did not move)',
                error: (e: Error) => `Rejected: ${e.message}`,
              })
            }
          >
            <Send className="size-3.5" />
            Store set-point
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!ik.ok || !ik.withinLimits}
            onClick={() => {
              if (!ik.ok) return;
              onLoadIntoJoints({
                j1: serverRound(ik.j1),
                j2: serverRound(ik.j2),
                jz: ik.jz,
              });
              toast.success('Loaded into joint control', {
                description: 'Review the ghost pose, then press Send move.',
              });
            }}
          >
            <MoveRight className="size-3.5" />
            Load into joint control
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function IkPreview({
  ik,
  radius,
}: {
  ik: ReturnType<typeof inverseKinematics>;
  radius: number;
}) {
  if (!ik.ok) {
    const message =
      ik.reason === 'outside-outer'
        ? `${radius.toFixed(0)}mm from the base is beyond the ${R_MAX}mm reach.`
        : ik.reason === 'inside-inner'
          ? `${radius.toFixed(0)}mm is inside the ${R_MIN}mm dead zone the arm cannot fold into.`
          : 'The base itself is not a reachable point.';
    return (
      <Alert variant="destructive">
        <TriangleAlert />
        <AlertTitle>Unreachable</AlertTitle>
        <AlertDescription>
          <p>
            {message} Sending this would make the server&apos;s{' '}
            <code>acos</code> raise and return a 500.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        Solution
      </p>
      <div className="flex justify-between text-sm tabular-nums">
        <span className="text-muted-foreground">J1</span>
        <span className="font-medium">{serverRound(ik.j1)}°</span>
      </div>
      <div className="flex justify-between text-sm tabular-nums">
        <span className="text-muted-foreground">J2</span>
        <span className="font-medium">{serverRound(ik.j2)}°</span>
      </div>
      <div className="text-muted-foreground flex justify-between text-sm tabular-nums">
        <span>Radius</span>
        <span>{radius.toFixed(1)} mm</span>
      </div>

      {!ik.withinLimits ? (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>Outside joint travel</AlertTitle>
          <AlertDescription>
            <p>
              {ik.j1Wrapped === null ? (
                <>
                  J1 would need {serverRound(ik.j1)}°, which has no equivalent
                  inside {JOINT_LIMITS.j1.min}…{JOINT_LIMITS.j1.max}°. This
                  bearing falls in the 4° sector the arm cannot reach.
                </>
              ) : (
                <>
                  The server would command J1 {serverRound(ik.j1)}°, outside{' '}
                  {JOINT_LIMITS.j1.min}…{JOINT_LIMITS.j1.max}°. The arm can
                  reach this point at {serverRound(ik.j1Wrapped)}° instead — the
                  server does not do that conversion, and it does not check
                  joint limits on this path either.
                </>
              )}
            </p>
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
