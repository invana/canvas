# CLAUDE.md — packages/graph (`@invana/graph`)

Graph-domain layers and behaviours that compose `@invana/canvas`.

**Status:** skeleton.

## Scope (per proposal §5)

- `GraphLayer` (extends `WorldLayer`) — wraps a `ShapesRenderer` internally; owns interaction state via `Layer.state` (zustand+immer) and bulk data via `Layer.data` (typed-array `ColumnStore` extensions).
- `GraphNodeStore extends ColumnStore` — typed-array columns: `x:f32, y:f32, color:u32, size:f32, typeId:u16, …`.
- `GraphEdgeStore extends ColumnStore` — typed-array columns: `sourceSlot:u32, targetSlot:u32, weight:f32, color:u32, typeId:u16, …`.
- `MiniMapLayer` (extends `ScreenLayer`) — viewport-fixed minimap of a source `GraphLayer`.
- Behaviours: `HoverActivateBehaviour`, `ClickSelectBehaviour`, `LassoSelectBehaviour`, `BrushSelectBehaviour`, `PanBehaviour`, `DragMoveBehaviour`.

## Data model — `NodeData` / `EdgeData` + layer-level `NodeOption` / `EdgeOption`

G6-aligned shape. The per-item descriptor (`NodeData<D>` / `EdgeData<D>`) is what the consumer hands to `GraphLayer.setData` and what `GraphStore` holds internally. The layer-level template (`NodeOption` / `EdgeOption`) lives under `GraphLayerOptions.node` / `.edge` and carries the *shared* styling — every node/edge inherits these unless it overrides a field.

```ts
// per-item (passed to setData; stored in GraphStore)
interface NodeData<D = unknown> {
  id: string;
  type?: string;                          // type tag (free-form)
  data?: D;                               // user payload — opaque to the store
  style?: NodeStyle;                      // base visual style (concrete)
  state?: Record<string, NodeStyle>;      // per-instance overlay catalogue
  states?: readonly string[] | null;      // active state names (plural)
  position?: { x: number; y: number };
  pinned?: boolean;
  parentId?: string;                      // single hierarchy field; covers tree + combo/group membership
}

interface EdgeData<D = unknown> {
  id: string;
  source: string;
  target: string;
  type?: string;                          // predicate / FK label (free-form)
  data?: D;
  style?: EdgeStyle;
  state?: Record<string, EdgeStyle>;
  states?: readonly string[] | null;
}

// layer-level template (under GraphLayerOptions.node / .edge)
interface NodeOption {
  type?: string;
  style?: ResolvableNodeStyle<GraphNode>;
  state?: Record<string, ResolvableNodeStyle<GraphNode>>;
  palette?: unknown;                      // reserved
}
// EdgeOption is the same shape with EdgeStyle / GraphEdge.
```

### `NodeStyle` and `EdgeStyle` — flat with one escape hatch

Visual style is **flat-prefixed** (`bgFill`, `bgStrokeColor`, `bgStrokeWidth`, `bgStrokeDashArray`, `labelText`, `labelColor`, `labelFontSize`, `labelPlacement`, `labelOffsetY`, `labelBackgroundFill`, …). Polymorphic values (`shape`, `icon`, `image`, `badges`, `decorations`, `effects`) stay structured because their kinds carry different required params.

**`NodeStyle.shape` = `NodeShapeOptions`** — discriminated union of `RectShapeOption | CircleShapeOption | ArcShapeOption`. The `kind` tag drives compile-time enforcement of variant-required fields (`{ kind: 'arc' }` requires `innerR` / `outerR` / `startAngle` / `endAngle`).

**`EdgeStyle.shape` = `EdgeShapeOptions`** — single interface (no union) carrying `pathType` + anchor + router + pathStyle params (`sourceAnchor`, `targetAnchor`, `sourceAnchorOpts`, `targetAnchorOpts`, `pathStyleOpts`, `waypoints`).

**Label fields** flatten the canvas `ShapeLabelStyle` / `ConnectorLabelStyle` surfaces:

- text/font: `labelText`, `labelColor`, `labelFontSize`, `labelFontFamily`, `labelFontWeight`, `labelFontStyle`, `labelAlign`, `labelLineHeight`, `labelLetterSpacing`
- placement: `labelPlacement`, `labelOffsetX`, `labelOffsetY`, `labelRotation` (nodes) / `labelPathOffset`, `labelAutoRotate`, `labelKeepUpright` (edges), `labelAlpha`, `labelMinFontSize`
- background pill: `labelBackgroundFill`, `labelBackgroundAlpha`, `labelBackgroundStrokeColor`, `labelBackgroundStrokeWidth`, `labelBackgroundPadding`, `labelBackgroundCornerRadius`
- resolution / LOD / collision: `labelMinZoom`, `labelMaxZoom`, `labelPriority`, `labelCollisionGroup`, `labelForceShow`

**Escape hatch — `labelStyle: ShapeLabelStyle | ConnectorLabelStyle`** — when the flat fields don't cover a case (wrap / maxLines, html-text content, custom stroke on text), supply the full canvas payload directly. The adapter uses it verbatim and **ignores the flat label fields**.

### Hierarchy — `parentId` is the only field

Earlier drafts followed G6 and exposed `combo` (group id) and `children` (denormalised child ids) alongside `parentId`. Both were dropped:

- `combo` overlaps with `parentId` — a "combo" is just a regular node that visually represents a group; nodes "in the combo" can express that as `parentId: <comboNodeId>`. Two fields for one concept.
- `children` is the inverse of `parentId` — users could set both and drift them out of sync. The store already maintains the inverse index internally (`childrenIndex: Map<string, Set<string>>`) and exposes it via the existing iterators `store.childrenOf(id)` / `store.descendantsOf(id)`.

**Rule:** users describe the tree bottom-up via `parentId`. To query children/descendants, use the store methods. The hierarchy field is single and authoritative.

### `state` (catalogue) vs `states` (active list)

Singular `state` is a *catalogue* of style overlays keyed by state name. Plural `states` is the *active list* of state names currently applied. Both can be set at multiple layers; precedence is documented in `data-types-implementation-plan.md`.

- Per-instance `NodeData.state` — `Record<string, NodeStyle>` overlay payloads for THIS node.
- Per-instance `NodeData.states` — `readonly string[]` (active list).
- Layer-level `NodeOption.state` — `Record<string, ResolvableNodeStyle<GraphNode>>` overlay payloads for ALL nodes.

### Resolution precedence (highest wins, per-field merge)

For each node, `GraphLayer.resolveNodeStyle(node)` builds the final flat
`NodeStyle` by `Object.assign`-ing contributions in this order:

1. Layer `options.node.style` — resolved against the stored `GraphNode`.
2. Per-node `node.style` — concrete `NodeStyle`.
3. For each name in `node.states[]` (iteration order):
   - layer-level `options.node.state[name]` — resolved.
   - per-node `node.state[name]` — concrete.

Decorations are a special case: instead of last-write-wins per field, the
contributing `decorations[]` arrays are **concatenated** across the same
contribution order, then deduped by `id` (`spec.id ?? `${kind}#<index>``,
later wins). `remove: true` in a higher-precedence overlay drops an earlier
same-id entry. See `resolveNodeDecorations` / `resolveEdgeDecorations`.

`resolveNodeStyle` and `resolveEdgeStyle` are public on `GraphLayer` —
behaviours that need the same effective style the renderer sees
(`NodeSizeLODBehaviour`, `LabelCollisionBehaviour`, `MiniMapLayer`) call
them directly rather than duplicating the merge logic.

### Resolver model

`ResolvableNodeStyle<D>` makes each field `T | ((subject: D) => T)`:

- On `NodeOption.style`, `D = GraphNode` — resolvers fire every render.
- On `NodeInput`, `D` = the raw input `data` — resolvers fire once at insert; the store holds concrete values.

`ResolvableId<D> = string | ((data: D) => string)` for the optional input-side id derivation.

### Storybook convention — light per-item, heavy layer template

Per [[feedback_storybook_data_pattern]] and recent refinements:

- **Hardcode per-item data** as literal arrays (no `.map()` / `for` loops generating nodes or edges). The data shape needs to read cleanly in Storybook's "Show code" tab.
- **Hoist truly shared styling to the layer template** (`options.node.style`, `options.edge.style`). Per-item entries only carry what genuinely differs (id, position/source/target, unique `labelText`, distinguishing fill).
- **Don't write helper functions** in story files. The resolver merges layer + per-item styles correctly, so the layer template can carry e.g. label font/colour/background and per-item only sets `labelText`.
- **Escape hatch (`labelStyle`)** only when the flat fields can't express the case (wrap, html-text). Otherwise prefer flat.

## State vs. data — bifurcated source of truth

Per `architecture-proposal.md` §2.1:
- **`Layer.state`** holds UI / interaction / decoration intent: `hoveredId`, `selectedIds`, `haloIds`, `pulsedIds`, drag state. Small, observable, time-travel-able.
- **`Layer.data`** holds bulk node/edge data in `ColumnStore`s: positions, colors, sizes. Up to millions of items, mutated at machine rate (1000s/sec from feeds). Not immer-managed.

Sugar methods that affect interaction → `state.setState(...)`. Sugar methods that change positions/attrs → `data.nodes.setX(...)` / etc. Both feed the same `DirtyBatcher`; one `flush()` projects to the renderer.

## Decoration sugar convention

`@invana/canvas` exposes one generic decoration method: `renderer.setDecoration(id, slot, spec)`. `GraphLayer` adds discoverable, typed shortcuts on top — graph-domain method names that mutate **state** (never the renderer directly), so the state-as-truth contract holds and devtools / time-travel / telemetry catch every change.

```ts
graphLayer.haloNode(id, style | null)             // slot 'halo',   kind 'halo'
graphLayer.dashBorderNode(id, style | null)       // slot 'border', kind 'border'
graphLayer.pulseNode(id, opts | false)            // slot 'pulse',  kind 'pulse-ring'
graphLayer.glowNode(id, style | null)             // slot 'glow',   kind 'glow'
graphLayer.marchingAntsNode(id, style | null)     // slot 'border', kind 'marching-ants'
graphLayer.flashEdge(id, opts)                    // edge equivalent
```

**Convention** — every sugar method:
1. Takes `(id, style | null | false)` — second arg of `null` / `false` clears the decoration.
2. Mutates layer state only; never calls `renderer.setDecoration` directly.
3. Maps to one slot + one decoration kind (both built into `@invana/canvas`).

The actual decoration **rendering logic** (HaloDecoration, BorderDecoration, etc.) lives in `@invana/canvas` because it's domain-agnostic. `@invana/graph` only owns the *graph-domain naming* and the *state shape* (which ids have which decorations). When `@invana/er-diagram` ships, it'll add its own sugar (`erLayer.haloTable(id)`, `erLayer.markConflict(tableId)`) over the same canvas decorations.

## Rules

- No `pixi.js` imports — go through `@invana/canvas` API only.
- Behaviours don't auto-enable; the developer registers + enables them explicitly.
- Cross-layer deps via explicit `*LayerId` option fields (proposal §2.4).
- Decoration sugar methods mutate state, never the renderer directly (see above).
