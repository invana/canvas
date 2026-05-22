import { useId } from 'react';
import { Field, Label, Slider } from '@invana/ui';

export interface SliderFieldProps {
  label: string;
  value: number | undefined;
  onChange: (next: number) => void;
  min: number;
  max: number;
  step?: number;
  /** Number of decimals to show in the inline value readout. Default 2. */
  precision?: number;
  description?: string;
  /** Default value used when `value` is undefined. */
  defaultValue?: number;
}

export function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.01,
  precision = 2,
  description,
  defaultValue,
}: SliderFieldProps) {
  const id = useId();
  const effective = value ?? defaultValue ?? min;
  return (
    <Field>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <Label htmlFor={id}>{label}</Label>
        <span style={{ fontSize: 12, opacity: 0.7, fontVariantNumeric: 'tabular-nums' }}>
          {effective.toFixed(precision)}
        </span>
      </div>
      <Slider
        id={id}
        value={[effective]}
        min={min}
        max={max}
        step={step}
        onValueChange={(values: number[]) => {
          if (values[0] !== undefined) onChange(values[0]);
        }}
      />
      {description ? <span style={{ fontSize: 12, opacity: 0.7 }}>{description}</span> : null}
    </Field>
  );
}
