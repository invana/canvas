# Interface: CameraOptions

## Properties

### binding

> **binding**: [`ICameraBinding`](ICameraBinding.md)

The renderer's viewport, behind the pixi-free [ICameraBinding](ICameraBinding.md) seam.
Created by the renderer (`Canvas` wires `PixiViewportBinding` today).

***

### bus?

> `optional` **bus?**: [`CanvasEventBus`](../classes/CanvasEventBus.md)

Optional bus for `input:camera:zoom` / `input:camera:pan` events.

***

### initialScale?

> `optional` **initialScale?**: `number`

Initial uniform scale. Default 1.

***

### initialX?

> `optional` **initialX?**: `number`

Initial world-container offset (= where world (0,0) lives in screen pixels). Default (0,0).

***

### initialY?

> `optional` **initialY?**: `number`

***

### maxScale?

> `optional` **maxScale?**: `number`

***

### minScale?

> `optional` **minScale?**: `number`

Min / max zoom clamp. Defaults: 0.01 .. 100.

***

### screenHeight

> **screenHeight**: `number`

***

### screenWidth

> **screenWidth**: `number`

Initial viewport size in CSS pixels. Mirrors the binding's own screen size for projection math.

***

### store?

> `optional` **store?**: [`CanvasStore`](../../../canvas-store/src/interfaces/CanvasStore.md)

Optional kernel store. When present, the camera keeps
`store.view.interaction.camera` (the abstract `{x,y,zoom}` transform) in sync
with the binding **both ways** — gestures/mutators push into the store,
and external `actions.camera.*` writes apply to the binding.
