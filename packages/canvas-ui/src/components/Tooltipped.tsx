import type { ReactElement, ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@invana/ui';

import type { TooltipSide } from './types';

export interface TooltippedProps {
  /**
   * Tooltip content (typically the host control's `title` / `label`). When
   * `null` / `undefined` / `''` the child renders **unwrapped** — no tooltip,
   * no extra DOM — so callers can pass an optional label without branching.
   */
  label?: ReactNode;
  /** Side the tooltip is placed on relative to the trigger. Default `'top'`. */
  side?: TooltipSide;
  /** Hover-open delay in ms. Default `0` (instant — matches a toolbar feel). */
  delayDuration?: number;
  /** The single trigger element (a `Button`, a dropdown trigger, …). */
  children: ReactElement;
}

/**
 * Wraps a single interactive element with an `@invana/ui` (Radix) tooltip
 * driven by `label`. The building-block that lets the dumb control components
 * surface their `title` / `label` as a real hover tooltip — readable when the
 * controls are dropped into a compact `NavHorizontal` / `NavVertical` slot,
 * where the native `title` attribute is easy to miss.
 *
 * Self-contained: bundles its own `TooltipProvider` (like `@invana/ui`'s
 * `ButtonWithTooltip`), so a control works standalone without the host wiring a
 * provider. `asChild` forwards the trigger props onto the child, preserving its
 * variant / size / active styling.
 *
 * The content background is pinned to `--color-popover` (opaque): the design
 * kit's default tooltip is translucent (`bg-popover/85` + backdrop-blur), which
 * reads as see-through over a busy canvas — same reasoning as the `RichSelect`
 * dropdown surfaces the {@link ToolbarItems} renderer uses.
 */
export function Tooltipped({ label, side, delayDuration = 0, children }: TooltippedProps) {
  if (label == null || label === '') return children;
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} style={{ backgroundColor: 'var(--color-popover)' }}>
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
