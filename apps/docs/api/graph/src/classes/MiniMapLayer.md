# Class: MiniMapLayer

Defined in: [graph/src/layer/MiniMapLayer.ts:100](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/MiniMapLayer.ts#L100)

The subset of `Layer` the `LayerRegistry` and `Canvas.tick` interact with.
Lets the registry stay decoupled from the abstract class implementation.

## Extends

- [`ScreenLayer`](../../../canvas/src/classes/ScreenLayer.md)\<[`MiniMapLayerOptions`](../interfaces/MiniMapLayerOptions.md), `MiniMapState`, `Record`\<`string`, `never`\>, `never`, [`ScreenLayerHit`](../../../canvas/src/interfaces/ScreenLayerHit.md)\>

## Constructors

### Constructor

> **new MiniMapLayer**(`opts`): `MiniMapLayer`

Defined in: [graph/src/layer/MiniMapLayer.ts:134](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/MiniMapLayer.ts#L134)

#### Parameters

##### opts

[`LayerOptions`](../../../canvas/src/interfaces/LayerOptions.md)\<[`MiniMapLayerOptions`](../interfaces/MiniMapLayerOptions.md)\>

#### Returns

`MiniMapLayer`

#### Overrides

[`ScreenLayer`](../../../canvas/src/classes/ScreenLayer.md).[`constructor`](../../../canvas/src/classes/ScreenLayer.md#constructor)

## Properties

### \_container?

> `protected` `optional` **\_container?**: `Container`

Defined in: [canvas/src/layers/ScreenLayer.ts:37](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/ScreenLayer.ts#L37)

Backing field — assigned in `mount`, cleared in `unmount`.

#### Inherited from

[`ScreenLayer`](../../../canvas/src/classes/ScreenLayer.md).[`_container`](../../../canvas/src/classes/ScreenLayer.md#_container)

***

### ctx?

> `protected` `optional` **ctx?**: [`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

Defined in: [canvas/src/layers/Layer.ts:108](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L108)

Set by `mount(ctx)`; cleared by `unmount()`.

#### Inherited from

[`ScreenLayer`](../../../canvas/src/classes/ScreenLayer.md).[`ctx`](../../../canvas/src/classes/ScreenLayer.md#ctx)

***

### cullable

> **cullable**: `boolean`

Defined in: [canvas/src/layers/Layer.ts:91](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L91)

#### Inherited from

[`ScreenLayer`](../../../canvas/src/classes/ScreenLayer.md).[`cullable`](../../../canvas/src/classes/ScreenLayer.md#cullable)

***

### dirty

> `readonly` **dirty**: [`DirtyBatcher`](../../../canvas/src/classes/DirtyBatcher.md)\<`never`\>

Defined in: [canvas/src/layers/Layer.ts:85](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L85)

#### Inherited from

[`ScreenLayer`](../../../canvas/src/classes/ScreenLayer.md).[`dirty`](../../../canvas/src/classes/ScreenLayer.md#dirty)

***

### events

> `readonly` **events**: [`SourceEmitter`](../../../canvas/src/classes/SourceEmitter.md)\<`Record`\<`string`, `never`\>\>

Defined in: [canvas/src/layers/Layer.ts:84](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L84)

#### Inherited from

[`ScreenLayer`](../../../canvas/src/classes/ScreenLayer.md).[`events`](../../../canvas/src/classes/ScreenLayer.md#events)

***

### hittable

> **hittable**: `boolean`

Defined in: [canvas/src/layers/Layer.ts:89](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L89)

#### Inherited from

[`ScreenLayer`](../../../canvas/src/classes/ScreenLayer.md).[`hittable`](../../../canvas/src/classes/ScreenLayer.md#hittable)

***

### id

> `readonly` **id**: `string`

Defined in: [canvas/src/layers/Layer.ts:81](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L81)

#### Inherited from

[`ScreenLayer`](../../../canvas/src/classes/ScreenLayer.md).[`id`](../../../canvas/src/classes/ScreenLayer.md#id)

***

### options

> `readonly` **options**: [`MiniMapLayerOptions`](../interfaces/MiniMapLayerOptions.md)

Defined in: [canvas/src/layers/Layer.ts:82](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L82)

#### Inherited from

[`ScreenLayer`](../../../canvas/src/classes/ScreenLayer.md).[`options`](../../../canvas/src/classes/ScreenLayer.md#options)

***

### state

> `readonly` **state**: [`Store`](../../../canvas/src/type-aliases/Store.md)\<`MiniMapState`\>

Defined in: [canvas/src/layers/Layer.ts:83](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L83)

#### Inherited from

[`ScreenLayer`](../../../canvas/src/classes/ScreenLayer.md).[`state`](../../../canvas/src/classes/ScreenLayer.md#state)

***

### zIndex

> **zIndex**: `number`

Defined in: [canvas/src/layers/Layer.ts:90](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L90)

#### Inherited from

[`ScreenLayer`](../../../canvas/src/classes/ScreenLayer.md).[`zIndex`](../../../canvas/src/classes/ScreenLayer.md#zindex)

## Accessors

### container

#### Get Signature

> **get** `protected` **container**(): `Container`

Defined in: [canvas/src/layers/ScreenLayer.ts:45](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/ScreenLayer.ts#L45)

Root pixi `Container` for this screen-space layer. Available from
`onMount(ctx)` for the layer's lifetime. Throws before mount / after unmount.

Subclass-only — not part of the external layer API.

##### Returns

`Container`

#### Inherited from

[`ScreenLayer`](../../../canvas/src/classes/ScreenLayer.md).[`container`](../../../canvas/src/classes/ScreenLayer.md#container)

***

### context

#### Get Signature

> **get** `protected` **context**(): [`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

Defined in: [canvas/src/layers/Layer.ts:156](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L156)

Convenience accessor; throws when called pre-mount.

##### Returns

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Inherited from

[`ScreenLayer`](../../../canvas/src/classes/ScreenLayer.md).[`context`](../../../canvas/src/classes/ScreenLayer.md#context)

***

### mounted

#### Get Signature

> **get** **mounted**(): `boolean`

Defined in: [canvas/src/layers/Layer.ts:111](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L111)

True between `mount` and `unmount`.

##### Returns

`boolean`

#### Inherited from

[`ScreenLayer`](../../../canvas/src/classes/ScreenLayer.md).[`mounted`](../../../canvas/src/classes/ScreenLayer.md#mounted)

***

### visible

#### Get Signature

> **get** **visible**(): `boolean`

Defined in: [canvas/src/layers/Layer.ts:98](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L98)

Whether this layer renders. Setting `false` hides the layer's pixi
container (via `onVisibleChange`, overridden by `WorldLayer` /
`ScreenLayer`) and the Canvas tick skips its flush.

##### Returns

`boolean`

#### Set Signature

> **set** **visible**(`value`): `void`

Defined in: [canvas/src/layers/Layer.ts:101](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L101)

##### Parameters

###### value

`boolean`

##### Returns

`void`

#### Inherited from

[`ScreenLayer`](../../../canvas/src/classes/ScreenLayer.md).[`visible`](../../../canvas/src/classes/ScreenLayer.md#visible)

## Methods

### applyDirty()

> `protected` **applyDirty**(`_snap`): `void`

Defined in: [canvas/src/layers/Layer.ts:189](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L189)

Translate a dirty snapshot into renderer / pixi commands.
Default: no-op. Override when the layer batches work via `dirty.mark(...)`.

#### Parameters

##### \_snap

[`DirtySnapshot`](../../../canvas/src/interfaces/DirtySnapshot.md)\<`never`\>

#### Returns

`void`

#### Inherited from

[`ScreenLayer`](../../../canvas/src/classes/ScreenLayer.md).[`applyDirty`](../../../canvas/src/classes/ScreenLayer.md#applydirty)

***

### createContainer()

> **createContainer**(`label?`): `Container`

Defined in: [canvas/src/layers/ScreenLayer.ts:99](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/ScreenLayer.ts#L99)

Create a plain pixi `Container` attached to this layer's root container.
Useful as a parent for mounted display objects.

#### Parameters

##### label?

`string`

#### Returns

`Container`

#### Inherited from

[`ScreenLayer`](../../../canvas/src/classes/ScreenLayer.md).[`createContainer`](../../../canvas/src/classes/ScreenLayer.md#createcontainer)

***

### createGraphics()

> **createGraphics**(`label?`): `Graphics`

Defined in: [canvas/src/layers/ScreenLayer.ts:88](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/ScreenLayer.ts#L88)

Create a pixi `Graphics` attached to this layer's root container. The
sanctioned way for layer authors to obtain a `Graphics` for direct
painting via `@invana/canvas/draw` primitives.

#### Parameters

##### label?

`string`

#### Returns

`Graphics`

#### Inherited from

[`ScreenLayer`](../../../canvas/src/classes/ScreenLayer.md).[`createGraphics`](../../../canvas/src/classes/ScreenLayer.md#creategraphics)

***

### createState()

> `protected` **createState**(): `MiniMapState`

Defined in: [graph/src/layer/MiniMapLayer.ts:145](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/MiniMapLayer.ts#L145)

Build the initial UI / interaction state. Called once in the constructor.

#### Returns

`MiniMapState`

#### Overrides

[`ScreenLayer`](../../../canvas/src/classes/ScreenLayer.md).[`createState`](../../../canvas/src/classes/ScreenLayer.md#createstate)

***

### flush()

> **flush**(): `void`

Defined in: [canvas/src/layers/Layer.ts:174](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L174)

Called by Canvas tick when `hasPending()` is true. Swaps the dirty
snapshot, hands it to `applyDirty`. Subclasses normally don't override.

#### Returns

`void`

#### Inherited from

[`ScreenLayer`](../../../canvas/src/classes/ScreenLayer.md).[`flush`](../../../canvas/src/classes/ScreenLayer.md#flush)

***

### hasPending()

> **hasPending**(): `boolean`

Defined in: [canvas/src/layers/Layer.ts:166](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L166)

Whether `flush()` has work to do this frame.

#### Returns

`boolean`

#### Inherited from

[`ScreenLayer`](../../../canvas/src/classes/ScreenLayer.md).[`hasPending`](../../../canvas/src/classes/ScreenLayer.md#haspending)

***

### hitTest()

> **hitTest**(): [`ScreenLayerHit`](../../../canvas/src/interfaces/ScreenLayerHit.md)

Defined in: [graph/src/layer/MiniMapLayer.ts:217](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/MiniMapLayer.ts#L217)

Hit-test in screen / viewport coordinates. Top-most hit or `null`.

#### Returns

[`ScreenLayerHit`](../../../canvas/src/interfaces/ScreenLayerHit.md)

#### Overrides

[`ScreenLayer`](../../../canvas/src/classes/ScreenLayer.md).[`hitTest`](../../../canvas/src/classes/ScreenLayer.md#hittest)

***

### mount()

> **mount**(`ctx`): `void`

Defined in: [canvas/src/layers/ScreenLayer.ts:56](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/ScreenLayer.ts#L56)

#### Parameters

##### ctx

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Returns

`void`

#### Inherited from

[`ScreenLayer`](../../../canvas/src/classes/ScreenLayer.md).[`mount`](../../../canvas/src/classes/ScreenLayer.md#mount)

***

### onMount()

> `protected` **onMount**(`ctx`): `void`

Defined in: [graph/src/layer/MiniMapLayer.ts:149](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/MiniMapLayer.ts#L149)

Domain-specific mount setup (subscribe to peers, attach renderer, etc.).

#### Parameters

##### ctx

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Returns

`void`

#### Overrides

[`ScreenLayer`](../../../canvas/src/classes/ScreenLayer.md).[`onMount`](../../../canvas/src/classes/ScreenLayer.md#onmount)

***

### onUnmount()

> `protected` **onUnmount**(): `void`

Defined in: [graph/src/layer/MiniMapLayer.ts:199](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/MiniMapLayer.ts#L199)

Domain-specific unmount teardown.

#### Returns

`void`

#### Overrides

[`ScreenLayer`](../../../canvas/src/classes/ScreenLayer.md).[`onUnmount`](../../../canvas/src/classes/ScreenLayer.md#onunmount)

***

### onVisibleChange()

> `protected` **onVisibleChange**(`value`): `void`

Defined in: [canvas/src/layers/ScreenLayer.ts:72](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/ScreenLayer.ts#L72)

Keep the pixi container in sync when `layer.visible` is toggled.

#### Parameters

##### value

`boolean`

#### Returns

`void`

#### Inherited from

[`ScreenLayer`](../../../canvas/src/classes/ScreenLayer.md).[`onVisibleChange`](../../../canvas/src/classes/ScreenLayer.md#onvisiblechange)

***

### refresh()

> **refresh**(): `void`

Defined in: [graph/src/layer/MiniMapLayer.ts:224](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/MiniMapLayer.ts#L224)

Force a re-paint. Cheap — call after mutating colours / sizes externally.

#### Returns

`void`

***

### setOptions()

> **setOptions**(`patch`): `void`

Defined in: [graph/src/layer/MiniMapLayer.ts:228](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/MiniMapLayer.ts#L228)

#### Parameters

##### patch

`Partial`\<`Omit`\<[`MiniMapLayerOptions`](../interfaces/MiniMapLayerOptions.md), `"graphLayerId"`\>\>

#### Returns

`void`

***

### setZIndex()

> **setZIndex**(`z`): `void`

Defined in: [canvas/src/layers/ScreenLayer.ts:111](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/ScreenLayer.ts#L111)

Update this layer's z-order relative to its peers. Keeps the iteration
field (`this.zIndex`) and the pixi container's `zIndex` in sync, and
flips `ctx.stage` into sorted mode so the change renders.

#### Parameters

##### z

`number`

#### Returns

`void`

#### Inherited from

[`ScreenLayer`](../../../canvas/src/classes/ScreenLayer.md).[`setZIndex`](../../../canvas/src/classes/ScreenLayer.md#setzindex)

***

### unmount()

> **unmount**(): `void`

Defined in: [canvas/src/layers/ScreenLayer.ts:76](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/ScreenLayer.ts#L76)

#### Returns

`void`

#### Inherited from

[`ScreenLayer`](../../../canvas/src/classes/ScreenLayer.md).[`unmount`](../../../canvas/src/classes/ScreenLayer.md#unmount)
