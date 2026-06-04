import { Button } from '@invana/ui';

import { Tooltipped } from './Tooltipped';
import type { ToolbarIcon, TooltipSide } from './types';

export interface ControlButtonProps {
  /** Icon component (e.g. a `lucide-react` glyph). Consumer-supplied — icon-agnostic. */
  icon: ToolbarIcon;
  onClick: () => void;
  /** Tooltip content + accessible label. */
  title: string;
  /** Side the tooltip is placed on. Default `'top'`. */
  tooltipSide?: TooltipSide;
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
 *
 * `title` drives both a real hover tooltip (via {@link Tooltipped}) and the
 * `aria-label`, so the icon-only button stays usable and accessible inside a
 * compact `NavHorizontal` / `NavVertical`.
 */
export function ControlButton({
  icon: Icon,
  onClick,
  title,
  tooltipSide,
  active = false,
  disabled = false,
  className,
}: ControlButtonProps) {
  return (
    <Tooltipped label={title} side={tooltipSide}>
      <Button
        variant={active ? 'default' : 'ghost'}
        size="icon"
        aria-label={title}
        disabled={disabled}
        onClick={onClick}
        className={className}
      >
        <Icon size={16} />
      </Button>
    </Tooltipped>
  );
}
