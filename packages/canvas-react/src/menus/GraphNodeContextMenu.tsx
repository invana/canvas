import { useCallback } from 'react';
import type { ContextMenuEvent } from '@invana/graph';
import type { MenuItem } from '@invana/ui';

import {
  GraphContextMenuRoot,
  type GraphContextMenuCommonProps,
  type GraphContextMenuContext,
  type GraphTargetMenuContext,
} from './GraphContextMenuBase';

/** Context handed to {@link GraphNodeContextMenuProps.items}. */
export type GraphNodeMenuContext = GraphTargetMenuContext;

export interface GraphNodeContextMenuProps extends GraphContextMenuCommonProps {
  /**
   * Build the menu shown when a **node** is right-clicked. Receives the node's
   * `id`, its `data`, the pointer position, the live `canvas`, and `close`.
   * Return the `@invana/ui` `MenuItem[]` to render.
   */
  items: (ctx: GraphNodeMenuContext) => MenuItem[];
  /** Behaviour id; default `'node-context-menu'`. */
  id?: string;
  /**
   * Transient state name applied to the right-clicked node while the menu is
   * open (e.g. `'context-open'`), cleared on the next open / dismiss. Default
   * `null` (no marker).
   */
  state?: string | null;
}

/**
 * Node-scoped right-click menu for a `GraphLayer`. Drop it inside `<Canvas>`
 * (alongside the layer) and pass an `items` builder — the behaviour wiring,
 * positioning, dismissal (outside-click / Escape), and auto-close are handled
 * internally.
 *
 * Pairs with {@link GraphEdgeContextMenu} and {@link GraphBackgroundContextMenu};
 * each owns a distinct behaviour scoped to its own target, so the three compose
 * without conflict.
 *
 * @example
 * ```tsx
 * <GraphNodeContextMenu
 *   items={({ id, canvas, close }) => [
 *     { id: 'edit', label: 'Edit', onClick: () => editNode(id) },
 *     { id: 'delete', label: 'Delete', onClick: () => deleteNode(id) },
 *   ]}
 * />
 * ```
 */
export function GraphNodeContextMenu({
  items,
  id = 'node-context-menu',
  ...common
}: GraphNodeContextMenuProps) {
  const build = useCallback(
    (event: ContextMenuEvent, base: GraphContextMenuContext): MenuItem[] =>
      items({ ...base, id: event.id as string, data: event.data }),
    [items],
  );
  return <GraphContextMenuRoot target="node" id={id} build={build} {...common} />;
}
