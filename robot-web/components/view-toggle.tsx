'use client';

import { Box } from 'lucide-react';

import { Toggle } from '@/components/ui/toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function ViewToggle({
  show3d,
  onChange,
}: {
  show3d: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          variant="outline"
          pressed={show3d}
          onPressedChange={onChange}
          aria-label="Toggle the 3D view"
        >
          <Box className="size-4" />
          3D
        </Toggle>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-56">
          {show3d
            ? 'Turn off the 3D view to stop rendering entirely.'
            : 'Turn the 3D view back on.'}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
