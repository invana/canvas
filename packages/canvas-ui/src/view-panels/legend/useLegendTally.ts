// useLegendTally — the live counts behind every legend: the drawn elements of a
// graph layer grouped by a key (their type, by default), each group with its
// count, its colour and whether its whole type is hidden. `LegendViewPanel`
// (the dock) and `CanvasLegend` (the overlay on the canvas) both read it, so the
// two can never count differently.
//
// It follows the store's add / remove / visibility events and the layer's
// `data:changed`, coalesced per animation frame. An element hidden one by one
// (the explicit `hidden` flag — a filter, right-click → Hide) is left out; an
// edge counts only while neither of its ends is hidden. A type hidden whole
// keeps its count and is marked, so a legend can keep its entry to bring it back.

import { recordsOnly } from '@invana/graph';
import type { GraphCanvas, GraphEdge, GraphLayer, GraphNode } from '@invana/graph';
import type { LegendSwatchKind } from '@invana/ui';
import { useEffect, useRef, useState } from 'react';

/** One legend entry as counted. */
export interface LegendTallyRow {
  /** The group key — a type, or whatever `groupBy` returned. */
  value: string;
  count: number;
  /** The first element's colour, as `colorOf` gave it. */
  color: string | undefined;
  /** The first element's swatch, as `kindOf` gave it. */
  kind: LegendSwatchKind | undefined;
  /** Every element of the group is of a type hidden whole (`hiddenTypes`). */
  hidden: boolean;
}

/** How one legend section groups and colours the drawn elements of one kind. */
export type LegendTallySpec =
  | {
      element: 'node';
      /** The node's group key; `undefined` leaves it out. Default its type. */
      groupBy?: (node: GraphNode) => string | undefined;
      /** The colour a group's swatch wears, read from its first node. */
      colorOf?: (node: GraphNode, layer: GraphLayer) => string | undefined;
      /** The swatch a group wears, read from its first node. */
      kindOf?: (node: GraphNode, layer: GraphLayer) => LegendSwatchKind | undefined;
    }
  | {
      element: 'edge';
      /** The edge's group key; `undefined` leaves it out. Default its type. */
      groupBy?: (edge: GraphEdge) => string | undefined;
      /** The colour a group's swatch wears, read from its first edge. */
      colorOf?: (edge: GraphEdge, layer: GraphLayer) => string | undefined;
      /** The swatch a group wears, read from its first edge. */
      kindOf?: (edge: GraphEdge, layer: GraphLayer) => LegendSwatchKind | undefined;
    };

/**
 * Count the drawn nodes and edges of `layerId` on `canvas`, live — one list of
 * rows per spec, in the order given, each largest first.
 *
 * `specs` are read on every rebuild through a ref, so a host may pass fresh
 * functions each render without resubscribing.
 */
export function useLegendTally(canvas: GraphCanvas | null, layerId: string, specs: readonly LegendTallySpec[]): LegendTallyRow[][] {
  const [rows, setRows] = useState<LegendTallyRow[][]>([]);
  const frame = useRef<number | null>(null);
  const specsRef = useRef(specs);
  specsRef.current = specs;

  useEffect(() => {
    const layer = canvas?.layers.get<GraphLayer>(layerId);
    if (!layer) return;
    const store = layer.store;
    const rebuild = () => {
      frame.current = null;
      const hidden = layer.hiddenTypes;
      const nodes = recordsOnly(store.nodes()).filter((n) => !n.hidden);
      const edges = recordsOnly(store.edges()).filter(
        (e) => !e.hidden && !store.isNodeHidden(e.source) && !store.isNodeHidden(e.target),
      );
      setRows(
        specsRef.current.map((spec) =>
          spec.element === 'node'
            ? tally(nodes, hidden.node, spec.groupBy, (n) => [spec.colorOf?.(n, layer), spec.kindOf?.(n, layer)])
            : tally(edges, hidden.edge, spec.groupBy, (e) => [spec.colorOf?.(e, layer), spec.kindOf?.(e, layer)]),
        ),
      );
    };
    const schedule = () => {
      if (frame.current === null) frame.current = requestAnimationFrame(rebuild);
    };
    const offs = (['node:add', 'node:remove', 'edge:add', 'edge:remove', 'node:visibility', 'edge:visibility'] as const).map((ev) =>
      store.events.on(ev, schedule),
    );
    offs.push(layer.events.on('data:changed', schedule));
    schedule();
    return () => {
      for (const off of offs) off();
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, [canvas, layerId]);

  return rows;
}

/** Elements grouped by key, largest first; the colour from the first of each. */
function tally<T extends { type?: string }>(
  items: readonly T[],
  hiddenTypes: readonly string[],
  groupBy: ((item: T) => string | undefined) | undefined,
  swatchOf: (item: T) => [string | undefined, LegendSwatchKind | undefined],
): LegendTallyRow[] {
  const out = new Map<string, LegendTallyRow>();
  for (const item of items) {
    const value = groupBy ? groupBy(item) : (item.type ?? '');
    if (value === undefined) continue;
    const typeHidden = hiddenTypes.includes(item.type ?? '');
    const row = out.get(value);
    if (row) {
      row.count += 1;
      row.hidden &&= typeHidden;
    } else {
      const [color, kind] = swatchOf(item);
      out.set(value, { value, count: 1, color, kind, hidden: typeHidden });
    }
  }
  return [...out.values()].sort((a, b) => b.count - a.count);
}
