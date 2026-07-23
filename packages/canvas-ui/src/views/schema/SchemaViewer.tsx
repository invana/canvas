// SchemaViewer — the graph's *schema* rendered as a live metagraph in its own
// nested `<GraphCanvas>`. It reads a **source** `GraphCanvas`, derives the schema
// (reactive — updates as data loads), compiles it to metagraph `GraphData`, and
// projects that into an inner engine instance.
//
// It composes the **canvas-react primitives directly** (a view, not an app):
// background + theme (via the shared `CanvasThemeSync` host bridge), pan/zoom/drag,
// parallel-edge fan-out, crisp labels, and the layout. It deliberately does *not*
// embed `GraphCanvasApp` — that's a top-level `AppLayoutV2` shell whose resizable
// panel state can't be isolated per instance, so nesting one inside another app's
// region collides ("Invalid 1 panel layout"). A view composes the engine; the app
// shell wraps a view.
//
// **No layout package is imported here** — the viewer is layout-agnostic. Inject
// `layouts={{ key: () => new SomeLayout() }}` (the consumer owns the layout
// packages) to enable the toolbar's layout picker; with none, the metagraph shows
// at its seeded positions.

import { useEffect, useMemo, useState } from 'react';
import type { GraphCanvas, GraphData, GraphSchema } from '@invana/graph';
import {
  BackgroundLayer,
  DragNodeBehaviour,
  DragPanBehaviour,
  GraphCanvas as GraphCanvasRoot,
  GraphLayer,
  ParallelEdgeBehaviour,
  TextResolutionLODBehaviour,
  ThemeBehaviour,
  WheelZoomBehaviour,
  useLayout,
  type LayoutFactory,
} from '@invana/canvas-react';

import { Panel } from '../../components';
import type { ToolbarIcon } from '../../components';
import { CanvasThemeSync } from '../../apps/CanvasThemeSync';
import { CanvasControlsToolbar } from '../../toolbars/CanvasControlsToolbar';
import { SchemaToolbar } from '../../toolbars/SchemaToolbar';
import { useDerivedSchema, type UseDerivedSchemaOptions } from './useDerivedSchema';
import {
  schemaSignature,
  schemaToMetaGraph,
  type SchemaEdgeRouting,
  type SchemaNodeMode,
} from './schema';

const INNER_LAYER_ID = 'schema';

/**
 * Applies + re-applies an injected layout to the metagraph. Mounted inside
 * `<GraphCanvasRoot>` so `useLayout` resolves the inner canvas. Keyed by the
 * parent on `<layout>:<nodeMode>:<edgeRouting>:<sig>`, so any change that rewrites
 * the data (a pure `setData` wipe) re-solves.
 */
function SchemaLayoutRunner({
  layouts,
  layout,
  fitPadding,
}: {
  layouts: Record<string, LayoutFactory>;
  layout: string;
  fitPadding: number;
}) {
  useLayout(layouts, { layerId: INNER_LAYER_ID, initial: layout, applyInitial: true, fitPadding });
  return null;
}

/** Shared `SchemaViewer` props — everything except the mutually-exclusive source. */
export interface SchemaViewerBaseProps extends UseDerivedSchemaOptions {
  /**
   * Injected layout factories (`{ key: () => new SomeLayout() }`) — the consumer
   * owns the layout packages. Supplying this shows the layout picker. Omit to show
   * the metagraph at its seeded positions.
   */
  layouts?: Record<string, LayoutFactory>;
  /** Labels for the injected layouts (`{ key: label }`). Defaults to the keys. */
  layoutLabels?: Record<string, string>;
  /** Optional per-layout icons for the picker. */
  layoutIcons?: Record<string, ToolbarIcon>;
  /** Initial layout key. Default: the first injected layout. */
  defaultLayout?: string;
  /** Initial node-render mode. Default `'simple'`. */
  defaultNodeMode?: SchemaNodeMode;
  /** Initial edge routing. Default `'straight'`. */
  defaultEdgeRouting?: SchemaEdgeRouting;
  /** Show the top-left `SchemaToolbar`. Default `true`. */
  showToolbar?: boolean;
  /** Auto-fit padding (screen px) after an injected layout. Default `60`. */
  fitPadding?: number;
  /** Extra classes on the root. */
  className?: string;
}

/**
 * `SchemaViewer` props — provide **exactly one** schema source (they're mutually
 * exclusive; the type enforces it and a dev warning fires at runtime if both are
 * passed):
 * - **`canvas`** — derive/read the schema from a live source canvas (its
 *   authoritative `store.schema` if set, else the schema of the loaded data), or
 * - **`schema`** — render an explicit, externally-sourced schema (e.g. a fetched
 *   Neo4j / GraphQL / ontology schema); no canvas needed.
 */
export type SchemaViewerProps = SchemaViewerBaseProps &
  (
    | {
        /** The source canvas whose schema is shown (null until `<Canvas>` publishes it). */
        canvas: GraphCanvas | null;
        schema?: never;
      }
    | {
        /** An explicit, externally-sourced schema to render. */
        schema: GraphSchema;
        canvas?: never;
      }
  );

/**
 * Renders the derived schema of `canvas` as an interactive metagraph — node types
 * as simple discs or composite ER cards, edge types as their connections — with a
 * `SchemaToolbar` for node mode / layout (when injected) / edge routing / fit, and
 * standard zoom controls. Shows a compact empty state until the source graph has
 * data. Drop it into a panel / tab and hand it the live source `canvas`.
 */
export function SchemaViewer({
  canvas,
  schema: explicitSchema,
  layerId = 'graph',
  nodeTypeOf,
  edgeTypeOf,
  layouts,
  layoutLabels,
  layoutIcons,
  defaultLayout,
  defaultNodeMode = 'simple',
  defaultEdgeRouting = 'straight',
  showToolbar = true,
  fitPadding = 60,
  className,
}: SchemaViewerProps) {
  // `canvas` and `schema` are mutually exclusive (see the props type). Warn if a
  // JS consumer (bypassing the types) passes both; `schema` then wins.
  const bothPassed = canvas !== undefined && explicitSchema !== undefined;
  useEffect(() => {
    if (bothPassed) {
      // eslint-disable-next-line no-console
      console.warn(
        '[SchemaViewer] Pass either `canvas` (derive/read the schema from a live canvas) or ' +
          '`schema` (render a provided one) — not both. `schema` takes precedence.',
      );
    }
  }, [bothPassed]);

  // Precedence: explicit prop → authoritative (`store.schema`) → observed
  // (`deriveSchema`). The hook resolves the latter two reactively.
  const resolved = useDerivedSchema(canvas, { layerId, nodeTypeOf, edgeTypeOf });
  const schema = explicitSchema ?? resolved;

  const layoutKeys = layouts ? Object.keys(layouts) : [];
  const hasLayouts = layoutKeys.length > 0;

  const [nodeMode, setNodeMode] = useState<SchemaNodeMode>(defaultNodeMode);
  const [edgeRouting, setEdgeRouting] = useState<SchemaEdgeRouting>(defaultEdgeRouting);
  const [layout, setLayout] = useState<string>(defaultLayout ?? layoutKeys[0] ?? '');

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

  const layoutOptions = layoutLabels ?? Object.fromEntries(layoutKeys.map((k) => [k, k]));

  return (
    <div className={`relative h-full w-full ${className ?? ''}`}>
      <GraphCanvasRoot autoResize className="h-full w-full">
        {/* Themed grid background + the sole theme publisher, bridged to the host
            app theme by the shared `CanvasThemeSync`. Before the graph layer so it
            renders behind it. */}
        <BackgroundLayer id="bg" type="pattern" patternType="grid" alpha={0.5} />
        <ThemeBehaviour id="theme" mode="system" active="default" accent="css-var" />
        <CanvasThemeSync />

        <GraphLayer id={INNER_LAYER_ID} data={meta} />
        <WheelZoomBehaviour id="wheel" />
        <DragPanBehaviour id="pan" />
        <DragNodeBehaviour id="drag-node" targetLayerId={INNER_LAYER_ID} />
        {/* Fan parallel edge-types apart; keep labels crisp on zoom. */}
        <ParallelEdgeBehaviour id="parallel-edge" targetLayerId={INNER_LAYER_ID} spacing={44} />
        <TextResolutionLODBehaviour id="label-lod" targetLayerId={INNER_LAYER_ID} />

        {/* Injected layouts → the viewer drives them. Keyed so a data rewrite
            (node-mode / edge-routing / structure change) re-solves. */}
        {hasLayouts && layouts ? (
          <SchemaLayoutRunner
            key={`${layout}:${nodeMode}:${edgeRouting}:${signature}`}
            layouts={layouts}
            layout={layout}
            fitPadding={fitPadding}
          />
        ) : null}

        {showToolbar ? (
          <Panel position="top-left">
            <SchemaToolbar
              nodeMode={nodeMode}
              onNodeModeChange={setNodeMode}
              layout={hasLayouts ? layout : undefined}
              onLayoutChange={hasLayouts ? setLayout : undefined}
              layoutOptions={hasLayouts ? layoutOptions : undefined}
              layoutIcons={layoutIcons}
              edgeRouting={edgeRouting}
              onEdgeRoutingChange={setEdgeRouting}
              layerId={INNER_LAYER_ID}
            />
          </Panel>
        ) : null}

        {/* Standard zoom controls (fit lives in the SchemaToolbar). */}
        <CanvasControlsToolbar position="bottom-left" showFit={false} fitLayerId={INNER_LAYER_ID} />
      </GraphCanvasRoot>
    </div>
  );
}
