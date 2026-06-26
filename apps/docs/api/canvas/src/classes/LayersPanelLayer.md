# Class: LayersPanelLayer

Defined in: [canvas/src/layers/LayersPanelLayer.ts:86](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/LayersPanelLayer.ts#L86)

The subset of `Layer` the `LayerRegistry` and `Canvas.tick` interact with.
Lets the registry stay decoupled from the abstract class implementation.

## Extends

- [`ScreenLayer`](ScreenLayer.md)\<[`LayersPanelLayerOptions`](../interfaces/LayersPanelLayerOptions.md), `LayersPanelState`\>

## Constructors

### Constructor

> **new LayersPanelLayer**(`opts?`): `LayersPanelLayer`

Defined in: [canvas/src/layers/LayersPanelLayer.ts:94](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/LayersPanelLayer.ts#L94)

#### Parameters

##### opts?

[`LayersPanelLayerCtorOptions`](../interfaces/LayersPanelLayerCtorOptions.md) = `{}`

#### Returns

`LayersPanelLayer`

#### Overrides

[`ScreenLayer`](ScreenLayer.md).[`constructor`](ScreenLayer.md#constructor)

## Properties

### \_container?

> `protected` `optional` **\_container?**: `Container`

Defined in: [canvas/src/layers/ScreenLayer.ts:37](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/ScreenLayer.ts#L37)

Backing field — assigned in `mount`, cleared in `unmount`.

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`_container`](ScreenLayer.md#_container)

***

### ctx?

> `protected` `optional` **ctx?**: [`CanvasContext`](../interfaces/CanvasContext.md)

Defined in: [canvas/src/layers/Layer.ts:111](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L111)

Set by `mount(ctx)`; cleared by `unmount()`.

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`ctx`](ScreenLayer.md#ctx)

***

### cullable

> **cullable**: `boolean`

Defined in: [canvas/src/layers/Layer.ts:94](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L94)

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`cullable`](ScreenLayer.md#cullable)

***

### dirty

> `readonly` **dirty**: [`DirtyBatcher`](DirtyBatcher.md)\<`string`\>

Defined in: [canvas/src/layers/Layer.ts:88](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L88)

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`dirty`](ScreenLayer.md#dirty)

***

### events

> `readonly` **events**: [`SourceEmitter`](SourceEmitter.md)\<[`EventMap`](../type-aliases/EventMap.md)\>

Defined in: [canvas/src/layers/Layer.ts:87](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L87)

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`events`](ScreenLayer.md#events)

***

### hittable

> **hittable**: `boolean`

Defined in: [canvas/src/layers/Layer.ts:92](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L92)

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`hittable`](ScreenLayer.md#hittable)

***

### id

> `readonly` **id**: `string`

Defined in: [canvas/src/layers/Layer.ts:84](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L84)

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`id`](ScreenLayer.md#id)

***

### options

> `readonly` **options**: [`LayersPanelLayerOptions`](../interfaces/LayersPanelLayerOptions.md)

Defined in: [canvas/src/layers/Layer.ts:85](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L85)

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`options`](ScreenLayer.md#options)

***

### state

> `readonly` **state**: [`Store`](../type-aliases/Store.md)\<`LayersPanelState`\>

Defined in: [canvas/src/layers/Layer.ts:86](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L86)

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`state`](ScreenLayer.md#state)

***

### zIndex

> **zIndex**: `number`

Defined in: [canvas/src/layers/Layer.ts:93](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L93)

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`zIndex`](ScreenLayer.md#zindex)

## Accessors

### container

#### Get Signature

> **get** `protected` **container**(): `Container`

Defined in: [canvas/src/layers/ScreenLayer.ts:45](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/ScreenLayer.ts#L45)

Root pixi `Container` for this screen-space layer. Available from
`onMount(ctx)` for the layer's lifetime. Throws before mount / after unmount.

Subclass-only — not part of the external layer API.

##### Returns

`Container`

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`container`](ScreenLayer.md#container)

***

### context

#### Get Signature

> **get** `protected` **context**(): [`CanvasContext`](../interfaces/CanvasContext.md)

Defined in: [canvas/src/layers/Layer.ts:159](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L159)

Convenience accessor; throws when called pre-mount.

##### Returns

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`context`](ScreenLayer.md#context)

***

### mounted

#### Get Signature

> **get** **mounted**(): `boolean`

Defined in: [canvas/src/layers/Layer.ts:114](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L114)

True between `mount` and `unmount`.

##### Returns

`boolean`

`true` between `mount(ctx)` and `unmount()`. Lets the registry skip already-mounted layers.

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`mounted`](ScreenLayer.md#mounted)

***

### visible

#### Get Signature

> **get** **visible**(): `boolean`

Defined in: [canvas/src/layers/Layer.ts:101](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L101)

Whether this layer renders. Setting `false` hides the layer's pixi
container (via `onVisibleChange`, overridden by `WorldLayer` /
`ScreenLayer`) and the Canvas tick skips its flush.

##### Returns

`boolean`

#### Set Signature

> **set** **visible**(`value`): `void`

Defined in: [canvas/src/layers/Layer.ts:104](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L104)

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

Defined in: [canvas/src/layers/Layer.ts:204](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L204)

Translate a dirty snapshot into renderer / pixi commands.
Default: no-op. Override when the layer batches work via `dirty.mark(...)`.

#### Parameters

##### \_snap

[`DirtySnapshot`](../interfaces/DirtySnapshot.md)\<`string`\>

#### Returns

`void`

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`applyDirty`](ScreenLayer.md#applydirty)

***

### createContainer()

> **createContainer**(`label?`): `Container`

Defined in: [canvas/src/layers/ScreenLayer.ts:99](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/ScreenLayer.ts#L99)

Create a plain pixi `Container` attached to this layer's root container.
Useful as a parent for mounted display objects.

#### Parameters

##### label?

`string`

#### Returns

`Container`

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`createContainer`](ScreenLayer.md#createcontainer)

***

### createGraphics()

> **createGraphics**(`label?`): `Graphics`

Defined in: [canvas/src/layers/ScreenLayer.ts:88](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/ScreenLayer.ts#L88)

Create a pixi `Graphics` attached to this layer's root container. The
sanctioned way for layer authors to obtain a `Graphics` for direct
painting via `@invana/canvas/draw` primitives.

#### Parameters

##### label?

`string`

#### Returns

`Graphics`

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`createGraphics`](ScreenLayer.md#creategraphics)

***

### createState()

> `protected` **createState**(): `LayersPanelState`

Defined in: [canvas/src/layers/LayersPanelLayer.ts:106](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/LayersPanelLayer.ts#L106)

Build the initial UI / interaction state. Called once in the constructor.

#### Returns

`LayersPanelState`

#### Overrides

[`ScreenLayer`](ScreenLayer.md).[`createState`](ScreenLayer.md#createstate)

***

### disable()

> **disable**(): `void`

Defined in: [canvas/src/layers/LayersPanelLayer.ts:142](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/LayersPanelLayer.ts#L142)

#### Returns

`void`

***

### enable()

> **enable**(): `void`

Defined in: [canvas/src/layers/LayersPanelLayer.ts:137](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/LayersPanelLayer.ts#L137)

#### Returns

`void`

***

### flush()

> **flush**(): `void`

Defined in: [canvas/src/layers/Layer.ts:177](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L177)

Called by Canvas tick when `hasPending()` is true. Swaps the dirty
snapshot, hands it to `applyDirty`. Subclasses normally don't override.

#### Returns

`void`

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`flush`](ScreenLayer.md#flush)

***

### hasPending()

> **hasPending**(): `boolean`

Defined in: [canvas/src/layers/Layer.ts:169](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L169)

Whether `flush()` has work to do this frame.

#### Returns

`boolean`

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`hasPending`](ScreenLayer.md#haspending)

***

### hitTest()

> **hitTest**(`_screenX`, `_screenY`): [`ScreenLayerHit`](../interfaces/ScreenLayerHit.md)

Defined in: [canvas/src/layers/LayersPanelLayer.ts:113](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/LayersPanelLayer.ts#L113)

Overlay is DOM — never participates in the engine's hit-testing.

#### Parameters

##### \_screenX

`number`

##### \_screenY

`number`

#### Returns

[`ScreenLayerHit`](../interfaces/ScreenLayerHit.md)

#### Overrides

[`ScreenLayer`](ScreenLayer.md).[`hitTest`](ScreenLayer.md#hittest)

***

### mount()

> **mount**(`ctx`): `void`

Defined in: [canvas/src/layers/ScreenLayer.ts:56](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/ScreenLayer.ts#L56)

#### Parameters

##### ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`mount`](ScreenLayer.md#mount)

***

### onMount()

> `protected` **onMount**(): `void`

Defined in: [canvas/src/layers/LayersPanelLayer.ts:119](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/LayersPanelLayer.ts#L119)

Domain-specific mount setup (subscribe to peers, attach renderer, etc.).

#### Returns

`void`

#### Overrides

[`ScreenLayer`](ScreenLayer.md).[`onMount`](ScreenLayer.md#onmount)

***

### onUnmount()

> `protected` **onUnmount**(): `void`

Defined in: [canvas/src/layers/LayersPanelLayer.ts:125](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/LayersPanelLayer.ts#L125)

Domain-specific unmount teardown.

#### Returns

`void`

#### Overrides

[`ScreenLayer`](ScreenLayer.md).[`onUnmount`](ScreenLayer.md#onunmount)

***

### onVisibleChange()

> `protected` **onVisibleChange**(`value`): `void`

Defined in: [canvas/src/layers/ScreenLayer.ts:72](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/ScreenLayer.ts#L72)

Keep the pixi container in sync when `layer.visible` is toggled.

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

Defined in: [canvas/src/layers/Layer.ts:191](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L191)

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

### refresh()

> **refresh**(): `void`

Defined in: [canvas/src/layers/LayersPanelLayer.ts:162](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/LayersPanelLayer.ts#L162)

Force a re-render of the panel. Call this if external code mutates
`layer.visible` on a registered layer and you want the checkboxes to
reflect the new state. (The engine does not emit an event for visibility
mutations.)

#### Returns

`void`

***

### setEnabled()

> **setEnabled**(`enabled`): `void`

Defined in: [canvas/src/layers/LayersPanelLayer.ts:132](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/LayersPanelLayer.ts#L132)

Show or hide the panel at runtime without removing the layer.

#### Parameters

##### enabled

`boolean`

#### Returns

`void`

***

### setOptions()

> **setOptions**(`partial`): `void`

Defined in: [canvas/src/layers/LayersPanelLayer.ts:148](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/LayersPanelLayer.ts#L148)

Update display options (corner, colors, font size, …) at runtime.

#### Parameters

##### partial

`Partial`\<[`LayersPanelLayerOptions`](../interfaces/LayersPanelLayerOptions.md)\>

#### Returns

`void`

***

### setZIndex()

> **setZIndex**(`z`): `void`

Defined in: [canvas/src/layers/ScreenLayer.ts:111](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/ScreenLayer.ts#L111)

Update this layer's z-order relative to its peers. Keeps the iteration
field (`this.zIndex`) and the pixi container's `zIndex` in sync, and
flips `ctx.stage` into sorted mode so the change renders.

#### Parameters

##### z

`number`

#### Returns

`void`

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`setZIndex`](ScreenLayer.md#setzindex)

***

### unmount()

> **unmount**(): `void`

Defined in: [canvas/src/layers/ScreenLayer.ts:76](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/ScreenLayer.ts#L76)

#### Returns

`void`

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`unmount`](ScreenLayer.md#unmount)
