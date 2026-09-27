import type { Canvas } from '@invana/canvas';
import type { ClickSelectBehaviour, GraphClipboard, GraphHistory } from '@invana/graph';

/**
 * The graph edit actions shared by the hooks (`useClearGraph`, `useClipboard`)
 * and the commands the providers register (`graph.clear`, `clipboard.*`), so a
 * toolbar button and a control-panel button can never behave differently.
 */

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
 * graph; otherwise the layer's fast `clear()`.
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

/** The node and edge ids the click-select behaviour currently holds. */
export function selectedElementIds(canvas: Canvas, clickSelectId: string): { nodeIds: string[]; edgeIds: string[] } {
  const behaviour = canvas.behaviours.get<ClickSelectBehaviour>(clickSelectId);
  return {
    nodeIds: behaviour ? behaviour.getSelectedShapeIds() : [],
    edgeIds: behaviour ? behaviour.getSelectedConnectorIds() : [],
  };
}

/** Paste the clipboard (undoably when `history` is given) and select what was pasted. */
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
