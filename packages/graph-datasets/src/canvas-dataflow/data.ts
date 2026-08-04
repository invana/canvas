/**
 * **Canvas dataflow** — the engine's own type / instance graph, as a graph.
 *
 * Every node is a real symbol in this monorepo, and every edge is a real
 * relationship traced from the source (file references are in `data.file`). It
 * answers one question: **what happens to a node between `<GraphCanvasApp data>`
 * and a pixel?**
 *
 * The short version, and the spine of the graph:
 *
 * ```
 *   GraphData ──setData──▶ GraphStore ──▶ GraphNode  (the stored record)
 *                                            │
 *                          resolveNodeStyle  │  merges NodeOption + node.style + states
 *                                            ▼
 *                                        NodeStyle  (flat, concrete)
 *                                            │
 *                              GraphLayer.nodeSpec  ◀── the one translation point
 *                                            ▼
 *                                     BaseShapeSpec  (canvas vocabulary)
 *                                            │
 *                     PrimitivesRenderer.addShape    kind → registered class
 *                                            ▼
 *                                       CircleShape  (an IShape instance)
 * ```
 *
 * ### Three things the picture makes obvious
 *
 * 1. **`@invana/canvas` has no record type.** There is no `Shape` data object
 *    paralleling `GraphNode` — a shape exists only as a *spec you hand in* and an
 *    *instance the renderer holds*. All persistence is graph-side.
 * 2. **`GraphStore` plugs into the kernel, it doesn't compete with it.** It
 *    `implements DataSource` — a three-method interface — and `GraphLayer`
 *    registers it under the layer id. The kernel never learns what a graph is.
 * 3. **Edges compile into four sub-choices where nodes make one.** A node picks a
 *    single geometry (`shape.kind`); an edge composes anchor + router + pathStyle
 *    + marker. That's why `NodeShapeOptions` is a discriminated union and
 *    `EdgeShapeOptions` is a flat interface.
 *
 * `type` is the **layer of the stack** a symbol belongs to, so colour-by-type
 * reads as a vertical section through the engine. `data.package` is the owning
 * package, for colouring by ownership instead.
 *
 * @example
 * import { canvasDataflow, canvasDataflowSettings } from '@invana/graph-datasets';
 * <GraphCanvasApp data={canvasDataflow} config={canvasDataflowSettings} />
 */

import type { GraphEdge, GraphNode } from '@invana/graph';

/** Which layer of the stack a symbol lives at — the node's `type`. */
type DataflowLayer =
  | 'package'
  | 'react'
  | 'facade'
  | 'engine'
  | 'store'
  | 'layer'
  | 'behaviour'
  | 'record'
  | 'style'
  | 'spec'
  | 'instance'
  | 'renderer'
  | 'interface';

/** How one symbol relates to another — the edge's `type`. */
type DataflowRelation =
  | 'creates'
  | 'extends'
  | 'implements'
  | 'registers'
  | 'stores'
  | 'resolves-to'
  | 'compiles-to'
  | 'instantiates'
  | 'draws'
  | 'reads'
  | 'owns';

/** What kind of TypeScript construct the symbol is — distinct from its stack layer. */
type SymbolKind = 'class' | 'interface' | 'type' | 'function' | 'component' | 'const' | 'package';

/** Payload every node carries. `purpose` is the one-line "why does this exist". */
interface DataflowPayload {
  name: string;
  package: string;
  symbol: SymbolKind;
  purpose: string;
  file?: string;
}

const n = (
  id: string,
  type: DataflowLayer,
  pkg: string,
  symbol: SymbolKind,
  purpose: string,
  file?: string,
): GraphNode & { data: DataflowPayload } => ({
  id,
  type,
  // `parentId` is the only hierarchy field — a symbol belongs to the package
  // node that owns it. Whether that renders as a frame is the consumer's call.
  parentId: pkg,
  data: { name: id, package: pkg, symbol, purpose, ...(file ? { file } : {}) },
});

/** A package container. Children point at it via `parentId`. */
const pkgNode = (
  id: string,
  purpose: string,
): GraphNode & { data: DataflowPayload } => ({
  id,
  type: 'package',
  data: { name: id, package: id, symbol: 'package', purpose },
});

const nodes = [
  // ── The five packages the pipeline crosses ───────────────────────────────
  pkgNode('@invana/canvas-ui', 'The React UI kit — all pixels, built on canvas-react.'),
  pkgNode('@invana/canvas-react', 'Headless React bindings. Renders no application UI.'),
  pkgNode('@invana/graph', 'The graph domain: layer, store, behaviours, templates.'),
  pkgNode('@invana/canvas', 'The pixi renderer over the kernel. The only pixi importer.'),
  pkgNode('@invana/canvas-store', 'The renderer-free kernel: view + data + events.'),

  // ── React / app shell ────────────────────────────────────────────────────
  n('GraphCanvasApp', 'react', '@invana/canvas-ui', 'component', 'Batteries-included React shell: chrome regions, toolbars, panels.', 'apps/GraphCanvasApp.tsx'),
  n('GraphCanvasRoot', 'react', '@invana/canvas-react', 'component', 'Headless React root — mounts the engine, renders no UI.', 'GraphCanvas.tsx'),

  // ── Engine ───────────────────────────────────────────────────────────────
  n('GraphCanvas', 'facade', '@invana/graph', 'class', 'Graph-domain facade over Canvas. Home of the (designed) operations layer.', 'canvas/GraphCanvas.ts'),
  n('Canvas', 'engine', '@invana/canvas', 'class', 'The engine. Owns registries, the rAF loop, and one CanvasStore.', 'engine/Canvas.ts'),

  // ── Kernel store ─────────────────────────────────────────────────────────
  n('CanvasStore', 'store', '@invana/canvas-store', 'interface', 'The kernel hub: { view, data, events }. Renderer-free.', 'CanvasStore.ts'),
  n('ReactiveStore', 'store', '@invana/canvas-store', 'interface', 'Port for view state (config, selection, camera). zustand behind an interface.', 'port/types.ts'),
  n('CanvasEventBus', 'store', '@invana/canvas-store', 'class', 'The single bus. canvas.events IS store.events.', 'events/CanvasEventBus.ts'),
  n('DataSource', 'interface', '@invana/canvas-store', 'interface', 'Three methods — onFlush / setFlushMode / flush. All the kernel knows about data.', 'data/DataSource.ts'),
  n('LayerData', 'store', '@invana/canvas-store', 'class', 'The kernel default data holder. Currently has no consumers — GraphLayer brings its own.', 'data/LayerData.ts'),
  n('ColumnStore', 'store', '@invana/canvas-store', 'class', 'Typed-array HOT lane: x/y/flags at ~10ns per write, millions of items.', 'data/ColumnStore.ts'),

  // ── Graph store + records ────────────────────────────────────────────────
  n('GraphStore', 'store', '@invana/graph', 'class', 'The graph data layer. Cold Map for records, ColumnStore for positions.', 'store/GraphStore.ts'),
  n('GraphData', 'record', '@invana/graph', 'interface', 'What setData takes: { nodes, edges }.', 'layer/types.ts'),
  n('GraphNode', 'record', '@invana/graph', 'interface', 'The stored node. id + REQUIRED type + data + position + style.', 'store/types.ts'),
  n('GraphEdge', 'record', '@invana/graph', 'interface', 'The stored edge. id + REQUIRED type + source + target.', 'store/types.ts'),
  n('UNKNOWN_TYPE', 'record', '@invana/graph', 'const', "Sentinel for a record with no meaningful kind. 'unknown'.", 'store/types.ts'),
  n('AdjacencyIndex', 'store', '@invana/graph', 'class', 'Typed-array incidence buckets. What a path/reachability query would build on.', 'store/AdjacencyIndex.ts'),

  // ── Styling ──────────────────────────────────────────────────────────────
  n('NodeOption', 'style', '@invana/graph', 'interface', 'LAYER TEMPLATE. Every field may be a function of the node — resolvers fire per render.', 'layer/types.ts'),
  n('EdgeOption', 'style', '@invana/graph', 'interface', 'Edge equivalent of NodeOption.', 'layer/types.ts'),
  n('ResolvableNodeStyle', 'style', '@invana/graph', 'type', 'Mapped type making each NodeStyle field `T | ((node) => T)`.', 'layer/types.ts'),
  n('ResolvableEdgeStyle', 'style', '@invana/graph', 'type', 'Edge twin — each EdgeStyle field becomes `T | ((edge) => T)`.', 'layer/types.ts'),
  n('NodeStyle', 'style', '@invana/graph', 'interface', 'Flat concrete style: bgFill, labelText, shape, badges, decorations…', 'layer/types.ts'),
  n('EdgeStyle', 'style', '@invana/graph', 'interface', 'Flat concrete edge style: strokeColor, arrowTargetShape, shape…', 'layer/types.ts'),
  n('NodeShapeOptions', 'style', '@invana/graph', 'type', "Discriminated union on `kind` — a node picks ONE geometry.", 'layer/types.ts'),
  n('EdgeShapeOptions', 'style', '@invana/graph', 'interface', 'Flat interface — an edge composes anchor + router + pathStyle + marker.', 'layer/types.ts'),

  // ── The layer + the translation ──────────────────────────────────────────
  n('GraphLayer', 'layer', '@invana/graph', 'class', 'Projects store → renderer. Owns both translation points.', 'layer/GraphLayer.ts'),
  n('WorldLayer', 'layer', '@invana/canvas', 'class', 'World-space layer base — pans and zooms with the camera.', 'layers/WorldLayer.ts'),
  n('resolveNodeStyle', 'layer', '@invana/graph', 'function', 'Merges layer template + type binding + per-node style + active states.', 'layer/GraphLayer.ts:959'),
  n('resolveEdgeStyle', 'layer', '@invana/graph', 'function', 'The edge twin of resolveNodeStyle — same merge, edge contributions.', 'layer/GraphLayer.ts:1009'),
  n('nodeSpec', 'layer', '@invana/graph', 'function', 'THE SEAM. GraphNode → BaseShapeSpec. Graph code emitting canvas vocabulary.', 'layer/GraphLayer.ts:1390'),
  n('edgeSpec', 'layer', '@invana/graph', 'function', 'THE SEAM, edge side. GraphEdge → BaseConnectorSpec.', 'layer/GraphLayer.ts:1551'),

  // ── Canvas specs ─────────────────────────────────────────────────────────
  n('BaseShapeSpec', 'spec', '@invana/canvas', 'interface', 'A draw instruction, not data. Canvas has no stored record type.', 'primitives/types.ts:385'),
  n('CircleSpec', 'spec', '@invana/canvas', 'interface', 'One of the spec variants: Circle/Ellipse/Rect/TabbedRect/Polygon/RegularPolygon/Arc.', 'primitives/types.ts:410'),
  n('BaseConnectorSpec', 'spec', '@invana/canvas', 'interface', 'The edge draw instruction — endpoints + router + pathStyle + markers.', 'primitives/types.ts:693'),

  // ── Renderer + instances ─────────────────────────────────────────────────
  n('PrimitivesRenderer', 'renderer', '@invana/canvas', 'class', 'The only place pixi is touched. addShape / addConnector / setDecoration.', 'primitives/PrimitivesRenderer.ts'),
  n('IShape', 'interface', '@invana/canvas', 'interface', 'Runtime shape instance contract.', 'primitives/types.ts:800'),
  n('IConnector', 'interface', '@invana/canvas', 'interface', 'Runtime connector instance contract.', 'primitives/types.ts:933'),
  n('CircleShape', 'instance', '@invana/canvas', 'class', "Registered as kind 'circle'. Siblings: Rect, Arc, Polygon, Star, Ellipse, TabbedRect.", 'primitives/shapes/CircleShape.ts'),
  n('CompositeShape', 'instance', '@invana/canvas', 'class', 'The card primitive — borrowed silhouette + parts + labels. Domain-free.', 'primitives/shapes/CompositeShape.ts'),
  n('Connector', 'instance', '@invana/canvas', 'class', 'The drawn edge.', 'primitives/connectors/Connector.ts'),
  n('Anchor', 'instance', '@invana/canvas', 'function', 'boundary · center · edgePort · perpendicular · silhouettePort', 'primitives/connectors/anchors/'),
  n('Router', 'instance', '@invana/canvas', 'function', 'straight · orth · manhattan · metro · oneSide · er', 'primitives/connectors/routers/'),
  n('PathStyle', 'instance', '@invana/canvas', 'function', 'bezier · quadratic · smooth · rounded · bundle · bump* · loop*', 'primitives/connectors/pathStyles/'),
  n('ArrowMarker', 'instance', '@invana/canvas', 'class', 'Endpoint decoration.', 'primitives/markers/ArrowMarker.ts'),

  // ── A behaviour, to show where they attach ───────────────────────────────
  n('ColorByBehaviour', 'behaviour', '@invana/graph', 'class', 'Writes resolvers onto the layer template — never per-item.', 'behaviours/ColorByBehaviour.ts'),
] satisfies GraphNode[];

let seq = 0;
const e = (source: string, target: string, type: DataflowRelation, note: string): GraphEdge & { data: { note: string } } => ({
  id: `df${seq++}`,
  type,
  source,
  target,
  data: { note },
});

const edges = [
  // Construction
  e('GraphCanvasApp', 'GraphCanvasRoot', 'owns', 'The UI kit composes the headless root.'),
  e('GraphCanvasRoot', 'GraphCanvas', 'creates', 'Mounts the engine on effect.'),
  e('GraphCanvas', 'Canvas', 'extends', 'GraphCanvas extends Canvas.'),
  e('Canvas', 'CanvasStore', 'creates', 'createCanvasStore() — one per Canvas. Canvas.ts:263'),
  e('CanvasStore', 'ReactiveStore', 'owns', 'store.view — config, selection, camera.'),
  e('CanvasStore', 'CanvasEventBus', 'owns', 'store.events. canvas.events is the same object.'),
  e('CanvasStore', 'DataSource', 'owns', 'store.data — a keyed registry, one per layer.'),
  e('CanvasStore', 'LayerData', 'owns', 'store.layer(id) lazily creates one — currently nothing calls it.'),
  e('LayerData', 'DataSource', 'implements', 'The kernel default. No current consumers.'),
  e('LayerData', 'ColumnStore', 'owns', 'Hot x/y/flags lane.'),

  // The graph store plugs in
  e('GraphLayer', 'WorldLayer', 'extends', 'World-space, pans with the camera.'),
  e('Canvas', 'GraphLayer', 'owns', 'canvas.layers.add(graph).'),
  e('GraphLayer', 'GraphStore', 'owns', 'Its data lives here.'),
  e('GraphStore', 'DataSource', 'implements', 'D13: interface, not inheritance. GraphStore.ts:75'),
  e('GraphLayer', 'CanvasStore', 'registers', 'ctx.store.setSource(this.id, this.store). GraphLayer.ts:337'),
  e('GraphStore', 'ColumnStore', 'owns', 'Positions never touch the reactive path.'),
  e('GraphStore', 'AdjacencyIndex', 'owns', 'Incidence buckets for degree / traversal.'),

  // Data in
  e('GraphCanvasApp', 'GraphData', 'reads', 'The `data` prop.'),
  e('GraphData', 'GraphStore', 'compiles-to', 'setData → addNode/addEdge → installNode.'),
  e('GraphStore', 'GraphNode', 'stores', 'Cold record in a Map; x/y in the ColumnStore.'),
  e('GraphStore', 'GraphEdge', 'stores', 'Same split.'),
  e('GraphNode', 'UNKNOWN_TYPE', 'reads', 'installNode defaults type with `||` — catches undefined AND empty string.'),

  // Styling resolution
  e('GraphLayer', 'NodeOption', 'owns', 'options.node — the layer template.'),
  e('NodeOption', 'ResolvableNodeStyle', 'reads', 'Each field may be a function of the stored node.'),
  e('Canvas', 'ColorByBehaviour', 'owns', 'canvas.behaviours.register(...).'),
  e('ColorByBehaviour', 'NodeOption', 'registers', 'Installs a bgFill resolver — new nodes colour themselves.'),
  e('GraphNode', 'resolveNodeStyle', 'reads', 'Per render, per node.'),
  e('NodeOption', 'resolveNodeStyle', 'reads', 'Contribution 1 of 3.'),
  e('resolveNodeStyle', 'NodeStyle', 'resolves-to', 'Flat, concrete, fully merged.'),
  e('NodeStyle', 'NodeShapeOptions', 'owns', 'style.shape — the geometry selector.'),
  e('EdgeStyle', 'EdgeShapeOptions', 'owns', 'style.shape — anchor + router + pathStyle.'),

  // The seam
  e('resolveNodeStyle', 'nodeSpec', 'reads', 'nodeSpec calls it first thing.'),
  e('nodeSpec', 'BaseShapeSpec', 'compiles-to', 'GRAPH → CANVAS. The vocabulary changes here.'),
  e('edgeSpec', 'BaseConnectorSpec', 'compiles-to', 'GRAPH → CANVAS, edge side.'),
  // Edge side, mirroring the node side above. Without these `EdgeOption` was an
  // orphan and `EdgeStyle` had no producer — the audit that caught it is why
  // this dataset is worth having.
  e('GraphLayer', 'EdgeOption', 'owns', 'options.edge — the edge template.'),
  e('EdgeOption', 'ResolvableEdgeStyle', 'reads', 'Each field may be a function of the stored edge.'),
  e('EdgeOption', 'resolveEdgeStyle', 'reads', 'Contribution 1 of 3.'),
  e('GraphEdge', 'resolveEdgeStyle', 'reads', 'Per render, per edge.'),
  e('resolveEdgeStyle', 'EdgeStyle', 'resolves-to', 'Flat, concrete, fully merged.'),
  e('resolveEdgeStyle', 'edgeSpec', 'reads', 'edgeSpec calls it first thing.'),
  e('BaseShapeSpec', 'CircleSpec', 'resolves-to', 'One variant per geometry kind.'),

  // Down to pixels
  e('GraphLayer', 'PrimitivesRenderer', 'owns', '_renderer.addShape(id, spec). GraphLayer.ts:1652'),
  e('BaseShapeSpec', 'PrimitivesRenderer', 'reads', 'addShape takes the spec.'),
  e('BaseConnectorSpec', 'PrimitivesRenderer', 'reads', 'addConnector takes the spec.'),
  e('PrimitivesRenderer', 'CircleShape', 'instantiates', "registerShape('circle', CircleShape) — a kind→class table."),
  e('PrimitivesRenderer', 'CompositeShape', 'instantiates', "registerShape('composite', …) — the card primitive."),
  e('PrimitivesRenderer', 'Connector', 'instantiates', 'One per edge.'),
  e('CircleShape', 'IShape', 'implements', 'The runtime instance contract.'),
  e('CompositeShape', 'IShape', 'implements', ''),
  e('Connector', 'IConnector', 'implements', ''),
  e('Connector', 'Anchor', 'reads', 'Where the line attaches.'),
  e('Connector', 'Router', 'reads', 'The path it takes.'),
  e('Connector', 'PathStyle', 'reads', 'How that path is drawn.'),
  e('Connector', 'ArrowMarker', 'reads', 'Endpoint decoration.'),
  e('PrimitivesRenderer', 'IShape', 'draws', 'The only place pixi is touched.'),
] satisfies GraphEdge[];

/**
 * The engine's type / instance dataflow — **data only**.
 *
 * No `settings`, deliberately, and no card templates: this dataset describes
 * *what the symbols are*, not how to draw them. A consumer supplies the look —
 * see `usecases/by-casestudies/code-explainability`, which owns the card
 * structures, stylings and layout config for it.
 *
 * (This is the one dataset in the package without a `settings` half. Every other
 * one ships a recommended look because the look is inseparable from the data —
 * a Sankey needs a Sankey layout. Here the graph is just a DAG of symbols, and
 * the interesting looks are the consumer's business.)
 */
export const canvasDataflow: {
  nodes: (GraphNode & { data: DataflowPayload })[];
  edges: (GraphEdge & { data: { note: string } })[];
} = { nodes, edges };

/** {@link canvasDataflow} as the value `<GraphCanvasApp data>` takes. */
export const data = canvasDataflow;
