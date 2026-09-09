# Interface: WheelInputOptions

Wheel-zoom input configuration.

## Properties

### modifier?

> `optional` **modifier?**: [`CameraInputModifier`](../type-aliases/CameraInputModifier.md)

Require this modifier to be held for the wheel to zoom, leaving plain
scroll to the page. `null` / omitted = no modifier.

***

### percent?

> `optional` **percent?**: `number`

Zoom fraction per wheel tick. Default `0.1` (10%).

***

### smooth?

> `optional` **smooth?**: `number` \| `false`

Smooth-scroll frame count; `false` = instant snap. Default `false`.

***

### trackpadPinch?

> `optional` **trackpadPinch?**: `boolean`

Treat a two-finger trackpad pinch as zoom rather than scroll. Default `true`.
