# Class: HeadlessRenderer

## Implements

- [`IRenderer`](../interfaces/IRenderer.md)

## Constructors

### Constructor

> **new HeadlessRenderer**(): `HeadlessRenderer`

#### Returns

`HeadlessRenderer`

## Properties

### backend

> `readonly` **backend**: `"canvas"`

The backend actually resolved at [mount](../interfaces/IRenderer.md#mount) (may differ from the preference).

#### Implementation of

[`IRenderer`](../interfaces/IRenderer.md).[`backend`](../interfaces/IRenderer.md#backend)

***

### binding

> `readonly` **binding**: [`HeadlessCameraBinding`](HeadlessCameraBinding.md)

***

### camera?

> `optional` **camera?**: [`Camera`](Camera.md)

***

### canvasElement

> `readonly` **canvasElement**: `HTMLCanvasElement` = `null`

The drawing surface, when there is one. `null` on a headless backend.

#### Implementation of

[`IRenderer`](../interfaces/IRenderer.md).[`canvasElement`](../interfaces/IRenderer.md#canvaselement)

***

### destroyed

> **destroyed**: `boolean` = `false`

***

### frames

> `readonly` **frames**: `number`[] = `[]`

Every `tick(dt)` the engine drove, in order.

***

### surfaces

> `readonly` **surfaces**: `Map`\<`string`, [`HeadlessSurface`](HeadlessSurface.md)\>

Every surface handed out, by layer id — for asserting layer lifecycle.

## Accessors

### capabilities

#### Get Signature

> **get** **capabilities**(): [`RendererCapabilities`](../interfaces/RendererCapabilities.md)

What this backend supports. Read after [mount](../interfaces/IRenderer.md#mount).

##### Returns

[`RendererCapabilities`](../interfaces/RendererCapabilities.md)

What this backend supports. Read after [mount](../interfaces/IRenderer.md#mount).

#### Implementation of

[`IRenderer`](../interfaces/IRenderer.md).[`capabilities`](../interfaces/IRenderer.md#capabilities)

## Methods

### attachCamera()

> **attachCamera**(`camera`): `void`

Hand back the engine's `Camera` once it wraps this renderer's binding.
Surfaces need it (hit-floor scaling, label-raster priority), so the order is
`createCameraBinding` → `new Camera` → `attachCamera` → `createSurface`.

#### Parameters

##### camera

[`Camera`](Camera.md)

#### Returns

`void`

#### Implementation of

[`IRenderer`](../interfaces/IRenderer.md).[`attachCamera`](../interfaces/IRenderer.md#attachcamera)

***

### createCameraBinding()

> **createCameraBinding**(): [`ICameraBinding`](../interfaces/ICameraBinding.md)

The concrete viewport behind the engine's [Camera](Camera.md). The renderer owns
the realisation; `Camera` owns clamping, anchored zoom, fit and the bus /
store sync.

#### Returns

[`ICameraBinding`](../interfaces/ICameraBinding.md)

#### Implementation of

[`IRenderer`](../interfaces/IRenderer.md).[`createCameraBinding`](../interfaces/IRenderer.md#createcamerabinding)

***

### createOverlay()

> **createOverlay**(): [`IOverlayDevice`](../interfaces/IOverlayDevice.md)

A standalone transient device not owned by any layer — a lasso, a brush
rectangle, a drag ghost. Behaviours use this, because a gesture overlay
belongs to the gesture rather than to a layer (§3, decision D3).

#### Returns

[`IOverlayDevice`](../interfaces/IOverlayDevice.md)

#### Implementation of

[`IRenderer`](../interfaces/IRenderer.md).[`createOverlay`](../interfaces/IRenderer.md#createoverlay)

***

### createSurface()

> **createSurface**(`space`, `id`): [`ISurface`](../interfaces/ISurface.md)

A layer's slice of the renderer — durable spec projection, transient
overlays, visibility and paint order. This replaces a layer constructing a
backend container for itself.

#### Parameters

##### space

[`SurfaceSpace`](../type-aliases/SurfaceSpace.md)

##### id

`string`

#### Returns

[`ISurface`](../interfaces/ISurface.md)

#### Implementation of

[`IRenderer`](../interfaces/IRenderer.md).[`createSurface`](../interfaces/IRenderer.md#createsurface)

***

### destroy()

> **destroy**(): `void`

Tear down: release the backend, the DOM surface, and every listener.

#### Returns

`void`

#### Implementation of

[`IRenderer`](../interfaces/IRenderer.md).[`destroy`](../interfaces/IRenderer.md#destroy)

***

### mount()

> **mount**(): `void`

Stand the backend up against a DOM host: create the drawing surface, attach
it, and build the scene root. May be async (GPU adapter acquisition); the
orchestrator awaits it before creating any surface. [backend](../interfaces/IRenderer.md#backend) and
[capabilities](../interfaces/IRenderer.md#capabilities) are meaningful only once this resolves.

#### Returns

`void`

#### Implementation of

[`IRenderer`](../interfaces/IRenderer.md).[`mount`](../interfaces/IRenderer.md#mount)

***

### resize()

> **resize**(): `void`

Viewport size changed (CSS px).

#### Returns

`void`

#### Implementation of

[`IRenderer`](../interfaces/IRenderer.md).[`resize`](../interfaces/IRenderer.md#resize)

***

### tick()

> **tick**(`dtMs`): `void`

Records the frames the engine drove, so a test can assert the clock ran.

#### Parameters

##### dtMs

`number`

#### Returns

`void`

#### Implementation of

[`IRenderer`](../interfaces/IRenderer.md).[`tick`](../interfaces/IRenderer.md#tick)

***

### worldContentBounds()

> **worldContentBounds**(): [`Rect`](../interfaces/Rect.md)

World-space bounds of everything drawn, or `null` when nothing is. Used by
`area: 'content'` export. The backend answers because only it knows what is
actually mounted.

#### Returns

[`Rect`](../interfaces/Rect.md)

#### Implementation of

[`IRenderer`](../interfaces/IRenderer.md).[`worldContentBounds`](../interfaces/IRenderer.md#worldcontentbounds)
