import { useId } from 'react';
import {
  Field,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@invana/ui';
import type { NodeStyle } from '@invana/graph';

import { ColorField } from '../../../primitives/ColorField';
import { NumberField } from '../../../primitives/NumberField';
import type { NodeStyleFormValue } from '../types';

type Placement = NonNullable<NodeStyle['labelPlacement']>;

const PLACEMENT_OPTIONS: readonly { value: Placement; label: string }[] = [
  { value: 'center', label: 'Center (anchor)' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'top-left', label: 'Top-left' },
  { value: 'top-right', label: 'Top-right' },
  { value: 'bottom-left', label: 'Bottom-left' },
  { value: 'bottom-right', label: 'Bottom-right' },
  { value: 'inside-center', label: 'Inside center (contained)' },
  { value: 'inside-top', label: 'Inside top' },
  { value: 'inside-bottom', label: 'Inside bottom' },
  { value: 'inside-left', label: 'Inside left' },
  { value: 'inside-right', label: 'Inside right' },
];

export interface LabelSectionProps {
  value: NodeStyleFormValue;
  onChange: (next: NodeStyleFormValue) => void;
}

export function LabelSection({ value, onChange }: LabelSectionProps) {
  const textId = useId();
  const placementId = useId();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Field>
        <Label htmlFor={textId}>Text</Label>
        <Input
          id={textId}
          type="text"
          value={value.labelText ?? ''}
          placeholder="(uses node id / data field)"
          onChange={(e) => onChange({ ...value, labelText: e.target.value })}
        />
      </Field>

      <ColorField
        label="Color"
        value={value.labelColor}
        onChange={(labelColor) => onChange({ ...value, labelColor })}
      />
      <NumberField
        label="Font size"
        value={value.labelFontSize}
        min={1}
        step={1}
        onChange={(labelFontSize) => onChange({ ...value, labelFontSize })}
      />
      <NumberField
        label="Font weight"
        value={value.labelFontWeight}
        min={100}
        max={900}
        step={100}
        placeholder="400"
        onChange={(labelFontWeight) => onChange({ ...value, labelFontWeight })}
      />

      <Field>
        <Label htmlFor={placementId}>Placement</Label>
        <Select
          value={value.labelPlacement}
          onValueChange={(v) => onChange({ ...value, labelPlacement: v as Placement })}
        >
          <SelectTrigger id={placementId}>
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {PLACEMENT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span style={{ fontSize: 12, opacity: 0.7 }}>
          <code>inside-*</code> placements clip / truncate to fit the shape.
        </span>
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <NumberField
          label="Offset X"
          value={value.labelOffsetX}
          step={1}
          onChange={(labelOffsetX) => onChange({ ...value, labelOffsetX })}
        />
        <NumberField
          label="Offset Y"
          value={value.labelOffsetY}
          step={1}
          onChange={(labelOffsetY) => onChange({ ...value, labelOffsetY })}
        />
      </div>
    </div>
  );
}
