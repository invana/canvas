import type { Canvas } from '@invana/canvas';
import type { EdgePathType } from '@invana/graph';
import { Cable, CornerDownRight, Minus, Spline, Waypoints } from 'lucide-react';

import type { ToolbarItem } from '../components/ToolbarItem';
import type { ToolbarIcon } from '../components/types';
import { useEdgeType } from './useEdgeType';

/** Baked (lucide) icon per edge-routing type; override via `options.icons`. */
const DEFAULT_ICONS: Record<string, ToolbarIcon> = {
  straight: Minus,
  orth: CornerDownRight,
  bezier: Spline,
  rounded: Waypoints,
  smooth: Cable,
};

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
  /** Menu alignment. */
  align?: 'start' | 'center' | 'end';
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: Canvas | null;
}

/**
 * **Style Editor** toolbar section — an edge-routing `select` {@link ToolbarItem}
 * built off {@link useEdgeType}. Selecting a type re-routes every edge in the
 * layer (straight / orthogonal / curved / …) and becomes the default for future
 * edges.
 */
export function useStyleEditorSection(options: UseStyleEditorSectionOptions = {}): ToolbarItem[] {
  const { layerId, label = 'Edge', initial, types, labels, align, canvas } = options;
  const { edgeType, edgeTypeOptions, setEdgeType } = useEdgeType(
    {
      ...(layerId ? { layerId } : {}),
      ...(initial ? { initial } : {}),
      ...(types ? { types } : {}),
      ...(labels ? { labels } : {}),
    },
    canvas,
  );
  return [{ type: 'select', key: 'edge-type', label, value: edgeType, options: edgeTypeOptions, icons: DEFAULT_ICONS, onChange: setEdgeType, align, triggerLabelOnly: true }];
}
