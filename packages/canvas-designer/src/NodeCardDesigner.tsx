import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react';
import { FormField } from '@invana/forms';
import { Button } from '@invana/ui';
import { FormProvider, useForm, type Control, type FieldValues } from 'react-hook-form';
import type { CardElement, FreeformStructure } from '@invana/graph';

import { CardElementView } from './CardElementView';
import { CARD_FIELDS, elementFields, NO_BIND } from './fields';
import {
  applyFormToCard,
  applyFormToElement,
  cardToForm,
  elementLabel,
  elementToForm,
  newElement,
  parseTemplate,
  previewColor,
  templateToJson,
} from './mapping';
import { useHistory } from './useHistory';
import type { CardFormState, ElementFormState, ElementType } from './types';

export interface NodeCardDesignerProps {
  /** Initial template, loaded once on mount. Remount (via `key`) to reload. */
  defaults?: FreeformStructure;
  /** Data fields the host offers for binding (slot → data path), e.g. the KG schema. */
  dataFields?: { key: string; label: string }[];
  /** Active role → hex palette, so the design canvas previews themed colours. */
  palette?: Record<string, number>;
  /** Live callback — fired on every edit with the current template. */
  onChange?: (template: FreeformStructure) => void;
  /** Called with the produced template on Apply. */
  onSubmit?: (template: FreeformStructure) => void;
  /** Apply button label. Default `'Apply template'`. */
  submitLabel?: string;
}

const EMPTY_TEMPLATE: FreeformStructure = {
  name: 'card',
  kind: 'freeform',
  width: 240,
  height: 140,
  cornerRadius: 12,
  bgRole: 'cardBg',
  elements: [],
};

const PALETTE_ITEMS: { type: ElementType; label: string }[] = [
  { type: 'text', label: 'Text' },
  { type: 'rect', label: 'Rect' },
  { type: 'circle', label: 'Circle' },
  { type: 'line', label: 'Line' },
  { type: 'image', label: 'Image' },
];

/**
 * Full-featured visual **node card designer** — a free-form WYSIWYG builder that
 * produces a `FreeformStructure` (the self-contained card template the engine
 * renders via its `composite` shape). Drop elements, drag to position, bind text
 * to data fields, style by colour role; reorder + show/hide via the **layers**
 * panel; **undo/redo** and **save/load** from the toolbar. Engine-agnostic —
 * emits JSON via `onChange` / `onSubmit`.
 */
export function NodeCardDesigner({
  defaults,
  dataFields = [],
  palette = {},
  onChange,
  onSubmit,
  submitLabel = 'Apply template',
}: NodeCardDesignerProps) {
  const history = useHistory<FreeformStructure>(defaults ?? EMPTY_TEMPLATE);
  const tpl = history.state;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const idSeq = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const preDrag = useRef<FreeformStructure | null>(null);

  // Emit on every change.
  useEffect(() => {
    onChange?.(tpl);
  }, [tpl, onChange]);

  const selected = tpl.elements.find((e) => e.id === selectedId) ?? null;

  // ── Mutations (routed through history) ──────────────────────────────────
  const addElement = (type: ElementType) => {
    const id = `el-${type}-${(idSeq.current += 1)}`;
    history.commit({ ...tpl, elements: [...tpl.elements, newElement(type, id)] });
    setSelectedId(id);
  };
  const updateElement = useCallback(
    (id: string, next: CardElement) => {
      history.commit(
        { ...history.state, elements: history.state.elements.map((e) => (e.id === id ? next : e)) },
        `prop:${id}`,
      );
    },
    [history],
  );
  const removeElement = (id: string) => {
    history.commit({ ...tpl, elements: tpl.elements.filter((e) => e.id !== id) });
    if (selectedId === id) setSelectedId(null);
  };
  const toggleHidden = (id: string) => {
    history.commit({
      ...tpl,
      elements: tpl.elements.map((e) => (e.id === id ? { ...e, hidden: !e.hidden } : e)),
    });
  };
  const moveZ = (id: string, dir: 1 | -1) => {
    const els = [...tpl.elements];
    const i = els.indexOf(els.find((e) => e.id === id)!);
    const j = i + dir;
    if (j < 0 || j >= els.length) return;
    [els[i], els[j]] = [els[j]!, els[i]!];
    history.commit({ ...tpl, elements: els });
  };
  const updateCard = useCallback(
    (v: CardFormState) => history.commit(applyFormToCard(history.state, v), 'card'),
    [history],
  );

  // Drag: transient `set` per move, one undo entry per gesture.
  const onMoveStart = () => {
    preDrag.current = history.state;
  };
  const onMove = (id: string, x: number, y: number) => {
    history.set({ ...history.state, elements: history.state.elements.map((e) => (e.id === id ? { ...e, x, y } : e)) });
  };
  const onMoveEnd = () => {
    if (preDrag.current) history.record(preDrag.current);
    preDrag.current = null;
  };

  // ── Save / load / new ────────────────────────────────────────────────────
  const onSave = () => download(`${tpl.name || 'card'}.json`, templateToJson(tpl));
  const onLoadFile = async (file: File) => {
    const parsed = parseTemplate(await file.text());
    if (parsed) {
      history.reset(parsed);
      setSelectedId(null);
    }
  };
  const onNew = () => {
    history.reset(EMPTY_TEMPLATE);
    setSelectedId(null);
  };

  // Keyboard: ⌘/Ctrl+Z undo, ⌘/Ctrl+Shift+Z (or Ctrl+Y) redo.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === 'z') {
        e.preventDefault();
        if (e.shiftKey) history.redo();
        else history.undo();
      } else if (k === 'y') {
        e.preventDefault();
        history.redo();
      }
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [history]);

  return (
    <div ref={rootRef} tabIndex={-1} style={{ outline: 'none' }}>
      {/* Toolbar */}
      <div style={toolbarStyle}>
        <Button type="button" variant="ghost" onClick={onNew}>New</Button>
        <Button type="button" variant="ghost" onClick={() => fileInput.current?.click()}>Load</Button>
        <Button type="button" variant="ghost" onClick={onSave}>Save</Button>
        <span style={dividerStyle} />
        <Button type="button" variant="ghost" disabled={!history.canUndo} onClick={history.undo}>Undo</Button>
        <Button type="button" variant="ghost" disabled={!history.canRedo} onClick={history.redo}>Redo</Button>
        <span style={{ flex: 1 }} />
        {onSubmit ? <Button onClick={() => onSubmit(tpl)}>{submitLabel}</Button> : null}
        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onLoadFile(f);
            e.target.value = '';
          }}
        />
      </div>

      <div style={shellStyle}>
        {/* Layers + palette */}
        <div style={layersStyle}>
          <span style={sectionLabel}>Add element</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {PALETTE_ITEMS.map((it) => (
              <Button key={it.type} type="button" variant="outline" onClick={() => addElement(it.type)}>
                {it.label}
              </Button>
            ))}
          </div>
          <span style={{ ...sectionLabel, marginTop: 8 }}>Layers (top = front)</span>
          {/* Dense layer affordances (eye / z-order / delete) + the hidden file
              input are bespoke designer-tool controls, intentionally native for
              compactness — the form/chrome rule covers the editors, not this
              canvas tool. Everything user-facing else uses @invana/ui Button. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[...tpl.elements].reverse().map((el) => (
              <div
                key={el.id}
                style={layerRowStyle(el.id === selectedId)}
                onClick={() => setSelectedId(el.id)}
              >
                <button
                  type="button"
                  title={el.hidden ? 'Show' : 'Hide'}
                  style={iconBtnStyle}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleHidden(el.id);
                  }}
                >
                  {el.hidden ? '○' : '◉'}
                </button>
                <span style={layerLabelStyle(!!el.hidden)}>{elementLabel(el)}</span>
                <button type="button" title="Forward" style={iconBtnStyle} onClick={(e) => { e.stopPropagation(); moveZ(el.id, 1); }}>↑</button>
                <button type="button" title="Backward" style={iconBtnStyle} onClick={(e) => { e.stopPropagation(); moveZ(el.id, -1); }}>↓</button>
                <button type="button" title="Delete" style={iconBtnStyle} onClick={(e) => { e.stopPropagation(); removeElement(el.id); }}>✕</button>
              </div>
            ))}
            {tpl.elements.length === 0 ? (
              <span style={{ fontSize: 11, opacity: 0.6 }}>No elements yet — add one above.</span>
            ) : null}
          </div>
        </div>

        {/* Design canvas */}
        <div style={canvasWrapStyle} onPointerDown={() => setSelectedId(null)}>
          <DesignCanvas
            tpl={tpl}
            palette={palette}
            dataFields={dataFields}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMoveStart={onMoveStart}
            onMove={onMove}
            onMoveEnd={onMoveEnd}
          />
        </div>

        {/* Properties */}
        <div style={propsStyle}>
          <span style={sectionLabel}>Card</span>
          {/* Keyed on history.version so undo/redo/load re-seed the form, but
              live typing (which doesn't bump version) keeps the cursor. */}
          <CardPropsForm key={`card-${history.version}`} tpl={tpl} onChange={updateCard} />

          <span style={{ ...sectionLabel, marginTop: 12 }}>
            {selected ? `Element · ${selected.type}` : 'Element'}
          </span>
          {selected ? (
            <ElementPropsForm
              key={`${selected.id}-${history.version}`}
              element={selected}
              dataFields={dataFields}
              onChange={(next) => updateElement(selected.id, next)}
            />
          ) : (
            <p style={{ fontSize: 12, opacity: 0.6, margin: '4px 0' }}>Select an element to edit it.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Design canvas ───────────────────────────────────────────────────────────

function DesignCanvas({
  tpl,
  palette,
  dataFields,
  selectedId,
  onSelect,
  onMoveStart,
  onMove,
  onMoveEnd,
}: {
  tpl: FreeformStructure;
  palette: Record<string, number>;
  dataFields: { key: string; label: string }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMoveStart: () => void;
  onMove: (id: string, x: number, y: number) => void;
  onMoveEnd: () => void;
}) {
  const drag = useRef<{ id: string; ox: number; oy: number; ex: number; ey: number } | null>(null);

  const onPointerDownEl = (e: PointerEvent, el: CardElement) => {
    e.stopPropagation();
    onSelect(el.id);
    drag.current = { id: el.id, ox: e.clientX, oy: e.clientY, ex: el.x, ey: el.y };
    onMoveStart();
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const x = Math.round(Math.max(0, Math.min(tpl.width, d.ex + (e.clientX - d.ox))));
    const y = Math.round(Math.max(0, Math.min(tpl.height, d.ey + (e.clientY - d.oy))));
    onMove(d.id, x, y);
  };
  const onPointerUp = () => {
    if (drag.current) onMoveEnd();
    drag.current = null;
  };

  const labelFor = (key?: string): string => dataFields.find((f) => f.key === key)?.label ?? key ?? '';

  return (
    <div
      style={{
        position: 'relative',
        width: tpl.width,
        height: tpl.height,
        borderRadius: tpl.cornerRadius ?? 10,
        background: previewColor(tpl.bgRole, tpl.bg, palette, 0xffffff),
        boxShadow: '0 1px 6px rgba(0,0,0,0.15)',
        overflow: 'hidden',
        touchAction: 'none',
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {tpl.elements.map((el) =>
        el.hidden ? null : (
          <CardElementView
            key={el.id}
            el={el}
            palette={palette}
            selected={el.id === selectedId}
            text={el.type === 'text' ? (el.bind ? `{${labelFor(el.bind)}}` : (el.text ?? '')) : ''}
            onPointerDown={(e) => onPointerDownEl(e, el)}
          />
        ),
      )}
    </div>
  );
}

// ─── Property forms (schema-driven via @invana/forms) ────────────────────────

function CardPropsForm({ tpl, onChange }: { tpl: FreeformStructure; onChange: (v: CardFormState) => void }) {
  const form = useForm<{ card: CardFormState }>({ defaultValues: { card: cardToForm(tpl) } });
  const { control, watch } = form;
  useEffect(() => {
    const sub = watch((values) => values.card && onChange(values.card as CardFormState));
    return () => sub.unsubscribe();
  }, [watch, onChange]);
  const c = control as unknown as Control<FieldValues>;
  return (
    <FormProvider {...form}>
      <FormField.ObjectField control={c} name="card" fields={CARD_FIELDS} />
    </FormProvider>
  );
}

function ElementPropsForm({
  element,
  dataFields,
  onChange,
}: {
  element: CardElement;
  dataFields: { key: string; label: string }[];
  onChange: (next: CardElement) => void;
}) {
  const form = useForm<{ el: ElementFormState }>({ defaultValues: { el: elementToForm(element) } });
  const { control, watch } = form;
  useEffect(() => {
    const sub = watch((values) => values.el && onChange(applyFormToElement(element, values.el as ElementFormState)));
    return () => sub.unsubscribe();
    // `element` identity is stable for the form's lifetime (keyed on id by parent).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch, onChange]);
  const c = control as unknown as Control<FieldValues>;
  return (
    <FormProvider {...form}>
      <FormField.ObjectField control={c} name="el" fields={elementFields(element.type, dataFields)} />
    </FormProvider>
  );
}

// ─── Small utils ─────────────────────────────────────────────────────────────

function download(filename: string, text: string): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Re-export so a host can detect the static-bind sentinel if needed.
export { NO_BIND };

// ─── Layout ──────────────────────────────────────────────────────────────────

const toolbarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '6px 12px',
  borderBottom: '1px solid var(--border, #e4e4e7)',
};
const dividerStyle: CSSProperties = { width: 1, height: 20, background: 'var(--border, #e4e4e7)', margin: '0 4px' };
// Responsive: the three panels sit side-by-side when there's room and wrap
// (canvas, then properties) onto new rows when the container is narrow — so the
// Properties panel is never pushed off-screen.
const shellStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  alignItems: 'flex-start',
  padding: 12,
};
const layersStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  width: 200,
  flexShrink: 0,
};
const canvasWrapStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: '2 1 340px',
  minWidth: 0,
  minHeight: 260,
  padding: 24,
  background: 'var(--muted, #f4f4f5)',
  borderRadius: 8,
  overflow: 'auto',
};
const propsStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  flex: '1 1 280px',
  minWidth: 260,
};
const sectionLabel: CSSProperties = { fontSize: 13, fontWeight: 600 };
const layerRowStyle = (on: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  padding: '2px 4px',
  borderRadius: 5,
  cursor: 'pointer',
  background: on ? 'rgba(59,130,246,0.12)' : 'transparent',
  border: `1px solid ${on ? 'var(--primary, #3b82f6)' : 'transparent'}`,
});
const layerLabelStyle = (hidden: boolean): CSSProperties => ({
  flex: 1,
  fontSize: 11,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  opacity: hidden ? 0.4 : 1,
});
const iconBtnStyle: CSSProperties = {
  width: 20,
  height: 20,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: 12,
  color: 'inherit',
  padding: 0,
  borderRadius: 4,
};
