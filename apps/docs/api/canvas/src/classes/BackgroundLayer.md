# Class: BackgroundLayer

Defined in: [canvas/src/layers/BackgroundLayer.ts:128](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/BackgroundLayer.ts#L128)

The subset of `Layer` the `LayerRegistry` and `Canvas.tick` interact with.
Lets the registry stay decoupled from the abstract class implementation.

## Extends

- [`ScreenLayer`](ScreenLayer.md)\<[`BackgroundLayerOptions`](../interfaces/BackgroundLayerOptions.md), `BackgroundLayerState`, `Record`\<`string`, `never`\>, `never`, [`ScreenLayerHit`](../interfaces/ScreenLayerHit.md)\>

## Constructors

### Constructor

> **new BackgroundLayer**(`opts`): `BackgroundLayer`

Defined in: [canvas/src/layers/BackgroundLayer.ts:150](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/BackgroundLayer.ts#L150)

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

> `readonly` **dirty**: [`DirtyBatcher`](DirtyBatcher.md)\<`never`\>

Defined in: [canvas/src/layers/Layer.ts:88](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L88)

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`dirty`](ScreenLayer.md#dirty)

***

### events

> `readonly` **events**: [`SourceEmitter`](SourceEmitter.md)\<`Record`\<`string`, `never`\>\>

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

> `readonly` **options**: [`BackgroundLayerOptions`](../interfaces/BackgroundLayerOptions.md)

Defined in: [canvas/src/layers/Layer.ts:85](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L85)

#### Inherited from

[`ScreenLayer`](ScreenLayer.md).[`options`](ScreenLayer.md#options)

***

### state

> `readonly` **state**: [`Store`](../type-aliases/Store.md)\<`BackgroundLayerState`\>

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

[`DirtySnapshot`](../interfaces/DirtySnapshot.md)\<`never`\>

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

> `protected` **createState**(): `BackgroundLayerState`

Defined in: [canvas/src/layers/BackgroundLayer.ts:163](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/BackgroundLayer.ts#L163)

Build the initial UI / interaction state. Called once in the constructor.

#### Returns

`BackgroundLayerState`

#### Overrides

[`ScreenLayer`](ScreenLayer.md).[`createState`](ScreenLayer.md#createstate)

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

### getMode()

> **getMode**(): [`BackgroundMode`](../type-aliases/BackgroundMode.md)

Defined in: [canvas/src/layers/BackgroundLayer.ts:252](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/BackgroundLayer.ts#L252)

Current mode setting.

#### Returns

[`BackgroundMode`](../type-aliases/BackgroundMode.md)

***

### getOptions()

> **getOptions**(): `Required`\<[`BackgroundLayerOptions`](../interfaces/BackgroundLayerOptions.md)\>

Defined in: [canvas/src/layers/BackgroundLayer.ts:237](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/BackgroundLayer.ts#L237)

Snapshot of the resolved options.

#### Returns

`Required`\<[`BackgroundLayerOptions`](../interfaces/BackgroundLayerOptions.md)\>

***

### getResolvedBackgroundColor()

> **getResolvedBackgroundColor**(): `string` \| `number`

Defined in: [canvas/src/layers/BackgroundLayer.ts:274](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/BackgroundLayer.ts#L274)

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

Defined in: [canvas/src/layers/BackgroundLayer.ts:261](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/BackgroundLayer.ts#L261)

Concrete kind currently being rendered. A pinned `mode` wins; otherwise
`'auto'` follows the active theme on `ctx.theme` (defaulting to `'light'`
when no theme has been published yet).

#### Returns

[`BackgroundKind`](../type-aliases/BackgroundKind.md)

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

> **hitTest**(): [`ScreenLayerHit`](../interfaces/ScreenLayerHit.md)

Defined in: [canvas/src/layers/BackgroundLayer.ts:224](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/BackgroundLayer.ts#L224)

Hit tests on the background always miss — clicks fall through to the
world layer beneath, which is what users expect for a bg.

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

> `protected` **onMount**(`ctx`): `void`

Defined in: [canvas/src/layers/BackgroundLayer.ts:167](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/BackgroundLayer.ts#L167)

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

Defined in: [canvas/src/layers/BackgroundLayer.ts:206](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/BackgroundLayer.ts#L206)

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

### setMode()

> **setMode**(`mode`): `void`

Defined in: [canvas/src/layers/BackgroundLayer.ts:245](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/BackgroundLayer.ts#L245)

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

Defined in: [canvas/src/layers/BackgroundLayer.ts:231](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/BackgroundLayer.ts#L231)

Merge-update options + re-render.

#### Parameters

##### changes

`Partial`\<[`BackgroundLayerOptions`](../interfaces/BackgroundLayerOptions.md)\>

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
