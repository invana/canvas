import { useEffect, type ReactNode } from 'react';
import type { ControlItemSpec, ControlPanelSpec } from '@invana/canvas';

import { useCanvas } from '../CanvasContext';
import { controlPanelSlots } from './slots';

export interface ControlPanelProps extends Omit<ControlPanelSpec, 'kind' | 'items'> {
  /** Panel id — its key in `definition.controlPanels`. Changing it re-registers the panel. */
  id: string;
  /** Serialisable items (commands, toggles, widgets, dividers, text). */
  items?: readonly ControlItemSpec[];
  /**
   * Arbitrary React content, rendered **after** {@link items}. Not persisted:
   * the stored spec carries a `{ type: 'slot', slot: id }` placeholder and the
   * node lives in the canvas's runtime slot registry.
   */
  children?: ReactNode;
}

/**
 * Declares a **control panel** — floating UI chrome pinned over the canvas — as
 * a child of `<Canvas>` / `<GraphCanvas>` / `<GraphCanvasApp>`, the same way
 * behaviours are declared.
 *
 * Headless: it renders `null`. On mount it writes its {@link ControlPanelSpec}
 * to `canvas.store.view.definition.controlPanels[id]` (via
 * `store.actions.controlPanels`), replaces it whenever the props change, and
 * removes it on unmount. Drawing is done by the UI kit's `<ControlPanels>`
 * projection (mounted automatically by `GraphCanvasApp`), so panels written any
 * other way — `canvas.update({ controlPanels })`, an imported state, the Studio —
 * draw identically.
 *
 * `children` render through the slot registry, under the `<Canvas>` providers
 * but not under any provider placed between `<Canvas>` and this component.
 *
 * @example
 * <ControlPanel id="view" position="bottom-right" orientation="vertical" items={[
 *   { type: 'command', command: 'camera.zoomIn', icon: 'zoom-in', label: 'Zoom in' },
 *   { type: 'command', command: 'camera.fit', icon: 'maximize', label: 'Fit' },
 * ]} />
 */
export function ControlPanel({ id, items, children, ...layout }: ControlPanelProps) {
  const canvas = useCanvas();
  const hasChildren = children !== undefined && children !== null && children !== false;

  const spec: ControlPanelSpec = {
    kind: 'control-panel',
    ...layout,
    items: [...(items ?? []), ...(hasChildren ? [{ type: 'slot' as const, slot: id, key: 'children' }] : [])],
  };
  // Props arrive as fresh objects every render; compare by value.
  const specKey = JSON.stringify(spec);

  // Remove on unmount / id change. Declared before the writer so a changed id
  // drops the old panel before the new one is written.
  useEffect(() => () => canvas.store.actions.controlPanels.remove(id), [canvas, id]);

  useEffect(() => {
    canvas.store.actions.controlPanels.add(id, JSON.parse(specKey) as ControlPanelSpec);
  }, [canvas, id, specKey]);

  useEffect(() => {
    if (!hasChildren) return;
    const slots = controlPanelSlots(canvas);
    slots.set(id, children);
    return () => slots.delete(id, children);
  }, [canvas, id, hasChildren, children]);

  return null;
}
