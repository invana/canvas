import type { ReactNode } from 'react';
import type { Canvas } from '@invana/canvas';

/**
 * Per-canvas registry of **non-persisted** control-panel content — the React
 * nodes a `ControlItemSpec` of `type: 'slot'` points at by name. Specs live in
 * the store as JSON; the nodes they can't hold live here, keyed by the canvas so
 * several canvases on one page never share slots.
 */
export interface ControlPanelSlots {
  /** Set (or replace) the node for `name`. */
  set(name: string, node: ReactNode): void;
  /** Remove `name` — only if it still holds `node`, so a stale cleanup can't wipe a newer registration. */
  delete(name: string, node: ReactNode): void;
  /** The node for `name`, or `undefined`. */
  get(name: string): ReactNode;
  /** Hear every change. Returns an unsubscribe. */
  subscribe(listener: () => void): () => void;
}

const registries = new WeakMap<Canvas, ControlPanelSlots>();

/** The slot registry for `canvas` (created on first use). */
export function controlPanelSlots(canvas: Canvas): ControlPanelSlots {
  let slots = registries.get(canvas);
  if (slots) return slots;
  const nodes = new Map<string, ReactNode>();
  const listeners = new Set<() => void>();
  const notify = () => {
    for (const l of [...listeners]) l();
  };
  slots = {
    set(name, node) {
      nodes.set(name, node);
      notify();
    },
    delete(name, node) {
      if (nodes.get(name) !== node) return;
      nodes.delete(name);
      notify();
    },
    get: (name) => nodes.get(name),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  registries.set(canvas, slots);
  return slots;
}
