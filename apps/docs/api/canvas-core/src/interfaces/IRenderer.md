# Interface: IRenderer

## Properties

### backend

> `readonly` **backend**: [`RendererBackend`](../type-aliases/RendererBackend.md)

The backend actually resolved at [mount](#mount) (may differ from the preference).

***

### canvasElement

> `readonly` **canvasElement**: `HTMLCanvasElement`

The drawing surface, when there is one. `null` on a headless backend.

***

### capabilities

> `readonly` **capabilities**: [`RendererCapabilities`](RendererCapabilities.md)

What this backend supports. Read after [mount](#mount).

## Methods

### attachCamera()

> **attachCamera**(`camera`): `void`

Hand back the engine's `Camera` once it wraps this renderer's binding.
Surfaces need it (hit-floor scaling, label-raster priority), so the order is
`createCameraBinding` → `new Camera` → `attachCamera` → `createSurface`.

#### Parameters

##### camera

[`Camera`](../classes/Camera.md)

#### Returns

`void`

***

### createCameraBinding()

> **createCameraBinding**(): [`ICameraBinding`](ICameraBinding.md)

The concrete viewport behind the engine's [Camera](../classes/Camera.md). The renderer owns
the realisation; `Camera` owns clamping, anchored zoom, fit and the bus /
store sync.

#### Returns

[`ICameraBinding`](ICameraBinding.md)

***

### createOverlay()

> **createOverlay**(`label`, `space?`): [`IOverlayDevice`](IOverlayDevice.md)

A standalone transient device not owned by any layer — a lasso, a brush
rectangle, a drag ghost. Behaviours use this, because a gesture overlay
belongs to the gesture rather than to a layer (§3, decision D3).

#### Parameters

##### label

`string`

##### space?

[`OverlaySpace`](../type-aliases/OverlaySpace.md)

#### Returns

[`IOverlayDevice`](IOverlayDevice.md)

***

### createSurface()

> **createSurface**(`space`, `id`, `opts?`): [`ISurface`](ISurface.md)

A layer's slice of the renderer — durable spec projection, transient
overlays, visibility and paint order. This replaces a layer constructing a
backend container for itself.

#### Parameters

##### space

[`SurfaceSpace`](../type-aliases/SurfaceSpace.md)

##### id

`string`

##### opts?

[`SurfaceOptions`](SurfaceOptions.md)

#### Returns

[`ISurface`](ISurface.md)

***

### destroy()

> **destroy**(): `void`

Tear down: release the backend, the DOM surface, and every listener.

#### Returns

`void`

***

### extract()?

> `optional` **extract**(`opts`): `HTMLCanvasElement`

Raster capture, capability-gated by [RendererCapabilities.rasterExport](RendererCapabilities.md#rasterexport)
(G1). Vector/SVG export is engine-side and spec-driven, so it is *not* here —
it works on every backend including headless.

#### Parameters

##### opts

###### region

[`Rect`](Rect.md)

World-space region to capture.

###### resolution

`number`

Output pixels per world unit.

#### Returns

`HTMLCanvasElement`

***

### mount()

> **mount**(`host`, `opts?`): `void` \| `Promise`\<`void`\>

Stand the backend up against a DOM host: create the drawing surface, attach
it, and build the scene root. May be async (GPU adapter acquisition); the
orchestrator awaits it before creating any surface. [backend](#backend) and
[capabilities](#capabilities) are meaningful only once this resolves.

#### Parameters

##### host

`HTMLElement`

##### opts?

[`RendererMountOptions`](RendererMountOptions.md)

#### Returns

`void` \| `Promise`\<`void`\>

***

### resize()

> **resize**(`width`, `height`): `void`

Viewport size changed (CSS px).

#### Parameters

##### width

`number`

##### height

`number`

#### Returns

`void`

***

### tick()

> **tick**(`dtMs`): `void`

Advance backend-owned animation and **present the frame**.

The engine owns the only `requestAnimationFrame` (G3) and calls this once
per frame, after advancing the camera, flushing data and updating layers. A
renderer must **not** schedule frames of its own: two clocks disagree about
frame order, and a test can't drive time by hand.

#### Parameters

##### dtMs

`number`

#### Returns

`void`

***

### worldContentBounds()

> **worldContentBounds**(): [`Rect`](Rect.md)

World-space bounds of everything drawn, or `null` when nothing is. Used by
`area: 'content'` export. The backend answers because only it knows what is
actually mounted.

#### Returns

[`Rect`](Rect.md)
