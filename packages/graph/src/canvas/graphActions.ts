/**
 * The graph edit actions shared by `canvas-react`'s hooks (`useClearGraph`,
 * `useClipboard`) and the commands its providers register (`graph.clear`,
 * `clipboard.*`, `history.undo` / `history.redo`), so a toolbar button and a
 * control-panel button can never behave differently. Plain functions over a
 * `Canvas` — no React — so they also run headless.
 *
 * Must not import `graphCommands.ts` (which imports this module).
 */

import type { Canvas } from '@invana/canvas';

import type { ClickSelectBehaviour } from '../behaviours/ClickSelectBehaviour';
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

/**
 * Whether the graph stack's step goes first. Undo takes the **newer** top (the
 * most recent edit). Redo takes the **older** top: undo walked back newest →
 * oldest, so the step undone last — the one to redo first — is the older one.
 * Ties go to the graph stack.
 */
function graphGoesFirst(
  graph: { at?: number } | undefined,
  view: { at: number } | undefined,
  redo = false,
): boolean {
  if (!view) return true;
  if (!graph) return false;
  const at = graph.at ?? 0;
  return redo ? at <= view.at : at >= view.at;
}

/*
 * Two stacks, one Undo button: graph edits (a `GraphHistory` over a layer's
 * store) and definition edits (`canvas.history`, the Studio's `edit:*`
 * applies). Each function below acts on whichever top should go first.
 */

/**
 * Undo the newer of the two tops — the graph `history`'s or `canvas.history`'s.
 * No-op when both stacks are empty.
 */
export function undoNewest(canvas: Canvas, history: GraphHistory): void {
  if (graphGoesFirst(history.peekUndo(), canvas.history.peekUndo())) history.undo();
  else canvas.history.undo();
}

/**
 * Redo the older of the two redo tops (the step undone last), from the graph
 * `history` or `canvas.history`. No-op when both redo stacks are empty.
 */
export function redoNewest(canvas: Canvas, history: GraphHistory): void {
  if (graphGoesFirst(history.peekRedo(), canvas.history.peekRedo(), true)) history.redo();
  else canvas.history.redo();
}

/** Whether either stack — the graph `history` or `canvas.history` — has a step to undo. */
export function canUndoEither(canvas: Canvas, history: GraphHistory): boolean {
  return history.canUndo || canvas.history.canUndo();
}

/** Whether either stack — the graph `history` or `canvas.history` — has a step to redo. */
export function canRedoEither(canvas: Canvas, history: GraphHistory): boolean {
  return history.canRedo || canvas.history.canRedo();
}
