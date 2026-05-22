import { useId } from 'react';
import { Field, Input, Label } from '@invana/ui';

export interface NumberFieldProps {
  label: string;
  value: number | undefined;
  onChange: (next: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  description?: string;
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
  description,
}: NumberFieldProps) {
  const id = useId();
  return (
    <Field>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        value={value ?? ''}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') {
            onChange(undefined);
            return;
          }
          const parsed = Number.parseFloat(raw);
          onChange(Number.isNaN(parsed) ? undefined : parsed);
        }}
      />
      {description ? <span style={{ fontSize: 12, opacity: 0.7 }}>{description}</span> : null}
    </Field>
  );
}
