import type { CSSProperties } from 'react';
import { NestedMenu, type MenuItem } from '@invana/ui';

export interface ContextMenuOverlayProps {
  /** Left offset in px, relative to the positioned ancestor (the `<Canvas>` host). */
  x: number;
  /** Top offset in px, relative to the positioned ancestor. */
  y: number;
  /** Menu tree to render (per-target; leaves carry their own `onClick`). */
  items: MenuItem[];
  /** Stacking order; default `1000` so the menu floats over canvas chrome. */
  zIndex?: number;
  /** Extra inline style merged onto the positioned wrapper. */
  style?: CSSProperties;
}

/**
 * Dumb overlay for a right-click context menu: an absolutely-positioned
 * `@invana/ui` `<NestedMenu>` anchored at `(x, y)` within its positioned
 * ancestor. Engine-agnostic, props-in only — the open/close state and the
 * action wiring live in the consumer (`useContextMenu` + the menu items).
 *
 * Render it as a `<Canvas>` descendant: the host `<div>` is `position: relative`,
 * so `(x, y)` taken from `ContextMenuEvent.screen` lands the menu at the cursor.
 *
 * It **stops `pointerdown` propagation** so a click *inside* the menu doesn't
 * reach the window-level dismiss listener `useContextMenu` attaches, and
 * **prevents the native context menu** on a right-click over itself. Leaf items
 * close the menu via their own `onClick`.
 */
export function ContextMenuOverlay({ x, y, items, zIndex = 1000, style }: ContextMenuOverlayProps) {
  return (
    <div
      style={{ position: 'absolute', left: x, top: y, zIndex, ...style }}
      onPointerDown={(ev) => ev.stopPropagation()}
      onContextMenu={(ev) => ev.preventDefault()}
    >
      <NestedMenu menuItems={items} />
    </div>
  );
}
