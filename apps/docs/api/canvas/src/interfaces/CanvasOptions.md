# Interface: CanvasOptions

Defined in: [packages/canvas/src/engine/Canvas.ts:46](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/engine/Canvas.ts#L46)

## Properties

### antialias?

> `optional` **antialias?**: `boolean`

Defined in: [packages/canvas/src/engine/Canvas.ts:69](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/engine/Canvas.ts#L69)

GPU MSAA. Default `true`. Auto-disabled on the Canvas backend.

***

### autoResize?

> `optional` **autoResize?**: `boolean`

Defined in: [packages/canvas/src/engine/Canvas.ts:88](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/engine/Canvas.ts#L88)

Automatically resize the renderer and camera when the container element
changes size. Covers both window resize and programmatic expand/collapse.
Uses `ResizeObserver` internally. Default `false`.

***

### backgroundColor?

> `optional` **backgroundColor?**: `number`

Defined in: [packages/canvas/src/engine/Canvas.ts:75](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/engine/Canvas.ts#L75)

Background colour. Default `0` (black, but only visible when `opaque: true`).

***

### container?

> `optional` **container?**: `HTMLElement`

Defined in: [packages/canvas/src/engine/Canvas.ts:55](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/engine/Canvas.ts#L55)

DOM element pixi mounts its `<canvas>` into. Required by `init()`.

***

### height?

> `optional` **height?**: `number`

Defined in: [packages/canvas/src/engine/Canvas.ts:63](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/engine/Canvas.ts#L63)

Viewport height in CSS pixels. Default = `container.clientHeight`.

***

### hello?

> `optional` **hello?**: `boolean`

Defined in: [packages/canvas/src/engine/Canvas.ts:81](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/engine/Canvas.ts#L81)

Suppress pixi's "PixiJS X.X.X" startup log. Default `true`.

***

### id?

> `optional` **id?**: `string`

Defined in: [packages/canvas/src/engine/Canvas.ts:52](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/engine/Canvas.ts#L52)

Stable identifier for this Canvas instance. Used as the source id on
envelopes published by the bus's own `emit()`. Default: `'canvas'`.
Override when running multiple Canvas instances in one document.

***

### opaque?

> `optional` **opaque?**: `boolean`

Defined in: [packages/canvas/src/engine/Canvas.ts:72](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/engine/Canvas.ts#L72)

`true` → opaque scene, `backgroundAlpha = 1` (skips per-frame blend).

***

### powerPreference?

> `optional` **powerPreference?**: `"high-performance"` \| `"low-power"`

Defined in: [packages/canvas/src/engine/Canvas.ts:78](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/engine/Canvas.ts#L78)

GPU power preference. Default `'high-performance'`.

***

### preference?

> `optional` **preference?**: `"canvas"` \| `"webgpu"` \| `"webgl"`

Defined in: [packages/canvas/src/engine/Canvas.ts:58](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/engine/Canvas.ts#L58)

Preferred backend. Default `'webgpu'`. Pixi falls back via its own logic.

***

### resolution?

> `optional` **resolution?**: `number`

Defined in: [packages/canvas/src/engine/Canvas.ts:66](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/engine/Canvas.ts#L66)

Device pixel ratio. Default `window.devicePixelRatio`.

***

### width?

> `optional` **width?**: `number`

Defined in: [packages/canvas/src/engine/Canvas.ts:61](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/engine/Canvas.ts#L61)

Viewport width in CSS pixels. Default = `container.clientWidth`.
