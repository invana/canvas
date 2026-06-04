import type { Canvas as EngineCanvas, BackgroundLayerOptions } from '@invana/canvas';

import type { ToolbarIcon } from './types';
import { ControlButton } from './ControlButton';
import { useGrid } from '../hooks/useGrid';

type PatternType = NonNullable<BackgroundLayerOptions['patternType']>;

export interface GridToggleProps {
  icon: ToolbarIcon;
  /** Tooltip / accessible label. Default `'Toggle grid'`. */
  title?: string;
  /** Id of the `BackgroundLayer` to toggle. Default `'background'`. */
  backgroundLayerId?: string;
  /** Pattern to switch to when shown (e.g. `'grid'`); preserves existing if omitted. */
  patternType?: PatternType;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: EngineCanvas | null;
  className?: string;
}

/**
 * Self-wiring grid toggle. Shows the button as active while the background
 * pattern is visible. Wraps {@link useGrid}.
 */
export function GridToggle({
  icon,
  title = 'Toggle grid',
  backgroundLayerId,
  patternType,
  canvas,
  className,
}: GridToggleProps) {
  const { showGrid, toggleGrid } = useGrid(
    { ...(backgroundLayerId ? { backgroundLayerId } : {}), ...(patternType ? { patternType } : {}) },
    canvas,
  );
  return (
    <ControlButton
      icon={icon}
      title={title}
      onClick={toggleGrid}
      active={showGrid}
      className={className}
    />
  );
}
