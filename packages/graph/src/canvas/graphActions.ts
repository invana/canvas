/**
 * The graph edit actions shared by `canvas-react`'s hooks (`useClearGraph`,
 * `useClipboard`) and the graph commands (`graph.clear`, `clipboard.*` —
 * `GraphCanvas`'s built-ins and the clipboard provider's plain-canvas forms),
 * so a toolbar button and a control-panel button can never behave
 * differently. Every edit is recorded by the layer's store into
 * `canvas.history`, so undo needs nothing from here. Plain functions over a
 * `Canvas` — no React — so they also run headless.
 *
 * Must not import `graphCommands.ts` (which imports this module).
 */

import type { Canvas } from '@invana/canvas';

import type { ClickSelectBehaviour } from '../behaviours/ClickSelectBehaviour';
import type { GraphLayer } from '../layer/GraphLayer';
import type { EdgePathType, EdgeShapeOptions } from '../layer/types';
import type { GraphClipboard } from '../clipboard/GraphClipboard';

/** A layer `clearGraphLayer` can clear (a `GraphLayer`, structurally). */
interface ClearableLayer {
  clear(): void;
  store?: { operationLog?: { group<T>(meta: { title?: string }, fn: () => T): T; readonly replaying: boolean } };
}

function isClearable(layer: unknown): layer is ClearableLayer {
  return typeof (layer as ClearableLayer | undefined)?.clear === 'function';
}

/**
 * Clear `layerId` — one undoable `'clear'` entry in `canvas.history` (the
 * store records the wipe with everything it removed, so Undo restores the
 * graph). No-op when the layer is missing or can't be cleared.
 *
 * @param canvas  The canvas holding the layer.
 * @param layerId The graph layer to clear.
 */
export function clearGraphLayer(canvas: Canvas, layerId: string): void {
  const layer = canvas.layers.get(layerId);
  if (!isClearable(layer)) return;
  const log = layer.store?.operationLog;
  if (log && !log.replaying) log.group({ title: 'clear' }, () => layer.clear());
  else layer.clear();
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
 * then delete it — one undoable step.
 */
export function cutSelection(canvas: Canvas, clipboard: GraphClipboard, clickSelectId: string): void {
  const { nodeIds, edgeIds } = selectedElementIds(canvas, clickSelectId);
  clipboard.cut(nodeIds, edgeIds);
}

/**
 * Delete the current click-selection (read at call time) without touching the
 * buffer — one undoable step.
 */
export function deleteSelection(canvas: Canvas, clipboard: GraphClipboard, clickSelectId: string): void {
  const { nodeIds, edgeIds } = selectedElementIds(canvas, clickSelectId);
  clipboard.delete(nodeIds, edgeIds);
}

/**
 * Paste the clipboard (one undoable step) and select what was pasted through
 * the click-select behaviour `clickSelectId`.
 */
export function pasteAndSelect(canvas: Canvas, clipboard: GraphClipboard, clickSelectId: string): void {
  const { nodeIds, edgeIds } = clipboard.paste();
  canvas.behaviours.get<ClickSelectBehaviour>(clickSelectId)?.selectMultiple([
    ...nodeIds.map((id) => ({ id, type: 'shape' as const })),
    ...edgeIds.map((id) => ({ id, type: 'connector' as const })),
  ]);
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
