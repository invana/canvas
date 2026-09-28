import { useCallback, useContext, useRef } from 'react';
import type { Canvas } from '@invana/canvas';
import type { ErasedElement, GraphEdge, GraphNode, HistoryOp } from '@invana/graph';

import { CanvasContext } from '../CanvasContext';
import { HistoryContext } from '../HistoryContext';
import { useCanvasGraphHistory } from './useGraphEditState';

export interface UseDrawHistoryResult {
  /** Journal a just-created node as an undoable `add node` entry. */
  onNodeCreate: (node: GraphNode) => void;
  /** Journal a just-created edge as an undoable `connect` entry. */
  onEdgeCreate: (edge: GraphEdge) => void;
  /** Journal a just-erased node/edge as an undoable `delete` entry. */
  onErase: (removed: ErasedElement) => void;
}

/**
 * Ready-made callbacks that make `CreateNodeBehaviour` / `DrawEdgeBehaviour` /
 * `EraseBehaviour` **undoable**. Wire them to the behaviours' `onNodeCreate` /
 * `onEdgeCreate` / `onErase` props — each pushes the already-applied mutation as
 * one entry on the `GraphHistory` — a `<GraphHistoryProvider>` ancestor's, else
 * the one the `GraphCanvas` owns for `layerId` (mirroring how drags are
 * journalled, via `history.push`).
 *
 * The behaviours mutate the store themselves; these only *journal* the change,
 * so they pair with — they don't replace — the behaviour's own mutation.
 *
 * With no graph history (a plain `Canvas` without a provider, or
 * `history: false`) the callbacks are harmless no-ops (drawing still
 * works; it just isn't undoable). The returned functions are referentially
 * stable, so they're safe to capture once in a behaviour that reads its
 * callbacks at construction.
 */
export function useDrawHistory(layerId = 'graph', canvas?: Canvas | null): UseDrawHistoryResult {
  // Not `useResolvedCanvas`: outside any canvas this stays a harmless no-op.
  const fromContext = useContext(CanvasContext);
  const owned = useCanvasGraphHistory(canvas ?? fromContext, layerId);
  const history = useContext(HistoryContext) ?? owned;

  // The draw behaviours capture their callbacks once (at construction), but the
  // history instance is built in an effect *after* first render. Read it through
  // a ref so the stable callbacks always see the current (possibly-late) history.
  const ref = useRef(history);
  ref.current = history;

  const push = useCallback((op: HistoryOp, label: string): void => {
    ref.current?.push({ ops: [op], label });
  }, []);

  const onNodeCreate = useCallback(
    (node: GraphNode) => push({ kind: 'addNode', node }, 'add node'),
    [push],
  );
  const onEdgeCreate = useCallback(
    (edge: GraphEdge) => push({ kind: 'addEdge', edge }, 'connect'),
    [push],
  );
  const onErase = useCallback(
    (removed: ErasedElement) => {
      const op: HistoryOp =
        removed.kind === 'node'
          ? { kind: 'removeNode', node: removed.node, edges: removed.edges }
          : { kind: 'removeEdge', edge: removed.edge };
      push(op, 'delete');
    },
    [push],
  );

  return { onNodeCreate, onEdgeCreate, onErase };
}
