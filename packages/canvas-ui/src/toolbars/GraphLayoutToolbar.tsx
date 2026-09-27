import { useEffect } from 'react';
import type { Canvas } from '@invana/canvas';

import { ToolbarItems } from '../components';
import type { ToolbarIcon, ToolbarItem } from '../components';
import { useLayoutsSection } from '@invana/canvas-react';
import { useSelectMode } from '@invana/canvas-react';
import type { LayoutFactory } from '@invana/canvas-react';

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
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: Canvas | null;
  className?: string;
}

/**
 * Graph controls — the **Layouts** section ({@link useLayoutsSection}) plus a
 * selection-mode picker (built inline off {@link useSelectMode}), separated by a
 * divider. The consumer supplies the layout factory map and the
 * mode→behaviour-id map (both live in consumer space, so this can't be turnkey).
 *
 * @deprecated Callback-driven, with no command behind its controls, so it can't
 * share the control-spec renderer. Use `GraphControlsToolbar`, or
 * `<ControlItems items={…}>` with the `*_CONTROL_ITEMS` presets. Kept for
 * compatibility; see `docs/rfcs/feat/2026-09-28-toolbars-and-control-panels-draw-controls-twice.md` D3.
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

  return <ToolbarItems items={items} orientation="horizontal" className={className} />;
}
