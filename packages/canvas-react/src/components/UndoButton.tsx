import type { Canvas as EngineCanvas } from '@invana/canvas';

import type { ToolbarIcon } from './types';
import { ControlButton } from './ControlButton';
import { useHistory } from '../hooks/useHistory';

export interface UndoButtonProps {
  icon: ToolbarIcon;
  /** Tooltip / accessible label. Default `'Undo'`. */
  title?: string;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: EngineCanvas | null;
  className?: string;
}

/**
 * Self-wiring undo button. Disabled when there is nothing to undo. Requires a
 * `<GraphHistoryProvider>` ancestor (see {@link useHistory}).
 */
export function UndoButton({ icon, title = 'Undo', canvas, className }: UndoButtonProps) {
  const { undo, canUndo } = useHistory({}, canvas);
  return (
    <ControlButton
      icon={icon}
      title={title}
      onClick={undo}
      disabled={!canUndo}
      className={className}
    />
  );
}
