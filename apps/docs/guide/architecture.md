# Architecture Overview

`@invana/canvas` is built on **three composable concepts** plus one primitive. Get these right and the rest of the system falls out:

| Concept | Job | Owns |
|---|---|---|
| **Layer** | render | data + state + events + visible output + z-order |
| **Behaviour** | input → state mutation | input subscriptions |
| **Layout** | data → positions | a position-projection function |
| **Renderer** *(primitive)* | draw a class of things | pixels, hit-testing, raw events |

Renderers are tools that Layer authors compose internally — they're never registered with the canvas. Layers, Behaviours, and Layouts are what *you* compose to build a scene.

## Why three concepts and not one

The previous design had a single `Plugin` interface covering rendering, input, and data transforms. That collapsed under its own weight: should a plugin's `enabled` start `true` or `false`? How do you express that lasso and pan both want `shift+drag`? What does "register" mean for a layout that runs once and exits?

Splitting the concept clears all of that up:

- **Layers** default to `visible: true` — adding one means you want to see it.
- **Behaviours** default to `enabled: false` — registration just wires them up; the developer enables.
- **Layouts** don't register at all — you call `await layout.apply(layer)`.

Each concept has different defaults, lifecycle, and conflict semantics because they're different things.

## Mental model: state is the single source of truth

Everything the user sees is a projection of layer state. The renderer is a function of state, not a parallel system.

```
state mutation (any source — Layer API, Behaviour, upstream feed)
    ↓ machine cadence (1000+/sec OK)
zustand commits, fires subscribers
    ↓
Layer marks affected ids dirty in DirtyBatcher (O(1))
    ↓
next Canvas tick (~16ms — Canvas owns the single requestAnimationFrame)
    ↓
Canvas walks layers in z-order; layers with hasPending() flush()
    ↓
flush() drains dirty snapshot → renderer commands
    ↓
PixiJS paints only changed objects
```

Two properties fall out:

- **Mutations are O(1).** A `setState` call + a Set add. No RAF scheduling at the call site.
- **Renders are bounded.** At most one render pass per frame regardless of mutation rate. 1000 mutations in one frame collapse to one batched render.

This applies to **every** mutator — your code, behaviours, upstream data feeds. They all land in state; the layer's flush projects state to the renderer once per frame.

## Layer

A Layer is the unit of rendered output. It owns:

- `id` — stable identifier for registries, events, telemetry envelopes.
- `options` — construction-time config (what's fixed about how this layer renders).
- `state` — observable interaction state (zustand + immer).
- `events` — typed `SourceEmitter` that auto-forwards to the canvas tap.
- `dirty` — `DirtyBatcher` for per-frame batched flush.
- `visible` / `hittable` / `zIndex` / `cullable` — composition flags.

The base `Layer<TOptions, TState, TEvents, TDirtyBucket>` has these abstract / overridable hooks:

```ts
abstract class Layer<TOptions, TState, ...> {
  readonly id: string;
  readonly options: TOptions;
  readonly state: Store<TState>;       // zustand store w/ immer
  readonly events: SourceEmitter;      // layer-scoped events
  readonly dirty: DirtyBatcher;

  visible: boolean;                    // default true
  hittable: boolean;                   // default true
  zIndex: number;                      // default 0
  cullable: boolean;                   // default true

  mount(ctx: CanvasContext): void;     // called by LayerRegistry.add
  unmount(): void;
  flush(): void;                       // called by Canvas tick when hasPending()
  hasPending(): boolean;

  // Subclass hooks:
  protected abstract createState(): TState;
  protected applyDirty(snap): void;    // translate dirty buckets → renderer
  protected onMount(ctx): void;        // subscribe to peers, attach renderer
  protected onUnmount(ctx): void;
}
```

### WorldLayer vs ScreenLayer

Two abstract bases with different coordinate systems and different `hitTest` signatures. The type system stops you from mixing world and screen coordinates.

| Class | Coords | Affected by camera? | Examples |
|---|---|---|---|
| `WorldLayer` | world | yes | `GraphLayer`, `BackgroundLayer`, ER tables, swimlane bodies |
| `ScreenLayer` | screen | no — fixed to viewport | minimap, dev info, toolbars, lasso rectangle |

**The decision rule:** if the user pans the camera 100px, should this thing move with the diagram, or stay glued to the screen?

- **Move with the diagram → `WorldLayer`.** Default for almost everything.
- **Stay glued to the screen → `ScreenLayer`.** UI overlays, HUD, fixed widgets.

See [the layers guide](/guide/layers) for the full picture and decision tree.

## Behaviour

A Behaviour subscribes to input and mutates state — never renders, never owns data.

```ts
abstract class Behaviour {
  readonly id: string;
  readonly enabled: boolean;            // default FALSE — opt-in only
  readonly scope: 'layer' | 'canvas';   // inferred from layerId presence
  readonly layerId?: string;            // required for layer-scoped
  readonly shortcuts?: readonly string[]; // advisory metadata for conflict warnings

  register(ctx: CanvasContext): void;
  destroy(): void;
  enable(): void;
  disable(): void;
}
```

Two scopes:

- **Layer-scoped** — takes a `layerId`, mutates that layer's state. `HoverActivateBehaviour({ layerId: 'graph' })`.
- **Canvas-scoped** — operates on the canvas itself (camera, global input). `DragPanBehaviour()`, `WheelZoomBehaviour()`.

**Defaults are deliberately uncomfortable:** `enabled: false` so registration alone never silently activates input. The developer flips it on.

```ts
canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
canvas.behaviours.register(new LassoSelectBehaviour({ id: 'lasso', layerId: 'graph' }));
// later, from a UI handler:
canvas.behaviours.setEnabled('pan', false);
canvas.behaviours.setEnabled('lasso', true);
```

If two enabled behaviours claim the same gesture (`shortcuts: ['shift+drag']`), the registry warns. It does not enforce mutual exclusion — that's the developer's call.

See [the behaviours guide](/guide/behaviours) for scope rules, conflict handling, and the built-ins.

## Layout

A Layout is a function from data to positions. It does not register with the canvas. It does not render. It does not subscribe to input.

```ts
interface Layout<TLayer extends Layer = Layer> {
  apply(layer: TLayer): Promise<void>;
}
```

You instantiate it and call it against a layer:

```ts
const force = new D3ForceLayout({ charge: -300 });
await force.apply(graphLayer);

const elk = new ElkLayout({ algorithm: 'layered' });
await elk.apply(graphLayer);
```

A layout reads `layer.data`, computes positions, writes them back into the layer. Done.

Continuous-running cases (always-relax force simulation) are handled by a thin Behaviour that calls `apply()` on a tick. The Layout API itself stays a one-shot pure function.

See [the layouts guide](/guide/layouts).

## Renderer (primitive)

A Renderer knows how to draw a *class* of things — shapes + connectors, tile pyramids, raster images. It carries no domain knowledge.

`ShapesRenderer` — the canvas's built-in renderer — knows about pixels, hit-testing, and the camera. It knows nothing about nodes, edges, tables, or columns. It's *told* what to draw, and draws it.

A `GraphLayer` composes `ShapesRenderer` internally and supplies all the policy: which nodes/edges become which shapes/connectors, what LOD thresholds apply, when to bump label resolution, what hover/selection look like. A future `ERDiagramLayer`, `FlowchartLayer`, or `SwimlaneLayer` would do the same — same renderer, different brain.

**Users add Layers. Renderers are tools Layer authors use.** A renderer is never added to `canvas.layers`.

See [the renderers guide](/guide/renderers).

## CanvasContext — the shared access surface

Layers, Behaviours, and Layouts all see the same context object:

```ts
interface CanvasContext {
  layers: LayerRegistry;          // get<T>(id), list(), add(), remove()
  behaviours: BehaviourRegistry;  // get<T>(id), list(), register(), setEnabled()
  camera: Camera;                 // pan, zoom, fitContent, toWorld, toScreen
  events: CanvasEventBus;         // canvas-wide events + telemetry tap
  world: Container;               // pixi container WorldLayers attach to
  stage: Container;               // pixi root ScreenLayers attach to
}
```

A Behaviour reads peer layers. A Layer subscribes to another layer's events. A Layout reads camera bounds. No three parallel context types — one shared shape.

## Cross-layer dependencies must be explicit

When a layer needs another layer (a minimap reading the graph it mirrors), pass the source layer's id as an option:

```ts
canvas.layers.add(new GraphLayer({ id: 'graph', ... }));
canvas.layers.add(new MiniMapLayer({ id: 'minimap', sourceLayerId: 'graph' }));
```

Don't infer "the only graph layer." Don't reach by type. Multi-layer scenes need explicit ids; missing dependencies should surface as clear errors at mount time.

## What's next

Continue with the concept guides:

- [Layers](/guide/layers) — state vs data, dirty/flush, hit testing, when to subclass which base
- [Behaviours](/guide/behaviours) — scope, lifecycle, defaults, gesture conflicts
- [Layouts](/guide/layouts) — pure-function model, continuous simulations
- [Renderers](/guide/renderers) — `ShapesRenderer`, decorations, the boundary with Layers
- [Events](/guide/events) — the three-tier event hierarchy and the telemetry tap
