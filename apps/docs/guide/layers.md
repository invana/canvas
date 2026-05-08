# Layers

A **Layer** is the unit of rendered output. Compose a scene by stacking Layers in z-order.

If you take one thing away from this page: **a layer's `state` is the single source of truth.** The renderer is a function of state. Every mutation lands in state; every frame, the layer projects state to the renderer in one batched flush.

## What every Layer owns

```ts
abstract class Layer<TOptions, TState, TEvents, TDirtyBucket> {
  readonly id: string;
  readonly options: TOptions;          // construction-time, mostly-immutable config
  readonly state: Store<TState>;       // observable interaction state (zustand+immer)
  readonly events: SourceEmitter;      // typed, layer-scoped, auto-taps to canvas
  readonly dirty: DirtyBatcher;        // marks which ids changed since last frame

  visible: boolean;       // default true
  hittable: boolean;      // default true — false skips this layer during hit-test
  zIndex: number;         // default 0
  cullable: boolean;      // default true — false for full-canvas effect layers
}
```

Five fields, three flags. That's the surface every Layer presents to the canvas.

## Two abstract bases — pick one

You'll never extend `Layer` directly. You extend either `WorldLayer` or `ScreenLayer`. They mount onto different internal pixi containers and have different `hitTest` signatures so the type system catches coordinate mix-ups.

| Class | Coords | Camera affects it? | Mounts onto |
|---|---|---|---|
| `WorldLayer` | world | yes — pans + zooms with the diagram | `ctx.world` (a `pixi-viewport`) |
| `ScreenLayer` | screen pixels | no — fixed to the viewport | `ctx.stage` (the pixi root) |

### The decision rule

When you're not sure: imagine the user pans the camera 100px to the right.

- **The thing should slide 100px with the diagram → `WorldLayer`.** Graph nodes and edges, a backdrop grid, ER tables, swimlane bodies, decorations on data, custom diagram content.
- **The thing should stay glued to the same screen position → `ScreenLayer`.** Minimaps, dev info / FPS overlays, floating toolbars, tooltips, lasso rectangles, loading spinners, scale rulers.

Most layers are `WorldLayer`s. Reach for `ScreenLayer` when you're building UI overlays, not diagram content.

## Options vs state vs data — the bifurcated source of truth

Three slots, deliberately distinct, each with a different mutation profile:

| Slot | Purpose | Mutated by | Backed by | Scale |
|---|---|---|---|---|
| `options` | construction-time config: defaults, fixed style choices, peer layer ids | constructor; rare `setOptions()` | plain object | trivial |
| `state` | UI / interaction / decoration *intent* — hover, selection, drag, view modes | layer API, behaviours | zustand + immer | small (< few k items), observable |
| `data` | bulk hot data — node/edge attributes, positions, large per-instance fields | `Layer.update*`, layouts, external feeds | typed-array `ColumnStore` | huge (millions), high-frequency |

Why split `state` and `data`? Because immutable `Map` + immer doesn't scale. Cloning a 500k-entry Map per mutation costs tens of milliseconds. A typed-array column store mutates in place at ~10 ns per write, holds millions of items in tens of MB instead of hundreds, and supports bulk feeds at memcpy rate.

`state` and `data` together are the layer's source of truth. The split is performance, not semantics — both feed `flush()`, both feed the same dirty buckets.

::: tip Where each field belongs
**`state`** if it's read by inspectors, changes at user-input rate, is a `Set<id>` of "which ids are highlighted/selected", or matters for devtools / time-travel.

**`data`** if the renderer reads it directly (coordinates, attributes), it changes at machine rate (feeds, layouts, simulations), or it's per-instance for potentially millions of items.

Only subclasses that need bulk hot data declare a `data` field — the base `Layer` doesn't ship one.
:::

## The render projection — state → pixels

This is the core of the architecture. It's worth understanding once and then it's automatic.

```
mutation (your code, behaviour, data feed)
    │  setState / data.set* / etc.
    ▼
state commits
    │  layer marks affected ids dirty: this.dirty.mark('halo', id)
    ▼
mutation returns (O(1) — no rendering yet)

────────── ~16ms later ──────────

Canvas tick (single RAF, owned by Canvas)
    │
    ▼
walk layers in z-order
    │
    ▼  for each visible layer:
    │     if hasPending(): flush()
    │
    ▼
flush() drains dirty snapshot → applyDirty(snap)
    │
    ▼
applyDirty translates buckets → renderer commands
    │
    ▼
PixiJS paints only changed objects
```

Two properties fall out:

- **Mutations are O(1).** No RAF scheduling at the call site, no synchronous render.
- **Renders are bounded.** 1000 mutations in one frame collapse to one render pass touching only the changed shapes.

This applies to **every** mutator. Your imperative API, behaviours, upstream feeds — they all use the same path.

## Subclass hooks

When you write a Layer, you implement at minimum:

```ts
class MyLayer extends WorldLayer<MyOptions, MyState, MyEvents, MyDirtyBucket> {
  // Build initial state. Called once in the constructor.
  protected createState(): MyState {
    return { /* … */ };
  }

  // Optional: domain-specific mount setup — subscribe to peers, attach
  // renderer, populate the renderer from data.
  protected onMount(ctx: CanvasContext): void {
    const source = ctx.layers.get<GraphLayer>(this.options.sourceLayerId);
    source.events.on('selection:changed', (s) => this.refresh(s));
  }

  // Optional: teardown — unwind subscriptions registered on peers in onMount.
  protected onUnmount(_ctx: CanvasContext): void {
    /* … */
  }

  // Optional: translate dirty buckets into renderer commands.
  // Called once per frame when dirty.hasPending() is true.
  protected applyDirty(snap: DirtySnapshot<MyDirtyBucket>): void {
    for (const id of snap.get('shape')) this.renderer.updateShape(id, /* … */);
    for (const id of snap.get('halo'))  this.renderer.setDecoration(id, 'halo', /* … */);
  }

  // Required (WorldLayer): hit-test in world coords. Top-most hit or null.
  hitTest(worldX: number, worldY: number) {
    return null;
  }
}
```

`createState()` is the only one that's strictly abstract. Everything else has a sensible default; override only what you need.

## Marking dirty — the per-frame batching primitive

Mutations *should not* re-render synchronously. They mark dirty:

```ts
class GraphLayer extends WorldLayer<...> {
  // Public API — anything can call this; behaviours, your code, data feeds.
  selectNode(id: string): void {
    this.state.setState((s) => {
      s.selectedIds = new Set([...s.selectedIds, id]);
    });
    this.dirty.mark('halo', id);
  }

  // Hot-path data mutation — typed-array write, no immer, O(1).
  updateNodePosition(id: string, x: number, y: number): void {
    this.data.nodes.setX(id, x);
    this.data.nodes.setY(id, y);
    this.dirty.mark('shape', id);
  }
}
```

The `applyDirty(snap)` hook is the single place where state becomes pixels. Each bucket name is a string of your choosing — `'shape'`, `'halo'`, `'edge-route'`, whatever the layer needs.

External mutators (behaviours calling `state.setState` directly, upstream feeds writing to a column store) need to land in dirty buckets too. Layers wire this up by subscribing to their own state / data inside `onMount` and translating subscriber callbacks into `dirty.mark(...)` calls.

## Hit testing

Each Layer implements `hitTest` against its own data + spatial index. The Canvas drives a top-down hit walk by z-order:

1. Walk layers in z-order, top to bottom (screen-layers before world-layers).
2. Skip layers where `hittable === false`.
3. The first layer that returns a non-null result wins. Stop.
4. If no layer claims the hit, the canvas emits `'background:click'` (with world coords).

This is DOM-style targeting — like `event.target` resolves to one element. Set `hittable: false` on backgrounds, decorative overlays, and effect layers that should never receive input.

`WorldLayer.hitTest` takes world coords. `ScreenLayer.hitTest` takes screen coords. The signatures differ on purpose — TypeScript catches you when you mix them.

## Cross-layer dependencies

When a Layer reads from a peer (a minimap reflecting a graph, a heatmap overlay reading a graph's node positions), declare the dependency as an explicit `*LayerId` field in options:

```ts
canvas.layers.add(new GraphLayer({ id: 'graph', options: { /* … */ } }));
canvas.layers.add(
  new MiniMapLayer({
    id: 'minimap',
    options: { sourceLayerId: 'graph' },
  }),
);
```

Inside `MiniMapLayer.onMount`:

```ts
protected onMount(ctx: CanvasContext): void {
  const source = ctx.layers.get<GraphLayer>(this.options.sourceLayerId);
  if (!source) {
    throw new Error(`MiniMapLayer "${this.id}" requires layer "${this.options.sourceLayerId}"`);
  }
  source.events.on('selection:changed', (s) => this.refresh(s));
  source.state.subscribe((s) => this.highlightSelection(s.selectedIds));
}
```

**Don't infer the dependency** ("find the only graph layer of type GraphLayer"). Adding a second graph would silently break the binding. Explicit ids make multi-layer scenes work without ambiguity, and missing dependencies surface as clear errors at mount time.

## Composition

Adding a Layer mounts it; removing unmounts it. Defaults: `visible: true`, `hittable: true`, `zIndex: 0`.

```ts
canvas.layers.add(new BackgroundLayer({ id: 'bg', options: { pattern: 'dots' } }));
canvas.layers.add(new GraphLayer({ id: 'graph', options: { /* … */ }, zIndex: 10 }));
canvas.layers.add(new MiniMapLayer({ id: 'minimap', options: { sourceLayerId: 'graph' } }));

// Toggle without removing:
canvas.layers.get('bg')!.visible = false;

// Re-order at runtime (WorldLayer/ScreenLayer):
canvas.layers.get<GraphLayer>('graph')!.setZIndex(5);

// Remove permanently:
canvas.layers.remove('minimap');
```

Z-order ties broken by registration order — earlier add, drawn first.

## Custom Layer — minimal example

```ts
import { WorldLayer } from '@invana/canvas';
import type { CanvasContext, Graphics } from '@invana/canvas';

interface BoxOptions {
  size: number;
}

interface BoxState {
  hovered: boolean;
}

class BoxLayer extends WorldLayer<BoxOptions, BoxState> {
  private g?: Graphics;

  protected createState(): BoxState {
    return { hovered: false };
  }

  protected onMount(_ctx: CanvasContext): void {
    this.g = this.createGraphics('box');
    this.repaint();
    // when state changes, re-paint
    this.state.subscribe(() => this.repaint());
  }

  private repaint(): void {
    if (!this.g) return;
    this.g.clear();
    const { size } = this.options;
    const { hovered } = this.state.getState();
    this.g
      .rect(-size / 2, -size / 2, size, size)
      .fill(hovered ? 0xef4444 : 0x3b82f6);
  }

  hover(yes: boolean): void {
    this.state.setState((s) => {
      s.hovered = yes;
    });
  }

  hitTest(worldX: number, worldY: number) {
    const half = this.options.size / 2;
    if (Math.abs(worldX) <= half && Math.abs(worldY) <= half) {
      return { id: this.id };
    }
    return null;
  }
}

const canvas = new Canvas();
await canvas.init({ container: document.getElementById('app')! });
canvas.layers.add(new BoxLayer({ id: 'box', options: { size: 200 } }));
```

In a real layer, swap the manual `repaint` for the `dirty` + `applyDirty` flow — but the minimal pattern is the same: state mutates, the layer reads state, paints into a `Graphics`.

## What's next

- [Behaviours](/guide/behaviours) — how input lands in `state`
- [Renderers](/guide/renderers) — when to compose `PrimitivesRenderer` instead of painting directly
- [Events](/guide/events) — `layer.events` vs `canvas.events`
