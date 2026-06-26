# Interface: CanvasOptions

Defined in: [canvas/src/engine/Canvas.ts:50](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L50)

## Properties

### antialias?

> `optional` **antialias?**: `boolean`

Defined in: [canvas/src/engine/Canvas.ts:73](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L73)

GPU MSAA. Default `true`. Auto-disabled on the Canvas backend.

***

### autoResize?

> `optional` **autoResize?**: `boolean`

Defined in: [canvas/src/engine/Canvas.ts:92](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L92)

Automatically resize the renderer and camera when the container element
changes size. Covers both window resize and programmatic expand/collapse.
Uses `ResizeObserver` internally. Default `false`.

***

### backgroundColor?

> `optional` **backgroundColor?**: `number`

Defined in: [canvas/src/engine/Canvas.ts:79](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L79)

Background colour. Default `0` (black, but only visible when `opaque: true`).

***

### config?

> `optional` **config?**: [`CanvasConfig`](CanvasConfig.md)

Defined in: [canvas/src/engine/Canvas.ts:110](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L110)

Serialisable visual config applied at the end of `init()` to the
layers/behaviours already added (by id): each slice is pushed to the
instance's `setOptions`, and behaviours with `enabled: true` are turned on.
The single place to set all settings. Pure JSON — see [CanvasConfig](CanvasConfig.md).

***

### container?

> `optional` **container?**: `HTMLElement`

Defined in: [canvas/src/engine/Canvas.ts:59](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L59)

DOM element pixi mounts its `<canvas>` into. Required by `init()`.

***

### height?

> `optional` **height?**: `number`

Defined in: [canvas/src/engine/Canvas.ts:67](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L67)

Viewport height in CSS pixels. Default = `container.clientHeight`.

***

### hello?

> `optional` **hello?**: `boolean`

Defined in: [canvas/src/engine/Canvas.ts:85](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L85)

Suppress pixi's "PixiJS X.X.X" startup log. Default `true`.

***

### id?

> `optional` **id?**: `string`

Defined in: [canvas/src/engine/Canvas.ts:56](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L56)

Stable identifier for this Canvas instance. Used as the source id on
envelopes published by the bus's own `emit()`. Default: `'canvas'`.
Override when running multiple Canvas instances in one document.

***

### opaque?

> `optional` **opaque?**: `boolean`

Defined in: [canvas/src/engine/Canvas.ts:76](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L76)

`true` → opaque scene, `backgroundAlpha = 1` (skips per-frame blend).

***

### powerPreference?

> `optional` **powerPreference?**: `"high-performance"` \| `"low-power"`

Defined in: [canvas/src/engine/Canvas.ts:82](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L82)

GPU power preference. Default `'high-performance'`.

***

### preference?

> `optional` **preference?**: `"canvas"` \| `"webgpu"` \| `"webgl"`

Defined in: [canvas/src/engine/Canvas.ts:62](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L62)

Preferred backend. Default `'webgpu'`. Pixi falls back via its own logic.

***

### resolution?

> `optional` **resolution?**: `number`

Defined in: [canvas/src/engine/Canvas.ts:70](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L70)

Device pixel ratio. Default `window.devicePixelRatio`.

***

### suppressBrowserContextMenu?

> `optional` **suppressBrowserContextMenu?**: `boolean`

Defined in: [canvas/src/engine/Canvas.ts:102](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L102)

Suppress the browser's native right-click context menu on the canvas
element. Diagram apps typically want to show their own menu UI via the
`shape:contextmenu` / `connector:contextmenu` events. Default `true`.

Set to `false` if the app wants the OS context menu (e.g. for
accessibility / dev tooling on right-click).

***

### width?

> `optional` **width?**: `number`

Defined in: [canvas/src/engine/Canvas.ts:65](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L65)

Viewport width in CSS pixels. Default = `container.clientWidth`.
