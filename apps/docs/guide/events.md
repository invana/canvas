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
