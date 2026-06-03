import type { ComponentType } from 'react';

/**
 * Icon component accepted by the UI controls. These components are
 * **icon-agnostic** — the consumer passes the icon (e.g. a `lucide-react`
 * glyph), so the package takes on no icon dependency. Any component that renders
 * from `size` / `className` satisfies this (lucide icons do).
 */
export type ToolbarIcon = ComponentType<{ size?: number | string; className?: string }>;

/** Anchor position for a {@link Panel} within its positioned ancestor. */
export type PanelPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';
