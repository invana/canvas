# Class: HeadlessCameraBinding

`ICameraBinding` with no backend behind it.

The projection math mirrors the engine's coordinate model exactly
(`screen = world * zoom + offset`), so camera semantics — clamping, anchored
zoom, fit, the bus and store sync — are exercisable with no GPU.
`emitTransformChange` simulates a backend-driven gesture (a wheel tick, a
momentum glide), the one path `Camera` cannot trigger itself.

Shipped rather than test-only: §7 keeps a headless backend deliberately, so
consumers can test layouts, picking and projection without a renderer.

## Implements

- [`ICameraBinding`](../interfaces/ICameraBinding.md)

## Constructors

### Constructor

> **new HeadlessCameraBinding**(`screenWidth?`, `screenHeight?`): `HeadlessCameraBinding`

#### Parameters

##### screenWidth?

`number`

##### screenHeight?

`number`

#### Returns

`HeadlessCameraBinding`

## Properties

### dragSuspended

> **dragSuspended**: `boolean`

Latest `setDragSuspended` value.

***

### inputConfigs

> `readonly` **inputConfigs**: [`CameraInputConfig`](../interfaces/CameraInputConfig.md)[]

Every `configureInput` patch received, in order — for asserting input wiring.

***

### tickedMs

> **tickedMs**: `number`

Accumulated `tick` time, to prove the engine drives the clock.

## Methods

### configureInput()

> **configureInput**(`config`): `void`

Install / replace / remove the backend's own pan and zoom inputs. Patch
semantics: an omitted key is untouched, `null` removes that input.

#### Parameters

##### config

[`CameraInputConfig`](../interfaces/CameraInputConfig.md)

#### Returns

`void`

#### Implementation of

[`ICameraBinding`](../interfaces/ICameraBinding.md).[`configureInput`](../interfaces/ICameraBinding.md#configureinput)

***

### emitDragStart()

> **emitDragStart**(): `void`

Simulate the backend reporting the start of a drag-pan.

#### Returns

`void`

***

### emitTransformChange()

> **emitTransformChange**(`t`, `kind`): `void`

Simulate a backend-driven transform change (wheel, drag, momentum).

#### Parameters

##### t

[`CameraTransformValue`](../interfaces/CameraTransformValue.md)

##### kind

[`CameraChangeKind`](../type-aliases/CameraChangeKind.md)

#### Returns

`void`

***

### getTransform()

> **getTransform**(): [`CameraTransformValue`](../interfaces/CameraTransformValue.md)

The current transform, read straight from the backend viewport.

#### Returns

[`CameraTransformValue`](../interfaces/CameraTransformValue.md)

#### Implementation of

[`ICameraBinding`](../interfaces/ICameraBinding.md).[`getTransform`](../interfaces/ICameraBinding.md#gettransform)

***

### getVisibleBounds()

> **getVisibleBounds**(): [`Rect`](../../../renderer-pixijs/src/interfaces/Rect.md)

The world-space rectangle currently visible.

#### Returns

[`Rect`](../../../renderer-pixijs/src/interfaces/Rect.md)

#### Implementation of

[`ICameraBinding`](../interfaces/ICameraBinding.md).[`getVisibleBounds`](../interfaces/ICameraBinding.md#getvisiblebounds)

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

[`ICameraBinding`](../interfaces/ICameraBinding.md).[`onDragStart`](../interfaces/ICameraBinding.md#ondragstart)

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

[`ICameraBinding`](../interfaces/ICameraBinding.md).[`onTransformChange`](../interfaces/ICameraBinding.md#ontransformchange)

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

[`ICameraBinding`](../interfaces/ICameraBinding.md).[`resize`](../interfaces/ICameraBinding.md#resize)

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

[`ICameraBinding`](../interfaces/ICameraBinding.md).[`setDragSuspended`](../interfaces/ICameraBinding.md#setdragsuspended)

***

### setTransform()

> **setTransform**(`t`): `void`

Write the transform verbatim — no clamping, no re-anchoring. `Camera` has
already applied its own semantics; this is the raw write.

Must **not** re-report through [onTransformChange](../interfaces/ICameraBinding.md#ontransformchange): `Camera` knows it
made this change and emits its own events, so an echo would double-fire.

#### Parameters

##### t

[`CameraTransformValue`](../interfaces/CameraTransformValue.md)

#### Returns

`void`

#### Implementation of

[`ICameraBinding`](../interfaces/ICameraBinding.md).[`setTransform`](../interfaces/ICameraBinding.md#settransform)

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

[`ICameraBinding`](../interfaces/ICameraBinding.md).[`tick`](../interfaces/ICameraBinding.md#tick)

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

#### Implementation of

[`ICameraBinding`](../interfaces/ICameraBinding.md).[`toScreen`](../interfaces/ICameraBinding.md#toscreen)

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

#### Implementation of

[`ICameraBinding`](../interfaces/ICameraBinding.md).[`toWorld`](../interfaces/ICameraBinding.md#toworld)

***

### zoomToCentre()

> **zoomToCentre**(`zoom`): `void`

Zoom about the viewport centre, keeping the centre world point fixed. Split
out from [setTransform](../interfaces/ICameraBinding.md#settransform) because backends implement centre-anchored
zoom themselves and their arithmetic is what users' muscle memory expects.

#### Parameters

##### zoom

`number`

#### Returns

`void`

#### Implementation of

[`ICameraBinding`](../interfaces/ICameraBinding.md).[`zoomToCentre`](../interfaces/ICameraBinding.md#zoomtocentre)
