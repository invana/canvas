import { useCallback } from 'react';
import type { ContextMenuEvent } from '@invana/graph';
import type { MenuItem } from '@invana/ui';

import {
  GraphContextMenuRoot,
  type GraphContextMenuCommonProps,
  type GraphContextMenuContext,
  type GraphTargetMenuContext,
} from './GraphContextMenuBase';

/** Context handed to {@link GraphEdgeContextMenuProps.items}. */
export type GraphEdgeMenuContext = GraphTargetMenuContext;

export interface GraphEdgeContextMenuProps extends GraphContextMenuCommonProps {
  /**
   * Build the menu shown when an **edge** is right-clicked. Receives the edge's
   * `id`, its `data`, the pointer position, the live `canvas`, and `close`.
   * Return the `@invana/ui` `MenuItem[]` to render.
   */
  items: (ctx: GraphEdgeMenuContext) => MenuItem[];
  /** Behaviour id; default `'edge-context-menu'`. */
  id?: string;
  /**
   * Transient state name applied to the right-clicked edge while the menu is
   * open (e.g. `'context-open'`), cleared on the next open / dismiss. Default
   * `null` (no marker).
   */
  state?: string | null;
}

/**
 * Edge-scoped right-click menu for a `GraphLayer`. Drop it inside `<Canvas>`
 * (alongside the layer) and pass an `items` builder — the behaviour wiring,
 * positioning, dismissal (outside-click / Escape), and auto-close are handled
 * internally.
 *
 * Pairs with {@link GraphNodeContextMenu} and {@link GraphBackgroundContextMenu};
 * each owns a distinct behaviour scoped to its own target, so the three compose
 * without conflict.
 *
 * @example
 * ```tsx
 * <GraphEdgeContextMenu
 *   items={({ id, close }) => [
 *     { id: 'reverse', label: 'Reverse direction', onClick: () => reverseEdge(id) },
 *     { id: 'delete', label: 'Delete', onClick: () => deleteEdge(id) },
 *   ]}
 * />
 * ```
 */
export function GraphEdgeContextMenu({
  items,
  id = 'edge-context-menu',
  ...common
}: GraphEdgeContextMenuProps) {
  const build = useCallback(
    (event: ContextMenuEvent, base: GraphContextMenuContext): MenuItem[] =>
      items({ ...base, id: event.id as string, data: event.data }),
    [items],
  );
  return <GraphContextMenuRoot target="edge" id={id} build={build} {...common} />;
}
