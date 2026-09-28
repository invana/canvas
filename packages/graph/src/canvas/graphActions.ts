/**
 * The graph edit actions shared by `canvas-react`'s hooks (`useClearGraph`,
 * `useClipboard`) and the graph commands (`graph.clear`, `clipboard.*`,
 * `history.undo` / `history.redo` — `GraphCanvas`'s built-ins and the
 * providers' plain-canvas forms), so a toolbar button and a control-panel
 * button can never behave differently. Plain functions over a
 * `Canvas` — no React — so they also run headless.
 *
 * Must not import `graphCommands.ts` (which imports this module).
 */

import type { Canvas } from '@invana/canvas';

import type { ClickSelectBehaviour } from '../behaviours/ClickSelectBehaviour';
import type { GraphLayer } from '../layer/GraphLayer';
import type { EdgePathType, EdgeShapeOptions } from '../layer/types';
import type { GraphClipboard } from '../clipboard/GraphClipboard';
import type { GraphHistory } from '../history/GraphHistory';

/** A layer `clearGraphLayer` can clear (a `GraphLayer`, structurally). */
interface ClearableLayer {
  clear(): void;
  store?: { nodes(): IterableIterator<{ id: string }> };
}

function isClearable(layer: unknown): layer is ClearableLayer {
  return typeof (layer as ClearableLayer | undefined)?.clear === 'function';
}

/**
 * Clear `layerId`. With a `history` over that layer's store it is one undoable
 * `'clear'` entry (every node removed, edges cascading), so Undo restores the
 * graph; otherwise the layer's fast `clear()`. No-op when the layer is missing
 * or can't be cleared.
 *
 * @param canvas  The canvas holding the layer.
 * @param layerId The graph layer to clear.
 * @param history The `GraphHistory` journalling that layer's store, or `null`.
 */
export function clearGraphLayer(canvas: Canvas, layerId: string, history: GraphHistory | null): void {
  const layer = canvas.layers.get(layerId);
  if (!isClearable(layer)) return;
  const store = layer.store;
  if (history && store) {
    // Snapshot ids first — removing mutates the store mid-iteration.
    const ids = [...store.nodes()].map((n) => n.id);
    if (ids.length > 0) {
      history.transaction('clear', (rec) => {
        for (const id of ids) rec.removeNode(id);
      });
      return;
    }
  }
  layer.clear();
}

/**
 * The node and edge ids the click-select behaviour `clickSelectId` currently
 * holds, read at call time. Both lists are empty when the behaviour isn't
 * registered.
 */
export function selectedElementIds(canvas: Canvas, clickSelectId: string): { nodeIds: string[]; edgeIds: string[] } {
  const behaviour = canvas.behaviours.get<ClickSelectBehaviour>(clickSelectId);
  return {
    nodeIds: behaviour ? behaviour.getSelectedShapeIds() : [],
    edgeIds: behaviour ? behaviour.getSelectedConnectorIds() : [],
  };
}

/**
 * Copy the current click-selection (read at call time) into `clipboard`'s
 * buffer. Not an edit, so never journalled.
 */
export function copySelection(canvas: Canvas, clipboard: GraphClipboard, clickSelectId: string): void {
  const { nodeIds, edgeIds } = selectedElementIds(canvas, clickSelectId);
  clipboard.copy(nodeIds, edgeIds);
}

/**
 * Cut the current click-selection (read at call time): copy it to the buffer,
 * then delete it — one undoable step when `history` is given.
 */
export function cutSelection(
  canvas: Canvas,
  clipboard: GraphClipboard,
  history: GraphHistory | null,
  clickSelectId: string,
): void {
  const { nodeIds, edgeIds } = selectedElementIds(canvas, clickSelectId);
  clipboard.cut(nodeIds, edgeIds, history ?? undefined);
}

/**
 * Delete the current click-selection (read at call time) without touching the
 * buffer — one undoable step when `history` is given.
 */
export function deleteSelection(
  canvas: Canvas,
  clipboard: GraphClipboard,
  history: GraphHistory | null,
  clickSelectId: string,
): void {
  const { nodeIds, edgeIds } = selectedElementIds(canvas, clickSelectId);
  clipboard.delete(nodeIds, edgeIds, history ?? undefined);
}

/**
 * Paste the clipboard (undoably when `history` is given) and select what was
 * pasted through the click-select behaviour `clickSelectId`.
 */
export function pasteAndSelect(
  canvas: Canvas,
  clipboard: GraphClipboard,
  history: GraphHistory | null,
  clickSelectId: string,
): void {
  const { nodeIds, edgeIds } = clipboard.paste(history ?? undefined);
  canvas.behaviours.get<ClickSelectBehaviour>(clickSelectId)?.selectMultiple([
    ...nodeIds.map((id) => ({ id, type: 'shape' as const })),
    ...edgeIds.map((id) => ({ id, type: 'connector' as const })),
  ]);
}

/*
 * One Undo button, one log: graph edits and definition edits (the Studio's
 * `edit:*` applies) are entries in the canvas's single operation log, so
 * `canvas.history` alone decides the order (RFC
 * `feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`, F4). The
 * `history` argument only matters when it journals a store that is *not* on
 * the canvas's log (a layer that never mounted) — then it is the fallback.
 */

/**
 * Undo the newest undoable change on the canvas — a graph edit or a definition
 * edit, whichever came last. Falls back to `history` when the canvas has
 * nothing to undo and `history` is on a log of its own. No-op when neither can undo.
 */
export function undoNewest(canvas: Canvas, history: GraphHistory | null): void {
  if (canvas.history.canUndo()) canvas.history.undo();
  else if (history?.canUndo) history.undo();
}

/**
 * Redo the most recently undone change on the canvas, falling back to `history`
 * as {@link undoNewest} does. No-op when neither can redo.
 */
export function redoNewest(canvas: Canvas, history: GraphHistory | null): void {
  if (canvas.history.canRedo()) canvas.history.redo();
  else if (history?.canRedo) history.redo();
}

/** Whether the canvas — or, on a log of its own, `history` — has a change to undo. */
export function canUndoEither(canvas: Canvas, history: GraphHistory | null): boolean {
  return canvas.history.canUndo() || (history?.canUndo ?? false);
}

/** Whether the canvas — or, on a log of its own, `history` — has a change to redo. */
export function canRedoEither(canvas: Canvas, history: GraphHistory | null): boolean {
  return canvas.history.canRedo() || (history?.canRedo ?? false);
}

/** The layer's current edge `shape` template, or `{}`. */
function edgeShape(layer: GraphLayer): EdgeShapeOptions {
  const shape = (layer.edgeDefaults as { shape?: unknown } | undefined)?.shape;
  return (shape && typeof shape === 'object' ? shape : {}) as EdgeShapeOptions;
}

/**
 * The layer-wide edge path type — `edgeDefaults.shape.pathType` — or
 * `undefined` when the template doesn't set one. Shared by the
 * `graph.edgeType` command and `useEdgeType`.
 */
export function edgePathType(layer: GraphLayer): string | undefined {
  return edgeShape(layer).pathType;
}

/**
 * Switch every edge in the layer (and edges added later) to path type `type`
 * via `GraphLayer.setEdgeDefaults`. The prior `shape` is spread first, since
 * `setEdgeDefaults` replaces it wholesale — anchors / waypoints survive. The
 * layer emits `style:changed` (scope `edge`), which `GraphCanvas` bridges to
 * bound controls.
 */
export function setEdgePathType(layer: GraphLayer, type: string): void {
  layer.setEdgeDefaults({ shape: { ...edgeShape(layer), pathType: type as EdgePathType } });
}
