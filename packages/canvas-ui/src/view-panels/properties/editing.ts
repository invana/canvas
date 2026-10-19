// Which element a canvas's Properties panel is editing — held per canvas, outside
// React, so the act that asks for an editor (a context-menu item, the Add tool's
// `onNodeCreate`) and the panel that draws it need not share a component tree.
// The panel may not even be mounted when the ask comes: the board opens it after.

import type { Canvas } from '@invana/canvas';
import type { ClickInspectBehaviour, InspectTarget } from '@invana/graph';
import { useCallback, useSyncExternalStore } from 'react';

interface EditingState {
  key: string | null;
  listeners: Set<() => void>;
}

const states = new WeakMap<Canvas, EditingState>();

function stateOf(canvas: Canvas): EditingState {
  let s = states.get(canvas);
  if (!s) {
    s = { key: null, listeners: new Set() };
    states.set(canvas, s);
  }
  return s;
}

function setKey(canvas: Canvas, key: string | null): void {
  const s = stateOf(canvas);
  if (s.key === key) return;
  s.key = key;
  for (const l of s.listeners) l();
}

/** The `kind:id` key an element is edited under. */
export function propertiesKey(target: InspectTarget): string {
  return `${target.kind}:${target.id}`;
}

/**
 * Open `target`'s editor in the canvas's Properties panel: it becomes the
 * inspected element (`ClickInspectBehaviour`) and the panel draws its editor
 * instead of its read-only view. Opening the panel itself is the host's — a
 * board runs its panel command after this.
 */
export function editProperties(canvas: Canvas, target: InspectTarget, opts: { inspectBehaviourId?: string } = {}): void {
  // Target first, then the key: the panel shows the editor only while the two
  // agree, and a click that lands in between must not see a stale pair.
  canvas.behaviours.get<ClickInspectBehaviour>(opts.inspectBehaviourId ?? 'click-inspect')?.setTarget(target);
  setKey(canvas, propertiesKey(target));
}

/** Leave the editor — the panel goes back to the read-only view. */
export function stopEditingProperties(canvas: Canvas): void {
  setKey(canvas, null);
}

/** The `kind:id` of the element being edited on `canvas`, or `null`. Re-renders on change. */
export function usePropertiesEditing(canvas: Canvas | null): string | null {
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
