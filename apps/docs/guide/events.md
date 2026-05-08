# Events

The canvas has a **three-tier event hierarchy** plus a **single telemetry tap**. Once you see how the tiers fit together, every "where do I subscribe?" question has an obvious answer.

## The three tiers

```
DOM pointer events
        │
        ▼
PrimitivesRenderer.events        ← raw, primitive, hit-tested
  shape:pointerover              ← no semantic meaning, no domain knowledge
  shape:click
  connector:pointermove …
        │
        ▼
layer.events                     ← semantic, domain-specific
  GraphLayer:    node:click, edge:hover, selection:changed
  ERLayer:       table:click, column:click, relationship:hover
  FlowchartLayer:step:click, transition:hover
        │
        ▼
Behaviours subscribe HERE
  HoverActivateBehaviour reads layer.events, mutates layer.state
  ClickSelectBehaviour reads layer.events, mutates layer.state
```

The layer is the translator. It receives `shape:pointerover` from its renderer, looks up which node that shape represents, and emits a richer domain event with semantic context (the node, its neighbours, traversal info).

**Behaviours subscribe to layer events, not renderer events.** A graph-aware `HoverActivateBehaviour` cares about `node:hover` (with neighbours, traversal), not `shape:pointerover` (which has no domain meaning). The same behaviour applied to an ER diagram cares about `column:hover`. Renderer events stay private to the layer that owns the renderer.

## Two emitters, two scopes

| Emitter | Scope | Examples |
|---|---|---|
| `canvas.events` | canvas-wide, typed via `CanvasGlobalEvents` | `'renderer:initialised'`, `'camera:zoom'`, `'camera:pan'`, `'layer:added'`, `'behaviour:enabled'`, `'background:click'` |
| `layer.events` | per-layer, typed by the layer's own event map | `'node:click'`, `'edge:hover'`, `'selection:changed'` |

Subscribers get clean payloads — same shape as today, no envelope:

```ts
canvas.events.on('camera:zoom', ({ scale, centerX, centerY }) => {
  zoomReadout.textContent = `${Math.round(scale * 100)}%`;
});

graphLayer.events.on('node:click', ({ id, originalEvent }) => {
  console.log('clicked', id, originalEvent.shiftKey ? '+ shift' : '');
});

graphLayer.state.subscribe((s) => updateInspector(s.selectedIds));
```

Layer events do **not** bubble to `canvas.events`. App code subscribes to the source it cares about; no global event spam.

## Canvas-global events

These are the events `canvas.events` emits today:

| Event | Payload | Meaning |
|---|---|---|
| `renderer:initialised` | `{ backend, capabilities }` | Pixi finished init; canvas is ready. |
| `layer:added` | `{ id }` | A Layer was added and mounted. |
| `layer:removed` | `{ id }` | A Layer was removed and unmounted. |
| `behaviour:registered` | `{ id }` | A Behaviour was registered (regardless of enabled). |
| `behaviour:enabled` | `{ id }` | A Behaviour was enabled. |
| `behaviour:disabled` | `{ id }` | A Behaviour was disabled. |
| `camera:zoom` | `{ scale, centerX, centerY }` | Camera zoom changed. |
| `camera:pan` | `{ x, y }` | Camera pan changed. |
| `background:click` | `{ worldX, worldY }` | A click landed in empty space (no layer claimed it). |
| `tap:dropped` | `{ type, reason }` | A telemetry envelope was filtered (excluded or sampled). |

## The telemetry tap

Two-channel design: typed events for app code, a single tap for observability.

The tap sees **everything** in the system — every emitter forwards a structured envelope here. Telemetry sinks register once and don't enumerate emitters:

```ts
canvas.events.tap((event) => sendToDatadog(event));
canvas.events.tap((event) => activityLog.push(event));
```

### Envelope shape

```ts
interface CanvasEvent<TPayload = unknown> {
  type: string;       // 'layer:graph:shape:click'
  timestamp: number;  // performance.now()
  source: { kind: 'layer' | 'behaviour' | 'layout' | 'canvas'; id: string };
  payload: TPayload;
}
```

The `type` string follows a `<source-kind>:<source-id>:<event-name>` convention, so a tap subscriber can filter without inspecting `source`:

```
canvas:camera:zoom
layer:graph:shape:click
layer:graph:selection:changed
behaviour:lasso-select:enabled
behaviour:lasso-select:disabled
```

### Sampling and high-frequency events

The tap excludes high-frequency noise by default:

```ts
const DEFAULT_TAP_EXCLUDE = [
  'pointermove',
  'render:tick',
  'shape:pointermove',
  'connector:pointermove',
  'state:dirty-flush',
];
```

Consumers opt back in if they want it:

```ts
canvas.events.tap((event) => sendToTelemetry(event), {
  exclude: ['canvas:render:tick'],   // explicit override of defaults
  sampleRate: 0.1,                   // 10% of remaining events
});

canvas.events.tap((event) => debugLog.push(event), { exclude: [] });   // see everything
```

`tap()` returns an unsubscribe function:

```ts
const off = canvas.events.tap((e) => console.log(e.type));
// later:
off();
```

## Why tap, not bubbling?

| Aspect | Tap | Bubbling |
|---|---|---|
| App-level subscriptions | clean — only what you ask for | noisy — every layer's events show up at canvas |
| Telemetry hookup | one line, sees everything | must enumerate all emitters |
| Sampling/filtering | at the tap, one place | has to live at every subscriber |
| Payload shape | plain payload (subscribers) + envelope (tap) | one shape for both audiences — compromise |

If a real need for canvas-wide *typed* subscriptions per event kind appears, a separate `canvas.events.onAnyLayer(eventName, handler)` API can be added without changing the model. Until then, app code uses the targeted emitters; observability uses the tap.

## Serialisability — the dev-mode discipline

Once the tap is advertised as telemetry-ready, payloads must be serialisable. No PixiJS objects, DOM nodes, function refs, or rich classes inside payloads — only ids, numbers, strings, plain objects, arrays, `Map` / `Set` of allowed types.

A dev-mode runtime check enforces it. Every emitted event's payload is walked against the whitelist; violations log a warning with the offending path:

```
[canvas] emit('node:click').payload.node — got BaseShape, expected plain data
```

The walker runs only when `process.env.NODE_ENV !== 'production'` — tree-shaken out of production bundles, zero overhead in shipping code.

If a handler needs a rich object (the actual `BaseShape` instance, the `originalEvent`), pass an id in the payload and look the rich thing up in the handler:

```ts
// ❌ payload contains a non-serialisable object
graphLayer.events.emit('node:click', { node: someBaseShape });

// ✓ payload carries an id; handler resolves
graphLayer.events.emit('node:click', { id: 'node-42' });
graphLayer.events.on('node:click', ({ id }) => {
  const node = graphLayer.data.nodes.get(id);
  // …
});
```

`originalEvent` is the one common exception — it's allowed by convention because handlers reach for `event.shiftKey`, `event.target`, etc.

## Patterns

### Subscribe in onMount, never on the constructor

A Layer or Behaviour's constructor runs before the canvas exists. Subscribe in `onMount` / `onRegister` so the context is available and teardown works correctly:

```ts
class MiniMapLayer extends ScreenLayer<...> {
  protected onMount(ctx: CanvasContext): void {
    const source = ctx.layers.get<GraphLayer>(this.options.sourceLayerId);
    source.events.on('selection:changed', this.refreshSelection);
    source.state.subscribe(this.refreshFromState);
  }

  protected onUnmount(_ctx: CanvasContext): void {
    // ctx is cleared by the base — but subscriptions registered against
    // peers must be unwound here. Assign your handlers to instance fields
    // so you can pass the same reference to .off().
  }
}
```

Subscriptions registered against *your own* `state` / `events` / `dirty` are torn down by the base class on `unmount`. Subscriptions registered against **peers** (other layers, the camera) must be unwound by you.

### State subscriptions vs event subscriptions

| When you want… | Use… |
|---|---|
| to react to the value of state changing | `layer.state.subscribe((s) => …)` |
| to react to a discrete moment (a click, a pan, a hover transition) | `layer.events.on('node:click', …)` |
| to filter events by which slice of state changed | `layer.state.subscribe(selector, listener)` (zustand `subscribeWithSelector`) |
| canvas-wide observability for telemetry | `canvas.events.tap(…)` |

Pick the form that matches the question you're answering. State subscribers fire on every change to the slice they watch; event subscribers fire on the discrete moment.

### Don't reach across emitters when the same one would do

If a Layer's behaviour wants to react to that same Layer's selection, it subscribes to `layer.events('selection:changed')`. It doesn't tap the canvas-wide channel and filter for that layer's id — that's slower and noisier, and it makes the behaviour's data flow harder to trace.

The tap is for cross-cutting concerns (telemetry, devtools, activity logs). Targeted subscribers are for the everyday flow.

## What's next

- [Layers](/guide/layers) — how a Layer translates renderer events into domain events
- [Behaviours](/guide/behaviours) — what subscribes to layer events
- [Renderers](/guide/renderers) — the source of the raw events that layers translate
