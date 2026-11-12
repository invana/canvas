// CanvasLegend — the legend drawn on the canvas itself: a `FloatingPanel`
// pinned to a corner of the canvas host (`Panel`), folded to its bar or open.
//
// It says what the marks on the canvas mean, in sections:
//
// | Section | What it lists | Counts |
// |---|---|---|
// | Counted (`sections`) | Drawn nodes or edges grouped by a key — their type by default (node kinds, edge types), or any key the host reads off an element (a product, a journey) — each with its swatch | Live, and only what is shown: an element a filter hides leaves the count |
// | Marks (`marks`) | What a style means — a dashed edge, a ring, a fade — with no element to count | None |
//
// With no `sections` it lists the drawn node types as dots and edge types as
// lines, coloured as drawn — `LegendViewPanel`'s content, overlaid. Both read
// `useLegendTally`, so the dock and the overlay can never count differently.
//
// A section's `entries` fix its order, labels, swatches and colours (a key the
// canvas draws none of reads `0`); without them a section lists what is drawn,
// largest first. A section grouped by type may toggle its types
// (`graph.typeVisible`, one undoable write), as the dock does.
//
// Connected: it reads the canvas from context inside a `<GraphCanvas>` /
// `GraphCanvasApp`, or from its `canvas` prop. Place it as an in-canvas child.

import { GraphCanvasContext } from '@invana/canvas-react';
import type { GraphCanvas, GraphEdge, GraphLayer, GraphNode, NodeStyle } from '@invana/graph';
import { cn, Eyebrow, FloatingPanel, Legend, LegendItem, type LegendSwatchKind } from '@invana/ui';
import { type ReactNode, useContext, useState } from 'react';

import { Panel } from '../../components/Panel';
import type { PanelPosition } from '../../components/types';
import { hexColor, nodeSwatchColor } from '../element-display';
import { type LegendTallyRow, type LegendTallySpec, useLegendTally } from './useLegendTally';

/** One fixed entry of a section. */
export interface CanvasLegendEntry {
  /** The group key it stands for — a type, a product code, a journey id. */
  value: string;
  /** What it reads. Default `value`. */
  label?: ReactNode;
  /** Its swatch colour (any CSS colour or token). Default the drawn colour. */
  color?: string;
  /** Its swatch. Default the section's. */
  kind?: LegendSwatchKind;
}

interface SectionBase {
  title: string;
  /** Fixed entries, in order. Default one per key drawn, largest first. */
  entries?: readonly CanvasLegendEntry[];
  /** The swatch of an entry that names none. Default the drawn shape for nodes (`dot`, `box`), `line` for edges. */
  kind?: LegendSwatchKind;
  /** The colour of a key an entry gives none — a host colouring from its own palette. Default the drawn colour. */
  colorFor?: (value: string) => string | undefined;
  /** Entries hide or show their type (only when grouping by type). Default `false`. */
  toggleTypes?: boolean;
}

/** A counted section: drawn nodes or edges grouped by a key. */
export type CanvasLegendSection =
  | (SectionBase & {
      element: 'node';
      /** The node's key; `undefined` leaves it out. Default its type. */
      groupBy?: (node: GraphNode) => string | undefined;
    })
  | (SectionBase & {
      element: 'edge';
      /** The edge's key; `undefined` leaves it out. Default its type. */
      groupBy?: (edge: GraphEdge) => string | undefined;
    });

/** A section of marks: what a style means, uncounted. */
export interface CanvasLegendMarks {
  title: string;
  entries: readonly { label: ReactNode; color?: string; kind?: LegendSwatchKind }[];
}

export interface CanvasLegendProps {
  /** The live canvas. Default the one in context. */
  canvas?: GraphCanvas | null;
  /** GraphLayer to read. Default `'graph'`. */
  layerId?: string;
  /** The corner it pins to. Default `'bottom-right'`. */
  position?: PanelPosition;
  /** The bar's title. Default `Legend`. */
  title?: ReactNode;
  /** Counted sections. Default node types, then edge types. */
  sections?: readonly CanvasLegendSection[];
  /** Uncounted sections, after the counted ones. */
  marks?: readonly CanvasLegendMarks[];
  /** Uncontrolled: folded at first. Default `false`. */
  defaultCollapsed?: boolean;
  /** Controlled fold; pair with `onCollapsedChange`. */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  className?: string;
}

const DEFAULT_SECTIONS: readonly CanvasLegendSection[] = [
  { element: 'node', title: 'Nodes' },
  { element: 'edge', title: 'Edges' },
];

/** The legend swatch nearest a node's drawn shape. */
function shapeSwatch(style: Partial<NodeStyle>): LegendSwatchKind {
  const kind = (style.shape as { kind?: string } | undefined)?.kind;
  return kind === 'rect' || kind === 'round-rect' ? 'box' : 'dot';
}

/** A legend overlaid on the canvas — counted sections, then marks; collapsible. */
export function CanvasLegend({
  canvas: explicit,
  layerId = 'graph',
  position = 'bottom-right',
  title = 'Legend',
  sections = DEFAULT_SECTIONS,
  marks = [],
  defaultCollapsed = false,
  collapsed,
  onCollapsedChange,
  className,
}: CanvasLegendProps) {
  const fromContext = useContext(GraphCanvasContext);
  const canvas = explicit ?? fromContext;
  const [ownCollapsed, setOwnCollapsed] = useState(defaultCollapsed);
  const folded = collapsed ?? ownCollapsed;
  const setFolded = (next: boolean) => {
    if (collapsed === undefined) setOwnCollapsed(next);
    onCollapsedChange?.(next);
  };

  const specs: LegendTallySpec[] = sections.map((s) =>
    s.element === 'node'
      ? {
          element: 'node',
          groupBy: s.groupBy,
          colorOf: (n: GraphNode, layer: GraphLayer) => nodeSwatchColor(layer.resolveNodeStyle(n)),
          kindOf: (n: GraphNode, layer: GraphLayer) => shapeSwatch(layer.resolveNodeStyle(n)),
        }
      : {
          element: 'edge',
          groupBy: s.groupBy,
          colorOf: (e: GraphEdge, layer: GraphLayer) => {
            const stroke = (layer.resolveEdgeStyle(e) as { strokeColor?: unknown }).strokeColor;
            return typeof stroke === 'number' ? hexColor(stroke) : undefined;
          },
        },
  );
  const tallies = useLegendTally(canvas, layerId, specs);
  const shown = tallies.reduce((sum, rows) => sum + rows.reduce((n, r) => n + r.count, 0), 0);

  return (
    <Panel position={position} className={cn('w-64', className)}>
      <FloatingPanel
        title={title}
        collapsed={folded}
        onCollapsedChange={setFolded}
        summary={`${sections.length} sections`}
        className="max-h-[min(60vh,32rem)]"
        aria-label="Canvas legend"
      >
        <div className="flex flex-col gap-1.5 p-2">
          {shown === 0 && marks.length === 0 ? <p className="text-muted-foreground text-sm">Nothing drawn yet.</p> : null}
          {sections.map((section, i) => (
            <CountedSection key={section.title} section={section} rows={tallies[i] ?? []} canvas={canvas} layerId={layerId} />
          ))}
          {marks.map((m) => (
            <div key={m.title} className="flex flex-col gap-1">
              <Eyebrow>{m.title}</Eyebrow>
              <Legend orientation="column">
                {m.entries.map((e, j) => (
                  <LegendItem key={j} kind={e.kind ?? 'dot'} color={e.color} label={e.label} />
                ))}
              </Legend>
            </div>
          ))}
        </div>
      </FloatingPanel>
    </Panel>
  );
}

function CountedSection({
  section,
  rows,
  canvas,
  layerId,
}: {
  section: CanvasLegendSection;
  rows: LegendTallyRow[];
  canvas: GraphCanvas | null;
  layerId: string;
}) {
  const byValue = new Map(rows.map((r) => [r.value, r]));
  const entries: CanvasLegendEntry[] = section.entries ? [...section.entries] : rows.map((r) => ({ value: r.value }));
  if (entries.length === 0) return null;
  const fallbackKind: LegendSwatchKind = section.kind ?? (section.element === 'edge' ? 'line' : 'dot');
  return (
    <div className="flex flex-col gap-1">
      <Eyebrow>{section.title}</Eyebrow>
      <Legend orientation="column">
        {entries.map((entry) => {
          const row = byValue.get(entry.value);
          const toggle =
            section.toggleTypes && canvas && row
              ? {
                  pressed: !row.hidden,
                  onToggle: () => canvas.commands.run('graph.typeVisible', { layerId, kind: section.element, type: row.value }),
                  title: `${row.hidden ? 'Show' : 'Hide'} ${row.value}`,
                }
              : { muted: !row || row.hidden };
          return (
            <LegendItem
              key={entry.value}
              kind={entry.kind ?? section.kind ?? row?.kind ?? fallbackKind}
              color={entry.color ?? section.colorFor?.(entry.value) ?? row?.color}
              label={entry.label ?? entry.value}
              count={(row?.count ?? 0).toLocaleString()}
              {...toggle}
            />
          );
        })}
      </Legend>
    </div>
  );
}
