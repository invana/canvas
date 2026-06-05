import { useState, type ChangeEvent, type CSSProperties } from 'react';
import { Button } from '@invana/ui';

/** The values a {@link PropertiesEditor} edits: a label + a flat string→string data map. */
export interface PropertiesEditorValues {
  /** The element's label text. */
  label: string;
  /** The element's free-form type tag (maps to `node.type` / `edge.type`). Only edited when `showType`. */
  type?: string;
  /** Arbitrary key/value metadata (maps to `node.data` / `edge.data`). */
  data: Record<string, string>;
}

/** One editable key/value row. Kept as an array (not a map) so blank/duplicate keys are editable mid-typing. */
interface Row {
  k: string;
  v: string;
}

export interface PropertiesEditorProps {
  /** Heading shown above the form, e.g. `'Node'` / `'Edge'`. */
  title?: string;
  /**
   * Initial values, loaded into local state **once** on mount (same as
   * `NodeStyleEditor`). To reload for a different element, remount via `key`.
   */
  defaults?: Partial<PropertiesEditorValues>;
  /** Called with the edited values when the user clicks Apply. */
  onSubmit: (values: PropertiesEditorValues) => void;
  /** Submit button label. Default `'Apply'`. */
  submitLabel?: string;
  /** Show the label field. Default `true`. */
  showLabel?: boolean;
  /** Show an editable `type` field above the properties list. Default `false`. */
  showType?: boolean;
  /**
   * When provided, render a "Reverse direction" button in the footer that
   * invokes this callback immediately (i.e. not on Apply). Used for edges to
   * swap source/target. Omit for elements that have no direction.
   */
  onReverse?: () => void;
  className?: string;
}

/**
 * Dumb, engine-agnostic editor for an element's **label + key/value
 * properties** — the canvas counterpart of `@invana/canvas-ui`'s
 * `NodeStyleEditor`, but for arbitrary `data` rather than visual style (which
 * `@invana/forms`' fixed field types can't express as a dynamic list).
 *
 * Props in / `onSubmit` out: it owns the row state, lets the user add / remove /
 * rename fields, and on Apply emits `{ label, data }`. It holds **no** engine /
 * layer / commit logic — the consumer (see {@link InspectorPanel}) wires
 * `onSubmit` to the store. Blank-keyed rows are dropped on submit; on duplicate
 * keys the last row wins.
 *
 * The text fields are styled native `<input>`s: the `@invana/ui` build this
 * package resolves doesn't export a plain `Input`, and the dynamic key/value
 * list isn't expressible via the `@invana/forms` schema generator. `Button`
 * still comes from `@invana/ui` (no raw `<button>`).
 */
export function PropertiesEditor({
  title,
  defaults,
  onSubmit,
  submitLabel = 'Apply',
  showLabel = true,
  showType = false,
  onReverse,
  className,
}: PropertiesEditorProps) {
  const [label, setLabel] = useState(defaults?.label ?? '');
  const [type, setType] = useState(defaults?.type ?? '');
  const [rows, setRows] = useState<Row[]>(() =>
    Object.entries(defaults?.data ?? {}).map(([k, v]) => ({ k, v })),
  );

  const setRow = (i: number, patch: Partial<Row>): void =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const removeRow = (i: number): void => setRows((rs) => rs.filter((_, j) => j !== i));
  const addRow = (): void => setRows((rs) => [...rs, { k: '', v: '' }]);

  const apply = (): void => {
    const data: Record<string, string> = {};
    for (const { k, v } of rows) {
      const key = k.trim();
      if (key) data[key] = v;
    }
    onSubmit(showType ? { label, type, data } : { label, data });
  };

  return (
    <div className={className} style={cardStyle}>
      {title && <div style={titleStyle}>{title}</div>}

      {showLabel && (
        <label style={fieldStyle}>
          <span style={captionStyle}>Label</span>
          <input
            style={inputStyle}
            value={label}
            placeholder="Label text"
            onChange={(e: ChangeEvent<HTMLInputElement>) => setLabel(e.target.value)}
          />
        </label>
      )}

      {showType && (
        <label style={fieldStyle}>
          <span style={captionStyle}>Type</span>
          <input
            style={inputStyle}
            value={type}
            placeholder="Type tag"
            onChange={(e: ChangeEvent<HTMLInputElement>) => setType(e.target.value)}
          />
        </label>
      )}

      <div style={fieldStyle}>
        <span style={captionStyle}>Properties</span>
        {rows.length === 0 && <span style={emptyStyle}>No properties yet.</span>}
        {rows.map((row, i) => (
          <div key={i} style={rowStyle}>
            <input
              style={inputStyle}
              value={row.k}
              placeholder="key"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setRow(i, { k: e.target.value })}
            />
            <input
              style={inputStyle}
              value={row.v}
              placeholder="value"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setRow(i, { v: e.target.value })}
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Remove field"
              onClick={() => removeRow(i)}
            >
              ✕
            </Button>
          </div>
        ))}
        <div>
          <Button variant="outline" size="sm" onClick={addRow}>
            Add field
          </Button>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: onReverse ? 'space-between' : 'flex-end',
          alignItems: 'center',
        }}
      >
        {onReverse && (
          <Button variant="outline" size="sm" onClick={onReverse}>
            Reverse direction
          </Button>
        )}
        <Button onClick={apply}>{submitLabel}</Button>
      </div>
    </div>
  );
}

const cardStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: 12,
  minWidth: 240,
  background: 'var(--color-popover)',
  color: 'var(--color-popover-foreground)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
};
const titleStyle: CSSProperties = { fontSize: 13, fontWeight: 600, opacity: 0.85 };
const fieldStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 };
const captionStyle: CSSProperties = { fontSize: 12, fontWeight: 500, opacity: 0.8 };
const rowStyle: CSSProperties = { display: 'flex', gap: 6, alignItems: 'center' };
const emptyStyle: CSSProperties = { fontSize: 12, opacity: 0.6 };
const inputStyle: CSSProperties = {
  flex: 1,
  width: '100%',
  height: 28,
  padding: '0 8px',
  fontSize: 13,
  color: 'var(--color-foreground)',
  background: 'var(--color-background)',
  border: '1px solid var(--color-border)',
  borderRadius: 6,
  outline: 'none',
};
