import type { Canvas as EngineCanvas } from '@invana/canvas';

import type { ToolbarIcon, TooltipSide } from './types';
import { LockToggle } from './LockToggle';
import { useLock } from '../hooks/useLock';

export interface LockButtonProps {
  lockedIcon: ToolbarIcon;
  unlockedIcon: ToolbarIcon;
  /** Behaviour ids disabled while locked. Default `['pan', 'drag-node']`. */
  behaviourIds?: string[];
  /** Initial locked state. Default `false`. */
  initialLocked?: boolean;
  /** Side the tooltip is placed on. Default `'top'`. */
  tooltipSide?: TooltipSide;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: EngineCanvas | null;
  className?: string;
}

/**
 * Self-wiring lock toggle — disables pan + node drag (by default) while locked,
 * leaving zoom available. Wraps the dumb {@link LockToggle} with {@link useLock}.
 */
export function LockButton({
  lockedIcon,
  unlockedIcon,
  behaviourIds,
  initialLocked,
  tooltipSide,
  canvas,
  className,
}: LockButtonProps) {
  const { locked, toggleLock } = useLock(
    {
      ...(behaviourIds ? { behaviourIds } : {}),
      ...(initialLocked !== undefined ? { initialLocked } : {}),
    },
    canvas,
  );
  return (
    <LockToggle
      locked={locked}
      onToggle={toggleLock}
      lockedIcon={lockedIcon}
      unlockedIcon={unlockedIcon}
      tooltipSide={tooltipSide}
      className={className}
    />
  );
}
