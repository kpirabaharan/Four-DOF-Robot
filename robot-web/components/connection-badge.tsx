'use client';

import { Plug, PlugZap, Unplug } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useRobotSocket } from '@/context/robot-socket-provider';
import { getApiBaseUrl } from '@/lib/config';

export function ConnectionBadge() {
  const { status, isStale, ageMs, reconnect } = useRobotSocket();

  const { label, variant, Icon, hint } =
    status === 'connected' && !isStale
      ? {
          label: 'Live',
          variant: 'default' as const,
          Icon: PlugZap,
          hint: 'Telemetry is arriving at about 2 Hz.',
        }
      : status === 'connected'
        ? {
            label: 'Stale',
            variant: 'secondary' as const,
            Icon: Plug,
            hint:
              ageMs === null
                ? 'Socket is open but no telemetry has arrived yet.'
                : `Socket is open but no frame for ${Math.round(ageMs / 1000)}s.`,
          }
        : {
            label: status === 'connecting' ? 'Connecting' : 'Offline',
            variant: 'destructive' as const,
            Icon: Unplug,
            hint: `Cannot reach ${getApiBaseUrl()}. Click to retry.`,
          };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={reconnect}
          className="cursor-pointer rounded-full"
          aria-label={`Connection: ${label}. Click to reconnect.`}
        >
          <Badge variant={variant} className="gap-1.5">
            <Icon className="size-3.5" aria-hidden />
            {label}
          </Badge>
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-56">{hint}</p>
      </TooltipContent>
    </Tooltip>
  );
}
