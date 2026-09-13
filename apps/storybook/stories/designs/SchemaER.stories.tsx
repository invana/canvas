import {
  GraphCanvas,
  GraphLayer,
  BackgroundLayer,
  ThemeBehaviour,
  DragPanBehaviour,
  WheelZoomBehaviour,
  DragNodeBehaviour,
  HoverActivateBehaviour,
  ElkLayout,
  type GraphLayerProps
} from '@invana/canvas-react';
import type { CanvasConfig, CompositePart } from '@invana/canvas';
import type { CompositeShapeOption, GraphData, GraphNode } from '@invana/graph';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * **Family II — ER / schema.** The reference rendering of plate P5, and the
 * exact opposite of the network family: every node is read individually,
 * nothing may overlap, and each line's endpoint carries a hard fact.
 *
 * The grammar decisions, each visible in the config below:
 *
 * - **Square corners** — `cornerRadius: 0` on the composite root. Radius
 *   signals how soft the abstraction is; a record is not a card.
 * - **The node is a composite, not a new kind** (rule R1) — the whole table is
 *   `node.style.shape` returning a `CompositeShapeOption`: a header strip, a
 *   divider `line`, then one `rect` + key glyph + two `label` parts per column.
 *   Height is computed from the column count. There is no `schema` template
 *   kind in the engine and there should not be one.
 * - **Every row is an addressable sub-part** — each row `rect` carries a
 *   `hitId`, so the renderer emits `shape:partover` / `shape:partout` and a
 *   consumer can hover, right-click or anchor against *a column* rather than
 *   the table. That is the half of port-anchoring that already ships.
 * - **Routing is semantic** (rule R3) — `pathType: 'orth'` with ELK's
 *   `ORTHOGONAL` edge routing, because a foreign key is an axis-aligned fact.
 * - **Identifiers are monospace, prose is not** — column names and types use
 *   the mono stack; only the row count in the header is non-schema data, and
 *   it earns its ink by being the first thing anyone asks.
 *
 * **Known gap.** Cardinality should be crow's-foot / bar terminals. The engine
 * registers exactly one marker primitive (`ArrowMarker`), and `EdgeStyle`
 * exposes `'triangle' | 'diamond' | 'circle' | 'none'` — no crow's-foot or bar.
 * So cardinality falls back to an edge *label* (`1:N`) here. `diamond` and
 * `circle` do now render (rfc:fix-2026-09-13-edge-arrow-style-fields-are-never-read);
 * the two ER-specific marks are still missing. See the plate book's gap table.
 */
const meta: Meta = { title: 'designs/SchemaER' };
export default meta;
type Story = StoryObj;

// ── Palette ─────────────────────────────────────────────────────────────────
// Contrast-first. Every value is checked against the near-white card body it
// sits on: body text and titles clear 7:1, secondary text 4.5:1, and the card
// outline is a slate-500 rather than the slate-300 hairline a "quiet" border
// tempts you into — at canvas zoom a 1px hairline below ~3:1 simply vanishes.
const PAPER = 0xffffff;   // card body
const INK = 0x0f172a;     // titles                        — 17.9:1 on PAPER
const BODY = 0x334155;    // row text                      —  9.7:1
const MUTED = 0x64748b;   // meta / types / edge labels    —  4.8:1
const RULE = 0x94a3b8;    // dividers *inside* a card      —  2.8:1, decorative
const LINE = 0x64748b;    // card outline + connectors     —  4.8:1
const AMBER = 0x9a6207;   // branch, keys, retry

// ── Geometry ────────────────────────────────────────────────────────────────
const CARD_W = 208;
const HEADER_H = 28;
const ROW_H = 24;

type Key = 'pk' | 'fk';
interface Column {
  readonly name: string;
  readonly type: string;
  readonly key?: Key;
}
interface TableData {
  readonly table: string;
  readonly rows: string;
  readonly columns: readonly Column[];
}

const tableOf = (n: GraphNode): TableData => n.data as TableData;
const heightOf = (n: GraphNode): number => HEADER_H + tableOf(n).columns.length * ROW_H;

// ── Data ────────────────────────────────────────────────────────────────────
// A four-table order schema. `data` carries the columns; the shape resolver
// turns them into geometry, so adding a column reshapes the card with no other
// change anywhere.
const DATA: GraphData = {
  nodes: [
    {
      id: 'customer',
      type: 'table',
      data: {
        table: 'customer',
        rows: '1.2M',
        columns: [
          { name: 'id', type: 'uuid', key: 'pk' },
          { name: 'email', type: 'citext' },
          { name: 'tier', type: 'enum' },
          { name: 'created_at', type: 'timestamptz' }
        ]
      } satisfies TableData
    },
    {
      id: 'order',
      type: 'table',
      data: {
        table: 'order',
        rows: '8.4M',
        columns: [
          { name: 'id', type: 'uuid', key: 'pk' },
          { name: 'customer_id', type: 'uuid', key: 'fk' },
          { name: 'status', type: 'enum' },
          { name: 'total_cents', type: 'bigint' },
          { name: 'placed_at', type: 'timestamptz' }
        ]
      } satisfies TableData
    },
    {
      id: 'order_item',
      type: 'table',
      data: {
        table: 'order_item',
        rows: '31M',
        columns: [
          { name: 'id', type: 'uuid', key: 'pk' },
          { name: 'order_id', type: 'uuid', key: 'fk' },
          { name: 'product_id', type: 'uuid', key: 'fk' },
          { name: 'qty', type: 'int' }
        ]
      } satisfies TableData
    },
    {
      id: 'product',
      type: 'table',
      data: {
        table: 'product',
        rows: '96K',
        columns: [
          { name: 'id', type: 'uuid', key: 'pk' },
          { name: 'sku', type: 'text' },
          { name: 'name', type: 'text' }
        ]
      } satisfies TableData
    }
  ],
  edges: [
    { id: 'fk-order-customer', source: 'customer', target: 'order', type: 'HAS_MANY' },
    { id: 'fk-item-order', source: 'order', target: 'order_item', type: 'HAS_MANY' },
    { id: 'fk-item-product', source: 'product', target: 'order_item', type: 'HAS_MANY' }
  ]
};

// ── The table card, assembled from generic composite parts ──────────────────
function tableCard(n: GraphNode): CompositeShapeOption {
  const { table, rows, columns } = tableOf(n);
  const height = heightOf(n);
  const parts: CompositePart[] = [
    // Header strip + its two labels.
    { part: 'rect', x: 0, y: 0, width: CARD_W, height: HEADER_H, fill: LINE, fillAlpha: 0.14 },
    { part: 'label', x: 12, y: 8, text: table, fontSize: 12, fontWeight: 600, fill: INK },
    { part: 'label', x: CARD_W - 12, y: 10, text: rows, anchor: 'right', fontSize: 9.5, fill: MUTED },
    { part: 'line', x: 0, y: HEADER_H, x2: CARD_W, y2: HEADER_H, stroke: { color: RULE, width: 1 } }
  ];

  columns.forEach((col, i) => {
    const y = HEADER_H + i * ROW_H;
    // The row plate. `hitId` is what promotes it to an addressable sub-part —
    // the renderer reports the topmost hitId under the pointer and turns it
    // into shape:partover / shape:partout.
    parts.push({
      part: 'rect',
      x: 0,
      y,
      width: CARD_W,
      height: ROW_H,
      fill: LINE,
      fillAlpha: i % 2 === 1 ? 0.05 : 0.001,
      hitId: `row:${col.name}`
    });
    // Key glyph: filled square = primary, hollow = foreign, nothing otherwise.
    if (col.key) {
      parts.push({
        part: 'rect',
        x: 11,
        y: y + 8,
        width: 7,
        height: 7,
        fill: col.key === 'pk' ? AMBER : PAPER,
        stroke: col.key === 'fk' ? { color: AMBER, width: 1.4 } : undefined
      });
    }
    parts.push({ part: 'label', x: 27, y: y + 6, text: col.name, fontSize: 11, fill: col.key ? INK : BODY });
    parts.push({ part: 'label', x: CARD_W - 12, y: y + 7, text: col.type, anchor: 'right', fontSize: 9.5, fill: MUTED });
    if (i < columns.length - 1) {
      parts.push({ part: 'line', x: 0, y: y + ROW_H, x2: CARD_W, y2: y + ROW_H, stroke: { color: RULE, width: 1, alpha: 0.5 } });
    }
  });

  return {
    kind: 'composite',
    width: CARD_W,
    height,
    // Square. A record is not a card.
    cornerRadius: 0,
    fill: PAPER,
    stroke: { color: LINE, width: 1.8 },
    parts,
    clip: true
  };
}

// ── Style ───────────────────────────────────────────────────────────────────
const NODE: GraphLayerProps['node'] = {
  style: {
    shape: tableCard,
    // The composite carries its own labels; the node-level label would double up.
    labelText: ''
  },
  state: {
    hovered: {
      // Composites delegate decorations to the root shape, so one ring traces
      // the whole card silhouette with no per-part code.
      decorations: [{ kind: 'ring', id: 'focus', color: AMBER, width: 2, gap: 3 }]
    }
  }
};

const EDGE: GraphLayerProps['edge'] = {
  style: {
    shape: { pathType: 'orth' },
    strokeColor: LINE,
    strokeWidth: 1.6,
    // GAP: cardinality wants crow's-foot + bar terminals. Only four arrow
    // shapes exist, so the fact rides in the label until a marker registry lands.
    arrowSourceShape: 'none',
    arrowTargetShape: 'triangle',
    // Pixels, tip-to-tail. Sized to read against a 208px-wide table card.
    arrowTargetSize: 12,
    arrowTargetColor: LINE,
    labelText: '1:N',
    labelFontSize: 9.5,
    labelColor: MUTED,
    labelPlacement: 'center',
    // `labelKeepUpright` only un-flips upside-down text; it still lets the
    // label follow the path. Orthogonal routes have vertical legs, so a label
    // landing on one rendered sideways. Switching rotation off entirely is the
    // option that keeps `1:N` horizontal wherever it lands.
    labelAutoRotate: false,
    labelBackgroundFill: PAPER,
    labelBackgroundPadding: 3,
    labelBackgroundCornerRadius: 2
  }
};

const CONFIG: CanvasConfig = {
  // One fitter. The layout's own fit runs before composite card bounds are
  // known and framed the graph with `customer` off-screen.
  fitOnLoad: true,
  activeLayout: 'elk',
  layouts: {
    elk: {
      algorithm: 'layered',
      direction: 'RIGHT',
      // Orthogonal, because a foreign key is an axis-aligned fact (R3).
      edgeRouting: 'ORTHOGONAL',
      nodeSpacing: 56,
      layerSpacing: 120
    }
  }
};

export const SchemaER: Story = {
  render: () => (
    <div style={{ width: '100%', height: '100dvh' }}>
      <GraphCanvas autoResize config={CONFIG}>
        <BackgroundLayer id="bg" type="pattern" patternType="grid" />
        <ThemeBehaviour id="theme" mode="document" />
        <GraphLayer id="graph" data={DATA} node={NODE} edge={EDGE} />
        {/* nodeSize is a function, so it rides on `options` rather than the
            serialisable config — ELK needs each card's real height to pack
            layers without overlap, and that height is derived from the data. */}
        <ElkLayout
          id="elk"
          targetLayerId="graph"
          fitPadding={72}
          options={{ nodeSize: (n: GraphNode) => ({ width: CARD_W, height: heightOf(n) }) }}
        />
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="wheel" />
        <DragNodeBehaviour id="drag" />
        <HoverActivateBehaviour id="hover" degree={0} />
      </GraphCanvas>
    </div>
  )
};
