import type { Canvas, BackgroundLayerOptions } from '@invana/canvas';

import { Panel, ToolbarItems } from '../components';
import type { PanelPosition, ToolbarIcon, ToolbarItem } from '../components';
import { useGrid } from '../hooks/useGrid';

type PatternType = NonNullable<BackgroundLayerOptions['patternType']>;

export interface GridToolbarIconSet {
  grid: ToolbarIcon;
}

export interface GridToolbarProps {
  icons: GridToolbarIconSet;
  /** Where the toolbar pins. Default `'bottom-right'`. */
  position?: PanelPosition;
  /** Stack direction. Default `'horizontal'`. */
  orientation?: 'horizontal' | 'vertical';
  /** Id of the `BackgroundLayer` to toggle. Default `'background'`. */
  backgroundLayerId?: string;
  /** Pattern to switch to when shown (e.g. `'grid'`); preserves existing if omitted. */
  patternType?: PatternType;
  /** Render without the `<Panel>` wrapper. Default `false`. */
  bare?: boolean;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: Canvas | null;
  className?: string;
}

/**
 * Grid toggle bar — shows/hides a `BackgroundLayer`'s pattern. Built inline off
 * {@link useGrid} (grid isn't one of the five named toolbar sections).
 */
export function GridToolbar({
  icons,
  position = 'bottom-right',
  orientation = 'horizontal',
  backgroundLayerId,
  patternType,
  bare = false,
  canvas,
  className,
}: GridToolbarProps) {
  const { showGrid, toggleGrid } = useGrid(
    {
      ...(backgroundLayerId ? { backgroundLayerId } : {}),
      ...(patternType ? { patternType } : {}),
    },
    canvas,
  );
  const items: ToolbarItem[] = [
    { type: 'toggle', key: 'grid', icon: icons.grid, label: 'Toggle grid', active: showGrid, onToggle: toggleGrid },
  ];

  const nav = <ToolbarItems items={items} orientation={orientation} className={className} />;
  if (bare) return nav;
  return (
    <Panel position={position} orientation={orientation}>
      {nav}
    </Panel>
  );
}
