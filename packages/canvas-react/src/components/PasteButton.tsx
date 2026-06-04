import type { Canvas as EngineCanvas } from '@invana/canvas';

import type { ToolbarIcon } from './types';
import { ControlButton } from './ControlButton';
import { useClipboard } from '../hooks/useClipboard';

export interface PasteButtonProps {
  icon: ToolbarIcon;
  /** Tooltip / accessible label. Default `'Paste'`. */
  title?: string;
  /** Id of the `ClickSelectBehaviour` the pasted items are re-selected on. Default `'click-select'`. */
  clickSelectId?: string;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: EngineCanvas | null;
  className?: string;
}

/**
 * Self-wiring paste button — inserts the clipboard buffer (offset + re-id'd) and
 * selects the pasted items. Disabled when the buffer is empty. Requires a
 * `<GraphClipboardProvider>`; undoable when a `<GraphHistoryProvider>` is present.
 */
export function PasteButton({
  icon,
  title = 'Paste',
  clickSelectId,
  canvas,
  className,
}: PasteButtonProps) {
  const { paste, canPaste } = useClipboard(
    clickSelectId ? { clickSelectId } : {},
    canvas,
  );
  return (
    <ControlButton
      icon={icon}
      title={title}
      onClick={paste}
      disabled={!canPaste}
      className={className}
    />
  );
}
