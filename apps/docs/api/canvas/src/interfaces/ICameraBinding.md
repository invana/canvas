# Interface: ICameraBinding

## Methods

### configureInput()

> **configureInput**(`config`): `void`

Install / replace / remove the backend's own pan and zoom inputs. Patch
semantics: an omitted key is untouched, `null` removes that input.

#### Parameters

##### config

[`CameraInputConfig`](CameraInputConfig.md)

#### Returns

`void`

***

### getTransform()

> **getTransform**(): [`CameraTransformValue`](CameraTransformValue.md)

The current transform, read straight from the backend viewport.

#### Returns

[`CameraTransformValue`](CameraTransformValue.md)

***

### getVisibleBounds()

> **getVisibleBounds**(): [`Rect`](../../../renderer-pixijs/src/interfaces/Rect.md)

The world-space rectangle currently visible.

#### Returns

[`Rect`](../../../renderer-pixijs/src/interfaces/Rect.md)

***

### onDragStart()

> **onDragStart**(`fn`): () => `void`

Subscribe to the start of a drag-pan, fired once the pointer has moved
enough to pan. Returns an unsubscribe function.

#### Parameters

##### fn

() => `void`

#### Returns

() => `void`

***

### onTransformChange()

> **onTransformChange**(`fn`): () => `void`

Subscribe to transform changes the **backend** made on its own — a wheel
tick, a drag, a momentum glide. Changes `Camera` initiates never arrive
here. Returns an unsubscribe function.

#### Parameters

##### fn

(`kind`) => `void`

#### Returns

() => `void`

***

### resize()

> **resize**(`screenWidth`, `screenHeight`): `void`

Viewport size changed (CSS px).

#### Parameters

##### screenWidth

`number`

##### screenHeight

`number`

#### Returns

`void`

***

### setDragSuspended()

> **setDragSuspended**(`suspended`): `void`

Suspend or restore drag-panning without tearing it down — how gesture
arbitration yields the camera. Momentum is deliberately left running so an
in-flight glide finishes.

#### Parameters

##### suspended

`boolean`

#### Returns

`void`

***

### setTransform()

> **setTransform**(`t`): `void`

Write the transform verbatim — no clamping, no re-anchoring. `Camera` has
already applied its own semantics; this is the raw write.

Must **not** re-report through [onTransformChange](#ontransformchange): `Camera` knows it
made this change and emits its own events, so an echo would double-fire.

#### Parameters

##### t

[`CameraTransformValue`](CameraTransformValue.md)

#### Returns

`void`

***

### tick()

> **tick**(`dtMs`): `void`

Advance time-based input animation (momentum, snap). Driven by the engine's clock.

#### Parameters

##### dtMs

`number`

#### Returns

`void`

***

### toScreen()

> **toScreen**(`worldX`, `worldY`): [`Point`](../../../renderer-pixijs/src/interfaces/Point.md)

#### Parameters

##### worldX

`number`

##### worldY

`number`

#### Returns

[`Point`](../../../renderer-pixijs/src/interfaces/Point.md)

***

### toWorld()

> **toWorld**(`screenX`, `screenY`): [`Point`](../../../renderer-pixijs/src/interfaces/Point.md)

#### Parameters

##### screenX

`number`

##### screenY

`number`

#### Returns

[`Point`](../../../renderer-pixijs/src/interfaces/Point.md)

***

### zoomToCentre()

> **zoomToCentre**(`zoom`): `void`

Zoom about the viewport centre, keeping the centre world point fixed. Split
out from [setTransform](#settransform) because backends implement centre-anchored
zoom themselves and their arithmetic is what users' muscle memory expects.

#### Parameters

##### zoom

`number`

#### Returns

`void`
