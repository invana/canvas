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
  /** Active styling — applies the design-kit nav-item treatment. Default `false`. */
  active?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Active-state classes mirroring the design-kit sidebar nav items: a faint
 * primary tint, primary-coloured icon/text, and a thin primary ring — a subtle
 * "selected" affordance rather than a solid fill. Requires the host to run the
 * design-kit Tailwind theme (which provides the `primary` token).
 */
export const ACTIVE_CLASS = 'bg-primary/15 text-primary ring-1 ring-primary/25';

/**
 * Active-state classes for a **selected item inside a dropdown menu** (radio
 * pickers). A lighter variant of {@link ACTIVE_CLASS} — primary text + medium
 * weight only, dropping the tint + ring that read as heavy in a menu list, so
 * the selected option matches the toolbar's primary accent without clutter.
 */
export const ACTIVE_MENU_ITEM_CLASS = 'text-primary font-medium';

/**
 * A single icon control button — the building block to drop into a {@link Panel}
 * (the canvas equivalent of React Flow's `<ControlButton>`). Thin wrapper over
 * the `@invana/ui` `Button`; active state mirrors the design-kit nav items
 * ({@link ACTIVE_CLASS}) layered over the `'ghost'` variant.
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
        variant="ghost"
        size="icon"
        aria-label={title}
        disabled={disabled}
        onClick={onClick}
        className={[active && ACTIVE_CLASS, className].filter(Boolean).join(' ') || undefined}
      >
        <Icon size={16} />
      </Button>
    </Tooltipped>
  );
}
