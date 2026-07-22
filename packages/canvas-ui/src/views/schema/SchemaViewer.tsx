// SchemaViewer — the graph's *schema* rendered as a live metagraph in its own
// nested `<GraphCanvas>`: one node per node-type, one edge per node-type →
// node-type connection. It reads a **source** `GraphCanvas`, derives the schema
// (reactive — updates as data loads), compiles it to metagraph `GraphData`, and
// projects that into an inner engine instance.
//
// A top **`<SchemaToolbar>`** drives three pieces of view state the viewer owns —
// node mode (**Simple** discs ⇄ composite ER **Table** cards), **layout**
// (Hierarchical/ELK ⇄ Force), and **edge routing** (straight/orthogonal/curved) —
// plus **fit**. Node/edge styling rides the reactive `data` prop (rebuilding meta
// re-styles in place, keeping positions); the layout is applied through
// canvas-react's engine-agnostic `useLayout` hook with the layout **classes**
// imported here as factories (the layout packages are canvas-ui deps; headless
// `@invana/canvas-react` never imports one). ELK is the default — a small
// relational metagraph reads far better as a deterministic layered diagram than
// as force (which collapses tiny graphs toward the centre).

import { useMemo, useState } from 'react';
import type { GraphCanvas, GraphData } from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import {
  DragNodeBehaviour,
  DragPanBehaviour,
  GraphCanvas as GraphCanvasRoot,
  GraphLayer,
  WheelZoomBehaviour,
  useLayout,
  type LayoutFactory,
} from '@invana/canvas-react';

import { CanvasToolbar } from '../../toolbars/CanvasToolbar';
import { SchemaToolbar } from '../../toolbars/SchemaToolbar';
import { useDerivedSchema, type UseDerivedSchemaOptions } from './useDerivedSchema';
import {
  schemaSignature,
  schemaToMetaGraph,
  type SchemaEdgeRouting,
  type SchemaLayoutKind,
  type SchemaNodeMode,
} from './schema';

const INNER_LAYER_ID = 'schema';

/** ELK layered options — a top-down ER-style diagram. Edge routing is per-edge. */
const ELK_OPTIONS = { algorithm: 'layered' as const, direction: 'DOWN' as const, nodeSpacing: 60, layerSpacing: 90 };
/** d3-force options tuned for a small metagraph (strong repulsion, long links). */
const FORCE_OPTIONS = { charge: { strength: -280 }, link: { distance: 140 }, collide: {}, animate: false };

// Layout **factories** — `useLayout` applies whatever instance these produce. The
// layout classes are imported here (canvas-ui deps), never in canvas-react.
const LAYOUT_FACTORIES: Record<SchemaLayoutKind, LayoutFactory> = {
  elk: () => new ElkLayout(ELK_OPTIONS),
  force: () => new D3ForceLayout(FORCE_OPTIONS),
};

export interface SchemaViewerProps extends UseDerivedSchemaOptions {
  /** The **source** canvas whose schema is shown (null until `<Canvas>` publishes it). */
  canvas: GraphCanvas | null;
  /** Initial node-render mode. Default `'simple'`. */
  defaultNodeMode?: SchemaNodeMode;
  /** Initial layout. Default `'elk'` (hierarchical). */
  defaultLayout?: SchemaLayoutKind;
  /** Initial edge routing. Default `'straight'`. */
  defaultEdgeRouting?: SchemaEdgeRouting;
  /** Show the top `SchemaToolbar` (nodes · layout · edges · fit). Default `true`. */
  showToolbar?: boolean;
  /** Auto-fit padding (screen px) applied after each layout. Default `60`. */
  fitPadding?: number;
  /** Extra classes on the root. */
  className?: string;
}

/**
 * Applies + re-applies the metagraph layout. Mounted **inside** `<GraphCanvasRoot>`
 * so `useLayout` resolves the inner canvas from context. The parent keys it on
 * `<layout>:<nodeMode>:<signature>` — a layout switch, a node-mode change (card
 * sizes change) or a structural change remounts it and re-runs the layout.
 */
function SchemaLayoutRunner({ layout, fitPadding }: { layout: SchemaLayoutKind; fitPadding: number }) {
  useLayout(LAYOUT_FACTORIES, { layerId: INNER_LAYER_ID, initial: layout, applyInitial: true, fitPadding });
  return null;
}

/**
 * Renders the derived schema of `canvas` as a small interactive metagraph, with a
 * `SchemaToolbar` to switch node mode / layout / edge routing and fit the view.
 * Shows a compact empty state until the source graph has data. Drop it into a
 * panel / tab and hand it the live source `canvas`.
 */
export function SchemaViewer({
  canvas,
  layerId = 'graph',
  nodeTypeOf,
  edgeTypeOf,
  defaultNodeMode = 'simple',
  defaultLayout = 'elk',
  defaultEdgeRouting = 'straight',
  showToolbar = true,
  fitPadding = 60,
  className,
}: SchemaViewerProps) {
  const schema = useDerivedSchema(canvas, { layerId, nodeTypeOf, edgeTypeOf });

  const [nodeMode, setNodeMode] = useState<SchemaNodeMode>(defaultNodeMode);
  const [layout, setLayout] = useState<SchemaLayoutKind>(defaultLayout);
  const [edgeRouting, setEdgeRouting] = useState<SchemaEdgeRouting>(defaultEdgeRouting);

  // Meta is reactive: node/edge styling (shape, routing) rides `data`, so a
  // node-mode / edge-routing change re-styles in place without remounting.
  const meta: GraphData = useMemo(
    () => schemaToMetaGraph(schema, { nodeMode, edgeRouting }),
    [schema, nodeMode, edgeRouting],
  );
  const signature = useMemo(() => schemaSignature(schema), [schema]);

  if (schema.nodeTypes.length === 0) {
    return (
      <div className={`grid h-full w-full place-items-center p-4 ${className ?? ''}`}>
        <p className="text-muted-foreground text-xs">No schema yet — load a graph to see its node &amp; edge types.</p>
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full ${className ?? ''}`}>
      <GraphCanvasRoot autoResize className="h-full w-full">
        <GraphLayer id={INNER_LAYER_ID} data={meta} />
        <WheelZoomBehaviour id="wheel" />
        <DragPanBehaviour id="pan" />
        <DragNodeBehaviour id="drag-node" targetLayerId={INNER_LAYER_ID} />
        {/* Keyed on layout · nodeMode · edgeRouting · signature: any change to
            `meta` re-runs `layer.setData` (a pure wipe that resets positions to
            the seed ring), so the layout must re-run to re-place. For the
            deterministic ELK default the re-placement is identical → no jump. */}
        <SchemaLayoutRunner
          key={`${layout}:${nodeMode}:${edgeRouting}:${signature}`}
          layout={layout}
          fitPadding={fitPadding}
        />

        {showToolbar ? (
          <div className="bg-card/85 absolute inset-x-0 top-0 z-10 flex items-center border-b px-2 py-1 backdrop-blur">
            <SchemaToolbar
              nodeMode={nodeMode}
              onNodeModeChange={setNodeMode}
              layout={layout}
              onLayoutChange={setLayout}
              edgeRouting={edgeRouting}
              onEdgeRoutingChange={setEdgeRouting}
              layerId={INNER_LAYER_ID}
            />
          </div>
        ) : null}

        {/* Zoom + lock at bottom-left (fit lives in the SchemaToolbar). */}
        <CanvasToolbar bare={false} position="bottom-left" orientation="vertical" layerId={INNER_LAYER_ID} showFit={false} />
      </GraphCanvasRoot>
    </div>
  );
}
