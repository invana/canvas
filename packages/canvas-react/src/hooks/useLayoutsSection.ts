import type { Canvas as EngineCanvas } from '@invana/canvas';

import type { ToolbarItem } from '../components/ToolbarItem';
import { useLayout, type LayoutFactory } from './useLayout';

export interface UseLayoutsSectionOptions {
  /** Map of layout key → factory producing a fresh layout instance. Memoize it. */
  layouts: Record<string, LayoutFactory>;
  /** Trigger label. Default `'Layout'`. */
  label?: string;
  /** Target `GraphLayer` id. Default `'graph'`. */
  layerId?: string;
  /** Padding for the post-layout fit. Default `80`. */
  fitPadding?: number;
  /** Initially-selected key. Default: first key. */
  initial?: string;
  /** Optional key → human label map. Default: identity. */
  labels?: Record<string, string>;
  /** Menu alignment. */
  align?: 'start' | 'center' | 'end';
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: EngineCanvas | null;
}

/**
 * **Layouts** toolbar section — a layout-picker `select` {@link ToolbarItem}
 * built off {@link useLayout} (applies the chosen layout + fits the view).
 * Layouts live in separate packages, so the consumer supplies the factory map
 * (memoize it).
 */
export function useLayoutsSection(options: UseLayoutsSectionOptions): ToolbarItem[] {
  const { layouts, label = 'Layout', layerId, fitPadding, initial, labels, align, canvas } = options;
  const { layout, layoutOptions, applyLayout } = useLayout(
    layouts,
    {
      ...(layerId ? { layerId } : {}),
      ...(fitPadding !== undefined ? { fitPadding } : {}),
      ...(initial ? { initial } : {}),
      ...(labels ? { labels } : {}),
    },
    canvas,
  );
  return [{ type: 'select', key: 'layout', label, value: layout, options: layoutOptions, onChange: applyLayout, align }];
}
