import { useId } from 'react';
import {
  Field,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@invana/ui';
import type { NodeStyle } from '@invana/graph';

import { ColorField } from '../../../primitives/ColorField';
import { DashArrayField } from '../../../primitives/DashArrayField';
import { NumberField } from '../../../primitives/NumberField';
import { SliderField } from '../../../primitives/SliderField';
import type { NodeStyleFormValue } from '../types';

type Alignment = NonNullable<NodeStyle['bgStrokeAlignment']>;
type Cap = NonNullable<NodeStyle['bgStrokeCap']>;
type Join = NonNullable<NodeStyle['bgStrokeJoin']>;

const ALIGNMENT_OPTIONS: readonly { value: Alignment; label: string }[] = [
  { value: 'inside', label: 'Inside' },
  { value: 'center', label: 'Center' },
  { value: 'outside', label: 'Outside' },
];

const CAP_OPTIONS: readonly { value: Cap; label: string }[] = [
  { value: 'butt', label: 'Butt' },
  { value: 'round', label: 'Round' },
  { value: 'square', label: 'Square' },
];

const JOIN_OPTIONS: readonly { value: Join; label: string }[] = [
  { value: 'miter', label: 'Miter' },
  { value: 'round', label: 'Round' },
  { value: 'bevel', label: 'Bevel' },
];

export interface StrokeSectionProps {
  value: NodeStyleFormValue;
  onChange: (next: NodeStyleFormValue) => void;
}

export function StrokeSection({ value, onChange }: StrokeSectionProps) {
  const alignmentId = useId();
  const capId = useId();
  const joinId = useId();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <ColorField
        label="Stroke color"
        value={value.bgStrokeColor}
        onChange={(bgStrokeColor) => onChange({ ...value, bgStrokeColor })}
      />
      <SliderField
        label="Stroke alpha"
        value={value.bgStrokeAlpha}
        min={0}
        max={1}
        step={0.01}
        defaultValue={1}
        onChange={(bgStrokeAlpha) => onChange({ ...value, bgStrokeAlpha })}
      />
      <NumberField
        label="Stroke width"
        value={value.bgStrokeWidth}
        min={0}
        step={0.5}
        onChange={(bgStrokeWidth) => onChange({ ...value, bgStrokeWidth })}
      />

      <Field>
        <Label htmlFor={alignmentId}>Stroke alignment</Label>
        <Select
          value={value.bgStrokeAlignment}
          onValueChange={(v) => onChange({ ...value, bgStrokeAlignment: v as Alignment })}
        >
          <SelectTrigger id={alignmentId}>
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {ALIGNMENT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <DashArrayField
        label="Dash array"
        value={value.bgStrokeDashArray}
        onChange={(bgStrokeDashArray) => onChange({ ...value, bgStrokeDashArray })}
        description="Leave both blank for a solid stroke."
      />

      <Field>
        <Label htmlFor={capId}>Cap</Label>
        <Select
          value={value.bgStrokeCap}
          onValueChange={(v) => onChange({ ...value, bgStrokeCap: v as Cap })}
        >
          <SelectTrigger id={capId}>
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {CAP_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <Label htmlFor={joinId}>Join</Label>
        <Select
          value={value.bgStrokeJoin}
          onValueChange={(v) => onChange({ ...value, bgStrokeJoin: v as Join })}
        >
          <SelectTrigger id={joinId}>
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {JOIN_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}
