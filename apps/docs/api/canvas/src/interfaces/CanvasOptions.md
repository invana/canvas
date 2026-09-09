# Interface: CanvasOptions

## Properties

### antialias?

> `optional` **antialias?**: `boolean`

GPU MSAA. Default `true`. Auto-disabled on the Canvas backend.

***

### autoResize?

> `optional` **autoResize?**: `boolean`

Automatically resize the renderer and camera when the container element
changes size. Covers both window resize and programmatic expand/collapse.
Uses `ResizeObserver` internally. Default `false`.

***

### backgroundColor?

> `optional` **backgroundColor?**: `number`

Background colour. Default `0` (black, but only visible when `opaque: true`).

***

### config?

> `optional` **config?**: [`CanvasConfig`](CanvasConfig.md)

Serialisable visual config applied at the end of `init()` to the
layers/behaviours already added (by id): each slice is pushed to the
instance's `setOptions`, and behaviours with `enabled: true` are turned on.
The single place to set all settings. Pure JSON — see [CanvasConfig](CanvasConfig.md).

***

### container?

> `optional` **container?**: `HTMLElement`

DOM element pixi mounts its `<canvas>` into. Required by `init()`.

***

### height?

> `optional` **height?**: `number`

Viewport height in CSS pixels. Default = `container.clientHeight`.

***

### hello?

> `optional` **hello?**: `boolean`

Suppress pixi's "PixiJS X.X.X" startup log. Default `true`.

***

### id?

> `optional` **id?**: `string`

Stable identifier for this Canvas instance. Used as the source id on
envelopes published by the bus's own `emit()`. Default: `'canvas'`.
Override when running multiple Canvas instances in one document.

***

### opaque?

> `optional` **opaque?**: `boolean`

`true` → opaque scene, `backgroundAlpha = 1` (skips per-frame blend).

***

### powerPreference?

> `optional` **powerPreference?**: `"high-performance"` \| `"low-power"`

GPU power preference. Default `'high-performance'`.

***

### preference?

> `optional` **preference?**: [`RenderPreference`](../type-aliases/RenderPreference.md)

Preferred backend ([RenderPreference](../type-aliases/RenderPreference.md)). Default `'webgpu'`
(WebGPU-first). Passed to the renderer verbatim — `'canvas'` mounts the 2D
backend rather than being folded into `'webgl'`.

PixiJS's WebGPU renderer can crash at *render* time on some browser/driver
combinations (a null bind-group during pipeline setup), which no init-time
guard can catch. When that happens the engine halts its render loop and
emits `'canvas:renderer:fallback'` so the host can degrade to WebGL (the
`@invana/canvas-react` `<Canvas>` does this automatically). Pixi's own
auto-fallback still covers browsers with no WebGPU at all; pass `'webgl'`
explicitly to opt out of WebGPU entirely.

***

### renderer?

> `optional` **renderer?**: [`IRenderer`](IRenderer.md)

The drawing backend. Defaults to `@invana/renderer-pixijs` (the PixiJS
backend); supply one to override — a three.js backend, or
`HeadlessRenderer` for a test.

When supplied, `Canvas` calls `mount` on it; you do not mount it yourself.

***

### resolution?

> `optional` **resolution?**: `number`

Device pixel ratio. Default `window.devicePixelRatio`.

***

### suppressBrowserContextMenu?

> `optional` **suppressBrowserContextMenu?**: `boolean`

Suppress the browser's native right-click context menu on the canvas
element. Diagram apps typically want to show their own menu UI via the
`shape:contextmenu` / `connector:contextmenu` events. Default `true`.

Set to `false` if the app wants the OS context menu (e.g. for
accessibility / dev tooling on right-click).

***

### telemetry?

> `optional` **telemetry?**: [`CanvasTelemetryConfig`](CanvasTelemetryConfig.md)

Telemetry to emit — independently toggle `traces` / `metrics` / `logging`
(see [CanvasTelemetryConfig](CanvasTelemetryConfig.md)). Each stream `true` uses the dep-free
console adapter, so `telemetry: { traces: true, metrics: true }` works with
zero extra installs; inject a real port (or use the opt-in
`@invana/canvas-telemetry-otel` package) to export to OTLP / HyperDX. The
engine + kernel stay vendor-free — the exporter lives outside.

`metrics` covers the per-frame FPS / phase stream the engine emits on
`render:loop:tick` (see frames); `traces` covers view-mutation,
event-bus, and per-gesture interaction spans.

***

### width?

> `optional` **width?**: `number`

Viewport width in CSS pixels. Default = `container.clientWidth`.
