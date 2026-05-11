# DragShapeBehaviour

Pointer-drag move for individual shapes managed by a `PrimitivesRenderer`. **Layer-scoped** — pass the renderer reference at construction so the same canvas can host multiple draggable layers, each with its own behaviour.

The behaviour observes the renderer's public surface only: it subscribes to `shape:pointerdown` and calls `getShapePosition` / `updateShape` / `reRouteAllConnectors`. No private access — your custom layers can opt in by exposing a `PrimitivesRenderer`.

## Usage

```ts
import { Canvas, DragShapeBehaviour } from '@invana/canvas';
import { PrimitivesRenderer } from '@invana/canvas/primitives';

const canvas = await Canvas.init({ parent: document.body });
const demo = /* a WorldLayer that exposes a `renderer: PrimitivesRenderer` */;

canvas.behaviours.register(
  new DragShapeBehaviour({
    id: 'drag-shapes',
    renderer: demo.renderer,
    enabled: true,
    reRouteConnectors: true,
    filter: (id) => !id.endsWith(':badge'),
    dragCursor: 'grabbing',
  }),
);
```

The advertised gesture string is `'shape+drag'`.

## What happens on drag

1. `shape:pointerdown` from the renderer → drag start. The behaviour records the pointer's world position and the shape's current `(spec.x, spec.y)`.
2. The viewport's `drag` plugin is **paused** so the camera doesn't pan while a shape moves.
3. Window-level `pointermove` updates the shape via `renderer.updateShape(id, { x, y })` — the click point stays under the cursor. Window events (rather than pixi container events) keep the drag smooth even when the pointer briefly leaves the shape or the canvas.
4. When `reRouteConnectors: true` (default), every connector is re-routed after each move. Required for obstacle-aware routers (e.g. `manhattan`); set `false` for thousands of edges or when a smarter graph-level signal handles re-routing.
5. `pointerup` / `pointercancel` → drag end. Viewport pan resumes; the original cursor is restored.

## Options

| Option | Type | Default | Notes |
|---|---|---|---|
| `id` | `string` | required | Behaviour id. |
| `enabled` | `boolean` | `false` | Pass `true` or call `enable()` after registration. |
| `renderer` | `PrimitivesRenderer` | required | The renderer whose shapes this behaviour can drag. |
| `filter` | `(id: string) => boolean` | none | Predicate to restrict draggable ids. Returning `false` ignores the pointerdown. |
| `reRouteConnectors` | `boolean` | `true` | Re-route every connector after each move. Set `false` for very large edge sets or when re-routing is handled elsewhere. |
| `dragCursor` | `string` | `'grabbing'` | Cursor applied to the canvas element while a drag is in progress. Restored on drag end. |
| `shortcuts` | `string[]` | `['shape+drag']` | Override the gesture string used for conflict warnings. |

## Lifecycle

| Method | Effect |
|---|---|
| `register(b)` | Looks up the canvas element from the viewport's `EventSystem` and subscribes to `renderer.events.on('shape:pointerdown', …)`. |
| `enable()` | Allows incoming `shape:pointerdown` events to start a drag. (Subscription is set up at registration; `enable` flips the gate.) |
| `disable()` | Ends any in-flight drag and ignores subsequent pointerdowns until re-enabled. |
| `destroy()` | Ends any in-flight drag and unsubscribes from the renderer. |

## Headless / non-DOM stages

The behaviour reads the underlying `HTMLCanvasElement` from the viewport's `EventSystem` for cursor swap and accurate `clientX/Y` → screen-space conversion. When the canvas was created via `Canvas.initWithStage` (or any path where `EventSystem.domElement` is unavailable), the behaviour still works — cursor swap is skipped and coord conversion falls back to raw window coords.

## Coexistence

- Pair with [`DragPanBehaviour`](/behaviours/drag-pan-behaviour). When this behaviour starts a drag it pauses the pan plugin; pan resumes automatically on drag end.

## Related

- [Engine → Behaviours](/guide/behaviours)
- [Rendering → Primitives renderer](/guide/primitives) — the `PrimitivesRenderer` surface used by this behaviour.
