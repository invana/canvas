import type { ComponentType } from 'react';

/**
 * Icon component accepted by the UI controls. These components are
 * **icon-agnostic** — the consumer passes the icon (e.g. a `lucide-react`
 * glyph), so the package takes on no icon dependency. Any component that renders
 * from `size` / `className` satisfies this (lucide icons do).
 */
export type ToolbarIcon = ComponentType<{ size?: number | string; className?: string }>;

/**
 * Side a tooltip is placed on relative to its trigger. Mirrors the Radix /
 * `@invana/ui` `TooltipContent` `side` prop. A vertical Nav typically wants
 * `'right'`; a horizontal Nav `'bottom'`.
 */
export type TooltipSide = 'top' | 'right' | 'bottom' | 'left';

/**
 * Anchor position for a {@link Panel} within its positioned ancestor. The
 * corner / edge-centre values pin a content-sized overlay; `'left'` / `'right'`
 * make a **full-height side dock** flush to that edge.
 */
export type PanelPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'left'
  | 'right';
