# Class: MiniMapLayer

## Extends

- `ScreenLayer`\<[`MiniMapLayerOptions`](../interfaces/MiniMapLayerOptions.md), `MiniMapState`, `Record`\<`string`, `never`\>, `never`, `ScreenLayerHit`\>

## Constructors

### Constructor

> **new MiniMapLayer**(`opts`): `MiniMapLayer`

#### Parameters

##### opts

[`LayerOptions`](../../../canvas/src/interfaces/LayerOptions.md)\<[`MiniMapLayerOptions`](../interfaces/MiniMapLayerOptions.md)\>

#### Returns

`MiniMapLayer`

#### Overrides

`ScreenLayer< MiniMapLayerOptions, MiniMapState, Record<string, never>, never, ScreenLayerHit >.constructor`

## Properties

### \_surface?

> `protected` `optional` **\_surface?**: [`ISurface`](../../../canvas/src/interfaces/ISurface.md)

Backing field — assigned in `mount`, cleared in `unmount`.

#### Inherited from

[`GraphLegendLayer`](GraphLegendLayer.md).[`_surface`](GraphLegendLayer.md#_surface)

***

### ctx?

> `protected` `optional` **ctx?**: [`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

Set by `mount(ctx)`; cleared by `unmount()`.

#### Inherited from

`ScreenLayer.ctx`

***

### cullable

> **cullable**: `boolean`

#### Inherited from

`ScreenLayer.cullable`

***

### dirty

> `readonly` **dirty**: [`DirtyBatcher`](../../../canvas/src/classes/DirtyBatcher.md)\<`never`\>

#### Inherited from

`ScreenLayer.dirty`

***

### events

> `readonly` **events**: [`SourceEmitter`](../../../canvas/src/classes/SourceEmitter.md)\<`Record`\<`string`, `never`\>\>

#### Inherited from

`ScreenLayer.events`

***

### hittable

> **hittable**: `boolean`

#### Inherited from

`ScreenLayer.hittable`

***

### id

> `readonly` **id**: `string`

#### Inherited from

`ScreenLayer.id`

***

### kind

> `readonly` **kind**: `"minimap-layer"` = `'minimap-layer'`

Stable **class kind** — a minification-safe discriminator matching the
`@invana/canvas-ui` settings-editor registry key (e.g. `'background-layer'`,
`'minimap-layer'`). Distinct from [id](../../../graph-layer-maplibre/src/classes/MapLayer.md#id) (the per-instance key): all
`BackgroundLayer` instances share `kind: 'background-layer'`. Concrete layers
set it as a class field; left `undefined` on any that haven't, so consumers
fall back (e.g. to the class name). Lets domain-free tooling resolve an
instance's editor without an `instanceof` ladder.

#### Overrides

`ScreenLayer.kind`

***

### options

> `readonly` **options**: [`MiniMapLayerOptions`](../interfaces/MiniMapLayerOptions.md)

#### Inherited from

`ScreenLayer.options`

***

### zIndex

> **zIndex**: `number`

#### Inherited from

`ScreenLayer.zIndex`

## Accessors

### context

#### Get Signature

> **get** `protected` **context**(): [`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

Convenience accessor; throws when called pre-mount.

##### Returns

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Inherited from

`ScreenLayer.context`

***

### mounted

#### Get Signature

> **get** **mounted**(): `boolean`

True between `mount` and `unmount`.

##### Returns

`boolean`

#### Inherited from

`ScreenLayer.mounted`

***

### state

#### Get Signature

> **get** **state**(): [`ReactiveStore`](../../../canvas/src/interfaces/ReactiveStore.md)\<`TState`\>

UI / interaction state (`ReactiveStore<TState>`). Because it is built
through the injected kernel factory, every write emits patches and history /
telemetry / a future CRDT backend all observe it.

**Available from `mount()` onward** — accessing it before the first mount
throws. (`createState()` is also called at first mount, so it may safely
read subclass fields initialised in the subclass constructor.)

##### Returns

[`ReactiveStore`](../../../canvas/src/interfaces/ReactiveStore.md)\<`TState`\>

#### Inherited from

`ScreenLayer.state`

***

### surface

#### Get Signature

> **get** `protected` **surface**(): [`ISurface`](../../../canvas/src/interfaces/ISurface.md)

##### Returns

[`ISurface`](../../../canvas/src/interfaces/ISurface.md)

#### Inherited from

`ScreenLayer.surface`

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

`ScreenLayer.visible`

## Methods

### applyDirty()

> `protected` **applyDirty**(`_snap`): `void`

Translate a dirty snapshot into renderer / pixi commands.
Default: no-op. Override when the layer batches work via `dirty.mark(...)`.

#### Parameters

##### \_snap

[`DirtySnapshot`](../../../canvas/src/interfaces/DirtySnapshot.md)\<`never`\>

#### Returns

`void`

#### Inherited from

`ScreenLayer.applyDirty`

***

### createState()

> `protected` **createState**(): `MiniMapState`

Build the initial UI / interaction state. Called once in the constructor.

#### Returns

`MiniMapState`

#### Overrides

`ScreenLayer.createState`

***

### flush()

> **flush**(): `void`

Called by Canvas tick when `hasPending()` is true. Swaps the dirty
snapshot, hands it to `applyDirty`. Subclasses normally don't override.

#### Returns

`void`

#### Inherited from

`ScreenLayer.flush`

***

### getMode()

> **getMode**(): [`MiniMapMode`](../type-aliases/MiniMapMode.md)

Current mode setting.

#### Returns

[`MiniMapMode`](../type-aliases/MiniMapMode.md)

***

### getResolvedKind()

> **getResolvedKind**(): [`MiniMapKind`](../type-aliases/MiniMapKind.md)

Concrete kind currently resolved. A pinned `mode` wins; otherwise `'auto'`
follows the active theme on `ctx.theme` (defaulting to `'light'` before any
theme is published).

#### Returns

[`MiniMapKind`](../type-aliases/MiniMapKind.md)

***

### hasPending()

> **hasPending**(): `boolean`

Whether `flush()` has work to do this frame.

#### Returns

`boolean`

#### Inherited from

`ScreenLayer.hasPending`

***

### hitTest()

> **hitTest**(): `ScreenLayerHit`

Hit-test in screen / viewport coordinates. Top-most hit or `null`.

#### Returns

`ScreenLayerHit`

#### Overrides

`ScreenLayer.hitTest`

***

### mount()

> **mount**(`ctx`): `void`

#### Parameters

##### ctx

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Returns

`void`

#### Inherited from

`ScreenLayer.mount`

***

### onMount()

> `protected` **onMount**(`ctx`): `void`

Domain-specific mount setup (subscribe to peers, attach renderer, etc.).

#### Parameters

##### ctx

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Returns

`void`

#### Overrides

`ScreenLayer.onMount`

***

### onUnmount()

> `protected` **onUnmount**(): `void`

Domain-specific unmount teardown.

#### Returns

`void`

#### Overrides

`ScreenLayer.onUnmount`

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

`ScreenLayer.onVisibleChange`

***

### redraw()

> **redraw**(): `void`

Force a full repaint of this layer from its current state, bypassing the
per-frame dirty path. Base implementation is a no-op — only layers that
mount a renderer override it (e.g. `GraphLayer.redraw` re-renders every
node and edge). Driven by Canvas.redraw; reach for it after an
external change that sidestepped the normal mutate-and-flush path (theme
swap, palette change) or to recover from a suspected render desync.

#### Returns

`void`

#### Inherited from

`ScreenLayer.redraw`

***

### refresh()

> **refresh**(): `void`

Force a re-paint. Cheap — call after mutating colours / sizes externally.

#### Returns

`void`

***

### setMode()

> **setMode**(`mode`): `void`

Set the colour-resolution mode. `'auto'` follows the active theme on
`ctx.theme`; `'light'` / `'dark'` pin explicitly. No-op when unchanged. The
minimap chrome flips in lockstep with the canvas BackgroundLayer,
which resolves its kind from the same theme signal.

#### Parameters

##### mode

[`MiniMapMode`](../type-aliases/MiniMapMode.md)

#### Returns

`void`

***

### setOptions()

> **setOptions**(`patch`): `void`

#### Parameters

##### patch

`Partial`\<`Omit`\<[`MiniMapLayerOptions`](../interfaces/MiniMapLayerOptions.md), `"graphLayerId"`\>\>

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

`ScreenLayer.setVisible`

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

`ScreenLayer.setZIndex`

***

### surfaceOptions()

> `protected` **surfaceOptions**(): [`SurfaceOptions`](../../../canvas/src/interfaces/SurfaceOptions.md)

Per-layer options for the drawing device this layer's surface builds.
Override when the layer owns policy the renderer can't know — a graph layer
with pinpoint nodes wants a larger hit floor than one of big cards.
Read once, at mount.

#### Returns

[`SurfaceOptions`](../../../canvas/src/interfaces/SurfaceOptions.md)

#### Inherited from

`ScreenLayer.surfaceOptions`

***

### unmount()

> **unmount**(): `void`

#### Returns

`void`

#### Inherited from

`ScreenLayer.unmount`
