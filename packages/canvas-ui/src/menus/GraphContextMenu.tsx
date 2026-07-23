import { useCallback } from 'react';
import type { ClickSelectBehaviour, GraphLayer } from '@invana/graph';
import type { MenuItem } from '@invana/ui';
import { Crosshair, Eye, EyeOff, MousePointer2 } from 'lucide-react';

import { GraphNodeContextMenu, type GraphNodeMenuContext } from './GraphNodeContextMenu';
import { GraphEdgeContextMenu, type GraphEdgeMenuContext } from './GraphEdgeContextMenu';
import type { GraphContextMenuCommonProps } from './GraphContextMenuBase';

export interface GraphContextMenuProps extends GraphContextMenuCommonProps {
  /** Mount the node menu. Default `true`. */
  nodes?: boolean;
  /** Mount the edge menu. Default `true`. */
  edges?: boolean;
  /**
   * `ClickSelectBehaviour` id backing the **Select** action. Default
   * `'click-select'` (what `GraphCanvasApp` registers). Set `null` to drop the
   * Select item (e.g. no selection behaviour on the canvas).
   */
  selectBehaviourId?: string | null;
  /** Zoom the node **Focus** action zooms in to. Default `2`. */
  focusZoom?: number;
  /**
   * Transform the default **node** items before render — append, prepend, or
   * replace. Receives the menu context and the built-in items
   * (Focus · Select · Hide/Show). Return the final `MenuItem[]`.
   */
  nodeItems?: (ctx: GraphNodeMenuContext, defaults: MenuItem[]) => MenuItem[];
  /** Transform the default **edge** items — as {@link nodeItems}, for edges. */
  edgeItems?: (ctx: GraphEdgeMenuContext, defaults: MenuItem[]) => MenuItem[];
}

/**
 * The **standard, batteries-included** graph context menu — the right-click
 * equivalent of the default settings panel. Drop it inside `<Canvas>` (or under a
 * non-null lifted `GraphCanvasContext`) with **zero config** and every node/edge
 * gets a sensible menu: **Focus** (fit the element in view), **Select** (add it to
 * the selection), and **Hide/Show** (first-class visibility — restore it from
 * {@link CanvasFiltersViewPanel}).
 *
 * ```tsx
 * <GraphCanvas data={graph}>
 *   <GraphContextMenu />          // node + edge menus, standard items
 * </GraphCanvas>
 * ```
 *
 * It composes the two target-scoped primitives ({@link GraphNodeContextMenu} +
 * {@link GraphEdgeContextMenu}) — reach for those directly (with a bespoke `items`
 * builder) only when the standard set doesn't fit. To *extend* the standard set,
 * pass {@link GraphContextMenuProps.nodeItems} / `edgeItems` and spread the
 * `defaults` you're handed. Add the empty-canvas menu with a separate
 * {@link GraphBackgroundContextMenu}.
 */
export function GraphContextMenu({
  nodes = true,
  edges = true,
  selectBehaviourId = 'click-select',
  focusZoom = 2,
  nodeItems,
  edgeItems,
  layerId = 'graph',
  ...common
}: GraphContextMenuProps) {
  const buildNode = useCallback(
    (ctx: GraphNodeMenuContext): MenuItem[] => {
      const layer = ctx.canvas.layers.get<GraphLayer>(layerId);
      const select =
        selectBehaviourId != null
          ? ctx.canvas.behaviours.get<ClickSelectBehaviour>(selectBehaviourId)
          : undefined;
      const hidden = layer?.isNodeHidden(ctx.id) ?? false;
      const defaults: MenuItem[] = [
        {
          id: 'focus',
          label: 'Focus',
          icon: Crosshair,
          onClick: () => layer?.focusNode(ctx.id, { zoom: focusZoom }),
        },
        ...(select
          ? [
              {
                id: 'select',
                label: 'Select',
                icon: MousePointer2,
                onClick: () => select.select(ctx.id, 'shape'),
              } satisfies MenuItem,
            ]
          : []),
        hidden
          ? { id: 'toggle-hidden', label: 'Show', icon: Eye, onClick: () => layer?.showNode(ctx.id) }
          : { id: 'toggle-hidden', label: 'Hide', icon: EyeOff, onClick: () => layer?.hideNode(ctx.id) },
      ];
      return nodeItems ? nodeItems(ctx, defaults) : defaults;
    },
    [layerId, selectBehaviourId, focusZoom, nodeItems],
  );

  const buildEdge = useCallback(
    (ctx: GraphEdgeMenuContext): MenuItem[] => {
      const layer = ctx.canvas.layers.get<GraphLayer>(layerId);
      const select =
        selectBehaviourId != null
          ? ctx.canvas.behaviours.get<ClickSelectBehaviour>(selectBehaviourId)
          : undefined;
      const hidden = layer?.isEdgeHidden(ctx.id) ?? false;
      const defaults: MenuItem[] = [
        {
          id: 'focus',
          label: 'Focus',
          icon: Crosshair,
          onClick: () => layer?.focusEdges([ctx.id]),
        },
        ...(select
          ? [
              {
                id: 'select',
                label: 'Select',
                icon: MousePointer2,
                onClick: () => select.select(ctx.id, 'connector'),
              } satisfies MenuItem,
            ]
          : []),
        hidden
          ? { id: 'toggle-hidden', label: 'Show', icon: Eye, onClick: () => layer?.showEdge(ctx.id) }
          : { id: 'toggle-hidden', label: 'Hide', icon: EyeOff, onClick: () => layer?.hideEdge(ctx.id) },
      ];
      return edgeItems ? edgeItems(ctx, defaults) : defaults;
    },
    [layerId, selectBehaviourId, focusZoom, edgeItems],
  );

  return (
    <>
      {nodes ? <GraphNodeContextMenu items={buildNode} layerId={layerId} {...common} /> : null}
      {edges ? <GraphEdgeContextMenu items={buildEdge} layerId={layerId} {...common} /> : null}
    </>
  );
}
