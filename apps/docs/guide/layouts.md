# Layouts

A **Layout** is a function from data to positions. It's the simplest of the three concepts — and that's the point.

```ts
interface Layout<TLayer extends Layer = Layer> {
  apply(layer: TLayer): Promise<void>;
}
```

That's the whole interface.

You instantiate a Layout. You call `apply()` against a Layer. The Layout reads `layer.data`, computes positions, writes them back. Done.

```ts
import { D3ForceLayout } from '@invana/graph-layout-d3-force';

const force = new D3ForceLayout({ charge: -300, linkDistance: 80 });
await force.apply(graphLayer);
```

## Why this is the whole story

Layouts have no canvas registration. They have no rendering. They have no input subscriptions. They have no `enabled` flag. Two layouts can run on the same data — that's a domain concern, not something the framework needs to enforce.

Three things follow from this:

- **No lifecycle to learn.** Constructor + `apply()`. That's it.
- **Pure-ish functions.** The same input data + same options give you the same positions.
- **Async is built in.** ELK takes seconds; D3 force runs many ticks. `apply()` returns a `Promise`, you `await` it.

## Reading from the canvas during apply

A Layout sometimes needs canvas-level information — visible bounds, peer layers, the camera. It reads them through the layer's context (which is set after `mount()`):

```ts
class D3ForceLayout {
  constructor(private opts: D3ForceOptions) {}

  async apply(layer: GraphLayer): Promise<void> {
    const bounds = layer.context.camera.getVisibleBounds();
    // …clamp positions to visible area, seed simulation, etc.
  }
}
```

The same `CanvasContext` shape that Layers and Behaviours see is available to Layouts via the layer they're operating on. No three parallel context types — one shared shape.

## When and where to call apply

Typical patterns:

**Once on initial load.** Run a layout when data lands, then never again:

```ts
graphLayer.setData({ nodes, edges });
await new D3ForceLayout({ charge: -300 }).apply(graphLayer);
```

**On data changes.** Recompute positions when new nodes appear:

```ts
graphLayer.events.on('data:replaced', async () => {
  await new ElkLayout({ algorithm: 'layered' }).apply(graphLayer);
});
```

**On user action.** Wire a button to re-run a layout:

```ts
relayoutButton.addEventListener('click', async () => {
  await new D3ForceLayout({ charge: -300, iterations: 200 }).apply(graphLayer);
});
```

Layouts mutate the layer's data slot (typed-array columns), the layer marks affected ids dirty, the next Canvas tick projects new positions to the renderer. Same flush loop as every other state mutator.

## Two layouts on the same layer

Whether two layouts conflict is a **domain concern**, not framework enforcement. Don't apply two layouts to the same data unless you know what you want — they'll fight, and the winner is whichever wrote last.

If you need to switch layouts, just call the new one:

```ts
await new ElkLayout({ algorithm: 'layered' }).apply(graphLayer);
// later, switch:
await new D3ForceLayout({ charge: -300 }).apply(graphLayer);
```

The second `apply()` overwrites positions from the first. No registration to clean up, no listeners to remove.

## Continuous-running layouts

Force simulations sometimes want to run *every frame* — a node drag perturbs the system, the simulation relaxes back to equilibrium over the next few hundred frames.

The Layout API stays a one-shot pure function. Continuous behaviour is a thin **wrapper Behaviour** that calls `apply()` on a tick:

```ts
class ContinuousForceBehaviour extends Behaviour {
  private layout = new D3ForceLayout({ charge: -300, alpha: 0.05 });
  private ticking = false;

  protected onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.layerId!);
    ctx.events.on('canvas:tick' as never, async () => {
      if (!this.isEnabled || this.ticking) return;
      this.ticking = true;
      try {
        await this.layout.apply(layer);
      } finally {
        this.ticking = false;
      }
    });
  }
}
```

This gives you the best of both: a clean Layout API for one-shot runs, and the continuous case handled by a behaviour that's opt-in like every other behaviour.

## Layout authors: where to mutate

Inside `apply()`, mutate `layer.data` (the typed-array column store) and let the layer's dirty subscription pipeline handle the rest:

```ts
class StaticGridLayout {
  async apply(layer: GraphLayer): Promise<void> {
    let i = 0;
    const cols = Math.ceil(Math.sqrt(layer.data.nodes.size));
    layer.data.nodes.forEach((id) => {
      const x = (i % cols) * 100;
      const y = Math.floor(i / cols) * 100;
      layer.data.nodes.setX(id, x);
      layer.data.nodes.setY(id, y);
      i++;
    });
  }
}
```

You don't call `dirty.mark()` directly from inside the Layout. The Layer subscribes to its own column-store changes during `onMount` and translates them into dirty buckets — that's the layer's job, not the layout's.

Avoid touching `layer.state`. State is for interaction intent (hover, selection). Layouts deal in positions, which live in `data`.

## A note on ergonomics

`Layout` is intentionally minimal — one method, one argument, one return type. If a layout author finds themselves wanting `layout.start()`, `layout.stop()`, `layout.events`, or `layout.options` to be observable, they're really writing a Behaviour. Lean into that. The Layout interface is for the function. Anything stateful or observable is a different concept.

## What's next

- [Layers](/guide/layers) — the data slot a Layout writes into
- [Behaviours](/guide/behaviours) — the wrapper for continuous-running cases
- [Renderers](/guide/renderers) — how new positions become pixels
