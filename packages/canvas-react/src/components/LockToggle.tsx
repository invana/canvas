import { Button } from '@invana/ui';

import { Tooltipped } from './Tooltipped';
import type { ToolbarIcon, TooltipSide } from './types';

export interface LockToggleProps {
  /** Whether the view is locked (drives icon + active styling). */
  locked: boolean;
  onToggle: () => void;
  lockedIcon: ToolbarIcon;
  unlockedIcon: ToolbarIcon;
  /** Side the tooltip is placed on. Default `'top'`. */
  tooltipSide?: TooltipSide;
  className?: string;
}

/**
 * Toggle button for a "lock view" action (the consumer decides what locking
 * disables — e.g. pan + drag). Shows the locked icon and active styling while
 * locked. The tooltip + accessible label flips with state
 * ("Lock view" / "Unlock view").
 */
export function LockToggle({
  locked,
  onToggle,
  lockedIcon: LockedIcon,
  unlockedIcon: UnlockedIcon,
  tooltipSide,
  className,
}: LockToggleProps) {
  const Icon = locked ? LockedIcon : UnlockedIcon;
  const label = locked ? 'Unlock view' : 'Lock view';
  return (
    <Tooltipped label={label} side={tooltipSide}>
      <Button
        variant={locked ? 'default' : 'ghost'}
        size="icon"
        aria-label={label}
        onClick={onToggle}
        className={className}
      >
        <Icon size={16} />
      </Button>
    </Tooltipped>
  );
}
