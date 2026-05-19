# Events

The canvas has a single event bus with two channels:

1. **Typed events** — clean payloads on the emitter you care about. App code subscribes here.
2. **Tap channel** — a single firehose receiving an envelope for every event emitted system-wide. Telemetry sinks subscribe here.

`canvas.events` is the bus; `layer.events` and `behaviour.events` (when present) are per-source emitters whose emits forward to the bus's tap automatically.

## Typed events (the `on` channel)

```ts
canvas.events.on('camera:zoom', ({ scale, centerX, centerY }) => {
  hud.update(scale);
});

const off = canvas.events.on('layer:added', ({ id }) => console.log(id));
off(); // unsubscribe
```

Built-in events on `CanvasEventBus` (everything currently emitted by `@invana/canvas`):

| Event | Payload | Emitted by |
|---|---|---|
| `'renderer:initialised'` | `{ backend: 'webgpu' \| 'webgl' \| 'canvas', capabilities?: Record<string, unknown> }` | `Canvas.init()` / `Canvas.initWithStage()` |
| `'layer:added'` | `{ id: string }` | `canvas.layers.add(layer)` |
| `'layer:removed'` | `{ id: string }` | `canvas.layers.remove(id)` |
| `'behaviour:registered'` | `{ id: string }` | `canvas.behaviours.register(b)` |
| `'behaviour:enabled'` | `{ id: string }` | `register()` (when `enabled: true`) + `setEnabled(id, true)` |
| `'behaviour:disabled'` | `{ id: string }` | `setEnabled(id, false)` |
| `'camera:pan'` | `{ x: number, y: number }` | `camera.panTo / panBy / setPosition` |
| `'camera:zoom'` | `{ scale: number, centerX: number, centerY: number }` | `camera.zoomTo / zoomBy / setZoom` |

The event map is extensible. Domain packages can declare additional types via TypeScript module augmentation; the bus accepts any string key.

### Renderer-level pointer events

Raw, hit-tested pointer events for shapes and connectors live on `PrimitivesRenderer.events`, not on `canvas.events`. See the [Primitives guide → Pointer events](./primitives.md#pointer-events) for the full list (`shape:pointerover/out/down/up/click`, same for `connector:*`). They forward through the tap channel like every other event.

## The tap channel

`tap` receives a `CanvasEvent` envelope:

```ts
interface CanvasEvent<TPayload = unknown> {
  type: string;            // `${source.kind}:${source.id}:${name}`
  timestamp: number;       // performance.now()
  source: { kind: 'canvas' | 'layer' | 'behaviour' | 'layout', id: string };
  payload: TPayload;
}
```

One subscription, every event:

```ts
canvas.events.tap((event) => {
  metrics.send(event.type, event.payload);
});
```

### Exclude list

By default the tap excludes a small set of high-frequency event-name suffixes so dashboards don't drown (see `DEFAULT_TAP_EXCLUDE` in `events/CanvasEvent.ts`):

```
pointermove
render:tick
shape:pointermove
connector:pointermove
state:dirty-flush
```

Matched as **suffixes** of the envelope `type`, so `'pointermove'` excludes `'layer:graph:shape:pointermove'`, `'layer:er:shape:pointermove'`, etc. — without enumerating every emitter.

Override per subscription:

```ts
// See everything, including pointermove:
canvas.events.tap(devLog.push, { exclude: [] });

// Custom suffixes (matched as suffixes of envelope type):
canvas.events.tap(send, { exclude: ['camera:zoom'] });
```

### Sampling

```ts
canvas.events.tap(costlyAnalytics, { sampleRate: 0.1 });
```

Drops 90% of events at the bus (before your handler runs).

### Envelope type format

```
${source.kind}:${source.id}:${name}
```

Examples:

- `'canvas:main:camera:zoom'` (canvas-level event from the canvas `id: 'main'`)
- `'layer:graph:node:click'` (layer-level event from a layer `id: 'graph'`)
- `'behaviour:lasso:select:end'` (behaviour-level event)

You can filter by suffix without inspecting `source` directly.

## Per-source emitters

Layers, behaviours, and (future) layouts hold a `SourceEmitter` initialised with their source identity. `emit` fires two paths:

1. Local subscribers added via `on(name, fn)` see the plain payload.
2. The bus's tap subscribers see the envelope.

```ts
class NotesLayer extends WorldLayer<{}, {}, { 'note:click': { id: string } }> {
  // ...
  private onClick(id: string) {
    this.events.emit('note:click', { id });
    // → local handlers get { id }
    // → bus tap sees { type: 'layer:notes:note:click', payload: { id }, ... }
  }
}

notes.events.on('note:click', ({ id }) => {
  console.log('clicked', id);
});
```

`SourceEmitter` extends `EventEmitter`, so the `on` / `off` / `emit` surface is exactly the standard typed emitter — there's nothing special about subscribing.

## Tap-vs-bubble: why one tap, not propagation

App subscriptions stay tight (you only get the events you ask for at the source you ask). Telemetry stays cheap (one subscription). Filtering and sampling live in one place. The envelope-vs-payload split lets the same emit serve both audiences without each side paying for the other.

## Serialisability checks

In dev mode, every emit runs through `assertSerialisableInDev` — it surfaces non-serialisable payloads (DOM nodes, pixi objects, functions) immediately with the offending path. Telemetry sinks should never see anything that wouldn't survive `JSON.stringify`.

## Camera vs viewport — keep them apart

Two related but distinct concepts; they get separate event namespaces:

| Concept | What it is | Events |
|---|---|---|
| **Camera** | Transform state — pan offset, zoom scale, the world↔screen projection | `camera:pan`, `camera:zoom` |
| **Viewport** | The DOM surface — its width/height and the pointer/keyboard events landing on it | `viewport:resized`, `viewport:click`, `viewport:contextmenu`, `viewport:doubleclick`, `viewport:cursor:move` *(planned)* |

The camera doesn't get clicked or resized — the viewport does. `camera:zoom` means "the camera's zoom-scale state changed"; `viewport:resized` means "the DOM rect we render into changed size." Don't conflate them.

## Planned changes — two-tier pointer dispatch

Today `PrimitivesRenderer.events` emits `shape:click` / `connector:click` etc., and layer code subscribes to translate them into domain events. The planned model collapses this into a two-tier dispatch:

```
DOM pointer event
        │
        ▼
Canvas dispatcher
  - runs renderer.hitTest(world) once per DOM event
  - cascades top-down through hittable layers by z-order
  - dispatches to the topmost layer that claims the hit
  - if no hit: emits viewport:* on canvas.events
        │
        ▼
Layer.onPointer*(hit, domEvent) template methods
  Domain layers override these and emit semantic events
        │
        ▼
layer.events
  node:click, edge:hover, selection:changed (GraphLayer)
```

Effects of the change once it ships:

- **Renderer becomes silent.** `PrimitivesRenderer.events` no longer emits pointer events; the renderer exposes `hitTest()` as its public input-handling surface.
- **One emit per physical interaction.** No `shape:click` followed by `node:click`.
- **`Layer` gains seven template methods** — `onPointerOver / out / down / up / move`, `onClick`, `onDoubleClick`, `onContextMenu`. Default no-op; domain layers override and emit `node:click` etc. on `this.events`.
- **`BackgroundLayer` defaults to `hittable: false`** so clicks pass through to `viewport:click` unless you explicitly want the background to claim them.

The existing renderer events documented in [Primitives → Pointer events](./primitives.md#pointer-events) remain the shipping surface until this lands.

## Planned additional events

Once the two-tier dispatch ships, these expand the catalogue (all on `canvas.events` unless noted):

| Event | Payload | Notes |
|---|---|---|
| `layer:visibility:changed` | `{ id, visible }` | |
| `layer:zindex:changed` | `{ id, zIndex }` | |
| `layer:hittable:changed` | `{ id, hittable }` | |
| `layer:reordered` | `{ order: string[] }` | |
| `behaviour:deregistered` | `{ id }` | |
| `behaviour:shortcut:conflict` | `{ aId, bId, shortcut }` | |
| `viewport:resized` | `{ width, height }` | Wired via `ResizeObserver`. |
| `viewport:click` / `:doubleclick` / `:contextmenu` | `{ worldX, worldY, screenX, screenY, button, modifiers }` | Fires only when no layer claims the hit. |
| `viewport:cursor:move` | `{ worldX, worldY, screenX, screenY }` | Opt-in via `CursorTrackBehaviour`. Default-excluded from tap. |
| `frame:rendered` | `{ durationMs, layersRendered }` | Whole-frame lifecycle. Default-excluded from tap. |
| `render:start` / `render:end` | `{ dirtyCount }` / `{ durationMs, dirtyCount }` | Per-layer; emitted on **each layer's** `events`. Default-excluded from tap. |
| `layout:start` / `layout:end` | `{ layoutId, layerId, durationMs? }` | Opt-in via `LayoutInstrumentationBehaviour`. |

Lifecycle verbs also shift: `layer:added` → `layer:registered`, `layer:removed` → `layer:deregistered` (and same for behaviours).

## Render init event

```ts
canvas.events.on('renderer:initialised', ({ backend, capabilities }) => {
  if (backend === 'webgpu') {
    enableExpensiveFeatures();
  } else if (backend === 'webgl') {
    enableFallbackFeatures();
  }
});
```

Fired once per `canvas.init()` / `canvas.initWithStage()` call.
