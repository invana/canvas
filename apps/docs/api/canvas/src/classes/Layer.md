# Abstract Class: Layer\<TOptions, TState, TEvents, TDirtyBucket\>

Defined in: [packages/canvas/src/layers/Layer.ts:74](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L74)

The subset of `Layer` the `LayerRegistry` and `Canvas.tick` interact with.
Lets the registry stay decoupled from the abstract class implementation.

## Extended by

- [`WorldLayer`](WorldLayer.md)
- [`ScreenLayer`](ScreenLayer.md)

## Type Parameters

### TOptions

`TOptions` = `unknown`

### TState

`TState` *extends* `object` = `object`

### TEvents

`TEvents` *extends* [`EventMap`](../type-aliases/EventMap.md) = [`EventMap`](../type-aliases/EventMap.md)

### TDirtyBucket

`TDirtyBucket` *extends* `string` = `string`

## Implements

- [`ILayer`](../interfaces/ILayer.md)

## Constructors

### Constructor

> **new Layer**\<`TOptions`, `TState`, `TEvents`, `TDirtyBucket`\>(`opts`): `Layer`\<`TOptions`, `TState`, `TEvents`, `TDirtyBucket`\>

Defined in: [packages/canvas/src/layers/Layer.ts:100](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L100)

#### Parameters

##### opts

[`LayerOptions`](../interfaces/LayerOptions.md)\<`TOptions`\>

#### Returns

`Layer`\<`TOptions`, `TState`, `TEvents`, `TDirtyBucket`\>

## Properties

### ctx?

> `protected` `optional` **ctx?**: [`CanvasContext`](../interfaces/CanvasContext.md)

Defined in: [packages/canvas/src/layers/Layer.ts:93](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L93)

Set by `mount(ctx)`; cleared by `unmount()`.

***

### cullable

> **cullable**: `boolean`

Defined in: [packages/canvas/src/layers/Layer.ts:90](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L90)

#### Implementation of

[`ILayer`](../interfaces/ILayer.md).[`cullable`](../interfaces/ILayer.md#cullable)

***

### dirty

> `readonly` **dirty**: [`DirtyBatcher`](DirtyBatcher.md)\<`TDirtyBucket`\>

Defined in: [packages/canvas/src/layers/Layer.ts:85](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L85)

***

### events

> `readonly` **events**: [`SourceEmitter`](SourceEmitter.md)\<`TEvents`\>

Defined in: [packages/canvas/src/layers/Layer.ts:84](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L84)

***

### hittable

> **hittable**: `boolean`

Defined in: [packages/canvas/src/layers/Layer.ts:88](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L88)

#### Implementation of

[`ILayer`](../interfaces/ILayer.md).[`hittable`](../interfaces/ILayer.md#hittable)

***

### id

> `readonly` **id**: `string`

Defined in: [packages/canvas/src/layers/Layer.ts:81](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L81)

#### Implementation of

[`ILayer`](../interfaces/ILayer.md).[`id`](../interfaces/ILayer.md#id)

***

### options

> `readonly` **options**: `TOptions`

Defined in: [packages/canvas/src/layers/Layer.ts:82](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L82)

***

### state

> `readonly` **state**: [`Store`](../type-aliases/Store.md)\<`TState`\>

Defined in: [packages/canvas/src/layers/Layer.ts:83](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L83)

***

### visible

> **visible**: `boolean`

Defined in: [packages/canvas/src/layers/Layer.ts:87](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L87)

#### Implementation of

[`ILayer`](../interfaces/ILayer.md).[`visible`](../interfaces/ILayer.md#visible)

***

### zIndex

> **zIndex**: `number`

Defined in: [packages/canvas/src/layers/Layer.ts:89](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L89)

#### Implementation of

[`ILayer`](../interfaces/ILayer.md).[`zIndex`](../interfaces/ILayer.md#zindex)

## Accessors

### context

#### Get Signature

> **get** `protected` **context**(): [`CanvasContext`](../interfaces/CanvasContext.md)

Defined in: [packages/canvas/src/layers/Layer.ts:141](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L141)

Convenience accessor; throws when called pre-mount.

##### Returns

[`CanvasContext`](../interfaces/CanvasContext.md)

***

### mounted

#### Get Signature

> **get** **mounted**(): `boolean`

Defined in: [packages/canvas/src/layers/Layer.ts:96](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L96)

True between `mount` and `unmount`.

##### Returns

`boolean`

## Methods

### applyDirty()

> `protected` **applyDirty**(`_snap`): `void`

Defined in: [packages/canvas/src/layers/Layer.ts:174](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L174)

Translate a dirty snapshot into renderer / pixi commands.
Default: no-op. Override when the layer batches work via `dirty.mark(...)`.

#### Parameters

##### \_snap

[`DirtySnapshot`](../interfaces/DirtySnapshot.md)\<`TDirtyBucket`\>

#### Returns

`void`

***

### createState()

> `abstract` `protected` **createState**(): `TState`

Defined in: [packages/canvas/src/layers/Layer.ts:168](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L168)

Build the initial UI / interaction state. Called once in the constructor.

#### Returns

`TState`

***

### flush()

> **flush**(): `void`

Defined in: [packages/canvas/src/layers/Layer.ts:159](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L159)

Called by Canvas tick when `hasPending()` is true. Swaps the dirty
snapshot, hands it to `applyDirty`. Subclasses normally don't override.

#### Returns

`void`

#### Implementation of

[`ILayer`](../interfaces/ILayer.md).[`flush`](../interfaces/ILayer.md#flush)

***

### hasPending()

> **hasPending**(): `boolean`

Defined in: [packages/canvas/src/layers/Layer.ts:151](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L151)

Whether `flush()` has work to do this frame.

#### Returns

`boolean`

#### Implementation of

[`ILayer`](../interfaces/ILayer.md).[`hasPending`](../interfaces/ILayer.md#haspending)

***

### mount()

> **mount**(`ctx`): `void`

Defined in: [packages/canvas/src/layers/Layer.ts:122](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L122)

#### Parameters

##### ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

#### Implementation of

[`ILayer`](../interfaces/ILayer.md).[`mount`](../interfaces/ILayer.md#mount)

***

### onMount()

> `protected` **onMount**(`_ctx`): `void`

Defined in: [packages/canvas/src/layers/Layer.ts:179](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L179)

Domain-specific mount setup (subscribe to peers, attach renderer, etc.).

#### Parameters

##### \_ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

***

### onUnmount()

> `protected` **onUnmount**(`_ctx`): `void`

Defined in: [packages/canvas/src/layers/Layer.ts:184](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L184)

Domain-specific unmount teardown.

#### Parameters

##### \_ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

***

### unmount()

> **unmount**(): `void`

Defined in: [packages/canvas/src/layers/Layer.ts:131](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L131)

#### Returns

`void`

#### Implementation of

[`ILayer`](../interfaces/ILayer.md).[`unmount`](../interfaces/ILayer.md#unmount)
