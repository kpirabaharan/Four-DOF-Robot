'use client';

import { PauseOctagon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useRobotSocket } from '@/context/robot-socket-provider';
import { setJoints } from '@/lib/api';
import { HOLD_STOP_DEGREES_J1, HOLD_STOP_SECONDS } from '@/lib/robot';

/**
 * Re-sends the arm's current position as its target, which lands AccelStepper
 * on where it already is and brings motion to a stop. No firmware change needed.
 *
 * It is deliberately NOT called an e-stop. With the firmware's acceleration of
 * 25 steps/s^2 from 100 steps/s, deceleration takes about 4s and 200 steps --
 * roughly 20 degrees on J1 -- and AccelStepper will overshoot and reverse if
 * the new target falls inside its stopping distance. Telemetry is also whole
 * degrees, so there is a residual of up to half a degree.
 */
export function HoldButton() {
  const { position } = useRobotSocket();

  const onHold = () => {
    if (!position) return;
    toast.promise(
      setJoints({
        j1: position.j1,
        j2: position.j2,
        j3: position.j3,
        jz: position.jz,
      }),
      {
        loading: 'Holding…',
        success: `Holding at J1 ${position.j1}° · J2 ${position.j2}° · J3 ${position.j3}° · JZ ${position.jz}mm`,
        error: (e: Error) => `Hold failed: ${e.message}`,
      },
    );
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="secondary" onClick={onHold} disabled={!position}>
          <PauseOctagon className="size-4" />
          Hold
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-64">
          Retargets the arm to where it is now. Not an emergency stop — it
          decelerates over about {HOLD_STOP_SECONDS.toFixed(0)}s and roughly{' '}
          {HOLD_STOP_DEGREES_J1.toFixed(0)}° of J1 travel. Use the power switch
          for a real emergency.
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
