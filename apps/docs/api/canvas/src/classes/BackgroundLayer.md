# Class: BackgroundLayer

Defined in: [canvas/src/layers/BackgroundLayer.ts:111](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/BackgroundLayer.ts#L111)

The subset of `Layer` the `LayerRegistry` and `Canvas.tick` interact with.
Lets the registry stay decoupled from the abstract class implementation.

## Extends

- [`ScreenLayer`](ScreenLayer.md)\<[`BackgroundLayerOptions`](../interfaces/BackgroundLayerOptions.md), `BackgroundLayerState`, `Record`\<`string`, `never`\>, `never`, [`ScreenLayerHit`](../interfaces/ScreenLayerHit.md)\>

## Extended by

- [`ThemedBackgroundLayer`](ThemedBackgroundLayer.md)

## Constructors

### Constructor

> **new BackgroundLayer**(`opts`): `BackgroundLayer`

Defined in: [canvas/src/layers/BackgroundLayer.ts:134](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/BackgroundLayer.ts#L134)

#### Parameters

##### opts

[`LayerOptions`](../interfaces/LayerOptions.md)\<[`BackgroundLayerOptions`](../interfaces/BackgroundLayerOptions.md)\>

#### Returns

`BackgroundLayer`

#### Overrides

[`ScreenLayer`](ScreenLayer.md).[`constructor`](ScreenLayer.md#constructor)

## Properties

### \_container?

> `protected` `optional` **\_container?**: `Container`

Defined in: [canvas/src/layers/ScreenLayer.ts:37](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/ScreenLayer.ts#L37)

Backing field — assigned in `mount`, cleared in `unmount`.

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`_container`](ScreenLayer.md#_container)

***

### ctx?

> `protected` `optional` **ctx?**: [`CanvasContext`](../interfaces/CanvasContext.md)

Defined in: [canvas/src/layers/Layer.ts:108](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L108)

Set by `mount(ctx)`; cleared by `unmount()`.

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`ctx`](ScreenLayer.md#ctx)

***

### cullable

> **cullable**: `boolean`

Defined in: [canvas/src/layers/Layer.ts:91](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L91)

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`cullable`](ScreenLayer.md#cullable)

***

### dirty

> `readonly` **dirty**: [`DirtyBatcher`](DirtyBatcher.md)\<`never`\>

Defined in: [canvas/src/layers/Layer.ts:85](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L85)

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`dirty`](ScreenLayer.md#dirty)

***

### events

> `readonly` **events**: [`SourceEmitter`](SourceEmitter.md)\<`Record`\<`string`, `never`\>\>

Defined in: [canvas/src/layers/Layer.ts:84](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L84)

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`events`](ScreenLayer.md#events)

***

### hittable

> **hittable**: `boolean`

Defined in: [canvas/src/layers/Layer.ts:89](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L89)

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`hittable`](ScreenLayer.md#hittable)

***

### id

> `readonly` **id**: `string`

Defined in: [canvas/src/layers/Layer.ts:81](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L81)

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`id`](ScreenLayer.md#id)

***

### options

> `readonly` **options**: [`BackgroundLayerOptions`](../interfaces/BackgroundLayerOptions.md)

Defined in: [canvas/src/layers/Layer.ts:82](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L82)

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`options`](ScreenLayer.md#options)

***

### state

> `readonly` **state**: [`Store`](../type-aliases/Store.md)\<`BackgroundLayerState`\>

Defined in: [canvas/src/layers/Layer.ts:83](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L83)

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`state`](ScreenLayer.md#state)

***

### zIndex

> **zIndex**: `number`

Defined in: [canvas/src/layers/Layer.ts:90](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L90)

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`zIndex`](ScreenLayer.md#zindex)

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

[`ScreenLayer`](ScreenLayer.md).[`container`](ScreenLayer.md#container)

***

### context

#### Get Signature

> **get** `protected` **context**(): [`CanvasContext`](../interfaces/CanvasContext.md)

Defined in: [canvas/src/layers/Layer.ts:156](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L156)

Convenience accessor; throws when called pre-mount.

##### Returns

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`context`](ScreenLayer.md#context)

***

### mounted

#### Get Signature

> **get** **mounted**(): `boolean`

Defined in: [canvas/src/layers/Layer.ts:111](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L111)

True between `mount` and `unmount`.

##### Returns

`boolean`

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`mounted`](ScreenLayer.md#mounted)

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

[`ScreenLayer`](ScreenLayer.md).[`visible`](ScreenLayer.md#visible)

## Methods

### applyDirty()

> `protected` **applyDirty**(`_snap`): `void`

Defined in: [canvas/src/layers/Layer.ts:189](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L189)

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

[`ScreenLayer`](ScreenLayer.md).[`createContainer`](ScreenLayer.md#createcontainer)

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

[`ScreenLayer`](ScreenLayer.md).[`createGraphics`](ScreenLayer.md#creategraphics)

***

### createState()

> `protected` **createState**(): `BackgroundLayerState`

Defined in: [canvas/src/layers/BackgroundLayer.ts:147](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/BackgroundLayer.ts#L147)

Build the initial UI / interaction state. Called once in the constructor.

#### Returns

`BackgroundLayerState`

#### Overrides

[`ScreenLayer`](ScreenLayer.md).[`createState`](ScreenLayer.md#createstate)

***

### flush()

> **flush**(): `void`

Defined in: [canvas/src/layers/Layer.ts:174](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L174)

Called by Canvas tick when `hasPending()` is true. Swaps the dirty
snapshot, hands it to `applyDirty`. Subclasses normally don't override.

#### Returns

`void`

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`flush`](ScreenLayer.md#flush)

***

### getMode()

> **getMode**(): `BackgroundMode`

Defined in: [canvas/src/layers/BackgroundLayer.ts:232](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/BackgroundLayer.ts#L232)

Current mode setting.

#### Returns

`BackgroundMode`

***

### getOptions()

> **getOptions**(): `Required`\<[`BackgroundLayerOptions`](../interfaces/BackgroundLayerOptions.md)\>

Defined in: [canvas/src/layers/BackgroundLayer.ts:214](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/BackgroundLayer.ts#L214)

Snapshot of the resolved options.

#### Returns

`Required`\<[`BackgroundLayerOptions`](../interfaces/BackgroundLayerOptions.md)\>

***

### getResolvedKind()

> **getResolvedKind**(): `BackgroundKind`

Defined in: [canvas/src/layers/BackgroundLayer.ts:237](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/BackgroundLayer.ts#L237)

Concrete kind currently being rendered after mode resolution.

#### Returns

`BackgroundKind`

***

### hasPending()

> **hasPending**(): `boolean`

Defined in: [canvas/src/layers/Layer.ts:166](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L166)

Whether `flush()` has work to do this frame.

#### Returns

`boolean`

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`hasPending`](ScreenLayer.md#haspending)

***

### hitTest()

> **hitTest**(): [`ScreenLayerHit`](../interfaces/ScreenLayerHit.md)

Defined in: [canvas/src/layers/BackgroundLayer.ts:198](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/BackgroundLayer.ts#L198)

Hit tests on the background always miss — clicks fall through to the
world layer beneath, which is what users expect for a bg.

#### Returns

[`ScreenLayerHit`](../interfaces/ScreenLayerHit.md)

#### Overrides

[`ScreenLayer`](ScreenLayer.md).[`hitTest`](ScreenLayer.md#hittest)

***

### mount()

> **mount**(`ctx`): `void`

Defined in: [canvas/src/layers/ScreenLayer.ts:56](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/ScreenLayer.ts#L56)

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

Defined in: [canvas/src/layers/BackgroundLayer.ts:151](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/BackgroundLayer.ts#L151)

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

Defined in: [canvas/src/layers/BackgroundLayer.ts:181](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/BackgroundLayer.ts#L181)

Domain-specific unmount teardown.

#### Returns

`void`

#### Overrides

[`ScreenLayer`](ScreenLayer.md).[`onUnmount`](ScreenLayer.md#onunmount)

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

[`ScreenLayer`](ScreenLayer.md).[`onVisibleChange`](ScreenLayer.md#onvisiblechange)

***

### setMode()

> **setMode**(`mode`): `void`

Defined in: [canvas/src/layers/BackgroundLayer.ts:222](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/BackgroundLayer.ts#L222)

Set the colour-resolution mode. `'auto'` re-arms the system listener;
`'light'` / `'dark'` pin explicitly. No-op when mode is unchanged.

#### Parameters

##### mode

`BackgroundMode`

#### Returns

`void`

***

### setOptions()

> **setOptions**(`changes`): `void`

Defined in: [canvas/src/layers/BackgroundLayer.ts:205](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/BackgroundLayer.ts#L205)

Merge-update options + re-render.

#### Parameters

##### changes

`Partial`\<[`BackgroundLayerOptions`](../interfaces/BackgroundLayerOptions.md)\>

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

[`ScreenLayer`](ScreenLayer.md).[`setZIndex`](ScreenLayer.md#setzindex)

***

### unmount()

> **unmount**(): `void`

Defined in: [canvas/src/layers/ScreenLayer.ts:76](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/ScreenLayer.ts#L76)

#### Returns

`void`

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`unmount`](ScreenLayer.md#unmount)
