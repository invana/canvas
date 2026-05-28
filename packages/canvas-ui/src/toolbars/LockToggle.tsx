import { Button } from '@invana/ui';

import type { ToolbarIcon } from './types';

export interface LockToggleProps {
  /** Whether the view is locked (drives icon + active styling). */
  locked: boolean;
  onToggle: () => void;
  lockedIcon: ToolbarIcon;
  unlockedIcon: ToolbarIcon;
  className?: string;
}

/**
 * Toggle button for a "lock view" action (the consumer decides what locking
 * disables — e.g. pan + drag). Shows the locked icon and active styling while
 * locked.
 */
export function LockToggle({
  locked,
  onToggle,
  lockedIcon: LockedIcon,
  unlockedIcon: UnlockedIcon,
  className,
}: LockToggleProps) {
  const Icon = locked ? LockedIcon : UnlockedIcon;
  return (
    <Button
      variant={locked ? 'default' : 'ghost'}
      size="icon"
      title={locked ? 'Unlock view' : 'Lock view'}
      onClick={onToggle}
      className={className}
    >
      <Icon size={16} />
    </Button>
  );
}
