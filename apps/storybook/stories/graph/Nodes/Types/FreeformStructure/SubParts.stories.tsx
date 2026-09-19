import { useCallback, useEffect, useState } from 'react';
import {
  BackgroundLayer,
  CanvasThemeSync,
  DragNodeBehaviour,
  DragPanBehaviour,
  GraphCanvas,
  GraphLayer,
  TextResolutionLODBehaviour,
  ThemeBehaviour,
  WheelZoomBehaviour,
  useCanvas,
  type GraphLayerProps
} from '@invana/canvas-react';
import type { CanvasConfig } from '@invana/canvas';
import type {
  GraphData,
  GraphLayer as GraphLayerEngine,
  NodeStructureRegistry,
  NodeTypeRegistry
} from '@invana/graph';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@invana/ui';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * **`FreeformStructure` — addressable sub-parts (`hitId`).** A card is one node
 * as far as selection, drag and hover are concerned. `hitId` is the escape
 * hatch: it promotes a single element to an **addressable sub-part**, so the
 * renderer reports the topmost `hitId` under the pointer and turns it into
 * `shape:partover` / `shape:partout` / `shape:partcontextmenu`
 * (`file:packages/renderer-pixijs/src/primitives/shapes/PrimitivesRenderer.ts#L1997`).
 * That is what lets a consumer hover, right-click or anchor against **a row**
 * rather than the whole table.
 *
 * **Hover any row** — the panel top-left prints the raw event. Note what the
 * payload carries: `id` (the *node*) **and** `partId` (the row), which is what
 * makes two cards built from the same structure distinguishable.
 *
 * The idiom, as used by `designs/SchemaER` and the data-model case study:
 *
 * - **A transparent full-width `rect` is the row.** `fillAlpha: 0.001` keeps it
 *   invisible while hit-testing stays geometric, so the whole row reacts — not
 *   just the glyph the eye lands on. The zebra rows here use `0.06` for the
 *   same shape at a visible tint.
 * - **`hitId` is honoured on `rect` and `circle` only.** The engine's
 *   `CompositePart` carries it on those two kinds; on `text`, `line` and
 *   `image` it is accepted by the type and ignored by the compiler.
 * - **Later elements win.** The reported hit is the *topmost* `hitId`, so a row
 *   plate must sit below its own text (it does — plates first, then labels) and
 *   a nested `hitId` shadows the one underneath it.
 * - **The event comes off the layer's renderer**, not the canvas bus:
 *   `layer.getRenderer().events` (`file:packages/graph/src/layer/GraphLayer.ts#L148`).
 *   Row hit-testing has no canvas-bus equivalent today.
 *
 * This story only *reports* the hit. Lighting the row up means recompiling the
 * card with the hovered row styled — a resolver, not a static template; see
 * `graph/Nodes/Types/Composite Shapes/SchemaTable` for that version.
 *
 * **One structure per row count.** A free-form element list is fixed, so a
 * four-column table and a three-column table are two structures. That is the
 * format's honest shape, not an oversight — a registry of tables is generated,
 * not hand-written.
 */
const meta: Meta = { title: 'graph/Nodes/Types/FreeformStructure/SubParts' };
export default meta;
type Story = StoryObj;

// ── The definition — literal JSON ───────────────────────────────────────────
// Square corners: the header strip and the rows run edge to edge, and
// `compileFreeform` sets no clip (see the `Anatomy` sibling).
const STRUCTURES: NodeStructureRegistry = {
  /** Four rows → height 34 + 4 × 26 = 138. */
  customerTable: {
    name: 'customerTable',
    kind: 'freeform',
    width: 240,
    height: 138,
    cornerRadius: 0,
    bgRole: 'cardBg',
    strokeRole: 'muted',
    strokeWidth: 1.6,
    elements: [
      { id: 'header', type: 'rect', x: 0, y: 0, width: 240, height: 34, fillRole: 'muted', fillAlpha: 0.14 },
      { id: 'table', type: 'text', x: 12, y: -2, bind: 'data.table', fontSize: 12, fontWeight: 600, colorRole: 'heading' },
      { id: 'headrule', type: 'line', x: 0, y: 34, x2: 240, y2: 34, colorRole: 'divider' },

      // Row plates — the addressable parts. Invisible ones take 0.001 rather
      // than 0: the hit test is geometric, but a 0-alpha fill is still a fill
      // the author can see in the template as "this row exists".
      { id: 'row-id', type: 'rect', x: 0, y: 34, width: 240, height: 26, fillRole: 'muted', fillAlpha: 0.001, hitId: 'row:id' },
      { id: 'row-email', type: 'rect', x: 0, y: 60, width: 240, height: 26, fillRole: 'muted', fillAlpha: 0.06, hitId: 'row:email' },
      { id: 'row-tier', type: 'rect', x: 0, y: 86, width: 240, height: 26, fillRole: 'muted', fillAlpha: 0.001, hitId: 'row:tier' },
      { id: 'row-created', type: 'rect', x: 0, y: 112, width: 240, height: 26, fillRole: 'muted', fillAlpha: 0.06, hitId: 'row:created_at' },

      { id: 'key', type: 'rect', x: 12, y: 42, width: 7, height: 7, fill: 0xce8509 },
      { id: 'n-id', type: 'text', x: 28, y: 30.5, text: 'id', fontSize: 10.5, colorRole: 'heading' },
      { id: 't-id', type: 'text', x: 228, y: 32.5, text: 'uuid', anchor: 'right', fontSize: 9.5, colorRole: 'muted' },
      { id: 'n-email', type: 'text', x: 28, y: 56.5, text: 'email', fontSize: 10.5, colorRole: 'foreground' },
      { id: 't-email', type: 'text', x: 228, y: 58.5, text: 'citext', anchor: 'right', fontSize: 9.5, colorRole: 'muted' },
      { id: 'n-tier', type: 'text', x: 28, y: 82.5, text: 'tier', fontSize: 10.5, colorRole: 'foreground' },
      { id: 't-tier', type: 'text', x: 228, y: 84.5, text: 'enum', anchor: 'right', fontSize: 9.5, colorRole: 'muted' },
      { id: 'n-created', type: 'text', x: 28, y: 108.5, text: 'created_at', fontSize: 10.5, colorRole: 'foreground' },
      { id: 't-created', type: 'text', x: 228, y: 110.5, text: 'timestamptz', anchor: 'right', fontSize: 9.5, colorRole: 'muted' }
    ]
  },

  /** Three rows → height 34 + 3 × 26 = 112. A different row count is a different structure. */
  orderTable: {
    name: 'orderTable',
    kind: 'freeform',
    width: 240,
    height: 112,
    cornerRadius: 0,
    bgRole: 'cardBg',
    strokeRole: 'muted',
    strokeWidth: 1.6,
    elements: [
      { id: 'header', type: 'rect', x: 0, y: 0, width: 240, height: 34, fillRole: 'muted', fillAlpha: 0.14 },
      { id: 'table', type: 'text', x: 12, y: -2, bind: 'data.table', fontSize: 12, fontWeight: 600, colorRole: 'heading' },
      { id: 'headrule', type: 'line', x: 0, y: 34, x2: 240, y2: 34, colorRole: 'divider' },

      { id: 'row-id', type: 'rect', x: 0, y: 34, width: 240, height: 26, fillRole: 'muted', fillAlpha: 0.001, hitId: 'row:id' },
      { id: 'row-customer', type: 'rect', x: 0, y: 60, width: 240, height: 26, fillRole: 'muted', fillAlpha: 0.06, hitId: 'row:customer_id' },
      { id: 'row-total', type: 'rect', x: 0, y: 86, width: 240, height: 26, fillRole: 'muted', fillAlpha: 0.001, hitId: 'row:total' },

      { id: 'key', type: 'rect', x: 12, y: 42, width: 7, height: 7, fill: 0xce8509 },
      { id: 'n-id', type: 'text', x: 28, y: 30.5, text: 'id', fontSize: 10.5, colorRole: 'heading' },
      { id: 't-id', type: 'text', x: 228, y: 32.5, text: 'uuid', anchor: 'right', fontSize: 9.5, colorRole: 'muted' },
      // The foreign key keeps a literal amber: a key is meaning, and the role
      // vocabulary has no `warning`.
      { id: 'fk', type: 'rect', x: 12, y: 68, width: 7, height: 7, stroke: 0xce8509, strokeWidth: 1.4 },
      { id: 'n-customer', type: 'text', x: 28, y: 56.5, text: 'customer_id', fontSize: 10.5, colorRole: 'foreground' },
      { id: 't-customer', type: 'text', x: 228, y: 58.5, text: 'uuid', anchor: 'right', fontSize: 9.5, colorRole: 'muted' },
      { id: 'n-total', type: 'text', x: 28, y: 82.5, text: 'total', fontSize: 10.5, colorRole: 'foreground' },
      { id: 't-total', type: 'text', x: 228, y: 84.5, text: 'numeric', anchor: 'right', fontSize: 9.5, colorRole: 'muted' }
    ]
  }
};

const TYPES: NodeTypeRegistry = {
  customer: { structure: 'customerTable', styling: '', bindings: {} },
  order: { structure: 'orderTable', styling: '', bindings: {} }
};

const DATA: GraphData = {
  nodes: [
    { id: 'customer', type: 'customer', position: { x: -170, y: 0 }, data: { table: 'customer' } },
    { id: 'order', type: 'order', position: { x: 170, y: 0 }, data: { table: 'order' } }
  ],
  edges: [{ id: 'fk-order-customer', source: 'customer', target: 'order', type: 'HAS_MANY' }]
};

const NODE: GraphLayerProps['node'] = { style: { labelText: '' } };
const EDGE: GraphLayerProps['edge'] = {
  style: { shape: { pathType: 'orth' }, strokeWidth: 1.6, arrowSourceShape: 'none', arrowTargetShape: 'triangle' }
};

const CONFIG: CanvasConfig = { fitOnLoad: true };

/** One sub-part event, as reported. */
interface PartHit {
  event: 'shape:partover' | 'shape:partout';
  /** The **node** under the pointer. */
  id: string;
  /** The element's `hitId` — `'—'` on `partout`, which carries no part. */
  partId: string;
}

/**
 * Null-rendering probe: subscribes to the graph layer's renderer events and
 * hands each sub-part hit to the readout. Inside the canvas so `useCanvas()`
 * resolves, and after `<GraphLayer>` so the layer is registered by the time
 * this effect runs.
 */
function PartProbe({ onHit }: { onHit: (hit: PartHit) => void }) {
  const canvas = useCanvas();
  useEffect(() => {
    // Sub-part hits have no canvas-bus equivalent — they come off the layer's
    // renderer, the engine seam for composite sub-parts.
    const renderer = canvas.layers.get<GraphLayerEngine>('graph')?.getRenderer();
    if (!renderer) return;
    const over = (e: { id: string; partId: string }) =>
      onHit({ event: 'shape:partover', id: e.id, partId: e.partId });
    const out = (e: { id: string }) => onHit({ event: 'shape:partout', id: e.id, partId: '—' });
    renderer.events.on('shape:partover', over);
    renderer.events.on('shape:partout', out);
    return () => {
      renderer.events.off('shape:partover', over);
      renderer.events.off('shape:partout', out);
    };
  }, [canvas, onHit]);
  return null;
}

/** The live readout — the story's whole point is what lands in here. */
function HitReadout({ hit }: { hit: PartHit | null }) {
  return (
    <Card className="absolute left-4 top-4 w-72">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Sub-part events</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-xs">
        {hit ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">event</span>
              <code>{hit.event}</code>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">id (node)</span>
              <code>{hit.id}</code>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">partId</span>
              <Badge variant="secondary">{hit.partId}</Badge>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">Hover a row. Each row plate carries a `hitId`.</p>
        )}
      </CardContent>
    </Card>
  );
}

export const SubParts: Story = {
  render: function Render() {
    const [hit, setHit] = useState<PartHit | null>(null);
    const onHit = useCallback((next: PartHit) => setHit(next), []);
    return (
      // `relative` anchors the readout over the canvas host; the size is
      // structural (root rule 13's engine-host exemption).
      <div className="relative" style={{ width: '100%', height: '100dvh' }}>
        <GraphCanvas autoResize config={CONFIG}>
          <BackgroundLayer id="bg" type="pattern" patternType="grid" />
          <ThemeBehaviour id="theme" mode="document" />
          <CanvasThemeSync />
          <GraphLayer
            id="graph"
            data={DATA}
            node={NODE}
            edge={EDGE}
            nodeStructureTemplates={STRUCTURES}
            nodeTypes={TYPES}
          />
          <PartProbe onHit={onHit} />
          <DragPanBehaviour id="pan" />
          <WheelZoomBehaviour id="wheel" />
          <DragNodeBehaviour id="drag" />
          <TextResolutionLODBehaviour id="label-lod" targetLayerId="graph" />
        </GraphCanvas>
        <HitReadout hit={hit} />
      </div>
    );
  }
};
