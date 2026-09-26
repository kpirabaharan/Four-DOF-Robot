'use client';

import { Home } from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { home } from '@/lib/api';

export function HomeButton() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">
          <Home className="size-4" />
          Home
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Home all four axes?</AlertDialogTitle>
          <AlertDialogDescription>
            This drives Z, then J3, J2 and J1 into their limit switches, one
            after another, and cannot be paused once started. Make sure the arm
            has clear space through its whole travel first.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              toast.promise(home(), {
                loading: 'Starting homing sequence…',
                success: 'Homing: Z → J3 → J2 → J1',
                error: (e: Error) => `Could not start homing: ${e.message}`,
              })
            }
          >
            Home the arm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
