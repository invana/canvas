import { useCallback, type CSSProperties } from 'react';
import type { Canvas } from '@invana/canvas';
import type { ContextMenuEvent, ContextMenuTargetType } from '@invana/graph';
import type { MenuItem } from '@invana/ui';

import { useCanvas } from '../CanvasContext';
import { ContextMenuBehaviour } from '../behaviours/ContextMenuBehaviour';
import { ContextMenuOverlay } from '../components/ContextMenuOverlay';
import { useContextMenu } from '../hooks/useContextMenu';

/**
 * Context handed to a context-menu `items` builder for an empty-canvas
 * (background) right-click. Carries the pointer position, the live `Canvas`,
 * and a `close` callback for items that need to dismiss the menu explicitly
 * (auto-close already fires `close` after every leaf `onClick`).
 */
export interface GraphContextMenuContext {
  /** Pointer position in world (scene) coordinates — e.g. to place a new node. */
  readonly world: { readonly x: number; readonly y: number };
  /** Pointer position in canvas-relative screen px (where the overlay sits). */
  readonly screen: { readonly x: number; readonly y: number };
  /** The live engine instance, for reaching layers / behaviours / camera. */
  readonly canvas: Canvas;
  /** Dismiss the menu. Available for manual control; auto-close uses it too. */
  readonly close: () => void;
}

/**
 * Context handed to a node/edge context-menu `items` builder. Extends
 * {@link GraphContextMenuContext} with the right-clicked element's `id` and its
 * arbitrary `data` payload (`node.data` / `edge.data`).
 */
export interface GraphTargetMenuContext extends GraphContextMenuContext {
  /** Id of the right-clicked node / edge. */
  readonly id: string;
  /** Arbitrary user payload from `node.data` / `edge.data` (`undefined` if none). */
  readonly data: unknown;
}

/** Options shared by all three `Graph*ContextMenu` components. */
export interface GraphContextMenuCommonProps {
  /** GraphLayer id whose nodes/edges this menu watches; default `'graph'`. */
  layerId?: string;
  /** Whether the menu is active; reactive. Default `true`. */
  enabled?: boolean;
  /** Stacking order of the overlay; default `1000`. */
  zIndex?: number;
  /** Extra inline style merged onto the overlay wrapper. */
  style?: CSSProperties;
  /**
   * Auto-close the menu after any leaf item's `onClick`. Default `true`.
   * Set `false` to manage dismissal yourself via `ctx.close`.
   */
  autoClose?: boolean;
}

/**
 * Recursively wrap every leaf `onClick` so it also closes the menu. Items that
 * only open a submenu (no `onClick`) are left untouched; their `children` are
 * wrapped in turn. `close` is idempotent, so an `onClick` that already calls it
 * is harmless.
 */
function withAutoClose(items: MenuItem[], close: () => void): MenuItem[] {
  return items.map((item) => {
    const next: MenuItem = { ...item };
    if (item.children) next.children = withAutoClose(item.children, close);
    if (item.onClick) {
      const original = item.onClick;
      next.onClick = (): void => {
        original();
        close();
      };
    }
    return next;
  });
}

/** Props for the internal single-target root the public components delegate to. */
interface GraphContextMenuRootProps extends GraphContextMenuCommonProps {
  /** The one target type this menu responds to. */
  target: ContextMenuTargetType;
  /** Behaviour id — unique per target so the three menus coexist. */
  id: string;
  /** Transient state to mark the right-clicked node/edge while open (node/edge only). */
  state?: string | null;
  /** Build the menu tree from the right-click event + shared context. */
  build: (event: ContextMenuEvent, base: GraphContextMenuContext) => MenuItem[];
}

/**
 * Shared engine for the three target-scoped context menus. Owns one
 * single-target `ContextMenuBehaviour`, the open/close state (via
 * `useContextMenu`), and the overlay. The public components are thin wrappers
 * that fix `target` / `id` and adapt the event into their typed `items` builder.
 *
 * Not exported from the package — use `GraphNodeContextMenu`,
 * `GraphEdgeContextMenu`, or `GraphBackgroundContextMenu`.
 */
export function GraphContextMenuRoot({
  target,
  id,
  layerId = 'graph',
  enabled = true,
  zIndex,
  style,
  autoClose = true,
  state = null,
  build,
}: GraphContextMenuRootProps) {
  const canvas = useCanvas();
  const { menu, open, close } = useContextMenu<MenuItem[]>();

  const onContextMenu = useCallback(
    (event: ContextMenuEvent): void => {
      const base: GraphContextMenuContext = {
        world: event.world,
        screen: event.screen,
        canvas,
        close,
      };
      const items = build(event, base);
      open(event.screen.x, event.screen.y, autoClose ? withAutoClose(items, close) : items);
    },
    [canvas, build, autoClose, open, close],
  );

  return (
    <>
      <ContextMenuBehaviour
        id={id}
        layerId={layerId}
        enabled={enabled}
        targets={[target]}
        state={state}
        onContextMenu={onContextMenu}
      />
      {menu && (
        <ContextMenuOverlay x={menu.x} y={menu.y} items={menu.items} zIndex={zIndex} style={style} />
      )}
    </>
  );
}
