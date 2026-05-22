import { ColorField } from '../../../primitives/ColorField';
import { SliderField } from '../../../primitives/SliderField';
import type { NodeStyleFormValue } from '../types';

export interface BackgroundSectionProps {
  value: NodeStyleFormValue;
  onChange: (next: NodeStyleFormValue) => void;
}

export function BackgroundSection({ value, onChange }: BackgroundSectionProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <ColorField
        label="Fill color"
        value={value.bgFill}
        onChange={(bgFill) => onChange({ ...value, bgFill })}
        description="Solid color. Use the engine API directly for stacked / image / glyph fills."
      />
      <SliderField
        label="Fill alpha"
        value={value.bgAlpha}
        min={0}
        max={1}
        step={0.01}
        defaultValue={1}
        onChange={(bgAlpha) => onChange({ ...value, bgAlpha })}
      />
    </div>
  );
}
