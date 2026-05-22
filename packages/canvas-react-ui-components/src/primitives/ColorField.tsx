import { useId } from 'react';
import { Field, Label } from '@invana/ui';

import { hexToNumber, numberToHex } from './color';

export interface ColorFieldProps {
  label: string;
  /** RGB number, `0xRRGGBB`. Undefined renders as black. */
  value: number | undefined;
  onChange: (next: number) => void;
  description?: string;
}

/**
 * Color input bound to a 24-bit RGB number. Placeholder shim around the
 * native `<input type="color">` until `@invana/design-kit` ships a real
 * ColorPicker — the surface (`value: number`, `onChange: (n) => void`)
 * stays stable across that swap.
 */
export function ColorField({ label, value, onChange, description }: ColorFieldProps) {
  const id = useId();
  return (
    <Field>
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        type="color"
        value={numberToHex(value)}
        onChange={(e) => onChange(hexToNumber(e.target.value))}
        style={{
          width: '100%',
          height: 32,
          padding: 0,
          border: '1px solid var(--border, #d4d4d8)',
          borderRadius: 6,
          background: 'transparent',
          cursor: 'pointer',
        }}
      />
      {description ? <span style={{ fontSize: 12, opacity: 0.7 }}>{description}</span> : null}
    </Field>
  );
}
