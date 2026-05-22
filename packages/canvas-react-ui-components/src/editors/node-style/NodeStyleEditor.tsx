import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Canvas as EngineCanvas } from '@invana/canvas';
import { CanvasContext } from '@invana/canvas-react';
import type { GraphLayer } from '@invana/graph';
import { Button } from '@invana/ui';

import { NodeStyleForm } from './NodeStyleForm';
import { commitFormToLayer, dirtyKeys, seedFormFromLayer } from './apply';
import type { NodeStyleFormValue, NodeStyleSectionId } from './types';

export interface NodeStyleEditorProps {
  /**
   * Target graph layer id. Default `'graph'` (matches the default in
   * `@invana/canvas-react`'s `<GraphLayer>`).
   */
  layerId?: string;
  /**
   * Explicit canvas instance. Use this when the editor lives **outside**
   * any `<Canvas>` tree — e.g. a centralised inspector that addresses one
   * of several canvases on the page.
   *
   * Pass the engine instance directly (typically held in `useState` so the
   * component re-renders once `<Canvas>` finishes initialising). Passing
   * `null` while still booting renders a "waiting" placeholder rather
   * than throwing.
   *
   * When omitted, the editor reads the surrounding `CanvasContext`. If
   * both are supplied, this prop wins.
   *
   * Example:
   * ```tsx
   * const [canvasA, setCanvasA] = useState<EngineCanvas | null>(null);
   * <Canvas ref={setCanvasA} autoResize>…</Canvas>
   * <NodeStyleEditor canvas={canvasA} layerId="graph" />
   * ```
   */
  canvas?: EngineCanvas | null;
  /** Initial open tab. */
  defaultSection?: NodeStyleSectionId;
  /** Optional header rendered above the tabs. */
  title?: string;
}

/**
 * Opinionated, self-wiring NodeStyle editor.
 *
 * - Resolves its target canvas in the order `props.canvas → CanvasContext → waiting placeholder`.
 *   Never throws — a not-yet-initialised canvas just renders a small "Waiting for canvas…"
 *   stub until the prop / context becomes non-null.
 * - Seeds form state from one representative node's resolved style on mount and on canvas swaps.
 * - Apply commits via {@link commitFormToLayer} (per-node `store.updateNode` with the resolved
 *   style spread in).
 * - Reset restores the last-applied snapshot.
 *
 * For full headless control (no engine awareness, custom commit) use
 * {@link NodeStyleForm} directly.
 */
export function NodeStyleEditor({
  layerId = 'graph',
  canvas: canvasProp,
  defaultSection,
  title,
}: NodeStyleEditorProps) {
  const ctxCanvas = useContext(CanvasContext);
  const canvas = canvasProp ?? ctxCanvas;

  const layer = canvas
    ? (canvas.layers.get(layerId) as GraphLayer | undefined)
    : undefined;

  const initial = useMemo<NodeStyleFormValue>(
    () => (layer ? seedFormFromLayer(layer) : {}),
    [layer],
  );

  const [snapshot, setSnapshot] = useState<NodeStyleFormValue>(initial);
  const [value, setValue] = useState<NodeStyleFormValue>(initial);

  // Re-seed when the resolved layer changes (canvas booted, swapped between
  // canvases on the same page, or layer id changed).
  useEffect(() => {
    setSnapshot(initial);
    setValue(initial);
  }, [initial]);

  const dirty = useMemo(() => dirtyKeys(value, snapshot), [value, snapshot]);
  const isDirty = dirty.length > 0;

  const handleApply = useCallback(() => {
    if (!layer) return;
    commitFormToLayer(layer, value);
    setSnapshot(value);
  }, [layer, value]);

  const handleReset = useCallback(() => {
    setValue(snapshot);
  }, [snapshot]);

  if (!canvas) {
    return (
      <div style={{ padding: 16, fontSize: 13, opacity: 0.7 }}>
        Waiting for canvas…
      </div>
    );
  }

  if (!layer) {
    return (
      <div style={{ padding: 16, fontSize: 13, opacity: 0.7 }}>
        No graph layer with id <code>{layerId}</code> on the target canvas.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
      {title ? (
        <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
      ) : null}

      <NodeStyleForm value={value} onChange={setValue} defaultSection={defaultSection} />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 8,
          borderTop: '1px solid var(--border, #e4e4e7)',
        }}
      >
        <span style={{ fontSize: 12, opacity: 0.7 }}>
          {isDirty ? `${dirty.length} field${dirty.length === 1 ? '' : 's'} pending` : 'No changes'}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" onClick={handleReset} disabled={!isDirty}>
            Reset
          </Button>
          <Button onClick={handleApply} disabled={!isDirty}>
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
