import type { Canvas as EngineCanvas } from '@invana/canvas';

import type { ToolbarIcon } from './types';
import { ControlButton } from './ControlButton';
import { useClipboard } from '../hooks/useClipboard';

export interface DeleteSelectionButtonProps {
  icon: ToolbarIcon;
  /** Tooltip / accessible label. Default `'Delete selection'`. */
  title?: string;
  /** Id of the `ClickSelectBehaviour` to read selection from. Default `'click-select'`. */
  clickSelectId?: string;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: EngineCanvas | null;
  className?: string;
}

/**
 * Self-wiring delete button — removes the selected nodes/edges (undoable when a
 * `<GraphHistoryProvider>` is present). Disabled when nothing is selected.
 * Requires a `<GraphClipboardProvider>` + a `ClickSelectBehaviour`.
 */
export function DeleteSelectionButton({
  icon,
  title = 'Delete selection',
  clickSelectId,
  canvas,
  className,
}: DeleteSelectionButtonProps) {
  const { remove, hasSelection } = useClipboard(
    clickSelectId ? { clickSelectId } : {},
    canvas,
  );
  return (
    <ControlButton
      icon={icon}
      title={title}
      onClick={remove}
      disabled={!hasSelection}
      className={className}
    />
  );
}
