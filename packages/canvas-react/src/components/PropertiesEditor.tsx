import { useState, type ChangeEvent } from 'react';
import { Button, cn } from '@invana/ui';

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
  /** Class on the card — merged over the base card classes via `cn`. */
  className?: string;
}

/** Shared input classes — design-kit tokens, mirroring the `@invana/ui` field look. */
const INPUT_CLASS =
  'h-7 w-full flex-1 rounded-md border border-border bg-background px-2 text-[13px] text-foreground outline-none';

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
    <div
      className={cn(
        'flex min-w-[240px] flex-col gap-3 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg',
        className,
      )}
    >
      {title && <div className="text-[13px] font-semibold">{title}</div>}

      {showLabel && (
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Label</span>
          <input
            className={INPUT_CLASS}
            value={label}
            placeholder="Label text"
            onChange={(e: ChangeEvent<HTMLInputElement>) => setLabel(e.target.value)}
          />
        </label>
      )}

      {showType && (
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Type</span>
          <input
            className={INPUT_CLASS}
            value={type}
            placeholder="Type tag"
            onChange={(e: ChangeEvent<HTMLInputElement>) => setType(e.target.value)}
          />
        </label>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Properties</span>
        {rows.length === 0 && <span className="text-xs text-muted-foreground">No properties yet.</span>}
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input
              className={INPUT_CLASS}
              value={row.k}
              placeholder="key"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setRow(i, { k: e.target.value })}
            />
            <input
              className={INPUT_CLASS}
              value={row.v}
              placeholder="value"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setRow(i, { v: e.target.value })}
            />
            <Button variant="ghost" size="icon" aria-label="Remove field" onClick={() => removeRow(i)}>
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

      <div className={cn('flex items-center', onReverse ? 'justify-between' : 'justify-end')}>
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
