# Class: BackgroundLayer

The subset of `Layer` the `LayerRegistry` and `Canvas.tick` interact with.
Lets the registry stay decoupled from the abstract class implementation.

## Extends

- [`ScreenLayer`](ScreenLayer.md)\<[`BackgroundLayerOptions`](../interfaces/BackgroundLayerOptions.md), `BackgroundLayerState`, `Record`\<`string`, `never`\>, `never`, [`ScreenLayerHit`](../interfaces/ScreenLayerHit.md)\>

## Constructors

### Constructor

> **new BackgroundLayer**(`opts`): `BackgroundLayer`

#### Parameters

##### opts

[`LayerOptions`](../interfaces/LayerOptions.md)\<[`BackgroundLayerOptions`](../interfaces/BackgroundLayerOptions.md)\>

#### Returns

`BackgroundLayer`

#### Overrides

[`ScreenLayer`](ScreenLayer.md).[`constructor`](ScreenLayer.md#constructor)

## Properties

### \_surface?

> `protected` `optional` **\_surface?**: [`ISurface`](../interfaces/ISurface.md)

Backing field — assigned in `mount`, cleared in `unmount`.

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`_surface`](ScreenLayer.md#_surface)

***

### ctx?

> `protected` `optional` **ctx?**: [`CanvasContext`](../interfaces/CanvasContext.md)

Set by `mount(ctx)`; cleared by `unmount()`.

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`ctx`](ScreenLayer.md#ctx)

***

### cullable

> **cullable**: `boolean`

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`cullable`](ScreenLayer.md#cullable)

***

### dirty

> `readonly` **dirty**: [`DirtyBatcher`](DirtyBatcher.md)\<`never`\>

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`dirty`](ScreenLayer.md#dirty)

***

### events

> `readonly` **events**: [`SourceEmitter`](SourceEmitter.md)\<`Record`\<`string`, `never`\>\>

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`events`](ScreenLayer.md#events)

***

### hittable

> **hittable**: `boolean`

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`hittable`](ScreenLayer.md#hittable)

***

### id

> `readonly` **id**: `string`

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`id`](ScreenLayer.md#id)

***

### kind

> `readonly` **kind**: `"background-layer"` = `'background-layer'`

Stable **class kind** — a minification-safe discriminator matching the
`@invana/canvas-ui` settings-editor registry key (e.g. `'background-layer'`,
`'minimap-layer'`). Distinct from [id](../../../graph-layer-maplibre/src/classes/MapLayer.md#id) (the per-instance key): all
`BackgroundLayer` instances share `kind: 'background-layer'`. Concrete layers
set it as a class field; left `undefined` on any that haven't, so consumers
fall back (e.g. to the class name). Lets domain-free tooling resolve an
instance's editor without an `instanceof` ladder.

#### Overrides

[`ScreenLayer`](ScreenLayer.md).[`kind`](ScreenLayer.md#kind)

***

### options

> `readonly` **options**: [`BackgroundLayerOptions`](../interfaces/BackgroundLayerOptions.md)

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`options`](ScreenLayer.md#options)

***

### zIndex

> **zIndex**: `number`

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`zIndex`](ScreenLayer.md#zindex)

## Accessors

### context

#### Get Signature

> **get** `protected` **context**(): [`CanvasContext`](../interfaces/CanvasContext.md)

Convenience accessor; throws when called pre-mount.

##### Returns

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`context`](ScreenLayer.md#context)

***

### mounted

#### Get Signature

> **get** **mounted**(): `boolean`

True between `mount` and `unmount`.

##### Returns

`boolean`

`true` between `mount(ctx)` and `unmount()`. Lets the registry skip already-mounted layers.

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`mounted`](ScreenLayer.md#mounted)

***

### state

#### Get Signature

> **get** **state**(): [`ReactiveStore`](../interfaces/ReactiveStore.md)\<`TState`\>

UI / interaction state (`ReactiveStore<TState>`). Because it is built
through the injected kernel factory, every write emits patches and history /
telemetry / a future CRDT backend all observe it.

**Available from `mount()` onward** — accessing it before the first mount
throws. (`createState()` is also called at first mount, so it may safely
read subclass fields initialised in the subclass constructor.)

##### Returns

[`ReactiveStore`](../interfaces/ReactiveStore.md)\<`TState`\>

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`state`](ScreenLayer.md#state)

***

### surface

#### Get Signature

> **get** `protected` **surface**(): [`ISurface`](../interfaces/ISurface.md)

##### Returns

[`ISurface`](../interfaces/ISurface.md)

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`surface`](ScreenLayer.md#surface)

***

### visible

#### Get Signature

> **get** **visible**(): `boolean`

Whether this layer renders. Setting `false` hides the layer's pixi
container (via `onVisibleChange`, overridden by `WorldLayer` /
`ScreenLayer`) and the Canvas tick skips its flush.

##### Returns

`boolean`

#### Set Signature

> **set** **visible**(`value`): `void`

##### Parameters

###### value

`boolean`

##### Returns

`void`

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`visible`](ScreenLayer.md#visible)

## Methods

### applyDirty()

> `protected` **applyDirty**(`_snap`): `void`

Translate a dirty snapshot into renderer / pixi commands.
Default: no-op. Override when the layer batches work via `dirty.mark(...)`.

#### Parameters

##### \_snap

[`DirtySnapshot`](../interfaces/DirtySnapshot.md)\<`never`\>

#### Returns

`void`

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`applyDirty`](ScreenLayer.md#applydirty)

***

### createState()

> `protected` **createState**(): `BackgroundLayerState`

Build the initial UI / interaction state. Called once in the constructor.

#### Returns

`BackgroundLayerState`

#### Overrides

[`ScreenLayer`](ScreenLayer.md).[`createState`](ScreenLayer.md#createstate)

***

### flush()

> **flush**(): `void`

Called by Canvas tick when `hasPending()` is true. Swaps the dirty
snapshot, hands it to `applyDirty`. Subclasses normally don't override.

#### Returns

`void`

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`flush`](ScreenLayer.md#flush)

***

### getMode()

> **getMode**(): [`BackgroundMode`](../type-aliases/BackgroundMode.md)

Current mode setting.

#### Returns

[`BackgroundMode`](../type-aliases/BackgroundMode.md)

***

### getOptions()

> **getOptions**(): `Required`\<[`BackgroundLayerOptions`](../interfaces/BackgroundLayerOptions.md)\>

Snapshot of the resolved options.

#### Returns

`Required`\<[`BackgroundLayerOptions`](../interfaces/BackgroundLayerOptions.md)\>

***

### getResolvedBackgroundColor()

> **getResolvedBackgroundColor**(): `string` \| `number`

The resolved (mode-applied) solid colour currently painted behind the
pattern. Layers that want to match the canvas backdrop read this instead of
re-implementing `{ light, dark }` resolution — e.g. MiniMapLayer
pointed here via its `backgroundLayerId` mirrors the canvas background so
its chrome never drifts from the real one. Returns a `number` or CSS string
(whichever form the option carried), suitable for any pixi fill.

#### Returns

`string` \| `number`

***

### getResolvedKind()

> **getResolvedKind**(): [`BackgroundKind`](../type-aliases/BackgroundKind.md)

Concrete kind currently being rendered. A pinned `mode` wins; otherwise
`'auto'` follows the active theme on `ctx.theme` (defaulting to `'light'`
when no theme has been published yet).

#### Returns

[`BackgroundKind`](../type-aliases/BackgroundKind.md)

***

### hasPending()

> **hasPending**(): `boolean`

Whether `flush()` has work to do this frame.

#### Returns

`boolean`

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`hasPending`](ScreenLayer.md#haspending)

***

### hitTest()

> **hitTest**(): [`ScreenLayerHit`](../interfaces/ScreenLayerHit.md)

Hit tests on the background always miss — clicks fall through to the
world layer beneath, which is what users expect for a bg.

#### Returns

[`ScreenLayerHit`](../interfaces/ScreenLayerHit.md)

#### Overrides

[`ScreenLayer`](ScreenLayer.md).[`hitTest`](ScreenLayer.md#hittest)

***

### mount()

> **mount**(`ctx`): `void`

#### Parameters

##### ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`mount`](ScreenLayer.md#mount)

***

### onMount()

> `protected` **onMount**(`ctx`): `void`

Domain-specific mount setup (subscribe to peers, attach renderer, etc.).

#### Parameters

##### ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

#### Overrides

[`ScreenLayer`](ScreenLayer.md).[`onMount`](ScreenLayer.md#onmount)

***

### onUnmount()

> `protected` **onUnmount**(): `void`

Domain-specific unmount teardown.

#### Returns

`void`

#### Overrides

[`ScreenLayer`](ScreenLayer.md).[`onUnmount`](ScreenLayer.md#onunmount)

***

### onVisibleChange()

> `protected` **onVisibleChange**(`value`): `void`

Keep the surface in sync when `layer.visible` is toggled.

#### Parameters

##### value

`boolean`

#### Returns

`void`

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`onVisibleChange`](ScreenLayer.md#onvisiblechange)

***

### redraw()

> **redraw**(): `void`

Force a full repaint of this layer from its current state, bypassing the
per-frame dirty path. Base implementation is a no-op — only layers that
mount a renderer override it (e.g. `GraphLayer.redraw` re-renders every
node and edge). Driven by [Canvas.redraw](Canvas.md#redraw); reach for it after an
external change that sidestepped the normal mutate-and-flush path (theme
swap, palette change) or to recover from a suspected render desync.

#### Returns

`void`

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`redraw`](ScreenLayer.md#redraw)

***

### setMode()

> **setMode**(`mode`): `void`

Set the colour-resolution mode. `'auto'` re-arms the system listener;
`'light'` / `'dark'` pin explicitly. No-op when mode is unchanged.

#### Parameters

##### mode

[`BackgroundMode`](../type-aliases/BackgroundMode.md)

#### Returns

`void`

***

### setOptions()

> **setOptions**(`changes`): `void`

Merge-update options + re-render.

#### Parameters

##### changes

`Partial`\<[`BackgroundLayerOptions`](../interfaces/BackgroundLayerOptions.md)\>

#### Returns

`void`

***

### setVisible()

> **setVisible**(`visible`): `void`

Toggle whole-layer visibility, repaint, and announce it. Unlike assigning
`visible` (which only hides the pixi container via [onVisibleChange](#onvisiblechange)),
this also forces a [redraw](#redraw) and emits `scene:layer:visibilitychange`
on the canvas bus so dependent layers (minimap) and the render loop react
automatically. No-op if the value is unchanged.

#### Parameters

##### visible

`boolean`

#### Returns

`void`

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`setVisible`](ScreenLayer.md#setvisible)

***

### setZIndex()

> **setZIndex**(`z`): `void`

Update this layer's z-order relative to its peers. Keeps the iteration
field (`this.zIndex`) and the surface's paint order in sync, and
flips `ctx.stage` into sorted mode so the change renders.

#### Parameters

##### z

`number`

#### Returns

`void`

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`setZIndex`](ScreenLayer.md#setzindex)

***

### surfaceOptions()

> `protected` **surfaceOptions**(): [`SurfaceOptions`](../interfaces/SurfaceOptions.md)

Per-layer options for the drawing device this layer's surface builds.
Override when the layer owns policy the renderer can't know — a graph layer
with pinpoint nodes wants a larger hit floor than one of big cards.
Read once, at mount.

#### Returns

[`SurfaceOptions`](../interfaces/SurfaceOptions.md)

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`surfaceOptions`](ScreenLayer.md#surfaceoptions)

***

### unmount()

> **unmount**(): `void`

#### Returns

`void`

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`unmount`](ScreenLayer.md#unmount)
