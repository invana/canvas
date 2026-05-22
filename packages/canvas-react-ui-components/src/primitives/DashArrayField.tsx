import { Field, Label } from '@invana/ui';

import { NumberField } from './NumberField';

export interface DashArrayFieldProps {
  label: string;
  value: readonly [number, number] | undefined;
  onChange: (next: readonly [number, number] | undefined) => void;
  description?: string;
}

/**
 * Two-input editor for `[dash, gap]` stroke patterns. Clearing both inputs
 * emits `undefined` (i.e. solid stroke).
 */
export function DashArrayField({ label, value, onChange, description }: DashArrayFieldProps) {
  const dash = value?.[0];
  const gap = value?.[1];

  const commit = (next: [number | undefined, number | undefined]) => {
    if (next[0] === undefined && next[1] === undefined) {
      onChange(undefined);
      return;
    }
    onChange([next[0] ?? 0, next[1] ?? 0] as const);
  };

  return (
    <Field>
      <Label>{label}</Label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <NumberField
          label="dash"
          value={dash}
          min={0}
          step={1}
          onChange={(next) => commit([next, gap])}
        />
        <NumberField
          label="gap"
          value={gap}
          min={0}
          step={1}
          onChange={(next) => commit([dash, next])}
        />
      </div>
      {description ? <span style={{ fontSize: 12, opacity: 0.7 }}>{description}</span> : null}
    </Field>
  );
}
