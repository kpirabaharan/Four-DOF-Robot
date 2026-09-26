'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useRobotSocket } from '@/context/robot-socket-provider';
import { forwardKinematics } from '@/lib/kinematics';
import { JOINT_LIMITS } from '@/lib/robot';

function Row({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 tabular-nums">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="flex items-baseline gap-2">
        <span className="font-medium">{value}</span>
        {sub ? (
          <span className="text-muted-foreground w-20 text-right text-xs">
            {sub}
          </span>
        ) : null}
      </span>
    </div>
  );
}

/**
 * One card for everything the robot reports. The old app split this across two
 * cards that were both titled "Current Positions"; merging them removes the
 * ambiguity structurally rather than by renaming.
 */
export function TelemetryCard() {
  const { position, status } = useRobotSocket();

  if (!position) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Telemetry</CardTitle>
          <CardDescription>
            {status === 'connected'
              ? 'Waiting for the first frame…'
              : 'Not connected to the robot server.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  // The server rounds its own FK to whole mm, which costs up to ~0.5mm at full
  // extension. Recomputing from the reported angles shows the unrounded value.
  const exact = forwardKinematics(position.j1, position.j2, position.jz);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Telemetry</CardTitle>
        <CardDescription>Live from the arm, about twice a second.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Joints
          </p>
          <Row
            label="J1 · base"
            value={`${position.j1}${JOINT_LIMITS.j1.unit}`}
            sub={`${position.s1} steps`}
          />
          <Row
            label="J2 · elbow"
            value={`${position.j2}${JOINT_LIMITS.j2.unit}`}
            sub={`${position.s2} steps`}
          />
          <Row
            label="J3 · wrist"
            value={`${position.j3}${JOINT_LIMITS.j3.unit}`}
            sub={`${position.s3} steps`}
          />
          <Row
            label="JZ · lift"
            value={`${position.jz}${JOINT_LIMITS.jz.unit}`}
            sub={`${position.sz} steps`}
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            End effector
          </p>
          <Row label="X" value={`${position.xP} mm`} sub={exact.xP.toFixed(1)} />
          <Row label="Y" value={`${position.yP} mm`} sub={exact.yP.toFixed(1)} />
          <Row label="Z" value={`${position.zP} mm`} />
          <p className="text-muted-foreground pt-1 text-xs">
            Bold is what the server reports (rounded to whole mm); grey is
            recomputed from the joint angles.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
