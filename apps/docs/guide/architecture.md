# Architecture

`@invana/canvas` is organised around four primary kinds:

| Kind | Role |
|---|---|
| **Layer** | Owns visual output, interaction state, and per-frame flush. World-space or screen-space. |
| **Behaviour** | Subscribes to input, mutates state. Opt-in, explicitly enabled. |
| **Layout** | Pure function: reads layer data, computes positions, writes them back. No registration, no rendering. |
| **Renderer** | Domain-free drawing surface. The `PrimitivesRenderer` is the one renderer shipped today. |

A long-form rationale lives in `architecture-proposal.md` at the repo root.

## The mental model

```
            ┌─────────────────────────────────────────────┐
            │                  Canvas                     │
            │  (engine root: pixi app + ticker + bus)     │
            └───┬─────────────────────────────────────┬───┘
                │                                     │
       ┌────────▼─────────┐                  ┌────────▼──────────┐
       │  LayerRegistry   │                  │ BehaviourRegistry │
       └────────┬─────────┘                  └────────┬──────────┘
                │ owns                                 │ owns
       ┌────────▼──────────┐                  ┌────────▼─────────┐
       │      Layers       │   ◄── state ──   │   Behaviours     │
       │ (visual + state)  │     mutations    │ (input → state)  │
       └────────┬──────────┘                  └──────────────────┘
                │ composes
       ┌────────▼─────────┐
       │ PrimitivesRenderer│
       │ (shapes, edges,   │
       │  decorations…)    │
       └───────────────────┘
```

- **Canvas** owns the pixi `Application`, the tick loop, the `Camera`, the `CanvasEventBus`, and the two registries.
- **Layers** are added to `canvas.layers`. Each owns a small UI state store (zustand+immer), a `DirtyBatcher`, and — when it draws primitives — its own `PrimitivesRenderer`.
- **Behaviours** are registered on `canvas.behaviours`. They subscribe to layer events or bus events and mutate layer state. Behaviours never render and never own data.
- **Layouts** are pure objects with an `apply(layer)` method. They never register with the canvas.

## State vs data

Layers carry two kinds of mutable state:

- **`layer.state`** — small, observable UI / interaction state managed by zustand+immer. Examples: `hoveredId`, `selectedIds`, `haloIds`. Time-travel-able, devtools-friendly.
- **`layer.data`** *(subclass-provided)* — bulk hot data living in typed-array `ColumnStore`s. Built for millions of items mutated at machine rate. Not immer-managed.

The base `Layer` ships `state` and a `DirtyBatcher`; subclasses that need bulk data (e.g. a future `GraphLayer`) attach `ColumnStore` instances themselves.

## The tick

`Canvas.tick()` runs once per `requestAnimationFrame` (delegated to pixi's `Ticker`):

1. Advance the camera (so `pixi-viewport` plugins that animate — decelerate, snap — can update).
2. Walk `layers.byZOrder()`.
3. Skip invisible layers.
4. If a layer has pending dirty work, call `layer.flush()`.
5. If the layer (or its composed renderer) exposes `tickAnimations(dt)`, call it.
6. Pixi auto-renders the stage at end of tick.

No layer schedules its own RAF. There is one tick loop.

## World vs screen

A canvas has two coordinate spaces:

- **World** — what the camera transforms. Diagram content lives here.
- **Screen** — fixed to the viewport. Overlays, HUDs, tooltips, minimaps live here.

`WorldLayer`s and `ScreenLayer`s subclass the same `Layer` base but mount their root pixi containers into different parents (`canvas.world` for world layers, `canvas.stage` for screen layers).

See [Layers](./layers.md) for picking the right base.

## Events

There is one canvas-wide event bus (`canvas.events`) with two channels:

- **Typed events** via `on(name, handler)` — `layer:added`, `behaviour:enabled`, `camera:zoom`, `renderer:initialised`, …
- **Tap channel** via `tap(handler)` — a single firehose that receives every event emitted system-wide, wrapped in a `CanvasEvent` envelope. Telemetry sinks plug in here once and see everything.

Per-layer events flow through `layer.events` (a `SourceEmitter`) — they're typed and forwarded to the bus so taps still see them.

See [Events](./events.md).

## Domain-free primitives rule

The `PrimitivesRenderer` and everything it knows about — shape kinds, connector kinds, marker kinds, router kinds, decoration kinds — must remain **domain-free**. No reference to nodes, edges, vertices, tables, columns, lanes, ports, swimlanes, etc.

Domain packages (`@invana/graph`, future ER / swimlane / flowchart packages) compose primitives by extending `WorldLayer` / `ScreenLayer` and projecting domain state into `addShape` / `addConnector` / `setDecoration` calls.

**Rule of thumb:** if you can rename a file by stripping the domain word and the name still makes sense, it belongs in `packages/canvas`. Otherwise it belongs in a domain package.

## Where the boundaries are

| Concern | Lives in |
|---|---|
| pixi.js usage | `packages/canvas/src/` only — never re-exported, never imported elsewhere |
| `new Graphics()` / `new Container()` | `packages/canvas/src/` only |
| Decoration geometry | `packages/canvas/src/primitives/decorations/` (pure-class primitives) |
| Domain-specific naming (node, edge, ...) | `packages/graph/` and other domain packages |
| Layout algorithms | their own packages (`@invana/graph-layout-d3-force`, `@invana/graph-layout-elkjs`) |
