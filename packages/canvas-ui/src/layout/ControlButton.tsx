import { Button } from '@invana/ui';

import type { ToolbarIcon } from './types';

export interface ControlButtonProps {
  /** Icon component (e.g. a `lucide-react` glyph). Consumer-supplied — icon-agnostic. */
  icon: ToolbarIcon;
  onClick: () => void;
  /** Tooltip + accessible label. */
  title: string;
  /** Active styling — `'default'` (filled) vs `'ghost'` Button variant. Default `false`. */
  active?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * A single icon control button — the building block to drop into a {@link Panel}
 * (the canvas equivalent of React Flow's `<ControlButton>`). Thin wrapper over
 * the `@invana/ui` `Button`; active state uses Button variants, not Tailwind, so
 * it works without the host running Tailwind.
 */
export function ControlButton({
  icon: Icon,
  onClick,
  title,
  active = false,
  disabled = false,
  className,
}: ControlButtonProps) {
  return (
    <Button
      variant={active ? 'default' : 'ghost'}
      size="icon"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={className}
    >
      <Icon size={16} />
    </Button>
  );
}
