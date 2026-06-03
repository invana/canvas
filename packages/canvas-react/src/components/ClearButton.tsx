import { Button } from '@invana/ui';

import type { ToolbarIcon } from './types';

export interface ClearButtonProps {
  onClear: () => void;
  /** Optional leading icon (e.g. a trash glyph). */
  icon?: ToolbarIcon;
  /** Button text. Default `'Clear'`. */
  label?: string;
  className?: string;
}

/** A labelled action button — clears the canvas (or whatever `onClear` does). */
export function ClearButton({ onClear, icon: Icon, label = 'Clear', className }: ClearButtonProps) {
  return (
    <Button variant="outline" size="sm" onClick={onClear} className={className}>
      {Icon ? <Icon size={16} /> : null}
      {label}
    </Button>
  );
}
