import { useEffect } from 'react';
import type { Canvas } from '@invana/canvas';

import { Panel, ToolbarItems } from '../components';
import type { PanelPosition, ToolbarIcon, ToolbarItem } from '../components';
import { useLayoutsSection } from '../hooks/useLayoutsSection';
import { useSelectMode } from '../hooks/useSelectMode';
import type { LayoutFactory } from '../hooks/useLayout';

export interface GraphLayoutToolbarProps {
  /** Map of layout key → factory producing a fresh layout instance. Memoize it. */
  layouts: Record<string, LayoutFactory>;
  /** Map of select-mode key → behaviour id (e.g. `{ click: 'click-select', ... }`). Memoize it. */
  selectModeBehaviourIds: Record<string, string>;
  /** Optional layout key → label map. Default: identity. */
  layoutLabels?: Record<string, string>;
  /** Optional select-mode key → label map. Default: identity. */
  selectModeLabels?: Record<string, string>;
  /** Optional select-mode key → icon map. Shown on the trigger and beside each option. */
  selectModeIcons?: Record<string, ToolbarIcon>;
  /** Initially-selected layout key. */
  initialLayout?: string;
  /** Initially-active select mode key. */
  initialSelectMode?: string;
  /**
   * Notified with the active select-mode key — on the initial mode and on every
   * switch. Lift it (e.g. to drive a footer hint bar). Memoize it.
   */
  onSelectModeChange?: (mode: string) => void;
  /** Target `GraphLayer` id. Default `'graph'`. */
  layerId?: string;
  /** Where the toolbar pins. Default `'top-center'`. */
  position?: PanelPosition;
  /** Render without the `<Panel>` wrapper (embed in external chrome). Default `false`. */
  bare?: boolean;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: Canvas | null;
  className?: string;
}

/**
 * Graph controls — the **Layouts** section ({@link useLayoutsSection}) plus a
 * selection-mode picker (built inline off {@link useSelectMode}), separated by a
 * divider. The consumer supplies the layout factory map and the
 * mode→behaviour-id map (both live in consumer space, so this can't be turnkey).
 */
export function GraphLayoutToolbar({
  layouts,
  selectModeBehaviourIds,
  layoutLabels,
  selectModeLabels,
  selectModeIcons,
  initialLayout,
  initialSelectMode,
  onSelectModeChange,
  layerId,
  position = 'top-center',
  bare = false,
  canvas,
  className,
}: GraphLayoutToolbarProps) {
  const layoutItems = useLayoutsSection({
    layouts,
    ...(layoutLabels ? { labels: layoutLabels } : {}),
    ...(initialLayout ? { initial: initialLayout } : {}),
    ...(layerId ? { layerId } : {}),
    canvas,
  });

  const { mode, modeOptions, setMode } = useSelectMode(
    selectModeBehaviourIds,
    { ...(initialSelectMode ? { initial: initialSelectMode } : {}), ...(selectModeLabels ? { labels: selectModeLabels } : {}) },
    canvas,
  );
  useEffect(() => {
    onSelectModeChange?.(mode);
  }, [mode, onSelectModeChange]);

  const items: ToolbarItem[] = [
    ...layoutItems,
    { type: 'divider', key: 'layout-sep' },
    { type: 'select', key: 'select-mode', label: 'Select', value: mode, options: modeOptions, icons: selectModeIcons, onChange: setMode },
  ];

  const nav = <ToolbarItems items={items} orientation="horizontal" className={className} />;
  if (bare) return nav;
  return (
    <Panel position={position} orientation="horizontal">
      {nav}
    </Panel>
  );
}
