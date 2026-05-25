/**
 * `<NodeStyleEditor>` from `@invana/canvas-react-ui-components` — a
 * self-contained style form whose fields are generated from `@invana/forms`
 * `FieldConfig` schemas (the design-kit form-generator).
 *
 * It takes `defaults` + `fields`, owns the form, and on **Apply** calls
 * `onSubmit(values)`. It knows nothing about `Canvas`, engine, or layers — it
 * just edits a value in the shape you give it. This story is fully standalone:
 * seed the editor from a plain style (`styleToForm`), and on submit map the
 * values back (`formToStyle`) into the preview. No engine anywhere.
 *
 * The Geometry section shows the discriminated-union pattern: changing the
 * shape select swaps in that kind's geometry fields (radius vs width/height vs
 * sides…).
 */

import { useState, type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { NodeStyle } from '@invana/graph';
import {
  NodeStyleEditor,
  formToStyle,
  numberToHex,
  styleToForm,
  type NodeStyleFields,
} from '@invana/canvas-react-ui-components';

const meta: Meta = { title: 'canvas-react-ui-components/NodeStyleEditor' };
export default meta;
type Story = StoryObj;

/** A plain starting style — the editor edits this. No engine, no layers. */
const SAMPLE_STYLE: Partial<NodeStyle> = {
  shape: { kind: 'circle', radius: 28 },
  bgFill: 0x3b82f6,
  bgAlpha: 1,
  bgStrokeColor: 0x1e3a8a,
  bgStrokeWidth: 3,
  labelText: 'Node',
  labelColor: 0xffffff,
  labelFontSize: 14,
  labelPlacement: 'center',
};

function StandaloneDemo() {
  // The consumer decides what "submit" does — here, just store it for preview.
  // In a real app this is where you'd update a node, many nodes, an undo stack…
  const [applied, setApplied] = useState<Partial<NodeStyle>>(SAMPLE_STYLE);

  return (
    <div style={pageStyle}>
      <div style={editorColStyle}>
        <NodeStyleEditor
          defaults={styleToForm(SAMPLE_STYLE)}
          onSubmit={(values: NodeStyleFields) => setApplied(formToStyle(values))}
        />
      </div>
      <Preview style={applied} />
    </div>
  );
}

/** Renders the last-submitted style — proof the editor yields a usable style
 * with no engine attached. */
function Preview({ style }: { style: Partial<NodeStyle> }) {
  const bg = typeof style.bgFill === 'number' ? numberToHex(style.bgFill) : 'transparent';
  const stroke =
    typeof style.bgStrokeColor === 'number' ? numberToHex(style.bgStrokeColor) : 'transparent';
  const labelColor =
    typeof style.labelColor === 'number' ? numberToHex(style.labelColor) : '#111';
  const isCircle = style.shape?.kind === 'circle';

  return (
    <div style={previewColStyle}>
      <div style={{ fontWeight: 600, fontSize: 14 }}>Applied style (updates on Apply)</div>

      <div style={swatchHostStyle}>
        <div
          style={{
            width: 88,
            height: 88,
            background: bg,
            opacity: style.bgAlpha ?? 1,
            borderRadius: isCircle ? '50%' : 10,
            border: `${style.bgStrokeWidth ?? 0}px solid ${stroke}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: labelColor,
            fontSize: style.labelFontSize ?? 14,
          }}
        >
          {style.labelText}
        </div>
      </div>

      <div style={{ fontWeight: 600, fontSize: 13, marginTop: 8 }}>
        onSubmit value → Partial&lt;NodeStyle&gt;
      </div>
      <pre style={preStyle}>{JSON.stringify(style, null, 2)}</pre>
    </div>
  );
}

export const Standalone: Story = {
  render: () => <StandaloneDemo />,
};

// ─── Layout ──────────────────────────────────────────────────────────────

const pageStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '360px 1fr',
  gap: 16,
  height: '100vh',
  padding: 16,
  boxSizing: 'border-box',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  background: 'var(--background, #fff)',
  color: 'var(--foreground, #111)',
};

const editorColStyle: CSSProperties = {
  border: '1px solid var(--border, #e4e4e7)',
  borderRadius: 8,
  overflow: 'auto',
};

const previewColStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  minWidth: 0,
  overflow: 'auto',
};

const swatchHostStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 160,
  border: '1px dashed var(--border, #e4e4e7)',
  borderRadius: 8,
};

const preStyle: CSSProperties = {
  margin: 0,
  padding: 12,
  fontSize: 12,
  lineHeight: 1.5,
  background: 'var(--muted, #f4f4f5)',
  borderRadius: 8,
  overflow: 'auto',
};
