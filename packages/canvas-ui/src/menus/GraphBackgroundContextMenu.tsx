import { useCallback } from 'react';
import type { ContextMenuEvent } from '@invana/graph';
import type { MenuItem } from '@invana/ui';

import {
  GraphContextMenuRoot,
  type GraphContextMenuCommonProps,
  type GraphContextMenuContext,
} from './GraphContextMenuBase';

/** Context handed to {@link GraphBackgroundContextMenuProps.items}. */
export type GraphBackgroundMenuContext = GraphContextMenuContext;

export interface GraphBackgroundContextMenuProps extends GraphContextMenuCommonProps {
  /**
   * Build the menu shown when the **empty canvas** is right-clicked. Receives
   * the pointer position (`world` is handy for "add node here"), the live
   * `canvas`, and `close`. Return the `@invana/ui` `MenuItem[]` to render.
   */
  items: (ctx: GraphBackgroundMenuContext) => MenuItem[];
  /** Behaviour id; default `'background-context-menu'`. */
  id?: string;
}

/**
 * Background-scoped right-click menu for a `GraphLayer` — fires on a right-click
 * over the empty canvas (not on any node or edge). Drop it inside `<Canvas>`
 * (alongside the layer) and pass an `items` builder — the behaviour wiring,
 * positioning, dismissal (outside-click / Escape), and auto-close are handled
 * internally.
 *
 * Pairs with {@link GraphNodeContextMenu} and {@link GraphEdgeContextMenu}; each
 * owns a distinct behaviour scoped to its own target, so the three compose
 * without conflict.
 *
 * @example
 * ```tsx
 * <GraphBackgroundContextMenu
 *   items={({ world, canvas }) => [
 *     { id: 'add', label: 'Add node here', onClick: () => addNodeAt(world) },
 *     { id: 'fit', label: 'Fit to content', onClick: () => fit(canvas) },
 *   ]}
 * />
 * ```
 */
export function GraphBackgroundContextMenu({
  items,
  id = 'background-context-menu',
  ...common
}: GraphBackgroundContextMenuProps) {
  const build = useCallback(
    (_event: ContextMenuEvent, base: GraphContextMenuContext): MenuItem[] => items(base),
    [items],
  );
  return <GraphContextMenuRoot target="canvas" id={id} build={build} {...common} />;
}
