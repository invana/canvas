import { NavHorizontal, NavVertical } from '@invana/ui';
import type { Canvas as EngineCanvas, BackgroundLayerOptions } from '@invana/canvas';

import { Panel, GridToggle } from '../components';
import type { PanelPosition, ToolbarIcon } from '../components';

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
  canvas?: EngineCanvas | null;
  className?: string;
}

/**
 * Grid toggle bar — shows/hides a `BackgroundLayer`'s pattern. Self-wires
 * through {@link useGrid}.
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
  const controls = (
    <GridToggle
      icon={icons.grid}
      backgroundLayerId={backgroundLayerId}
      patternType={patternType}
      canvas={canvas}
    />
  );

  const nav =
    orientation === 'vertical' ? (
      <NavVertical top={controls} className={className} />
    ) : (
      <NavHorizontal left={controls} className={className} />
    );

  if (bare) return nav;
  return (
    <Panel position={position} orientation={orientation}>
      {nav}
    </Panel>
  );
}
