# Class: PixiViewportBinding

## Implements

- [`ICameraBinding`](../../../canvas/src/interfaces/ICameraBinding.md)

## Constructors

### Constructor

> **new PixiViewportBinding**(`viewport`): `PixiViewportBinding`

#### Parameters

##### viewport

`Viewport`

#### Returns

`PixiViewportBinding`

## Methods

### configureInput()

> **configureInput**(`config`): `void`

Install / replace / remove the backend's own pan and zoom inputs. Patch
semantics: an omitted key is untouched, `null` removes that input.

#### Parameters

##### config

[`CameraInputConfig`](../../../canvas/src/interfaces/CameraInputConfig.md)

#### Returns

`void`

#### Implementation of

[`ICameraBinding`](../../../canvas/src/interfaces/ICameraBinding.md).[`configureInput`](../../../canvas/src/interfaces/ICameraBinding.md#configureinput)

***

### getTransform()

> **getTransform**(): [`CameraTransformValue`](../../../canvas/src/interfaces/CameraTransformValue.md)

The current transform, read straight from the backend viewport.

#### Returns

[`CameraTransformValue`](../../../canvas/src/interfaces/CameraTransformValue.md)

#### Implementation of

[`ICameraBinding`](../../../canvas/src/interfaces/ICameraBinding.md).[`getTransform`](../../../canvas/src/interfaces/ICameraBinding.md#gettransform)

***

### getVisibleBounds()

> **getVisibleBounds**(): [`Rect`](../interfaces/Rect.md)

The world-space rectangle currently visible.

#### Returns

[`Rect`](../interfaces/Rect.md)

#### Implementation of

[`ICameraBinding`](../../../canvas/src/interfaces/ICameraBinding.md).[`getVisibleBounds`](../../../canvas/src/interfaces/ICameraBinding.md#getvisiblebounds)

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

#### Implementation of

[`ICameraBinding`](../../../canvas/src/interfaces/ICameraBinding.md).[`onDragStart`](../../../canvas/src/interfaces/ICameraBinding.md#ondragstart)

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

#### Implementation of

[`ICameraBinding`](../../../canvas/src/interfaces/ICameraBinding.md).[`onTransformChange`](../../../canvas/src/interfaces/ICameraBinding.md#ontransformchange)

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

#### Implementation of

[`ICameraBinding`](../../../canvas/src/interfaces/ICameraBinding.md).[`resize`](../../../canvas/src/interfaces/ICameraBinding.md#resize)

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

#### Implementation of

[`ICameraBinding`](../../../canvas/src/interfaces/ICameraBinding.md).[`setDragSuspended`](../../../canvas/src/interfaces/ICameraBinding.md#setdragsuspended)

***

### setTransform()

> **setTransform**(`t`): `void`

Write the transform verbatim — no clamping, no re-anchoring. `Camera` has
already applied its own semantics; this is the raw write.

Must **not** re-report through [onTransformChange](../../../canvas/src/interfaces/ICameraBinding.md#ontransformchange): `Camera` knows it
made this change and emits its own events, so an echo would double-fire.

#### Parameters

##### t

[`CameraTransformValue`](../../../canvas/src/interfaces/CameraTransformValue.md)

#### Returns

`void`

#### Implementation of

[`ICameraBinding`](../../../canvas/src/interfaces/ICameraBinding.md).[`setTransform`](../../../canvas/src/interfaces/ICameraBinding.md#settransform)

***

### tick()

> **tick**(`dtMs`): `void`

Advance time-based input animation (momentum, snap). Driven by the engine's clock.

#### Parameters

##### dtMs

`number`

#### Returns

`void`

#### Implementation of

[`ICameraBinding`](../../../canvas/src/interfaces/ICameraBinding.md).[`tick`](../../../canvas/src/interfaces/ICameraBinding.md#tick)

***

### toScreen()

> **toScreen**(`worldX`, `worldY`): [`Point`](../interfaces/Point.md)

#### Parameters

##### worldX

`number`

##### worldY

`number`

#### Returns

[`Point`](../interfaces/Point.md)

#### Implementation of

[`ICameraBinding`](../../../canvas/src/interfaces/ICameraBinding.md).[`toScreen`](../../../canvas/src/interfaces/ICameraBinding.md#toscreen)

***

### toWorld()

> **toWorld**(`screenX`, `screenY`): [`Point`](../interfaces/Point.md)

#### Parameters

##### screenX

`number`

##### screenY

`number`

#### Returns

[`Point`](../interfaces/Point.md)

#### Implementation of

[`ICameraBinding`](../../../canvas/src/interfaces/ICameraBinding.md).[`toWorld`](../../../canvas/src/interfaces/ICameraBinding.md#toworld)

***

### zoomToCentre()

> **zoomToCentre**(`zoom`): `void`

Zoom about the viewport centre, keeping the centre world point fixed. Split
out from [setTransform](../../../canvas/src/interfaces/ICameraBinding.md#settransform) because backends implement centre-anchored
zoom themselves and their arithmetic is what users' muscle memory expects.

#### Parameters

##### zoom

`number`

#### Returns

`void`

#### Implementation of

[`ICameraBinding`](../../../canvas/src/interfaces/ICameraBinding.md).[`zoomToCentre`](../../../canvas/src/interfaces/ICameraBinding.md#zoomtocentre)
