// Which element a canvas's Element panel is editing — held per canvas, outside
// React, so the act that asks for an editor (a context-menu item, the Add tool's
// `onNodeCreate`) and the panel that draws it need not share a component tree.
// The panel may not even be mounted when the ask comes: the board opens it after.

import type { Canvas } from '@invana/canvas';
import type { ClickInspectBehaviour, InspectTarget } from '@invana/graph';
import { useCallback, useSyncExternalStore } from 'react';

interface EditingState {
  key: string | null;
  /** The edited element was just drawn: its type is still to be given. */
  isNew: boolean;
  listeners: Set<() => void>;
}

const states = new WeakMap<Canvas, EditingState>();

function stateOf(canvas: Canvas): EditingState {
  let s = states.get(canvas);
  if (!s) {
    s = { key: null, isNew: false, listeners: new Set() };
    states.set(canvas, s);
  }
  return s;
}

function setKey(canvas: Canvas, key: string | null, isNew = false): void {
  const s = stateOf(canvas);
  if (s.key === key && s.isNew === isNew) return;
  s.key = key;
  s.isNew = key !== null && isNew;
  for (const l of s.listeners) l();
}

/** The `kind:id` key an element is edited under. */
export function elementKey(target: InspectTarget): string {
  return `${target.kind}:${target.id}`;
}

/**
 * Open `target`'s editor in the canvas's Element panel: it becomes the
 * inspected element (`ClickInspectBehaviour`) and the panel draws its editor
 * instead of its read-only view. Opening the panel itself is the host's — a
 * board runs its panel command after this.
 *
 * `isNew` is for an element just drawn (a drawing tool's `onNodeCreate` /
 * `onEdgeCreate`): its editor asks for the type first and will not apply
 * without one, and its *Cancel* takes the element off the board.
 */
export function editElement(
  canvas: Canvas,
  target: InspectTarget,
  opts: { inspectBehaviourId?: string; isNew?: boolean } = {},
): void {
  // Target first, then the key: the panel shows the editor only while the two
  // agree, and a click that lands in between must not see a stale pair.
  canvas.behaviours.get<ClickInspectBehaviour>(opts.inspectBehaviourId ?? 'click-inspect')?.setTarget(target);
  setKey(canvas, elementKey(target), opts.isNew ?? false);
}

/** Leave the editor — the panel goes back to the read-only view. */
export function stopEditingElement(canvas: Canvas): void {
  setKey(canvas, null);
}

/** Whether the element being edited on `canvas` was just drawn — see {@link editElement}. */
export function isEditingNewElement(canvas: Canvas | null): boolean {
  return canvas ? stateOf(canvas).isNew : false;
}

/** The `kind:id` of the element being edited on `canvas`, or `null`. Re-renders on change. */
export function useElementEditing(canvas: Canvas | null): string | null {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!canvas) return () => {};
      const s = stateOf(canvas);
      s.listeners.add(onChange);
      return () => void s.listeners.delete(onChange);
    },
    [canvas],
  );
  const get = useCallback(() => (canvas ? stateOf(canvas).key : null), [canvas]);
  return useSyncExternalStore(subscribe, get, get);
}
