'use client';

import { Server } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  getApiBaseUrlOverride,
  getConfiguredApiBaseUrl,
  setApiBaseUrlOverride,
} from '@/lib/config';

/**
 * NEXT_PUBLIC_* is inlined at build time, and this robot's address has already
 * moved twice. Rather than rebuild to repoint it, store an override locally.
 */
export function ApiUrlDialog() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const configured = getConfiguredApiBaseUrl();

  // Read the stored override when the dialog opens rather than syncing it in
  // an effect; localStorage is only interesting at that moment.
  const onOpenChange = (next: boolean) => {
    if (next) setValue(getApiBaseUrlOverride() ?? '');
    setOpen(next);
  };

  const apply = (next: string | null) => {
    setApiBaseUrlOverride(next);
    // The socket is built once per page, so a reload is the honest way to
    // repoint it rather than half-swapping listeners underneath the UI.
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Server settings">
              <Server className="size-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Robot server address</TooltipContent>
      </Tooltip>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Robot server address</DialogTitle>
          <DialogDescription>
            Where this page looks for the Flask API and the telemetry socket.
          </DialogDescription>
        </DialogHeader>

        <Field>
          <FieldLabel htmlFor="api-url">Override</FieldLabel>
          <Input
            id="api-url"
            placeholder={configured}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            spellCheck={false}
          />
          <FieldDescription>
            Built with <code>{configured}</code>. Leave blank to use that. The
            page must be served over plain HTTP — a browser on HTTPS blocks
            requests to an <code>http://</code> address on a private network.
          </FieldDescription>
        </Field>

        <DialogFooter>
          <Button variant="ghost" onClick={() => apply(null)}>
            Reset to default
          </Button>
          <Button onClick={() => apply(value.trim() || null)}>
            Save and reload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
