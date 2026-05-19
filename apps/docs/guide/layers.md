# Layers

A **Layer** owns visual output, UI / interaction state, and a per-frame flush. Compose a scene by stacking Layers in z-order.

Three layer classes ship today, all in `@invana/canvas`:

- `Layer<TOptions, TState, TEvents, TDirtyBucket>` — the abstract base.
- `WorldLayer` — camera-affected, world-coordinate content. **Default for almost everything.**
- `ScreenLayer` — viewport-fixed overlays.

There are no concrete built-in layers — `BackgroundLayer`, `MiniMapLayer`, etc. are future additions. Today every layer is one you subclass.

## What every Layer owns

| Field | Type | Purpose |
|---|---|---|
| `id` | `string` | Stable identifier. Used by registries, events, telemetry envelopes. |
| `options` | `TOptions` | Construction-time, mostly-immutable config. |
| `state` | `Store<TState>` | UI / interaction state (zustand + immer). Small, observable. |
| `events` | `SourceEmitter<TEvents>` | Typed per-layer events. Auto-forwarded to the canvas tap. |
| `dirty` | `DirtyBatcher` | Per-frame batched flush. |
| `visible` / `hittable` / `zIndex` / `cullable` | flags | Composition controls. |

Bulk hot data (`data`) is **not** on the base. Subclasses that need it (e.g. a future `GraphLayer`) attach `ColumnStore` instances themselves.

## Lifecycle

```
construct  →  add to canvas.layers  →  mount(ctx)  →  flush() on tick  →  ...  →  unmount()
```

- `Canvas` (via `LayerRegistry.add`) calls `mount(ctx)`.
- Subclass hooks: `createState()` (initial state), `onMount(ctx)`, `onUnmount(ctx)`, `applyDirty(snap)`.
- `flush()` is called per tick when `hasPending()` is true. It snapshots the dirty buckets and calls `applyDirty(snap)`.

## Picking a base — `WorldLayer` vs `ScreenLayer`

**Default to `WorldLayer`.** Diagram content — graph nodes, edges, ER tables, swimlane bodies, custom rendering — is camera-affected.

Reach for `ScreenLayer` only when the content must stay glued to a screen position regardless of camera:

| Use case | Base |
|---|---|
| Graph nodes, edges, diagram body | `WorldLayer` |
| Custom shapes / decorations on data | `WorldLayer` |
| Minimap (sticks to a corner) | `ScreenLayer` |
| Dev info / FPS overlay | `ScreenLayer` |
| Floating toolbars and palettes | `ScreenLayer` |
| Tooltips at cursor offsets | `ScreenLayer` |
| Lasso / rubber-band rectangle | `ScreenLayer` |
| Scale ruler ("1 cm = 100 units") | `ScreenLayer` |

The mental test: *if the user pans the camera 100px right, should this thing move with the diagram or stay glued to the screen?* Move with the diagram → `WorldLayer`. Stay glued → `ScreenLayer`.

## A minimal WorldLayer

```ts
import {
  WorldLayer,
  type WorldLayerHit,
  type CanvasContext,
} from '@invana/canvas';
import { PrimitivesRenderer } from '@invana/canvas/primitives';

interface NotesOptions { /* layer config */ }
interface NotesState  { selectedId: string | null }

class NotesLayer extends WorldLayer<NotesOptions, NotesState> {
  private renderer!: PrimitivesRenderer;

  protected createState(): NotesState {
    return { selectedId: null };
  }

  protected onMount(ctx: CanvasContext): void {
    this.renderer = new PrimitivesRenderer({
      container: this.container,  // WorldLayer's own root container
      camera: ctx.camera,
    });

    this.renderer.addShape('note-1', {
      kind: 'rect',
      x: 0, y: 0,
      width: 200, height: 80,
      cornerRadius: 6,
      fill: 0xfff7d6,
      stroke: { color: 0x999999, width: 1 },
    });
  }

  protected onUnmount(): void {
    this.renderer.destroy();
  }

  hitTest(worldX: number, worldY: number): WorldLayerHit | null {
    const hit = this.renderer.hitTest(worldX, worldY);
    return hit ? { id: hit.id, kind: hit.kind } : null;
  }
}

const notes = new NotesLayer({ id: 'notes', options: {} });
canvas.layers.add(notes);
```

### What `WorldLayer` provides

| Member | Purpose |
|---|---|
| `this.container` *(protected)* | Root pixi `Container` (RenderGroup) attached to `ctx.world`. Available from `onMount` onward. |
| `this.createGraphics(label?)` | Sanctioned way to obtain a `Graphics` attached to this layer. Keeps pixi internal. |
| `this.createContainer(label?)` | Same idea for grouped display objects. |
| `this.setZIndex(z)` | Update z-order in both `LayerRegistry` and the pixi container. |
| `this.getBounds()` | World-space AABB of everything rendered. One-shot scene-graph traversal — don't call per frame. |
| `this.hitTest(wx, wy)` *(abstract)* | Return the topmost hit at world coordinates or `null`. |

## A minimal ScreenLayer

```ts
import { ScreenLayer, type ScreenLayerHit, type CanvasContext } from '@invana/canvas';

class FpsLayer extends ScreenLayer<{}, { fps: number }> {
  protected createState() { return { fps: 0 }; }

  protected onMount(ctx: CanvasContext): void {
    // mount pixi text/graphics into `this.container`, which is attached
    // to `ctx.stage` (a sibling of canvas.world).
  }

  hitTest(_screenX: number, _screenY: number): ScreenLayerHit | null {
    return null; // pure overlay
  }
}
```

`ScreenLayer.hitTest` takes **screen** coordinates; `WorldLayer.hitTest` takes **world** coordinates. The type-distinct signatures stop you from accidentally feeding the wrong coordinate space.

## Per-frame work — the dirty batcher

Layers mutate state freely; the batcher coalesces work to one `flush` per frame.

```ts
// inside the layer
this.state.setState((s) => { s.hoveredId = id; });
this.dirty.mark('hover');   // declare a bucket name

// per tick, when hasPending() is true:
protected applyDirty(snap: DirtySnapshot<'hover' | 'data' | 'render'>): void {
  if (snap.has('hover')) { /* update hover styling */ }
  if (snap.has('data'))  { /* push data → renderer */ }
}
```

`DirtyBatcher` is RAF-free. The `Canvas` tick is the only thing that calls `flush()`.

## Stacked draw order

For ordered painting (edges below nodes, labels on top, halos behind everything), use **separate Layer instances** with different `zIndex`. Don't try to draw multiple semantic layers inside one Layer — pull them apart and let the registry order them.

```ts
canvas.layers.add(new EdgesLayer({ id: 'edges', zIndex: 0, options: {} }));
canvas.layers.add(new NodesLayer({ id: 'nodes', zIndex: 10, options: {} }));
canvas.layers.add(new LabelsLayer({ id: 'labels', zIndex: 20, options: {} }));
```

## Animated layers

If your layer (or a renderer it owns) needs per-frame animation, expose a `tickAnimations(dt)` method. The canvas tick calls it after `flush()`:

```ts
class PulseLayer extends WorldLayer { /* ... */
  tickAnimations(dt: number) {
    // advance phase, refresh transient visuals
  }
}
```

`PrimitivesRenderer` already exposes `tickAnimations(dt)` — the canvas tick detects it on `layer.renderer` and forwards automatically.
