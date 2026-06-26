# Interface: CameraOptions

Defined in: [canvas/src/camera/Camera.ts:45](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/camera/Camera.ts#L45)

## Properties

### bus?

> `optional` **bus?**: [`CanvasEventBus`](../classes/CanvasEventBus.md)

Defined in: [canvas/src/camera/Camera.ts:56](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/camera/Camera.ts#L56)

Optional bus for `camera:zoom` / `camera:pan` events.

***

### initialScale?

> `optional` **initialScale?**: `number`

Defined in: [canvas/src/camera/Camera.ts:58](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/camera/Camera.ts#L58)

Initial uniform scale. Default 1.

***

### initialX?

> `optional` **initialX?**: `number`

Defined in: [canvas/src/camera/Camera.ts:60](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/camera/Camera.ts#L60)

Initial world-container offset (= where world (0,0) lives in screen pixels). Default (0,0).

***

### initialY?

> `optional` **initialY?**: `number`

Defined in: [canvas/src/camera/Camera.ts:61](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/camera/Camera.ts#L61)

***

### maxScale?

> `optional` **maxScale?**: `number`

Defined in: [canvas/src/camera/Camera.ts:64](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/camera/Camera.ts#L64)

***

### minScale?

> `optional` **minScale?**: `number`

Defined in: [canvas/src/camera/Camera.ts:63](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/camera/Camera.ts#L63)

Min / max zoom clamp. Defaults: 0.01 .. 100.

***

### screenHeight

> **screenHeight**: `number`

Defined in: [canvas/src/camera/Camera.ts:54](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/camera/Camera.ts#L54)

***

### screenWidth

> **screenWidth**: `number`

Defined in: [canvas/src/camera/Camera.ts:53](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/camera/Camera.ts#L53)

Initial viewport size in CSS pixels. Mirrors the Viewport's own `screenWidth`/`screenHeight` for projection math.

***

### viewport

> **viewport**: `Viewport`

Defined in: [canvas/src/camera/Camera.ts:51](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/camera/Camera.ts#L51)

The `Viewport` instance the camera transforms. Created by `Canvas` and
attached to `app.stage` as the world root. Camera mutates its
`position` / `scale` directly via Viewport's typed methods.
