import {
  CanvasThemeSync,
  GraphCanvas,
  GraphLayer,
  BackgroundLayer,
  ThemeBehaviour,
  DragPanBehaviour,
  WheelZoomBehaviour,
  DragNodeBehaviour,
  HoverActivateBehaviour,
  TextResolutionLODBehaviour,
  ElkLayout,
  type GraphLayerProps
} from '@invana/canvas-react';
import type { CanvasConfig } from '@invana/canvas';
import type { GraphData, NodeStructureRegistry, NodeTypeRegistry } from '@invana/graph';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * **Family II — ER / schema.** The reference rendering of plate P5, and the
 * exact opposite of the network family: every node is read individually,
 * nothing may overlap, and each line's endpoint carries a hard fact.
 *
 * The grammar decisions, each visible in the definition below:
 *
 * - **Square corners** — `cornerRadius: 0` on the card. Radius signals how soft
 *   the abstraction is; a record is not a card.
 * - **The table is a template, not a new kind** (rule R1) — each table is a
 *   `FreeformStructure`: a header strip, a divider `line`, then one `rect` +
 *   key glyph + two `text` elements per column. There is no `schema` structure
 *   kind in the engine and there should not be one.
 * - **Every row is an addressable sub-part** — each row `rect` carries a
 *   `hitId`, so the renderer emits `shape:partover` / `shape:partout` and a
 *   consumer can hover, right-click or anchor against *a column* rather than
 *   the table.
 * - **Routing is semantic** (rule R3) — `pathType: 'orth'` with ELK's
 *   `ORTHOGONAL` edge routing, because a foreign key is an axis-aligned fact.
 *
 * **Themed by role, not by palette.** Every chrome colour is a `*Role`
 * (`cardBg` · `muted` · `heading` · `foreground` · `divider`), which
 * `GraphLayer` recompiles against the live palette on every `theme:change` —
 * so this file holds no light/dark values and the layer never remounts. Only
 * the key glyph's amber is literal: the role vocabulary has no
 * `success`/`warning`/`danger`, and a key is meaning, not chrome.
 *
 * The card outline takes `muted` rather than `stroke`: at canvas zoom the
 * `stroke` role is a hairline that disappears, and a record's border is one of
 * the marks the plate is *about*.
 *
 * **Known gaps.** Cardinality should be crow's-foot / bar terminals — the
 * engine registers one marker primitive and `EdgeStyle` exposes
 * `'triangle' | 'diamond' | 'circle' | 'none'`, so the fact rides in an edge
 * *label* (`1:N`) until a marker registry lands. The label's plate is themed
 * only once `paletteToEdgeDefaults` covers label backgrounds
 * (`rfc:feat-2026-09-11-a-colour-is-either-themed-or-manual-never-both` F12);
 * until then the label sits on the line with no plate.
 *
 * **Everything above the component is data.** `STRUCTURES` · `TYPES` · `DATA` ·
 * `NODE` · `EDGE` · `CONFIG` are literal JSON — no helpers, no factories, no
 * computed values — so the whole definition survives `JSON.stringify` and comes
 * back identical.
 *
 * ⚠️ **Text `y` looks a line high on purpose.** `CardElementCommon.y` is the
 * element's top-left, but `compileFreeform` emits the label part at
 * `el.y + fontSize`, so a 12px title whose rendered top must land at 8 is
 * authored as `-4`.
 */
const meta: Meta = { title: 'designs/SchemaER' };
export default meta;
type Story = StoryObj;

// ── The definition — literal JSON, top to bottom ─────────────────────────────
/**
 * One structure per table: a free-form card's element list is fixed, so a
 * four-column table and a five-column table are two structures (the same shape
 * the tasks-panel plates take). Height is `28 + columns × 24`.
 *
 * `hitId` on each row plate is what promotes it to an addressable sub-part.
 * The plate itself is the `muted` role at 0.14 / 0.05 / 0.001 alpha — a tint of
 * a themed colour rather than a pinned grey, so the zebra survives a theme
 * switch.
 */
const STRUCTURES: NodeStructureRegistry = {
  customer: {
    name: 'customer',
    kind: 'freeform',
    width: 208,
    height: 124,
    // Square. A record is not a card.
    cornerRadius: 0,
    bgRole: 'cardBg',
    strokeRole: 'muted',
    strokeWidth: 1.8,
    elements: [
      { id: 'header', type: 'rect', x: 0, y: 0, width: 208, height: 28, fillRole: 'muted', fillAlpha: 0.14 },
      { id: 'table', type: 'text', x: 12, y: -4, bind: 'data.table', fontSize: 12, fontWeight: 600, colorRole: 'heading' },
      { id: 'rows', type: 'text', x: 196, y: 0.5, bind: 'data.rows', anchor: 'right', fontSize: 9.5, colorRole: 'muted' },
      { id: 'headrule', type: 'line', x: 0, y: 28, x2: 208, y2: 28, colorRole: 'divider' },
      { id: 'row-id', type: 'rect', x: 0, y: 28, width: 208, height: 24, fillRole: 'muted', fillAlpha: 0.001, hitId: 'row:id' },
      { id: 'key-id', type: 'rect', x: 11, y: 36, width: 7, height: 7, fill: 0xce8509 },
      { id: 'name-id', type: 'text', x: 27, y: 23, text: 'id', fontSize: 11, colorRole: 'heading' },
      { id: 'type-id', type: 'text', x: 196, y: 25.5, text: 'uuid', anchor: 'right', fontSize: 9.5, colorRole: 'muted' },
      { id: 'rule-id', type: 'line', x: 0, y: 52, x2: 208, y2: 52, colorRole: 'divider' },
      { id: 'row-email', type: 'rect', x: 0, y: 52, width: 208, height: 24, fillRole: 'muted', fillAlpha: 0.05, hitId: 'row:email' },
      { id: 'name-email', type: 'text', x: 27, y: 47, text: 'email', fontSize: 11, colorRole: 'foreground' },
      { id: 'type-email', type: 'text', x: 196, y: 49.5, text: 'citext', anchor: 'right', fontSize: 9.5, colorRole: 'muted' },
      { id: 'rule-email', type: 'line', x: 0, y: 76, x2: 208, y2: 76, colorRole: 'divider' },
      { id: 'row-tier', type: 'rect', x: 0, y: 76, width: 208, height: 24, fillRole: 'muted', fillAlpha: 0.001, hitId: 'row:tier' },
      { id: 'name-tier', type: 'text', x: 27, y: 71, text: 'tier', fontSize: 11, colorRole: 'foreground' },
      { id: 'type-tier', type: 'text', x: 196, y: 73.5, text: 'enum', anchor: 'right', fontSize: 9.5, colorRole: 'muted' },
      { id: 'rule-tier', type: 'line', x: 0, y: 100, x2: 208, y2: 100, colorRole: 'divider' },
      { id: 'row-created_at', type: 'rect', x: 0, y: 100, width: 208, height: 24, fillRole: 'muted', fillAlpha: 0.05, hitId: 'row:created_at' },
      { id: 'name-created_at', type: 'text', x: 27, y: 95, text: 'created_at', fontSize: 11, colorRole: 'foreground' },
      { id: 'type-created_at', type: 'text', x: 196, y: 97.5, text: 'timestamptz', anchor: 'right', fontSize: 9.5, colorRole: 'muted' }
    ]
  },
  order: {
    name: 'order',
    kind: 'freeform',
    width: 208,
    height: 148,
    // Square. A record is not a card.
    cornerRadius: 0,
    bgRole: 'cardBg',
    strokeRole: 'muted',
    strokeWidth: 1.8,
    elements: [
      { id: 'header', type: 'rect', x: 0, y: 0, width: 208, height: 28, fillRole: 'muted', fillAlpha: 0.14 },
      { id: 'table', type: 'text', x: 12, y: -4, bind: 'data.table', fontSize: 12, fontWeight: 600, colorRole: 'heading' },
      { id: 'rows', type: 'text', x: 196, y: 0.5, bind: 'data.rows', anchor: 'right', fontSize: 9.5, colorRole: 'muted' },
      { id: 'headrule', type: 'line', x: 0, y: 28, x2: 208, y2: 28, colorRole: 'divider' },
      { id: 'row-id', type: 'rect', x: 0, y: 28, width: 208, height: 24, fillRole: 'muted', fillAlpha: 0.001, hitId: 'row:id' },
      { id: 'key-id', type: 'rect', x: 11, y: 36, width: 7, height: 7, fill: 0xce8509 },
      { id: 'name-id', type: 'text', x: 27, y: 23, text: 'id', fontSize: 11, colorRole: 'heading' },
      { id: 'type-id', type: 'text', x: 196, y: 25.5, text: 'uuid', anchor: 'right', fontSize: 9.5, colorRole: 'muted' },
      { id: 'rule-id', type: 'line', x: 0, y: 52, x2: 208, y2: 52, colorRole: 'divider' },
      { id: 'row-customer_id', type: 'rect', x: 0, y: 52, width: 208, height: 24, fillRole: 'muted', fillAlpha: 0.05, hitId: 'row:customer_id' },
      { id: 'key-customer_id', type: 'rect', x: 11, y: 60, width: 7, height: 7, stroke: 0xce8509, strokeWidth: 1.4 },
      { id: 'name-customer_id', type: 'text', x: 27, y: 47, text: 'customer_id', fontSize: 11, colorRole: 'heading' },
      { id: 'type-customer_id', type: 'text', x: 196, y: 49.5, text: 'uuid', anchor: 'right', fontSize: 9.5, colorRole: 'muted' },
      { id: 'rule-customer_id', type: 'line', x: 0, y: 76, x2: 208, y2: 76, colorRole: 'divider' },
      { id: 'row-status', type: 'rect', x: 0, y: 76, width: 208, height: 24, fillRole: 'muted', fillAlpha: 0.001, hitId: 'row:status' },
      { id: 'name-status', type: 'text', x: 27, y: 71, text: 'status', fontSize: 11, colorRole: 'foreground' },
      { id: 'type-status', type: 'text', x: 196, y: 73.5, text: 'enum', anchor: 'right', fontSize: 9.5, colorRole: 'muted' },
      { id: 'rule-status', type: 'line', x: 0, y: 100, x2: 208, y2: 100, colorRole: 'divider' },
      { id: 'row-total_cents', type: 'rect', x: 0, y: 100, width: 208, height: 24, fillRole: 'muted', fillAlpha: 0.05, hitId: 'row:total_cents' },
      { id: 'name-total_cents', type: 'text', x: 27, y: 95, text: 'total_cents', fontSize: 11, colorRole: 'foreground' },
      { id: 'type-total_cents', type: 'text', x: 196, y: 97.5, text: 'bigint', anchor: 'right', fontSize: 9.5, colorRole: 'muted' },
      { id: 'rule-total_cents', type: 'line', x: 0, y: 124, x2: 208, y2: 124, colorRole: 'divider' },
      { id: 'row-placed_at', type: 'rect', x: 0, y: 124, width: 208, height: 24, fillRole: 'muted', fillAlpha: 0.001, hitId: 'row:placed_at' },
      { id: 'name-placed_at', type: 'text', x: 27, y: 119, text: 'placed_at', fontSize: 11, colorRole: 'foreground' },
      { id: 'type-placed_at', type: 'text', x: 196, y: 121.5, text: 'timestamptz', anchor: 'right', fontSize: 9.5, colorRole: 'muted' }
    ]
  },
  order_item: {
    name: 'order_item',
    kind: 'freeform',
    width: 208,
    height: 124,
    // Square. A record is not a card.
    cornerRadius: 0,
    bgRole: 'cardBg',
    strokeRole: 'muted',
    strokeWidth: 1.8,
    elements: [
      { id: 'header', type: 'rect', x: 0, y: 0, width: 208, height: 28, fillRole: 'muted', fillAlpha: 0.14 },
      { id: 'table', type: 'text', x: 12, y: -4, bind: 'data.table', fontSize: 12, fontWeight: 600, colorRole: 'heading' },
      { id: 'rows', type: 'text', x: 196, y: 0.5, bind: 'data.rows', anchor: 'right', fontSize: 9.5, colorRole: 'muted' },
      { id: 'headrule', type: 'line', x: 0, y: 28, x2: 208, y2: 28, colorRole: 'divider' },
      { id: 'row-id', type: 'rect', x: 0, y: 28, width: 208, height: 24, fillRole: 'muted', fillAlpha: 0.001, hitId: 'row:id' },
      { id: 'key-id', type: 'rect', x: 11, y: 36, width: 7, height: 7, fill: 0xce8509 },
      { id: 'name-id', type: 'text', x: 27, y: 23, text: 'id', fontSize: 11, colorRole: 'heading' },
      { id: 'type-id', type: 'text', x: 196, y: 25.5, text: 'uuid', anchor: 'right', fontSize: 9.5, colorRole: 'muted' },
      { id: 'rule-id', type: 'line', x: 0, y: 52, x2: 208, y2: 52, colorRole: 'divider' },
      { id: 'row-order_id', type: 'rect', x: 0, y: 52, width: 208, height: 24, fillRole: 'muted', fillAlpha: 0.05, hitId: 'row:order_id' },
      { id: 'key-order_id', type: 'rect', x: 11, y: 60, width: 7, height: 7, stroke: 0xce8509, strokeWidth: 1.4 },
      { id: 'name-order_id', type: 'text', x: 27, y: 47, text: 'order_id', fontSize: 11, colorRole: 'heading' },
      { id: 'type-order_id', type: 'text', x: 196, y: 49.5, text: 'uuid', anchor: 'right', fontSize: 9.5, colorRole: 'muted' },
      { id: 'rule-order_id', type: 'line', x: 0, y: 76, x2: 208, y2: 76, colorRole: 'divider' },
      { id: 'row-product_id', type: 'rect', x: 0, y: 76, width: 208, height: 24, fillRole: 'muted', fillAlpha: 0.001, hitId: 'row:product_id' },
      { id: 'key-product_id', type: 'rect', x: 11, y: 84, width: 7, height: 7, stroke: 0xce8509, strokeWidth: 1.4 },
      { id: 'name-product_id', type: 'text', x: 27, y: 71, text: 'product_id', fontSize: 11, colorRole: 'heading' },
      { id: 'type-product_id', type: 'text', x: 196, y: 73.5, text: 'uuid', anchor: 'right', fontSize: 9.5, colorRole: 'muted' },
      { id: 'rule-product_id', type: 'line', x: 0, y: 100, x2: 208, y2: 100, colorRole: 'divider' },
      { id: 'row-qty', type: 'rect', x: 0, y: 100, width: 208, height: 24, fillRole: 'muted', fillAlpha: 0.05, hitId: 'row:qty' },
      { id: 'name-qty', type: 'text', x: 27, y: 95, text: 'qty', fontSize: 11, colorRole: 'foreground' },
      { id: 'type-qty', type: 'text', x: 196, y: 97.5, text: 'int', anchor: 'right', fontSize: 9.5, colorRole: 'muted' }
    ]
  },
  product: {
    name: 'product',
    kind: 'freeform',
    width: 208,
    height: 100,
    // Square. A record is not a card.
    cornerRadius: 0,
    bgRole: 'cardBg',
    strokeRole: 'muted',
    strokeWidth: 1.8,
    elements: [
      { id: 'header', type: 'rect', x: 0, y: 0, width: 208, height: 28, fillRole: 'muted', fillAlpha: 0.14 },
      { id: 'table', type: 'text', x: 12, y: -4, bind: 'data.table', fontSize: 12, fontWeight: 600, colorRole: 'heading' },
      { id: 'rows', type: 'text', x: 196, y: 0.5, bind: 'data.rows', anchor: 'right', fontSize: 9.5, colorRole: 'muted' },
      { id: 'headrule', type: 'line', x: 0, y: 28, x2: 208, y2: 28, colorRole: 'divider' },
      { id: 'row-id', type: 'rect', x: 0, y: 28, width: 208, height: 24, fillRole: 'muted', fillAlpha: 0.001, hitId: 'row:id' },
      { id: 'key-id', type: 'rect', x: 11, y: 36, width: 7, height: 7, fill: 0xce8509 },
      { id: 'name-id', type: 'text', x: 27, y: 23, text: 'id', fontSize: 11, colorRole: 'heading' },
      { id: 'type-id', type: 'text', x: 196, y: 25.5, text: 'uuid', anchor: 'right', fontSize: 9.5, colorRole: 'muted' },
      { id: 'rule-id', type: 'line', x: 0, y: 52, x2: 208, y2: 52, colorRole: 'divider' },
      { id: 'row-sku', type: 'rect', x: 0, y: 52, width: 208, height: 24, fillRole: 'muted', fillAlpha: 0.05, hitId: 'row:sku' },
      { id: 'name-sku', type: 'text', x: 27, y: 47, text: 'sku', fontSize: 11, colorRole: 'foreground' },
      { id: 'type-sku', type: 'text', x: 196, y: 49.5, text: 'text', anchor: 'right', fontSize: 9.5, colorRole: 'muted' },
      { id: 'rule-sku', type: 'line', x: 0, y: 76, x2: 208, y2: 76, colorRole: 'divider' },
      { id: 'row-name', type: 'rect', x: 0, y: 76, width: 208, height: 24, fillRole: 'muted', fillAlpha: 0.001, hitId: 'row:name' },
      { id: 'name-name', type: 'text', x: 27, y: 71, text: 'name', fontSize: 11, colorRole: 'foreground' },
      { id: 'type-name', type: 'text', x: 196, y: 73.5, text: 'text', anchor: 'right', fontSize: 9.5, colorRole: 'muted' }
    ]
  }
};

/** `type` selects the card; the column text is baked into the structure. */
const TYPES: NodeTypeRegistry = {
  customer: { structure: 'customer', styling: '', bindings: {} },
  order: { structure: 'order', styling: '', bindings: {} },
  order_item: { structure: 'order_item', styling: '', bindings: {} },
  product: { structure: 'product', styling: '', bindings: {} }
};

// A four-table order schema. `data` carries the two bound header fields; the
// columns are the structure's own elements, so adding a column is a template
// edit and nothing else changes.
const DATA: GraphData = {
  nodes: [
    { id: 'customer', type: 'customer', data: { table: 'customer', rows: '1.2M' } },
    { id: 'order', type: 'order', data: { table: 'order', rows: '8.4M' } },
    { id: 'order_item', type: 'order_item', data: { table: 'order_item', rows: '31M' } },
    { id: 'product', type: 'product', data: { table: 'product', rows: '96K' } }
  ],
  edges: [
    { id: 'fk-order-customer', source: 'customer', target: 'order', type: 'HAS_MANY' },
    { id: 'fk-item-order', source: 'order', target: 'order_item', type: 'HAS_MANY' },
    { id: 'fk-item-product', source: 'product', target: 'order_item', type: 'HAS_MANY' }
  ]
};

// The layer template carries no colour at all. `GraphLayer.applyTheme` writes
// the themed defaults (edge stroke + arrows ← `muted`, labels ← `foreground`)
// on every `theme:change`, and the structures above resolve their own roles.
const NODE: GraphLayerProps['node'] = {
  // Each card draws its own words; the node-level label would double them up.
  style: { labelText: '' }
};

const EDGE: GraphLayerProps['edge'] = {
  style: {
    shape: { pathType: 'orth' },
    strokeWidth: 1.6,
    arrowSourceShape: 'none',
    arrowTargetShape: 'triangle',
    // Pixels, tip-to-tail. Sized to read against a 208px-wide table card.
    arrowTargetSize: 12,
    labelText: '1:N',
    labelFontSize: 9.5,
    labelPlacement: 'center',
    // `labelKeepUpright` only un-flips upside-down text; it still lets the
    // label follow the path. Orthogonal routes have vertical legs, so a label
    // landing on one rendered sideways. Switching rotation off entirely is the
    // option that keeps `1:N` horizontal wherever it lands.
    labelAutoRotate: false
  }
};

const CONFIG: CanvasConfig = {
  // One fitter. The layout's own fit runs before the card bounds are known and
  // framed the graph with `customer` off-screen.
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
    // The host <div> sizes the engine's render surface — structural, and exempt
    // from the no-inline-CSS rule (root rule 13).
    <div style={{ width: '100%', height: '100dvh' }}>
      <GraphCanvas autoResize config={CONFIG}>
        {/* Colours left unset: the backdrop follows `surface`, the grid `divider`. */}
        <BackgroundLayer id="bg" type="pattern" patternType="grid" />
        <ThemeBehaviour id="theme" />
        {/* Drives the behaviour's mode + family from the host `@invana/themes`
            theme, which is what makes every role above follow the toolbar. */}
        <CanvasThemeSync />
        <GraphLayer
          id="graph"
          data={DATA}
          node={NODE}
          edge={EDGE}
          nodeStructureTemplates={STRUCTURES}
          nodeTypes={TYPES}
        />
        {/* No `nodeSize`: each card's structure declares its own box, so ELK
            packs the layers from the real heights with nothing passed in. */}
        <ElkLayout id="elk" targetLayerId="graph" fitPadding={72} />
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="wheel" />
        <DragNodeBehaviour id="drag" />
        <HoverActivateBehaviour id="hover" degree={0} />
        {/* Column names are 9.5–11px composite labels; this re-rasterises them
            in tiers as the camera comes in so they stay crisp. */}
        <TextResolutionLODBehaviour id="label-lod" targetLayerId="graph" enabled />
      </GraphCanvas>
    </div>
  )
};
