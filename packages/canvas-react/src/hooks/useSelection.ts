import { useCallback, useEffect, useState } from 'react';
import type { Canvas as EngineCanvas } from '@invana/canvas';
import type { ClickSelectBehaviour } from '@invana/graph';

import { useResolvedCanvas } from './useResolvedCanvas';

export interface UseSelectionOptions {
  /** Id of the `ClickSelectBehaviour` to read selection from. Default `'click-select'`. */
  clickSelectId?: string;
}

export interface UseSelectionResult {
  /** Currently selected node ids. */
  selectedNodeIds: string[];
  /** Currently selected edge ids. */
  selectedEdgeIds: string[];
  /** Total selected (nodes + edges). */
  count: number;
  /** Clear the selection. */
  clear: () => void;
}

/**
 * Reactive view of the current graph selection, driven by a
 * `ClickSelectBehaviour`'s `selection:change` event (brush/lasso flow through it
 * by delegation, so all three selection modes are covered by this one hook).
 *
 * Requires a registered `ClickSelectBehaviour`; if absent, the selection is
 * empty and `clear` is a no-op.
 */
export function useSelection(
  options: UseSelectionOptions = {},
  canvas?: EngineCanvas | null,
): UseSelectionResult {
  const { clickSelectId = 'click-select' } = options;
  const resolved = useResolvedCanvas(canvas);
  const [selectedNodeIds, setNodeIds] = useState<string[]>([]);
  const [selectedEdgeIds, setEdgeIds] = useState<string[]>([]);

  useEffect(() => {
    const behaviour = resolved.behaviours.get<ClickSelectBehaviour>(clickSelectId);
    if (!behaviour) {
      setNodeIds([]);
      setEdgeIds([]);
      return;
    }
    setNodeIds(behaviour.getSelectedShapeIds());
    setEdgeIds(behaviour.getSelectedConnectorIds());
    return behaviour.events.on('selection:change', (snapshot) => {
      setNodeIds(snapshot.shapeIds);
      setEdgeIds(snapshot.connectorIds);
    });
  }, [resolved, clickSelectId]);

  const clear = useCallback(() => {
    resolved.behaviours.get<ClickSelectBehaviour>(clickSelectId)?.clearSelection();
  }, [resolved, clickSelectId]);

  return {
    selectedNodeIds,
    selectedEdgeIds,
    count: selectedNodeIds.length + selectedEdgeIds.length,
    clear,
  };
}
