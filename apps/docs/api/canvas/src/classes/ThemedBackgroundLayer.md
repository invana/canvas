# Class: ThemedBackgroundLayer

Defined in: [canvas/src/layers/ThemedBackgroundLayer.ts:85](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/ThemedBackgroundLayer.ts#L85)

The subset of `Layer` the `LayerRegistry` and `Canvas.tick` interact with.
Lets the registry stay decoupled from the abstract class implementation.

## Extends

- [`BackgroundLayer`](BackgroundLayer.md)

## Constructors

### Constructor

> **new ThemedBackgroundLayer**(`opts`): `ThemedBackgroundLayer`

Defined in: [canvas/src/layers/ThemedBackgroundLayer.ts:99](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/ThemedBackgroundLayer.ts#L99)

#### Parameters

##### opts

[`LayerOptions`](../interfaces/LayerOptions.md)\<[`ThemedBackgroundLayerOptions`](../interfaces/ThemedBackgroundLayerOptions.md)\>

#### Returns

`ThemedBackgroundLayer`

#### Overrides

[`BackgroundLayer`](BackgroundLayer.md).[`constructor`](BackgroundLayer.md#constructor)

## Properties

### \_container?

> `protected` `optional` **\_container?**: `Container`

Defined in: [canvas/src/layers/ScreenLayer.ts:37](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/ScreenLayer.ts#L37)

Backing field — assigned in `mount`, cleared in `unmount`.

#### Inherited from

[`BackgroundLayer`](BackgroundLayer.md).[`_container`](BackgroundLayer.md#_container)

***

### ctx?

> `protected` `optional` **ctx?**: [`CanvasContext`](../interfaces/CanvasContext.md)

Defined in: [canvas/src/layers/Layer.ts:108](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/Layer.ts#L108)

Set by `mount(ctx)`; cleared by `unmount()`.

#### Inherited from

[`BackgroundLayer`](BackgroundLayer.md).[`ctx`](BackgroundLayer.md#ctx)

***

### cullable

> **cullable**: `boolean`

Defined in: [canvas/src/layers/Layer.ts:91](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/Layer.ts#L91)

#### Inherited from

[`BackgroundLayer`](BackgroundLayer.md).[`cullable`](BackgroundLayer.md#cullable)

***

### dirty

> `readonly` **dirty**: [`DirtyBatcher`](DirtyBatcher.md)\<`never`\>

Defined in: [canvas/src/layers/Layer.ts:85](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/Layer.ts#L85)

#### Inherited from

[`BackgroundLayer`](BackgroundLayer.md).[`dirty`](BackgroundLayer.md#dirty)

***

### events

> `readonly` **events**: [`EventEmitter`](EventEmitter.md)\<[`ThemedBackgroundLayerEvents`](../interfaces/ThemedBackgroundLayerEvents.md)\> & [`SourceEmitter`](SourceEmitter.md)\<`Record`\<`string`, `never`\>\>

Defined in: [canvas/src/layers/ThemedBackgroundLayer.ts:96](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/ThemedBackgroundLayer.ts#L96)

#### Overrides

[`BackgroundLayer`](BackgroundLayer.md).[`events`](BackgroundLayer.md#events)

***

### hittable

> **hittable**: `boolean`

Defined in: [canvas/src/layers/Layer.ts:89](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/Layer.ts#L89)

#### Inherited from

[`BackgroundLayer`](BackgroundLayer.md).[`hittable`](BackgroundLayer.md#hittable)

***

### id

> `readonly` **id**: `string`

Defined in: [canvas/src/layers/Layer.ts:81](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/Layer.ts#L81)

#### Inherited from

[`BackgroundLayer`](BackgroundLayer.md).[`id`](BackgroundLayer.md#id)

***

### options

> `readonly` **options**: [`BackgroundLayerOptions`](../interfaces/BackgroundLayerOptions.md)

Defined in: [canvas/src/layers/Layer.ts:82](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/Layer.ts#L82)

#### Inherited from

[`BackgroundLayer`](BackgroundLayer.md).[`options`](BackgroundLayer.md#options)

***

### state

> `readonly` **state**: [`Store`](../type-aliases/Store.md)\<`BackgroundLayerState`\>

Defined in: [canvas/src/layers/Layer.ts:83](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/Layer.ts#L83)

#### Inherited from

[`BackgroundLayer`](BackgroundLayer.md).[`state`](BackgroundLayer.md#state)

***

### zIndex

> **zIndex**: `number`

Defined in: [canvas/src/layers/Layer.ts:90](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/Layer.ts#L90)

#### Inherited from

[`BackgroundLayer`](BackgroundLayer.md).[`zIndex`](BackgroundLayer.md#zindex)

## Accessors

### container

#### Get Signature

> **get** `protected` **container**(): `Container`

Defined in: [canvas/src/layers/ScreenLayer.ts:45](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/ScreenLayer.ts#L45)

Root pixi `Container` for this screen-space layer. Available from
`onMount(ctx)` for the layer's lifetime. Throws before mount / after unmount.

Subclass-only — not part of the external layer API.

##### Returns

`Container`

#### Inherited from

[`BackgroundLayer`](BackgroundLayer.md).[`container`](BackgroundLayer.md#container)

***

### context

#### Get Signature

> **get** `protected` **context**(): [`CanvasContext`](../interfaces/CanvasContext.md)

Defined in: [canvas/src/layers/Layer.ts:156](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/Layer.ts#L156)

Convenience accessor; throws when called pre-mount.

##### Returns

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Inherited from

[`BackgroundLayer`](BackgroundLayer.md).[`context`](BackgroundLayer.md#context)

***

### mounted

#### Get Signature

> **get** **mounted**(): `boolean`

Defined in: [canvas/src/layers/Layer.ts:111](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/Layer.ts#L111)

True between `mount` and `unmount`.

##### Returns

`boolean`

#### Inherited from

[`BackgroundLayer`](BackgroundLayer.md).[`mounted`](BackgroundLayer.md#mounted)

***

### visible

#### Get Signature

> **get** **visible**(): `boolean`

Defined in: [canvas/src/layers/Layer.ts:98](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/Layer.ts#L98)

Whether this layer renders. Setting `false` hides the layer's pixi
container (via `onVisibleChange`, overridden by `WorldLayer` /
`ScreenLayer`) and the Canvas tick skips its flush.

##### Returns

`boolean`

#### Set Signature

> **set** **visible**(`value`): `void`

Defined in: [canvas/src/layers/Layer.ts:101](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/Layer.ts#L101)

##### Parameters

###### value

`boolean`

##### Returns

`void`

#### Inherited from

[`BackgroundLayer`](BackgroundLayer.md).[`visible`](BackgroundLayer.md#visible)

## Methods

### applyDirty()

> `protected` **applyDirty**(`_snap`): `void`

Defined in: [canvas/src/layers/Layer.ts:189](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/Layer.ts#L189)

Translate a dirty snapshot into renderer / pixi commands.
Default: no-op. Override when the layer batches work via `dirty.mark(...)`.

#### Parameters

##### \_snap

[`DirtySnapshot`](../interfaces/DirtySnapshot.md)\<`never`\>

#### Returns

`void`

#### Inherited from

[`BackgroundLayer`](BackgroundLayer.md).[`applyDirty`](BackgroundLayer.md#applydirty)

***

### createContainer()

> **createContainer**(`label?`): `Container`

Defined in: [canvas/src/layers/ScreenLayer.ts:99](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/ScreenLayer.ts#L99)

Create a plain pixi `Container` attached to this layer's root container.
Useful as a parent for mounted display objects.

#### Parameters

##### label?

`string`

#### Returns

`Container`

#### Inherited from

[`BackgroundLayer`](BackgroundLayer.md).[`createContainer`](BackgroundLayer.md#createcontainer)

***

### createGraphics()

> **createGraphics**(`label?`): `Graphics`

Defined in: [canvas/src/layers/ScreenLayer.ts:88](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/ScreenLayer.ts#L88)

Create a pixi `Graphics` attached to this layer's root container. The
sanctioned way for layer authors to obtain a `Graphics` for direct
painting via `@invana/canvas/draw` primitives.

#### Parameters

##### label?

`string`

#### Returns

`Graphics`

#### Inherited from

[`BackgroundLayer`](BackgroundLayer.md).[`createGraphics`](BackgroundLayer.md#creategraphics)

***

### createState()

> `protected` **createState**(): `ThemedBackgroundLayerState`

Defined in: [canvas/src/layers/ThemedBackgroundLayer.ts:143](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/ThemedBackgroundLayer.ts#L143)

Build the initial UI / interaction state. Called once in the constructor.

#### Returns

`ThemedBackgroundLayerState`

#### Overrides

[`BackgroundLayer`](BackgroundLayer.md).[`createState`](BackgroundLayer.md#createstate)

***

### flush()

> **flush**(): `void`

Defined in: [canvas/src/layers/Layer.ts:174](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/Layer.ts#L174)

Called by Canvas tick when `hasPending()` is true. Swaps the dirty
snapshot, hands it to `applyDirty`. Subclasses normally don't override.

#### Returns

`void`

#### Inherited from

[`BackgroundLayer`](BackgroundLayer.md).[`flush`](BackgroundLayer.md#flush)

***

### getActiveTheme()

> **getActiveTheme**(): [`ThemedBackgroundTheme`](../interfaces/ThemedBackgroundTheme.md)

Defined in: [canvas/src/layers/ThemedBackgroundLayer.ts:189](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/ThemedBackgroundLayer.ts#L189)

Currently active theme.

#### Returns

[`ThemedBackgroundTheme`](../interfaces/ThemedBackgroundTheme.md)

***

### getMode()

> **getMode**(): [`ThemedBackgroundMode`](../type-aliases/ThemedBackgroundMode.md)

Defined in: [canvas/src/layers/ThemedBackgroundLayer.ts:194](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/ThemedBackgroundLayer.ts#L194)

Current mode setting.

#### Returns

[`ThemedBackgroundMode`](../type-aliases/ThemedBackgroundMode.md)

#### Overrides

[`BackgroundLayer`](BackgroundLayer.md).[`getMode`](BackgroundLayer.md#getmode)

***

### getOptions()

> **getOptions**(): `Required`\<[`BackgroundLayerOptions`](../interfaces/BackgroundLayerOptions.md)\>

Defined in: [canvas/src/layers/BackgroundLayer.ts:214](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/BackgroundLayer.ts#L214)

Snapshot of the resolved options.

#### Returns

`Required`\<[`BackgroundLayerOptions`](../interfaces/BackgroundLayerOptions.md)\>

#### Inherited from

[`BackgroundLayer`](BackgroundLayer.md).[`getOptions`](BackgroundLayer.md#getoptions)

***

### getResolvedKind()

> **getResolvedKind**(): [`ThemedBackgroundKind`](../type-aliases/ThemedBackgroundKind.md)

Defined in: [canvas/src/layers/ThemedBackgroundLayer.ts:199](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/ThemedBackgroundLayer.ts#L199)

Concrete kind currently being rendered.

#### Returns

[`ThemedBackgroundKind`](../type-aliases/ThemedBackgroundKind.md)

#### Overrides

[`BackgroundLayer`](BackgroundLayer.md).[`getResolvedKind`](BackgroundLayer.md#getresolvedkind)

***

### getThemes()

> **getThemes**(): readonly [`ThemedBackgroundTheme`](../interfaces/ThemedBackgroundTheme.md)[]

Defined in: [canvas/src/layers/ThemedBackgroundLayer.ts:204](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/ThemedBackgroundLayer.ts#L204)

Snapshot of the configured themes.

#### Returns

readonly [`ThemedBackgroundTheme`](../interfaces/ThemedBackgroundTheme.md)[]

***

### hasPending()

> **hasPending**(): `boolean`

Defined in: [canvas/src/layers/Layer.ts:166](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/Layer.ts#L166)

Whether `flush()` has work to do this frame.

#### Returns

`boolean`

#### Inherited from

[`BackgroundLayer`](BackgroundLayer.md).[`hasPending`](BackgroundLayer.md#haspending)

***

### hitTest()

> **hitTest**(): [`ScreenLayerHit`](../interfaces/ScreenLayerHit.md)

Defined in: [canvas/src/layers/BackgroundLayer.ts:198](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/BackgroundLayer.ts#L198)

Hit tests on the background always miss — clicks fall through to the
world layer beneath, which is what users expect for a bg.

#### Returns

[`ScreenLayerHit`](../interfaces/ScreenLayerHit.md)

#### Inherited from

[`BackgroundLayer`](BackgroundLayer.md).[`hitTest`](BackgroundLayer.md#hittest)

***

### mount()

> **mount**(`ctx`): `void`

Defined in: [canvas/src/layers/ScreenLayer.ts:56](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/ScreenLayer.ts#L56)

#### Parameters

##### ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

#### Inherited from

[`BackgroundLayer`](BackgroundLayer.md).[`mount`](BackgroundLayer.md#mount)

***

### onMount()

> `protected` **onMount**(`ctx`): `void`

Defined in: [canvas/src/layers/ThemedBackgroundLayer.ts:147](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/ThemedBackgroundLayer.ts#L147)

Domain-specific mount setup (subscribe to peers, attach renderer, etc.).

#### Parameters

##### ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

#### Overrides

[`BackgroundLayer`](BackgroundLayer.md).[`onMount`](BackgroundLayer.md#onmount)

***

### onUnmount()

> `protected` **onUnmount**(): `void`

Defined in: [canvas/src/layers/ThemedBackgroundLayer.ts:153](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/ThemedBackgroundLayer.ts#L153)

Domain-specific unmount teardown.

#### Returns

`void`

#### Overrides

[`BackgroundLayer`](BackgroundLayer.md).[`onUnmount`](BackgroundLayer.md#onunmount)

***

### onVisibleChange()

> `protected` **onVisibleChange**(`value`): `void`

Defined in: [canvas/src/layers/ScreenLayer.ts:72](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/ScreenLayer.ts#L72)

Keep the pixi container in sync when `layer.visible` is toggled.

#### Parameters

##### value

`boolean`

#### Returns

`void`

#### Inherited from

[`BackgroundLayer`](BackgroundLayer.md).[`onVisibleChange`](BackgroundLayer.md#onvisiblechange)

***

### setMode()

> **setMode**(`mode`): `void`

Defined in: [canvas/src/layers/ThemedBackgroundLayer.ts:178](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/ThemedBackgroundLayer.ts#L178)

Set the mode. `'auto'` re-arms the system listener; `'light'` / `'dark'`
pin explicitly. Emits `'mode:updated'` when the mode actually changes.

#### Parameters

##### mode

[`ThemedBackgroundMode`](../type-aliases/ThemedBackgroundMode.md)

#### Returns

`void`

#### Overrides

[`BackgroundLayer`](BackgroundLayer.md).[`setMode`](BackgroundLayer.md#setmode)

***

### setOptions()

> **setOptions**(`changes`): `void`

Defined in: [canvas/src/layers/BackgroundLayer.ts:205](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/BackgroundLayer.ts#L205)

Merge-update options + re-render.

#### Parameters

##### changes

`Partial`\<[`BackgroundLayerOptions`](../interfaces/BackgroundLayerOptions.md)\>

#### Returns

`void`

#### Inherited from

[`BackgroundLayer`](BackgroundLayer.md).[`setOptions`](BackgroundLayer.md#setoptions)

***

### setTheme()

> **setTheme**(`id`): `void`

Defined in: [canvas/src/layers/ThemedBackgroundLayer.ts:164](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/ThemedBackgroundLayer.ts#L164)

Switch to a theme by id. Mode is preserved. Throws on unknown id.
Emits `'theme:switched'`.

#### Parameters

##### id

`string`

#### Returns

`void`

***

### setZIndex()

> **setZIndex**(`z`): `void`

Defined in: [canvas/src/layers/ScreenLayer.ts:111](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/ScreenLayer.ts#L111)

Update this layer's z-order relative to its peers. Keeps the iteration
field (`this.zIndex`) and the pixi container's `zIndex` in sync, and
flips `ctx.stage` into sorted mode so the change renders.

#### Parameters

##### z

`number`

#### Returns

`void`

#### Inherited from

[`BackgroundLayer`](BackgroundLayer.md).[`setZIndex`](BackgroundLayer.md#setzindex)

***

### unmount()

> **unmount**(): `void`

Defined in: [canvas/src/layers/ScreenLayer.ts:76](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layers/ScreenLayer.ts#L76)

#### Returns

`void`

#### Inherited from

[`BackgroundLayer`](BackgroundLayer.md).[`unmount`](BackgroundLayer.md#unmount)
