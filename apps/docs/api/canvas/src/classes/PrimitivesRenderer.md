# Class: PrimitivesRenderer

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:147](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L147)

## Constructors

### Constructor

> **new PrimitivesRenderer**(`opts`): `PrimitivesRenderer`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:196](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L196)

#### Parameters

##### opts

[`PrimitivesRendererOptions`](../interfaces/PrimitivesRendererOptions.md)

#### Returns

`PrimitivesRenderer`

## Properties

### camera

> `readonly` **camera**: [`Camera`](Camera.md)

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:193](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L193)

***

### events

> `readonly` **events**: [`EventEmitter`](EventEmitter.md)\<[`PrimitivesRendererEventMap`](../interfaces/PrimitivesRendererEventMap.md)\>

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:179](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L179)

## Accessors

### connectorCount

#### Get Signature

> **get** **connectorCount**(): `number`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:945](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L945)

##### Returns

`number`

***

### shapeCount

#### Get Signature

> **get** **shapeCount**(): `number`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:941](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L941)

##### Returns

`number`

## Methods

### addConnector()

> **addConnector**\<`TSpec`\>(`id`, `spec`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:369](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L369)

#### Type Parameters

##### TSpec

`TSpec` *extends* [`BaseConnectorSpec`](../interfaces/BaseConnectorSpec.md)

#### Parameters

##### id

`string`

##### spec

`TSpec`

#### Returns

`void`

***

### addShape()

> **addShape**\<`TSpec`\>(`id`, `spec`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:313](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L313)

#### Type Parameters

##### TSpec

`TSpec` *extends* [`BaseShapeSpec`](../interfaces/BaseShapeSpec.md)

#### Parameters

##### id

`string`

##### spec

`TSpec`

#### Returns

`void`

***

### destroy()

> **destroy**(): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:1021](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1021)

#### Returns

`void`

***

### getRenderStats()

> **getRenderStats**(): [`RenderStats`](../interfaces/RenderStats.md)

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:933](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L933)

#### Returns

[`RenderStats`](../interfaces/RenderStats.md)

***

### getShapeCenter()

> **getShapeCenter**(`id`): [`Point`](../interfaces/Point.md)

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:990](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L990)

World-space geometric **centre** of the registered shape's bounding box,
or `null` when no shape with that id exists. Differs from
`getShapePosition` for shapes whose local origin isn't the centre
(`RectShape` is anchored top-left; `CircleShape` is already centred).

This is the canonical "anchor reference point" for layer code that wants
a uniform centre regardless of shape kind — connector routing, badge
placement, fit-to-content, etc.

#### Parameters

##### id

`string`

#### Returns

[`Point`](../interfaces/Point.md)

***

### getShapePosition()

> **getShapePosition**(`id`): [`Point`](../interfaces/Point.md)

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:975](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L975)

World-space origin `(spec.x, spec.y)` of the registered shape, or `null`
when no shape with that id exists. Counterpart to `getShapeWorldBounds`;
use this when a behaviour needs the shape's translation point (drag
offset baseline, anchor for an external overlay, etc.).

#### Parameters

##### id

`string`

#### Returns

[`Point`](../interfaces/Point.md)

***

### getShapeWorldBounds()

> **getShapeWorldBounds**(`id`): [`Rect`](../interfaces/Rect.md)

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:964](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L964)

World-space AABB of the registered shape, or `null` when no shape with
that id exists. Domain-free read accessor for layer code that needs to
query shape geometry without poking at private state — e.g. a graph
layer building an obstacle list for an edge's router, a behaviour that
wants to fit content to a selection, or a debug overlay.

#### Parameters

##### id

`string`

#### Returns

[`Rect`](../interfaces/Rect.md)

***

### hasBadge()

> **hasBadge**(`hostId`, `slot`): `boolean`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:716](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L716)

#### Parameters

##### hostId

`string`

##### slot

`string`

#### Returns

`boolean`

***

### hasConnector()

> **hasConnector**(`id`): `boolean`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:953](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L953)

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### hasShape()

> **hasShape**(`id`): `boolean`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:949](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L949)

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### hitTest()

> **hitTest**(`worldX`, `worldY`): [`HitResult`](../interfaces/HitResult.md)

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:892](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L892)

#### Parameters

##### worldX

`number`

##### worldY

`number`

#### Returns

[`HitResult`](../interfaces/HitResult.md)

***

### rasteriseLabel()

> **rasteriseLabel**(`id`, `resolution`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:751](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L751)

#### Parameters

##### id

`string`

##### resolution

`number`

#### Returns

`void`

***

### registerAnchor()

> **registerAnchor**(`kind`, `fn`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:275](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L275)

#### Parameters

##### kind

`string`

##### fn

[`IAnchor`](../type-aliases/IAnchor.md)

#### Returns

`void`

***

### registerDecoration()

> **registerDecoration**\<`TStyle`\>(`kind`, `ctor`, `opts`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:279](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L279)

#### Type Parameters

##### TStyle

`TStyle`

#### Parameters

##### kind

`string`

##### ctor

(`style`) => [`IShapeDecoration`](../type-aliases/IShapeDecoration.md)\<`TStyle`\> \| [`IConnectorDecoration`](../type-aliases/IConnectorDecoration.md)\<`TStyle`\>

##### opts

[`RegisterDecorationOptions`](../interfaces/RegisterDecorationOptions.md)

#### Returns

`void`

***

### registerEffect()

> **registerEffect**\<`TStyle`\>(`kind`, `ctor`, `opts`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:300](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L300)

Register an effect under a string kind. Effects are domain-free primitives
that modulate the host shape's transform or style channels each frame
(shake, breathing, shimmer, …). The effect's constructor receives the
caller's `style` payload; `opts.target` constrains which host kinds the
effect may attach to (shape-only for v0).

Throws on `setEffect` if the registered `target` doesn't include the
host kind being targeted.

#### Type Parameters

##### TStyle

`TStyle`

#### Parameters

##### kind

`string`

##### ctor

(`style`) => [`IShapeEffect`](../type-aliases/IShapeEffect.md)\<`TStyle`\> \| `IConnectorEffect`\<`TStyle`\>

##### opts

[`RegisterEffectOptions`](../interfaces/RegisterEffectOptions.md)

#### Returns

`void`

***

### registerPathStyle()

> **registerPathStyle**(`kind`, `fn`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:271](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L271)

#### Parameters

##### kind

`string`

##### fn

[`IPathStyle`](../type-aliases/IPathStyle.md)

#### Returns

`void`

***

### registerRouter()

> **registerRouter**(`kind`, `fn`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:267](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L267)

#### Parameters

##### kind

`string`

##### fn

[`IRouter`](../type-aliases/IRouter.md)

#### Returns

`void`

***

### registerShape()

> **registerShape**\<`TSpec`\>(`kind`, `ctor`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:263](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L263)

#### Type Parameters

##### TSpec

`TSpec` *extends* [`BaseShapeSpec`](../interfaces/BaseShapeSpec.md)

#### Parameters

##### kind

`string`

##### ctor

[`ShapeCtor`](../interfaces/ShapeCtor.md)\<`TSpec`\>

#### Returns

`void`

***

### removeBadge()

> **removeBadge**(`hostId`, `slot`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:707](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L707)

#### Parameters

##### hostId

`string`

##### slot

`string`

#### Returns

`void`

***

### removeConnector()

> **removeConnector**(`id`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:438](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L438)

#### Parameters

##### id

`string`

#### Returns

`void`

***

### removeShape()

> **removeShape**(`id`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:347](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L347)

#### Parameters

##### id

`string`

#### Returns

`void`

***

### reRouteAllConnectors()

> **reRouteAllConnectors**(): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:1010](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1010)

Re-route every registered connector. Useful after a non-endpoint shape
moves (e.g. an obstacle) and you want connectors that auto-collect
obstacles to update their path.

Each call re-runs `routePath` per connector and refreshes the hit index
and any connector decorations. Linear in `connectorInstances`; safe to
call from drag handlers in typical layouts. Heavy graphs with thousands
of edges should prefer a targeted re-route (future).

#### Returns

`void`

***

### setBadge()

> **setBadge**(`hostId`, `slot`, `options`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:670](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L670)

Attach a badge to a host shape. The badge is registered as a real shape
under id `` `${hostId}:${slot}` `` so it inherits every shape capability —
any registered shape kind as the plate, any `ShapeFillLayer` as content
(solid / image / glyph / text / svg / image-inset / svg-url), and any
registered decoration via the `decorations` field.

On `updateShape(hostId, …)` every attached badge re-anchors automatically.
On `removeShape(hostId)` every attached badge is removed first.

Calling `setBadge` with the same `(hostId, slot)` replaces the previous
badge (the old badge shape and any of its decorations are destroyed).

#### Parameters

##### hostId

`string`

##### slot

`string`

##### options

[`BadgeOptions`](../interfaces/BadgeOptions.md)

#### Returns

`void`

***

### setDecoration()

> **setDecoration**\<`TStyle`\>(`targetId`, `slot`, `decoration`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:453](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L453)

#### Type Parameters

##### TStyle

`TStyle` = `unknown`

#### Parameters

##### targetId

`string`

##### slot

`string`

##### decoration

[`DecorationSpec`](../interfaces/DecorationSpec.md)\<`TStyle`\>

#### Returns

`void`

***

### setEffect()

> **setEffect**\<`TStyle`\>(`targetId`, `slot`, `effect`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:550](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L550)

Attach (or detach with `null`) an effect to a shape at the given slot.
Effects don't draw — they modulate the host shape's transform and/or
style. Multiple effects per host stack: transform deltas compose
additively (translations + rotation) and multiplicatively (scale);
style channels are last-writer-wins per channel by insertion order.

Connector effects are supported and modulate the host connector's
style channels (tint + alpha). Transform deltas on a path-resolved
primitive have no coherent meaning, so transform effects on connector
hosts are ignored at aggregation time.

#### Type Parameters

##### TStyle

`TStyle` = `unknown`

#### Parameters

##### targetId

`string`

##### slot

`string`

##### effect

[`EffectSpec`](../interfaces/EffectSpec.md)\<`TStyle`\>

#### Returns

`void`

***

### setLODLevel()

> **setLODLevel**(`id`, `level`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:741](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L741)

#### Parameters

##### id

`string`

##### level

`number`

#### Returns

`void`

***

### tickAnimations()

> **tickAnimations**(`deltaMs`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:759](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L759)

#### Parameters

##### deltaMs

`number`

#### Returns

`void`

***

### updateConnector()

> **updateConnector**\<`TSpec`\>(`id`, `partial`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:388](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L388)

#### Type Parameters

##### TSpec

`TSpec` *extends* [`BaseConnectorSpec`](../interfaces/BaseConnectorSpec.md)

#### Parameters

##### id

`string`

##### partial

`Partial`\<`TSpec`\>

#### Returns

`void`

***

### updateShape()

> **updateShape**\<`TSpec`\>(`id`, `partial`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:337](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L337)

#### Type Parameters

##### TSpec

`TSpec` *extends* [`BaseShapeSpec`](../interfaces/BaseShapeSpec.md)

#### Parameters

##### id

`string`

##### partial

`Partial`\<`TSpec`\>

#### Returns

`void`
