# CLAUDE.md — packages/graph (`@invana/graph`)

Graph-domain layers and behaviours that compose `@invana/canvas`. Replaces the old `@invana/plugins-graph-data` (now `*-deprecated`).

**Status:** skeleton.

## Scope (per proposal §5)

- `GraphLayer` (extends `WorldLayer`) — wraps a `ShapesRenderer` internally; owns interaction state via `Layer.state` (zustand+immer) and bulk data via `Layer.data` (typed-array `ColumnStore` extensions).
- `GraphNodeStore extends ColumnStore` — typed-array columns: `x:f32, y:f32, color:u32, size:f32, typeId:u16, …`.
- `GraphEdgeStore extends ColumnStore` — typed-array columns: `sourceSlot:u32, targetSlot:u32, weight:f32, color:u32, typeId:u16, …`.
- `MiniMapLayer` (extends `ScreenLayer`) — viewport-fixed minimap of a source `GraphLayer`.
- Behaviours: `HoverActivateBehaviour`, `ClickSelectBehaviour`, `LassoSelectBehaviour`, `BrushSelectBehaviour`, `PanBehaviour`, `DragMoveBehaviour`.
- Types: `INodeData`, `IEdgeData`, `IGraphStyles`.

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
