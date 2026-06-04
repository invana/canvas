import type { Canvas as EngineCanvas } from '@invana/canvas';

import type { ToolbarIcon } from './types';
import { ControlButton } from './ControlButton';
import { useClipboard } from '../hooks/useClipboard';

export interface CutButtonProps {
  icon: ToolbarIcon;
  /** Tooltip / accessible label. Default `'Cut'`. */
  title?: string;
  /** Id of the `ClickSelectBehaviour` to read selection from. Default `'click-select'`. */
  clickSelectId?: string;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: EngineCanvas | null;
  className?: string;
}

/**
 * Self-wiring cut button — copies the selection to the clipboard, then deletes
 * it (undoable when a `<GraphHistoryProvider>` is present). Disabled when
 * nothing is selected. Requires a `<GraphClipboardProvider>` + a
 * `ClickSelectBehaviour`.
 */
export function CutButton({
  icon,
  title = 'Cut',
  clickSelectId,
  canvas,
  className,
}: CutButtonProps) {
  const { cut, hasSelection } = useClipboard(
    clickSelectId ? { clickSelectId } : {},
    canvas,
  );
  return (
    <ControlButton
      icon={icon}
      title={title}
      onClick={cut}
      disabled={!hasSelection}
      className={className}
    />
  );
}
