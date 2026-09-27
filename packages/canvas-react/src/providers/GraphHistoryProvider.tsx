import { useEffect, useState, type ReactNode } from 'react';
import {
  GraphHistory,
  type GraphLayer,
  type HistoryOp,
  type Vec2,
} from '@invana/graph';
import type { Canvas } from '@invana/canvas';

import { useResolvedCanvas } from '../hooks/useResolvedCanvas';
import { HistoryContext } from '../HistoryContext';
import { clearGraphLayer } from './graphActions';

export interface GraphHistoryProviderProps {
  /** Id of the `GraphLayer` whose store the history journals. Default `'graph'`. */
  layerId?: string;
  /** Maximum undo depth. Forwarded to `GraphHistory`. Default `100`. */
  limit?: number;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: Canvas | null;
  children?: ReactNode;
}

/**
 * Constructs a `GraphHistory` over the target layer's store and provides it via
 * {@link HistoryContext}. Place it **inside** `<Canvas>` and **after** the
 * `<GraphLayer>` it targets, so the layer (and its store) exist when the effect
 * runs. Descendant `useHistory` / Undo-Redo-Redraw buttons resolve the history
 * from here.
 *
 * Node **drags** are captured as one undoable "move" entry per gesture (snapshot
 * at `node:drag-start`, net change pushed at `node:drag-end`) — reusing
 * `history.push`, so per-frame writes and layout sim ticks never enter the stack.
 *
 * While mounted it also registers the `history.undo` / `history.redo` commands
 * and an undoable `graph.clear` on the canvas, for control panels.
 *
 * The history is rebuilt (and its stacks cleared) if `layerId`, `limit`, or the
 * resolved canvas change.
 */
/** The layer a `graph.clear` targets (`args.layerId`, default `'graph'`). */
function targetLayer(args: unknown): string {
  const id = args && typeof args === 'object' ? (args as { layerId?: unknown }).layerId : undefined;
  return typeof id === 'string' ? id : 'graph';
}

export function GraphHistoryProvider({
  layerId = 'graph',
  limit,
  canvas,
  children,
}: GraphHistoryProviderProps) {
  const resolved = useResolvedCanvas(canvas);
  const [history, setHistory] = useState<GraphHistory | null>(null);

  useEffect(() => {
    const layer = resolved.layers.get<GraphLayer>(layerId);
    const store = layer?.store;
    if (!store) return;
    const instance = new GraphHistory(store, limit !== undefined ? { limit } : {});
    setHistory(instance);
    return () => {
      instance.clear();
      setHistory(null);
    };
  }, [resolved, layerId, limit]);

  // Capture node drags as one "move" entry per gesture. Every dragged primary
  // (a multi-selection drag moves them all) plus each one's descendants (group
  // drag) is snapshot at drag-start; the net position change is pushed at
  // drag-end. No per-frame recording → layout sim writes and programmatic
  // moves stay out of history.
  useEffect(() => {
    if (!history) return;
    const layer = resolved.layers.get<GraphLayer>(layerId);
    const store = layer?.store;
    if (!layer || !store) return;

    let before: Map<string, Vec2> | null = null;
    const offStart = layer.events.on('node:drag-start', ({ nodeId, nodeIds }) => {
      const ids = new Set<string>();
      for (const primary of nodeIds ?? [nodeId]) {
        ids.add(primary);
        for (const desc of store.descendantsOf(primary)) ids.add(desc);
      }
      before = new Map();
      for (const id of ids) {
        const p = store.getPosition(id);
        if (p) before.set(id, { x: p.x, y: p.y });
      }
    });
    const offEnd = layer.events.on('node:drag-end', () => {
      const snap = before;
      before = null;
      if (!snap) return;
      const ops: HistoryOp[] = [];
      for (const [id, from] of snap) {
        const to = store.getPosition(id);
        if (to && (to.x !== from.x || to.y !== from.y)) {
          ops.push({ kind: 'moveNode', id, before: from, after: { x: to.x, y: to.y } });
        }
      }
      if (ops.length > 0) history.push({ ops, label: 'move' });
    });
    return () => {
      offStart();
      offEnd();
    };
  }, [resolved, layerId, history]);

  // While mounted, undo / redo and an undoable `graph.clear` are canvas
  // commands, so a saved control panel can bind to them. `graph.clear` overrides
  // the graph's plain built-in and hands it back on unmount; a clear aimed at a
  // layer this history doesn't journal falls back to the plain clear.
  useEffect(() => {
    if (!history) return;
    const commands = resolved.commands;
    const offs = [
      commands.register('history.undo', {
        label: 'Undo',
        run: () => history.undo(),
        isEnabled: () => history.canUndo,
      }),
      commands.register('history.redo', {
        label: 'Redo',
        run: () => history.redo(),
        isEnabled: () => history.canRedo,
      }),
      commands.register('graph.clear', {
        label: 'Clear canvas',
        isEnabled: (c, args) => c.layers.has(targetLayer(args)),
        run: (c, args) => {
          const target = targetLayer(args);
          clearGraphLayer(c, target, target === layerId ? history : null);
        },
      }),
      // The undo stack isn't in the view store: tell bound controls it moved.
      history.events.on('change', () => commands.invalidate()),
    ];
    return () => {
      for (const off of offs) off();
    };
  }, [history, resolved, layerId]);

  return <HistoryContext.Provider value={history}>{children}</HistoryContext.Provider>;
}
