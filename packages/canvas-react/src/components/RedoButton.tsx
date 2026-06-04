import type { Canvas as EngineCanvas } from '@invana/canvas';

import type { ToolbarIcon, TooltipSide } from './types';
import { ControlButton } from './ControlButton';
import { useHistory } from '../hooks/useHistory';

export interface RedoButtonProps {
  icon: ToolbarIcon;
  /** Tooltip / accessible label. Default `'Redo'`. */
  title?: string;
  /** Side the tooltip is placed on. Default `'top'`. */
  tooltipSide?: TooltipSide;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: EngineCanvas | null;
  className?: string;
}

/**
 * Self-wiring redo button. Disabled when there is nothing to redo. Requires a
 * `<GraphHistoryProvider>` ancestor (see {@link useHistory}).
 */
export function RedoButton({ icon, title = 'Redo', tooltipSide, canvas, className }: RedoButtonProps) {
  const { redo, canRedo } = useHistory({}, canvas);
  return (
    <ControlButton
      icon={icon}
      title={title}
      tooltipSide={tooltipSide}
      onClick={redo}
      disabled={!canRedo}
      className={className}
    />
  );
}
