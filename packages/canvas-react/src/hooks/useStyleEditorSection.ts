import type { Canvas as EngineCanvas } from '@invana/canvas';
import type { EdgePathType } from '@invana/graph';

import type { ToolbarItem } from '../components/ToolbarItem';
import type { ToolbarIcon } from '../components/types';
import { useEdgeType } from './useEdgeType';

export interface UseStyleEditorSectionOptions {
  /** Target `GraphLayer` id. Default `'graph'`. */
  layerId?: string;
  /** Trigger label. Default `'Edge'`. */
  label?: string;
  /** Initially-selected path type. Default: the layer's current edge default. */
  initial?: EdgePathType;
  /** Path types to expose, in order. Default: straight / orth / bezier / rounded / smooth. */
  types?: readonly EdgePathType[];
  /** Optional key → human label map. Default: the built-in path-type labels. */
  labels?: Record<string, string>;
  /** Per-option icons (key → icon component). */
  icons?: Record<string, ToolbarIcon>;
  /** Menu alignment. */
  align?: 'start' | 'center' | 'end';
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: EngineCanvas | null;
}

/**
 * **Style Editor** toolbar section — an edge-routing `select` {@link ToolbarItem}
 * built off {@link useEdgeType}. Selecting a type re-routes every edge in the
 * layer (straight / orthogonal / curved / …) and becomes the default for future
 * edges.
 */
export function useStyleEditorSection(options: UseStyleEditorSectionOptions = {}): ToolbarItem[] {
  const { layerId, label = 'Edge', initial, types, labels, icons, align, canvas } = options;
  const { edgeType, edgeTypeOptions, setEdgeType } = useEdgeType(
    {
      ...(layerId ? { layerId } : {}),
      ...(initial ? { initial } : {}),
      ...(types ? { types } : {}),
      ...(labels ? { labels } : {}),
    },
    canvas,
  );
  return [{ type: 'select', key: 'edge-type', label, value: edgeType, options: edgeTypeOptions, icons, onChange: setEdgeType, align }];
}
