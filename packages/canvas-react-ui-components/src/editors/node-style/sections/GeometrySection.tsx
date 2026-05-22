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

import { NumberField } from '../../../primitives/NumberField';
import type { NodeStyleFormValue } from '../types';

type ShapeKind = NonNullable<NodeStyle['shape']>['kind'];

const SHAPE_OPTIONS: readonly { value: ShapeKind; label: string }[] = [
  { value: 'circle', label: 'Circle' },
  { value: 'rect', label: 'Rectangle' },
  { value: 'regular-polygon', label: 'Regular polygon' },
  { value: 'star', label: 'Star' },
];

export interface GeometrySectionProps {
  value: NodeStyleFormValue;
  onChange: (next: NodeStyleFormValue) => void;
}

/**
 * Geometry tab — picks the shape kind and the unified `size`.
 *
 * Shape kind switches construct a fresh shape spec with sane defaults; the
 * `size` field overrides the kind-specific size axis at style-resolution
 * time (see NodeStyle.size TSDoc), so we don't push it into the shape spec.
 */
export function GeometrySection({ value, onChange }: GeometrySectionProps) {
  const shapeId = useId();
  const currentKind = value.shape?.kind;

  const handleKindChange = (next: string) => {
    onChange({ ...value, shape: defaultShapeFor(next as ShapeKind) });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Field>
        <Label htmlFor={shapeId}>Shape</Label>
        <Select value={currentKind} onValueChange={handleKindChange}>
          <SelectTrigger id={shapeId}>
            <SelectValue placeholder="Select shape" />
          </SelectTrigger>
          <SelectContent>
            {SHAPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <NumberField
        label="Size"
        value={value.size}
        min={0}
        step={1}
        description="Unified radius / half-extent. Overrides the shape's native size axis."
        onChange={(size) => onChange({ ...value, size })}
      />
    </div>
  );
}

function defaultShapeFor(kind: ShapeKind): NodeStyle['shape'] {
  switch (kind) {
    case 'circle':
      return { kind: 'circle', radius: 12 };
    case 'rect':
      return { kind: 'rect', width: 24, height: 24 };
    case 'regular-polygon':
      return { kind: 'regular-polygon', sides: 6, radius: 12 };
    case 'star':
      return { kind: 'star', points: 5, innerRadius: 6, outerRadius: 12 };
    default:
      return { kind: 'circle', radius: 12 };
  }
}
