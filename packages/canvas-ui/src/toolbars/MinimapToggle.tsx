import { Button } from '@invana/ui';

import type { ToolbarIcon } from './types';

export interface MinimapToggleProps {
  /** Whether the minimap is currently shown (drives the active styling). */
  active: boolean;
  onToggle: () => void;
  icon: ToolbarIcon;
  className?: string;
}

/**
 * Toggle button for minimap visibility. Active state is rendered with the
 * `@invana/ui` `default` Button variant (no Tailwind dependency).
 */
export function MinimapToggle({ active, onToggle, icon: Icon, className }: MinimapToggleProps) {
  return (
    <Button
      variant={active ? 'default' : 'ghost'}
      size="icon"
      title={active ? 'Hide minimap' : 'Show minimap'}
      onClick={onToggle}
      className={className}
    >
      <Icon size={16} />
    </Button>
  );
}
