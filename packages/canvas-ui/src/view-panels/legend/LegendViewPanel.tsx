// LegendViewPanel — what the colours on the board mean: the kit's `Legend`, fed with
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
//
// Bare content, like every `view-panels/` surface — the board's rail opens it in
// a `FloatingPanel` (`BoardPanels`), which carries the title.

import type { GraphCanvas } from '@invana/graph';
import { Eyebrow, Legend, LegendItem, cn } from '@invana/ui';

import { nodeSwatchColor } from '../element-display';
import { LegendAnnotations } from './LegendAnnotations';
import { type LegendTallyRow, useLegendTally } from './useLegendTally';

export interface LegendViewPanelProps {
  /** The live canvas (null until it is ready). */
  canvas: GraphCanvas | null;
  /** GraphLayer to read. Default `'graph'`. */
  layerId?: string;
  /** Colour per type; return `undefined` to fall back to the drawn swatch. */
  colorForType?: (type: string, kind: 'node' | 'edge') => string | undefined;
  /** Heading inside the content. Default none — the panel around it has the title. */
  title?: string | null;
  /** Entries toggle their type's visibility. Default `true`. */
  toggleTypes?: boolean;
  className?: string;
}

/** Node and relationship types with live counts, coloured as drawn. */
export function LegendViewPanel({ canvas, layerId = 'graph', colorForType, title = null, toggleTypes = true, className }: LegendViewPanelProps) {
  const [nodes = [], edges = []] = useLegendTally(canvas, layerId, [
    { element: 'node', colorOf: (n, layer) => colorForType?.(n.type ?? '', 'node') ?? nodeSwatchColor(layer.resolveNodeStyle(n)) },
    { element: 'edge', colorOf: (e) => colorForType?.(e.type ?? '', 'edge') },
  ]);
  const rows = { nodes, edges };

  if (rows.nodes.length === 0 && rows.edges.length === 0) {
    return <p className={cn('text-muted-foreground px-1 py-4 text-center text-sm', className)}>Nothing drawn yet.</p>;
  }
  const toggle = (kind: 'node' | 'edge', r: LegendTallyRow) =>
    toggleTypes && canvas
      ? {
          pressed: !r.hidden,
          onToggle: () => canvas.commands.run('graph.typeVisible', { layerId, kind, type: r.value }),
          title: `${r.hidden ? 'Show' : 'Hide'} ${r.value}`,
        }
      : { muted: r.hidden };
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {title && <Eyebrow>{title}</Eyebrow>}
      {rows.nodes.length > 0 && <Eyebrow>Nodes</Eyebrow>}
      <Legend orientation="column">
        {rows.nodes.map((r) => (
          <LegendItem key={`n-${r.value}`} kind="dot" color={r.color} label={r.value} count={r.count.toLocaleString()} {...toggle('node', r)} />
        ))}
      </Legend>
      {rows.edges.length > 0 && <Eyebrow>Relationships</Eyebrow>}
      <Legend orientation="column">
        {rows.edges.map((r) => (
          <LegendItem key={`e-${r.value}`} kind="line" color={r.color} label={r.value} count={r.count.toLocaleString()} {...toggle('edge', r)} />
        ))}
      </Legend>
      <LegendAnnotations canvas={canvas} />
    </div>
  );
}
