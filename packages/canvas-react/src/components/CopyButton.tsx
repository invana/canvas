import type { Canvas as EngineCanvas } from '@invana/canvas';

import type { ToolbarIcon } from './types';
import { ControlButton } from './ControlButton';
import { useClipboard } from '../hooks/useClipboard';

export interface CopyButtonProps {
  icon: ToolbarIcon;
  /** Tooltip / accessible label. Default `'Copy'`. */
  title?: string;
  /** Id of the `ClickSelectBehaviour` to read selection from. Default `'click-select'`. */
  clickSelectId?: string;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: EngineCanvas | null;
  className?: string;
}

/**
 * Self-wiring copy button — copies the selection to the clipboard. Disabled when
 * nothing is selected. Requires a `<GraphClipboardProvider>` + a
 * `ClickSelectBehaviour`.
 */
export function CopyButton({
  icon,
  title = 'Copy',
  clickSelectId,
  canvas,
  className,
}: CopyButtonProps) {
  const { copy, hasSelection } = useClipboard(
    clickSelectId ? { clickSelectId } : {},
    canvas,
  );
  return (
    <ControlButton
      icon={icon}
      title={title}
      onClick={copy}
      disabled={!hasSelection}
      className={className}
    />
  );
}
