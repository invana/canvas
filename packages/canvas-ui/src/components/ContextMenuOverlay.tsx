import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { MenuItem } from '@invana/ui';

import { MenuItemList, type MenuHeader } from './MenuItemList';

export interface ContextMenuOverlayProps {
  /** Left offset in px, relative to the positioned ancestor (the `<Canvas>` host). */
  x: number;
  /** Top offset in px, relative to the positioned ancestor. */
  y: number;
  /** Menu tree to render (per-target; leaves carry their own `onClick`). */
  items: MenuItem[];
  /** What the menu is for, above its rows. */
  header?: MenuHeader;
  /** Stacking order; default `1000` so the menu floats over canvas chrome. */
  zIndex?: number;
  /** Extra inline style merged onto the positioned wrapper. */
  style?: CSSProperties;
}

/**
 * Dumb overlay for a right-click context menu: an absolutely-positioned
 * {@link MenuItemList} anchored at `(x, y)` within its positioned
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
export function ContextMenuOverlay({ x, y, items, header, zIndex = 1000, style }: ContextMenuOverlayProps) {
  // Opened near the board's right or bottom edge, the menu opens up / left of the
  // pointer instead, so it never runs off the board.
  const ref = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState({ left: x, top: y });
  useLayoutEffect(() => {
    const el = ref.current;
    const host = el?.offsetParent as HTMLElement | null | undefined;
    if (!el || !host) return setAt({ left: x, top: y });
    const { offsetWidth: w, offsetHeight: h } = el;
    const left = x + w > host.clientWidth ? Math.max(4, x - w) : x;
    const top = y + h > host.clientHeight ? Math.max(4, host.clientHeight - h - 4) : y;
    setAt({ left, top });
  }, [x, y, items, header]);
  return (
    <div
      ref={ref}
      style={{ position: 'absolute', left: at.left, top: at.top, zIndex, ...style }}
      onPointerDown={(ev) => ev.stopPropagation()}
      onContextMenu={(ev) => ev.preventDefault()}
    >
      <MenuItemList items={items} {...(header ? { header } : {})} />
    </div>
  );
}
