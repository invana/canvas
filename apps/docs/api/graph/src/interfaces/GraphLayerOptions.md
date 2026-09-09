# Interface: GraphLayerOptions

Constructor options for `GraphLayer`.

## Properties

### edge?

> `optional` **edge?**: [`EdgeOption`](EdgeOption.md)

Sibling of [node](#node) for edges.

***

### hitFloorPx?

> `optional` **hitFloorPx?**: `number`

Minimum hover/click target in screen pixels, forwarded to the
internal `PrimitivesRenderer`. Default `6`.

Behaves as a *fallback*: exact geometric hits always win; only
when no shape contains the cursor does the dispatcher pick the
closest candidate within `hitFloorPx` screen pixels. See
`PrimitivesRendererOptions.hitFloorPx` for details.

***

### initData?

> `optional` **initData?**: [`GraphData`](GraphData.md)

Initial graph content (`{ nodes, edges }`), loaded when the layer mounts —
equivalent to calling `setData` right after mount. The *initial* seed only;
the live dataset streams / changes later via `layer.setData(...)` or store
mutations. Content, not style — lives here on the layer, not in the
serialisable canvas config.

***

### node?

> `optional` **node?**: [`NodeOption`](NodeOption.md)

Layer-level node template (G6's `node` field). Carries `style` (base
appearance) and `state` (catalogue of named overlays applied while a
state in `node.states[]` is active). Resolver-aware: every field on
`style` / each `state[name]` may be a static value or a function
`(node: GraphNode) => value` that fires every render.

***

### nodeStructureTemplates?

> `optional` **nodeStructureTemplates?**: [`NodeStructureRegistry`](../type-aliases/NodeStructureRegistry.md)

Reusable node **structure** templates (skeletons: shape / slots / card
rows), keyed by name. Referenced by [nodeTypes](#nodetypes). No colours.

***

### nodeStylingTemplates?

> `optional` **nodeStylingTemplates?**: [`NodeStylingRegistry`](../type-aliases/NodeStylingRegistry.md)

Reusable node **styling** templates (roles + typography), keyed by name.
Referenced by [nodeTypes](#nodetypes). Roles resolve to numbers against the
active theme before the renderer; no hex needed (direct colours allowed).

***

### nodeTypes?

> `optional` **nodeTypes?**: [`NodeTypeRegistry`](../type-aliases/NodeTypeRegistry.md)

Per-node-**type** bindings — each maps a node `type` to a structure +
styling template and binds its slots to dotted data paths. A node whose
`type` has a binding is resolved through it (card → composite shape,
simple → shape + label) on top of the layer-level [node](#node) template.

***

### store?

> `optional` **store?**: [`GraphStore`](../classes/GraphStore.md)

Optional pre-built store. If omitted, the layer creates its own with
default options (`flushMode: 'sync'`, `unknownEndpoint: 'throw'`). Pass
a store you own to share data with other layers / sync code.

***

### useDefaultStates?

> `optional` **useDefaultStates?**: `boolean`

Auto-merge [DEFAULT\_NODE\_STATES](../variables/DEFAULT_NODE_STATES.md) / [DEFAULT\_EDGE\_STATES](../variables/DEFAULT_EDGE_STATES.md)
into `options.node.state` / `options.edge.state` on construction so
every canonical state has a sensible default appearance even when the
consumer supplied no state overlays. Consumer entries win on a
per-name basis (no per-field deep merge here — declare a full
`NodeStyle` if you want to replace a default entry). Default `true`.
