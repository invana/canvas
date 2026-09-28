import { useEffect, useState, type ReactNode } from 'react';
import {
  GraphHistory,
  canRedoEither,
  canUndoEither,
  captureNodeDrags,
  clearGraphLayer,
  eraseCommand,
  redoNewest,
  undoNewest,
  type GraphLayer,
} from '@invana/graph';
import type { Canvas } from '@invana/canvas';

import { useCanvasGraphHistory } from '../hooks/useGraphEditState';
import { useResolvedCanvas } from '../hooks/useResolvedCanvas';
import { HistoryContext } from '../HistoryContext';

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
 * Provides the target layer's `GraphHistory` via {@link HistoryContext}, for
 * descendant `useHistory` / Undo-Redo buttons.
 *
 * **On a `GraphCanvas`** the canvas already owns one per graph layer — with node
 * drags journalled and the `history.*` / undoable `graph.clear` / `graph.erase`
 * commands registered — so this provider only **bridges** that instance into the
 * context and applies `limit` while mounted. It builds and registers nothing.
 * Optional there: `useGraphHistory` falls back to the canvas's own.
 *
 * **Elsewhere** (a plain `Canvas`, or a `GraphCanvas` built with
 * `history: false`) it keeps the original behaviour: it builds a `GraphHistory`
 * over the layer's store, journals node drags on it (`captureNodeDrags`), and
 * while mounted registers `history.undo` / `history.redo` (over this history and
 * `canvas.history` — `undoNewest` / `redoNewest`) plus undoable `graph.clear` /
 * `graph.erase`. That history is rebuilt (stacks cleared) if `layerId`, `limit`
 * or the canvas change. Place the provider **after** the `<GraphLayer>` it
 * targets, so the layer exists when its effect runs.
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
  // The `GraphCanvas`'s own history for the layer, when it has one.
  const owned = useCanvasGraphHistory(resolved, layerId);
  const [own, setOwn] = useState<GraphHistory | null>(null);

  // Bridging: apply `limit` to the canvas's history while mounted.
  useEffect(() => {
    if (!owned || limit === undefined) return;
    const prev = owned.maxDepth;
    owned.setLimit(limit);
    return () => owned.setLimit(prev);
  }, [owned, limit]);

  // Not bridging: build one.
  useEffect(() => {
    if (owned) return;
    const layer = resolved.layers.get<GraphLayer>(layerId);
    const store = layer?.store;
    if (!store) return;
    const instance = new GraphHistory(store, limit !== undefined ? { limit } : {});
    setOwn(instance);
    return () => {
      instance.clear();
      setOwn(null);
    };
  }, [resolved, layerId, limit, owned]);

  // Not bridging: journal node drags on it, one "move" entry per gesture.
  useEffect(() => {
    if (!own) return;
    const layer = resolved.layers.get<GraphLayer>(layerId);
    return layer ? captureNodeDrags(layer, own) : undefined;
  }, [resolved, layerId, own]);

  // Not bridging: while mounted, undo / redo and an undoable `graph.clear` are
  // canvas commands, so a saved control panel can bind to them. `graph.clear`
  // overrides the plain built-in and hands it back on unmount; a clear aimed at
  // a layer this history doesn't journal falls back to the plain clear.
  useEffect(() => {
    const history = own;
    if (!history) return;
    const commands = resolved.commands;
    const offs = [
      // One Undo button for two stacks: graph edits (this history) and definition
      // edits (`canvas.history`). Undo takes the newer top, redo the older redo
      // top (the step undone last) — see `undoNewest` / `redoNewest`.
      commands.register('history.undo', {
        label: 'Undo',
        run: (c) => undoNewest(c, history),
        isEnabled: (c) => canUndoEither(c, history),
      }),
      commands.register('history.redo', {
        label: 'Redo',
        run: (c) => redoNewest(c, history),
        isEnabled: (c) => canRedoEither(c, history),
      }),
      commands.register('graph.clear', {
        label: 'Clear canvas',
        args: { layerId: { kind: 'layer', label: 'Layer', default: 'graph' } },
        isEnabled: (c, args) => c.layers.has(targetLayer(args)),
        run: (c, args) => {
          const target = targetLayer(args);
          clearGraphLayer(c, target, target === layerId ? history : null);
        },
      }),
      // Deleting the selection journals on this history (its own layer only).
      commands.register('graph.erase', eraseCommand((target) => (target === layerId ? history : null))),
      // The undo stack isn't in the view store: tell bound controls it moved.
      history.events.on('change', () => commands.invalidate()),
    ];
    return () => {
      for (const off of offs) off();
    };
  }, [own, resolved, layerId]);

  return <HistoryContext.Provider value={owned ?? own}>{children}</HistoryContext.Provider>;
}
