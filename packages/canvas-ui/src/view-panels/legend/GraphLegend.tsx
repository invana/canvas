// GraphLegend — what the colours on the board mean: the kit's `Legend`, fed with
// the graph layer's node and relationship types and a live count of each.
// Nodes first as dots, then relationships as lines.
//
// The colour of a type is the drawing's own: by default the resolved fill of the
// first node of that type (the same swatch `FindInCanvasViewPanel` shows), or
// whatever `colorForType` says — a host that colours by type from a palette
// passes the same function its styling uses, so the legend can never disagree
// with the board. Counts follow the store's add / remove / visibility events,
// coalesced per animation frame.
//
// Each entry is the switch for its type: a click hides every node (or edge) of
// that type through the `graph.typeVisible` command — one undoable write of the
// layer's `hiddenTypes`, so it also holds for nodes an expansion brings in — and
// the entry stays, muted, to bring it back. A hidden type keeps its count.

import type { GraphCanvas, GraphEdge, GraphLayer, GraphNode } from '@invana/graph';
import { Eyebrow, Legend, LegendItem, cn } from '@invana/ui';
import { useEffect, useRef, useState } from 'react';

import { nodeSwatchColor } from '../element-display';

export interface GraphLegendProps {
  /** The live canvas (null until it is ready). */
  canvas: GraphCanvas | null;
  /** GraphLayer to read. Default `'graph'`. */
  layerId?: string;
  /** Colour per type; return `undefined` to fall back to the drawn swatch. */
  colorForType?: (type: string, kind: 'node' | 'edge') => string | undefined;
  /** Heading. Default `Legend`; `null` for none. */
  title?: string | null;
  /** Entries toggle their type's visibility. Default `true`. */
  toggleTypes?: boolean;
  className?: string;
}

interface Row {
  type: string;
  count: number;
  color: string | undefined;
  /** The whole type is hidden (`hiddenTypes`). */
  hidden: boolean;
}

/** Node and relationship types with live counts, coloured as drawn. */
export function GraphLegend({ canvas, layerId = 'graph', colorForType, title = 'Legend', toggleTypes = true, className }: GraphLegendProps) {
  const [rows, setRows] = useState<{ nodes: Row[]; edges: Row[] }>({ nodes: [], edges: [] });
  const frame = useRef<number | null>(null);
  const colorRef = useRef(colorForType);
  colorRef.current = colorForType;

  useEffect(() => {
    const layer = canvas?.layers.get<GraphLayer>(layerId);
    if (!layer) return;
    const rebuild = () => {
      frame.current = null;
      const hidden = layer.hiddenTypes;
      setRows({
        nodes: tally(layer.store.nodes(), hidden.node, (n: GraphNode) => colorRef.current?.(n.type ?? '', 'node') ?? nodeSwatchColor(layer.resolveNodeStyle(n))),
        edges: tally(layer.store.edges(), hidden.edge, (e: GraphEdge) => colorRef.current?.(e.type ?? '', 'edge')),
      });
    };
    const schedule = () => {
      if (frame.current === null) frame.current = requestAnimationFrame(rebuild);
    };
    const offs = (['node:add', 'node:remove', 'edge:add', 'edge:remove', 'node:visibility', 'edge:visibility'] as const).map((ev) =>
      layer.store.events.on(ev, schedule),
    );
    offs.push(layer.events.on('data:changed', schedule));
    schedule();
    return () => {
      for (const off of offs) off();
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, [canvas, layerId]);

  if (rows.nodes.length === 0 && rows.edges.length === 0) return null;
  const toggle = (kind: 'node' | 'edge', r: Row) =>
    toggleTypes && canvas
      ? {
          pressed: !r.hidden,
          onToggle: () => canvas.commands.run('graph.typeVisible', { layerId, kind, type: r.type }),
          title: `${r.hidden ? 'Show' : 'Hide'} ${r.type}`,
        }
      : { muted: r.hidden };
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {title && <Eyebrow>{title}</Eyebrow>}
      <Legend orientation="column">
        {rows.nodes.map((r) => (
          <LegendItem key={`n-${r.type}`} kind="dot" color={r.color} label={r.type} count={r.count.toLocaleString()} {...toggle('node', r)} />
        ))}
        {rows.edges.map((r) => (
          <LegendItem key={`e-${r.type}`} kind="line" color={r.color} label={r.type} count={r.count.toLocaleString()} {...toggle('edge', r)} />
        ))}
      </Legend>
    </div>
  );
}

/**
 * Elements grouped by type, largest first; the colour from the first of each.
 * Elements hidden one by one are left out; a type hidden whole keeps its count
 * and is marked, so its entry stays to bring it back.
 */
function tally<T extends { type?: string; hidden?: boolean }>(
  items: Iterable<T>,
  hiddenTypes: readonly string[],
  colorOf: (item: T) => string | undefined,
): Row[] {
  const out = new Map<string, Row>();
  for (const item of items) {
    if (item.hidden) continue;
    const type = item.type ?? '';
    const row = out.get(type);
    if (row) row.count += 1;
    else out.set(type, { type, count: 1, color: colorOf(item), hidden: hiddenTypes.includes(type) });
  }
  return [...out.values()].sort((a, b) => b.count - a.count);
}
