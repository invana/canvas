# Class: PixiRenderer

`@invana/renderer-pixijs` — the PixiJS drawing backend for `@invana/canvas`.

**Everything that touches `pixi.js` in this repo lives here.** The engine
orchestrates, `@invana/graph` describes, this package draws.

```ts
import { Canvas } from '@invana/canvas-core';
import { PixiRenderer } from '@invana/renderer-pixijs';

const canvas = new Canvas();
await canvas.init({ container: el, renderer: new PixiRenderer({ events: canvas.events }) });
```

`renderer` is optional — omitting it makes `Canvas.init` resolve this package
with a lazy `import()`, which is why `@invana/canvas` declares it an
**optional peer** rather than a dependency (design D1, §4.6).

What is *not* here, deliberately: interaction state, the hit index (picking is
interaction, not drawing — D5), connector routing and path styles (geometry
answers must not need a backend — §5), and any domain concept. If something
here can only be expressed in pixi terms, that is a bug in the contract.

## Implements

- [`IRenderer`](../../../canvas/src/interfaces/IRenderer.md)

## Constructors

### Constructor

> **new PixiRenderer**(`opts`): `PixiRenderer`

#### Parameters

##### opts

[`PixiRendererOptions`](../interfaces/PixiRendererOptions.md)

#### Returns

`PixiRenderer`

## Accessors

### application

#### Get Signature

> **get** **application**(): `Application`\<`Renderer`\>

The pixi `Application`, when one exists. `undefined` on the headless path.

##### Returns

`Application`\<`Renderer`\>

***

### backend

#### Get Signature

> **get** **backend**(): [`RendererBackend`](../../../canvas-store/src/type-aliases/RendererBackend.md)

The backend actually resolved at [mount](../../../canvas/src/interfaces/IRenderer.md#mount) (may differ from the preference).

##### Returns

[`RendererBackend`](../../../canvas-store/src/type-aliases/RendererBackend.md)

The backend actually resolved at [mount](../../../canvas/src/interfaces/IRenderer.md#mount) (may differ from the preference).

#### Implementation of

[`IRenderer`](../../../canvas/src/interfaces/IRenderer.md).[`backend`](../../../canvas/src/interfaces/IRenderer.md#backend)

***

### canvasElement

#### Get Signature

> **get** **canvasElement**(): `HTMLCanvasElement`

The drawing surface, when there is one. `null` on a headless backend.

##### Returns

`HTMLCanvasElement`

The drawing surface, when there is one. `null` on a headless backend.

#### Implementation of

[`IRenderer`](../../../canvas/src/interfaces/IRenderer.md).[`canvasElement`](../../../canvas/src/interfaces/IRenderer.md#canvaselement)

***

### capabilities

#### Get Signature

> **get** **capabilities**(): [`RendererCapabilities`](../../../canvas/src/interfaces/RendererCapabilities.md)

What this backend supports. Read after [mount](../../../canvas/src/interfaces/IRenderer.md#mount).

##### Returns

[`RendererCapabilities`](../../../canvas/src/interfaces/RendererCapabilities.md)

What this backend supports. Read after [mount](../../../canvas/src/interfaces/IRenderer.md#mount).

#### Implementation of

[`IRenderer`](../../../canvas/src/interfaces/IRenderer.md).[`capabilities`](../../../canvas/src/interfaces/IRenderer.md#capabilities)

***

### stage

#### Get Signature

> **get** **stage**(): `Container`

The scene root. Screen-space surfaces attach here, above `world`.

##### Returns

`Container`

***

### world

#### Get Signature

> **get** **world**(): `Container`

The camera-transformed world root. World-space surfaces attach here.

##### Returns

`Container`

## Methods

### attachCamera()

> **attachCamera**(`camera`): `void`

Hand back the engine's `Camera` once it has been built on this renderer's
binding.

The ordering is unavoidable and worth stating: the binding must exist before
a `Camera` can wrap it, and a surface needs the `Camera` (its primitives
renderer scales the hit floor and prioritises label rasterisation by what is
in view). So the sequence is `createCameraBinding` → `new Camera` →
`attachCamera` → `createSurface`. [createSurface](#createsurface) throws rather than
silently drawing without one.

#### Parameters

##### camera

[`Camera`](../../../canvas/src/classes/Camera.md)

#### Returns

`void`

#### Implementation of

[`IRenderer`](../../../canvas/src/interfaces/IRenderer.md).[`attachCamera`](../../../canvas/src/interfaces/IRenderer.md#attachcamera)

***

### createCameraBinding()

> **createCameraBinding**(): [`ICameraBinding`](../../../canvas/src/interfaces/ICameraBinding.md)

The concrete viewport behind the engine's [Camera](../../../canvas/src/classes/Camera.md). The renderer owns
the realisation; `Camera` owns clamping, anchored zoom, fit and the bus /
store sync.

#### Returns

[`ICameraBinding`](../../../canvas/src/interfaces/ICameraBinding.md)

#### Implementation of

[`IRenderer`](../../../canvas/src/interfaces/IRenderer.md).[`createCameraBinding`](../../../canvas/src/interfaces/IRenderer.md#createcamerabinding)

***

### createOverlay()

> **createOverlay**(`label`, `space?`): [`IOverlayDevice`](../../../canvas/src/interfaces/IOverlayDevice.md)

A standalone transient device not owned by any layer — a lasso, a brush
rectangle, a drag ghost. Behaviours use this, because a gesture overlay
belongs to the gesture rather than to a layer (§3, decision D3).

#### Parameters

##### label

`string`

##### space?

[`OverlaySpace`](../../../canvas/src/type-aliases/OverlaySpace.md) = `'world'`

#### Returns

[`IOverlayDevice`](../../../canvas/src/interfaces/IOverlayDevice.md)

#### Implementation of

[`IRenderer`](../../../canvas/src/interfaces/IRenderer.md).[`createOverlay`](../../../canvas/src/interfaces/IRenderer.md#createoverlay)

***

### createSurface()

> **createSurface**(`space`, `id`, `opts?`): [`ISurface`](../../../canvas/src/interfaces/ISurface.md)

A layer's slice of the renderer — durable spec projection, transient
overlays, visibility and paint order. This replaces a layer constructing a
backend container for itself.

#### Parameters

##### space

[`SurfaceSpace`](../../../canvas/src/type-aliases/SurfaceSpace.md)

##### id

`string`

##### opts?

[`SurfaceOptions`](../../../canvas/src/interfaces/SurfaceOptions.md)

#### Returns

[`ISurface`](../../../canvas/src/interfaces/ISurface.md)

#### Implementation of

[`IRenderer`](../../../canvas/src/interfaces/IRenderer.md).[`createSurface`](../../../canvas/src/interfaces/IRenderer.md#createsurface)

***

### destroy()

> **destroy**(): `void`

Tear down: release the backend, the DOM surface, and every listener.

#### Returns

`void`

#### Implementation of

[`IRenderer`](../../../canvas/src/interfaces/IRenderer.md).[`destroy`](../../../canvas/src/interfaces/IRenderer.md#destroy)

***

### deviceInfo()

> **deviceInfo**(): `Record`\<`string`, `unknown`\>

Device facts for the `canvas:renderer:ready` event.

#### Returns

`Record`\<`string`, `unknown`\>

***

### extract()

> **extract**(`opts`): `HTMLCanvasElement`

Raster capture (G1). Extracts onto a **fully transparent clear** so the
caller composites its own background — which is what keeps a
`'transparent'` request honest.

`region` is world-local (the world container's own space, before the camera
transform), matching what `captureRect` computes.

#### Parameters

##### opts

###### region

[`Rect`](../interfaces/Rect.md)

###### resolution

`number`

#### Returns

`HTMLCanvasElement`

#### Implementation of

[`IRenderer`](../../../canvas/src/interfaces/IRenderer.md).[`extract`](../../../canvas/src/interfaces/IRenderer.md#extract)

***

### mount()

> **mount**(`host`, `opts?`): `Promise`\<`void`\>

Stand the backend up against a DOM host: create the drawing surface, attach
it, and build the scene root. May be async (GPU adapter acquisition); the
orchestrator awaits it before creating any surface. [backend](../../../canvas/src/interfaces/IRenderer.md#backend) and
[capabilities](../../../canvas/src/interfaces/IRenderer.md#capabilities) are meaningful only once this resolves.

#### Parameters

##### host

`HTMLElement`

##### opts?

[`RendererMountOptions`](../../../canvas/src/interfaces/RendererMountOptions.md) = `{}`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`IRenderer`](../../../canvas/src/interfaces/IRenderer.md).[`mount`](../../../canvas/src/interfaces/IRenderer.md#mount)

***

### mountStage()

> **mountStage**(`stage`, `screenWidth`, `screenHeight`): `void`

Headless entry: adopt a caller-supplied stage instead of creating an
`Application`. **Adapter-specific, deliberately not on [IRenderer](../../../canvas/src/interfaces/IRenderer.md)** —
it exists for unit tests of the layer / behaviour / state pipeline that
don't need a GPU, and a second backend has no obligation to offer it.

#### Parameters

##### stage

`Container`

##### screenWidth

`number`

##### screenHeight

`number`

#### Returns

`void`

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

#### Implementation of

[`IRenderer`](../../../canvas/src/interfaces/IRenderer.md).[`resize`](../../../canvas/src/interfaces/IRenderer.md#resize)

***

### tick()

> **tick**(`_dtMs`): `void`

Advance backend animation and **present the frame** (G3).

Pixi's `Application.ticker` is stopped at mount, so this call is the only
thing that renders. The engine owns the sole `requestAnimationFrame` and
calls here once per frame, *after* it has advanced the camera, flushed data
and updated layers — which is what makes frame order deterministic and lets
a test drive time by hand.

No-op after a render-time fallback: `_fellBack` means the host is swapping
backend and another frame would just re-hit the crash.

#### Parameters

##### \_dtMs

`number`

#### Returns

`void`

#### Implementation of

[`IRenderer`](../../../canvas/src/interfaces/IRenderer.md).[`tick`](../../../canvas/src/interfaces/IRenderer.md#tick)

***

### worldContentBounds()

> **worldContentBounds**(): [`Rect`](../interfaces/Rect.md)

World-space bounds of everything drawn, or `null` when nothing is. Used by
`area: 'content'` export. The backend answers because only it knows what is
actually mounted.

#### Returns

[`Rect`](../interfaces/Rect.md)

#### Implementation of

[`IRenderer`](../../../canvas/src/interfaces/IRenderer.md).[`worldContentBounds`](../../../canvas/src/interfaces/IRenderer.md#worldcontentbounds)
