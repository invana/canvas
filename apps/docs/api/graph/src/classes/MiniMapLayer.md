# Class: MiniMapLayer

Defined in: [graph/src/layer/MiniMapLayer.ts:151](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/MiniMapLayer.ts#L151)

## Extends

- `ScreenLayer`\<[`MiniMapLayerOptions`](../interfaces/MiniMapLayerOptions.md), `MiniMapState`, `Record`\<`string`, `never`\>, `never`, `ScreenLayerHit`\>

## Constructors

### Constructor

> **new MiniMapLayer**(`opts`): `MiniMapLayer`

Defined in: [graph/src/layer/MiniMapLayer.ts:188](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/MiniMapLayer.ts#L188)

#### Parameters

##### opts

`LayerOptions`\<[`MiniMapLayerOptions`](../interfaces/MiniMapLayerOptions.md)\>

#### Returns

`MiniMapLayer`

#### Overrides

`ScreenLayer< MiniMapLayerOptions, MiniMapState, Record<string, never>, never, ScreenLayerHit >.constructor`

## Properties

### \_container?

> `protected` `optional` **\_container?**: `Container`

Defined in: canvas/dist/index.d.ts:1010

Backing field — assigned in `mount`, cleared in `unmount`.

#### Inherited from

`ScreenLayer._container`

***

### ctx?

> `protected` `optional` **ctx?**: `CanvasContext`

Defined in: canvas/dist/index.d.ts:572

Set by `mount(ctx)`; cleared by `unmount()`.

#### Inherited from

`ScreenLayer.ctx`

***

### cullable

> **cullable**: `boolean`

Defined in: canvas/dist/index.d.ts:563

#### Inherited from

`ScreenLayer.cullable`

***

### dirty

> `readonly` **dirty**: `DirtyBatcher`\<`never`\>

Defined in: canvas/dist/index.d.ts:558

#### Inherited from

`ScreenLayer.dirty`

***

### events

> `readonly` **events**: `SourceEmitter`\<`Record`\<`string`, `never`\>\>

Defined in: canvas/dist/index.d.ts:557

#### Inherited from

`ScreenLayer.events`

***

### hittable

> **hittable**: `boolean`

Defined in: canvas/dist/index.d.ts:561

#### Inherited from

`ScreenLayer.hittable`

***

### id

> `readonly` **id**: `string`

Defined in: canvas/dist/index.d.ts:554

#### Inherited from

`ScreenLayer.id`

***

### options

> `readonly` **options**: [`MiniMapLayerOptions`](../interfaces/MiniMapLayerOptions.md)

Defined in: canvas/dist/index.d.ts:555

#### Inherited from

`ScreenLayer.options`

***

### state

> `readonly` **state**: `Store`\<`MiniMapState`\>

Defined in: canvas/dist/index.d.ts:556

#### Inherited from

`ScreenLayer.state`

***

### zIndex

> **zIndex**: `number`

Defined in: canvas/dist/index.d.ts:562

#### Inherited from

`ScreenLayer.zIndex`

## Accessors

### container

#### Get Signature

> **get** `protected` **container**(): `Container`

Defined in: canvas/dist/index.d.ts:1017

Root pixi `Container` for this screen-space layer. Available from
`onMount(ctx)` for the layer's lifetime. Throws before mount / after unmount.

Subclass-only — not part of the external layer API.

##### Returns

`Container`

#### Inherited from

`ScreenLayer.container`

***

### context

#### Get Signature

> **get** `protected` **context**(): `CanvasContext`

Defined in: canvas/dist/index.d.ts:579

Convenience accessor; throws when called pre-mount.

##### Returns

`CanvasContext`

#### Inherited from

`ScreenLayer.context`

***

### mounted

#### Get Signature

> **get** **mounted**(): `boolean`

Defined in: canvas/dist/index.d.ts:574

True between `mount` and `unmount`.

##### Returns

`boolean`

#### Inherited from

`ScreenLayer.mounted`

***

### visible

#### Get Signature

> **get** **visible**(): `boolean`

Defined in: canvas/dist/index.d.ts:569

Whether this layer renders. Setting `false` hides the layer's pixi
container (via `onVisibleChange`, overridden by `WorldLayer` /
`ScreenLayer`) and the Canvas tick skips its flush.

##### Returns

`boolean`

#### Set Signature

> **set** **visible**(`value`): `void`

Defined in: canvas/dist/index.d.ts:570

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

Defined in: canvas/dist/index.d.ts:602

Translate a dirty snapshot into renderer / pixi commands.
Default: no-op. Override when the layer batches work via `dirty.mark(...)`.

#### Parameters

##### \_snap

`DirtySnapshot`\<`never`\>

#### Returns

`void`

#### Inherited from

`ScreenLayer.applyDirty`

***

### createContainer()

> **createContainer**(`label?`): `Container`

Defined in: canvas/dist/index.d.ts:1033

Create a plain pixi `Container` attached to this layer's root container.
Useful as a parent for mounted display objects.

#### Parameters

##### label?

`string`

#### Returns

`Container`

#### Inherited from

`ScreenLayer.createContainer`

***

### createGraphics()

> **createGraphics**(`label?`): `Graphics`

Defined in: canvas/dist/index.d.ts:1028

Create a pixi `Graphics` attached to this layer's root container. The
sanctioned way for layer authors to obtain a `Graphics` for direct
painting via `@invana/canvas/draw` primitives.

#### Parameters

##### label?

`string`

#### Returns

`Graphics`

#### Inherited from

`ScreenLayer.createGraphics`

***

### createState()

> `protected` **createState**(): `MiniMapState`

Defined in: [graph/src/layer/MiniMapLayer.ts:199](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/MiniMapLayer.ts#L199)

Build the initial UI / interaction state. Called once in the constructor.

#### Returns

`MiniMapState`

#### Overrides

`ScreenLayer.createState`

***

### flush()

> **flush**(): `void`

Defined in: canvas/dist/index.d.ts:586

Called by Canvas tick when `hasPending()` is true. Swaps the dirty
snapshot, hands it to `applyDirty`. Subclasses normally don't override.

#### Returns

`void`

#### Inherited from

`ScreenLayer.flush`

***

### getMode()

> **getMode**(): [`MiniMapMode`](../type-aliases/MiniMapMode.md)

Defined in: [graph/src/layer/MiniMapLayer.ts:319](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/MiniMapLayer.ts#L319)

Current mode setting.

#### Returns

[`MiniMapMode`](../type-aliases/MiniMapMode.md)

***

### getResolvedKind()

> **getResolvedKind**(): [`MiniMapKind`](../type-aliases/MiniMapKind.md)

Defined in: [graph/src/layer/MiniMapLayer.ts:328](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/MiniMapLayer.ts#L328)

Concrete kind currently resolved. A pinned `mode` wins; otherwise `'auto'`
follows the active theme on `ctx.theme` (defaulting to `'light'` before any
theme is published).

#### Returns

[`MiniMapKind`](../type-aliases/MiniMapKind.md)

***

### hasPending()

> **hasPending**(): `boolean`

Defined in: canvas/dist/index.d.ts:581

Whether `flush()` has work to do this frame.

#### Returns

`boolean`

#### Inherited from

`ScreenLayer.hasPending`

***

### hitTest()

> **hitTest**(): `ScreenLayerHit`

Defined in: [graph/src/layer/MiniMapLayer.ts:289](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/MiniMapLayer.ts#L289)

Hit-test in screen / viewport coordinates. Top-most hit or `null`.

#### Returns

`ScreenLayerHit`

#### Overrides

`ScreenLayer.hitTest`

***

### mount()

> **mount**(`ctx`): `void`

Defined in: canvas/dist/index.d.ts:1019

#### Parameters

##### ctx

`CanvasContext`

#### Returns

`void`

#### Inherited from

`ScreenLayer.mount`

***

### onMount()

> `protected` **onMount**(`ctx`): `void`

Defined in: [graph/src/layer/MiniMapLayer.ts:203](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/MiniMapLayer.ts#L203)

Domain-specific mount setup (subscribe to peers, attach renderer, etc.).

#### Parameters

##### ctx

`CanvasContext`

#### Returns

`void`

#### Overrides

`ScreenLayer.onMount`

***

### onUnmount()

> `protected` **onUnmount**(): `void`

Defined in: [graph/src/layer/MiniMapLayer.ts:269](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/MiniMapLayer.ts#L269)

Domain-specific unmount teardown.

#### Returns

`void`

#### Overrides

`ScreenLayer.onUnmount`

***

### onVisibleChange()

> `protected` **onVisibleChange**(`value`): `void`

Defined in: canvas/dist/index.d.ts:1021

Keep the pixi container in sync when `layer.visible` is toggled.

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

Defined in: canvas/dist/index.d.ts:595

Force a full repaint of this layer from its current state, bypassing the
per-frame dirty path. Base implementation is a no-op — only layers that
mount a renderer override it (e.g. `GraphLayer.redraw` re-renders every
node and edge). Driven by [Canvas.redraw](GraphCanvas.md#redraw); reach for it after an
external change that sidestepped the normal mutate-and-flush path (theme
swap, palette change) or to recover from a suspected render desync.

#### Returns

`void`

#### Inherited from

`ScreenLayer.redraw`

***

### refresh()

> **refresh**(): `void`

Defined in: [graph/src/layer/MiniMapLayer.ts:296](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/MiniMapLayer.ts#L296)

Force a re-paint. Cheap — call after mutating colours / sizes externally.

#### Returns

`void`

***

### setMode()

> **setMode**(`mode`): `void`

Defined in: [graph/src/layer/MiniMapLayer.ts:312](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/MiniMapLayer.ts#L312)

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

Defined in: [graph/src/layer/MiniMapLayer.ts:300](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/MiniMapLayer.ts#L300)

#### Parameters

##### patch

`Partial`\<`Omit`\<[`MiniMapLayerOptions`](../interfaces/MiniMapLayerOptions.md), `"graphLayerId"`\>\>

#### Returns

`void`

***

### setZIndex()

> **setZIndex**(`z`): `void`

Defined in: canvas/dist/index.d.ts:1039

Update this layer's z-order relative to its peers. Keeps the iteration
field (`this.zIndex`) and the pixi container's `zIndex` in sync, and
flips `ctx.stage` into sorted mode so the change renders.

#### Parameters

##### z

`number`

#### Returns

`void`

#### Inherited from

`ScreenLayer.setZIndex`

***

### unmount()

> **unmount**(): `void`

Defined in: canvas/dist/index.d.ts:1022

#### Returns

`void`

#### Inherited from

`ScreenLayer.unmount`
