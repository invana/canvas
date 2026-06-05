import { useCallback, useEffect, useState } from 'react';

/** Open menu: where it sits (screen / canvas-relative px) + what it carries. */
export interface ContextMenuState<T> {
  /** Left offset in px, relative to the positioned ancestor (the `<Canvas>` host). */
  x: number;
  /** Top offset in px, relative to the positioned ancestor. */
  y: number;
  /** Caller-defined payload — typically the per-target menu items to render. */
  items: T;
}

export interface UseContextMenuResult<T> {
  /** Current open menu, or `null` when closed. */
  menu: ContextMenuState<T> | null;
  /** Open (or move) the menu at `(x, y)` carrying `items`. */
  open: (x: number, y: number, items: T) => void;
  /** Close the menu. */
  close: () => void;
}

/**
 * Headless open/close + position state for a right-click context menu, with the
 * dismissal lifecycle baked in: while a menu is open, an outside `pointerdown`
 * or `Escape` closes it.
 *
 * Pairs with `<ContextMenuBehaviour onContextMenu={…}>` (which supplies the
 * target + `screen` position) and `<ContextMenuOverlay>` (which renders the
 * menu). Feed `e.screen.x / e.screen.y` straight into {@link open}; because the
 * `<Canvas>` host is `position: relative`, those coordinates place the overlay
 * correctly when it's rendered as a `<Canvas>` descendant.
 *
 * The opening right-click's `pointerdown` fires *before* this effect's listener
 * attaches, so the menu never self-closes. `<ContextMenuOverlay>` stops
 * `pointerdown` propagation, so clicks *inside* the menu don't dismiss it —
 * leaf `onClick`s call {@link close} explicitly.
 *
 * Generic over the payload `T` so it stays UI-kit-agnostic; the graph stories
 * parameterise it as `MenuItem[]` (from `@invana/ui`).
 *
 * @example
 * ```tsx
 * const { menu, open, close } = useContextMenu<MenuItem[]>();
 * const onContextMenu = (e: ContextMenuEvent) =>
 *   open(e.screen.x, e.screen.y, buildItems(e, close));
 * // …
 * <ContextMenuBehaviour layerId="graph" onContextMenu={onContextMenu} />
 * {menu && <ContextMenuOverlay x={menu.x} y={menu.y} items={menu.items} />}
 * ```
 */
export function useContextMenu<T>(): UseContextMenuResult<T> {
  const [menu, setMenu] = useState<ContextMenuState<T> | null>(null);

  const close = useCallback(() => setMenu(null), []);
  const open = useCallback((x: number, y: number, items: T) => {
    setMenu({ x, y, items });
  }, []);

  useEffect(() => {
    if (!menu) return;
    const onKey = (ev: KeyboardEvent): void => {
      if (ev.key === 'Escape') close();
    };
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [menu, close]);

  return { menu, open, close };
}
