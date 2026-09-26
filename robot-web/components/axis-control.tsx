'use client';

import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { useController, type Control, type FieldValues, type Path } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import type { AxisLimit } from '@/lib/robot';
import { cn } from '@/lib/utils';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

type AxisControlProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  hint?: string;
  limit: AxisLimit;
  /** Live value from telemetry, drawn as a marker under the slider. */
  actual?: number;
};

/**
 * One axis: a slider for coarse motion, a number input for exact values, and
 * jog buttons for nudging. The slider and the input are two views of the same
 * form field; the input keeps its own string state so a half-typed value like
 * "-" or "1." does not get clobbered mid-keystroke.
 */
export function AxisControl<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  limit,
  actual,
}: AxisControlProps<T>) {
  const { field, fieldState } = useController({ control, name });
  const value = (field.value ?? 0) as number;
  const [draft, setDraft] = useState(String(value));
  const [lastValue, setLastValue] = useState(value);

  // Re-sync the text box when the value changes from somewhere else (slider,
  // jog, a form reset), but leave it alone while the user is mid-edit with a
  // number that already agrees. This is React's "adjust state during render"
  // pattern rather than an effect, so there is no extra render pass.
  if (lastValue !== value) {
    setLastValue(value);
    if (Number.parseFloat(draft) !== value) setDraft(String(value));
  }

  const commit = (next: number) => {
    if (Number.isNaN(next)) return;
    field.onChange(clamp(next, limit.min, limit.max));
  };

  const actualPct =
    actual === undefined
      ? null
      : ((clamp(actual, limit.min, limit.max) - limit.min) /
          (limit.max - limit.min)) *
        100;

  return (
    <Field data-invalid={!!fieldState.error}>
      <div className="flex items-center justify-between gap-2">
        <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
        <span className="text-muted-foreground text-xs tabular-nums">
          {limit.min} … {limit.max}
          {limit.unit}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8 shrink-0"
          aria-label={`Decrease ${label}`}
          disabled={value <= limit.min}
          onClick={() => commit(value - limit.step)}
        >
          <Minus className="size-3.5" />
        </Button>

        <Input
          id={field.name}
          inputMode="decimal"
          className="h-8 w-20 text-center tabular-nums"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            const parsed = Number.parseFloat(e.target.value);
            if (!Number.isNaN(parsed)) field.onChange(parsed);
          }}
          onBlur={() => {
            const parsed = Number.parseFloat(draft);
            if (Number.isNaN(parsed)) {
              setDraft(String(value));
            } else {
              commit(parsed);
              setDraft(String(clamp(parsed, limit.min, limit.max)));
            }
            field.onBlur();
          }}
        />

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8 shrink-0"
          aria-label={`Increase ${label}`}
          disabled={value >= limit.max}
          onClick={() => commit(value + limit.step)}
        >
          <Plus className="size-3.5" />
        </Button>

        <div className="relative flex-1">
          <Slider
            value={[clamp(value, limit.min, limit.max)]}
            min={limit.min}
            max={limit.max}
            step={limit.step}
            onValueChange={([v]) => field.onChange(v)}
            aria-label={`${label} slider`}
          />
          {actualPct !== null ? (
            <span
              className={cn(
                'bg-foreground/60 pointer-events-none absolute -bottom-1 h-1.5 w-0.5 -translate-x-1/2 rounded-full',
              )}
              style={{ left: `${actualPct}%` }}
              title={`Actual: ${actual}${limit.unit}`}
              aria-hidden
            />
          ) : null}
        </div>
      </div>

      {hint ? <FieldDescription>{hint}</FieldDescription> : null}
      {fieldState.error?.message ? (
        <FieldError>{fieldState.error.message}</FieldError>
      ) : null}
    </Field>
  );
}
