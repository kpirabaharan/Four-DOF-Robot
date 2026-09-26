'use client';

import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { RobotSocketProvider } from '@/context/robot-socket-provider';

/**
 * The single client boundary. Everything rendered below this is a client
 * component by inheritance, so nothing else needs a 'use client' directive.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider delayDuration={300}>
        <RobotSocketProvider>
          {children}
          <Toaster richColors closeButton position="bottom-right" />
        </RobotSocketProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
