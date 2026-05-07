# Class: ShapesRenderer

Defined in: [packages/canvas/src/renderers/ShapesRenderer.ts:121](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/ShapesRenderer.ts#L121)

## Constructors

### Constructor

> **new ShapesRenderer**(`opts`): `ShapesRenderer`

Defined in: [packages/canvas/src/renderers/ShapesRenderer.ts:165](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/ShapesRenderer.ts#L165)

#### Parameters

##### opts

[`ShapesRendererOptions`](../interfaces/ShapesRendererOptions.md)

#### Returns

`ShapesRenderer`

## Properties

### camera

> `readonly` **camera**: [`Camera`](Camera.md)

Defined in: [packages/canvas/src/renderers/ShapesRenderer.ts:157](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/ShapesRenderer.ts#L157)

Canvas camera. Exposed (read-only) so primitives can do
resolution-aware draws (e.g. text rasterisation at the current zoom).

***

### events

> `readonly` **events**: [`EventEmitter`](EventEmitter.md)\<[`ShapesRendererEventMap`](../interfaces/ShapesRendererEventMap.md)\>

Defined in: [packages/canvas/src/renderers/ShapesRenderer.ts:146](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/ShapesRenderer.ts#L146)

Raw, DOM-level pointer events on shapes/connectors. The host Layer
subscribes and translates these into domain events. No semantic
interpretation happens at this level.

## Accessors

### connectorCount

#### Get Signature

> **get** **connectorCount**(): `number`

Defined in: [packages/canvas/src/renderers/ShapesRenderer.ts:838](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/ShapesRenderer.ts#L838)

Number of connector instances currently in the renderer.

##### Returns

`number`

***

### shapeCount

#### Get Signature

> **get** **shapeCount**(): `number`

Defined in: [packages/canvas/src/renderers/ShapesRenderer.ts:833](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/ShapesRenderer.ts#L833)

Number of shape instances currently in the renderer.

##### Returns

`number`

## Methods

### addConnector()

> **addConnector**\<`TSpec`\>(`id`, `spec`): `void`

Defined in: [packages/canvas/src/renderers/ShapesRenderer.ts:319](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/ShapesRenderer.ts#L319)

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

Defined in: [packages/canvas/src/renderers/ShapesRenderer.ts:267](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/ShapesRenderer.ts#L267)

Add a shape. Throws if `id` already exists or `spec.kind` is unregistered.
Pixi Graphics attaches to the renderer's container; the bbox is
inserted into the hit index using the shape's `bounds()` translated by
the spec's `(x, y)`.

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

Defined in: [packages/canvas/src/renderers/ShapesRenderer.ts:592](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/ShapesRenderer.ts#L592)

Release all renderer-owned objects. The host Layer calls this in its
unmount path before the host layer's container is destroyed
(which would orphan our pixi children otherwise).

#### Returns

`void`

***

### getRenderStats()

> **getRenderStats**(): [`RenderStats`](../interfaces/RenderStats.md)

Defined in: [packages/canvas/src/renderers/ShapesRenderer.ts:577](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/ShapesRenderer.ts#L577)

#### Returns

[`RenderStats`](../interfaces/RenderStats.md)

***

### hasConnector()

> **hasConnector**(`id`): `boolean`

Defined in: [packages/canvas/src/renderers/ShapesRenderer.ts:846](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/ShapesRenderer.ts#L846)

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### hasShape()

> **hasShape**(`id`): `boolean`

Defined in: [packages/canvas/src/renderers/ShapesRenderer.ts:842](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/ShapesRenderer.ts#L842)

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### hitTest()

> **hitTest**(`worldX`, `worldY`): [`HitResult`](../interfaces/HitResult.md)

Defined in: [packages/canvas/src/renderers/ShapesRenderer.ts:529](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/ShapesRenderer.ts#L529)

Topmost-by-zIndex precise hit at the given world coordinates. Returns
`null` when no candidate is hit.

Two-stage:
  1. Spatial index narrows to candidates whose AABB contains the point
     (rbush, O(log n + k)).
  2. Each candidate runs its kind-specific containment check —
     `IShape.contains(localX, localY)` for shapes (default = bbox) and
     a stroke-distance test against the routed polyline for connectors.

Among precise hits, the highest `zIndex` wins; ties resolve to the
latest-inserted (rbush iteration order — unspecified but stable enough
for typical scenes).

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

Defined in: [packages/canvas/src/renderers/ShapesRenderer.ts:491](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/ShapesRenderer.ts#L491)

Bake a label texture at the given resolution. Forwards to the shape's
`setLabelResolution` if implemented (e.g. `TextShape` swaps its
underlying `Text.resolution`). Shapes without text ignore the call.
Unknown ids are no-ops.

#### Parameters

##### id

`string`

##### resolution

`number`

#### Returns

`void`

***

### registerConnector()

> **registerConnector**\<`TSpec`\>(`kind`, `ctor`): `void`

Defined in: [packages/canvas/src/renderers/ShapesRenderer.ts:224](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/ShapesRenderer.ts#L224)

#### Type Parameters

##### TSpec

`TSpec` *extends* [`BaseConnectorSpec`](../interfaces/BaseConnectorSpec.md)

#### Parameters

##### kind

`string`

##### ctor

[`ConnectorCtor`](../type-aliases/ConnectorCtor.md)\<`TSpec`\>

#### Returns

`void`

***

### registerDecoration()

> **registerDecoration**\<`TStyle`\>(`kind`, `ctor`, `opts`): `void`

Defined in: [packages/canvas/src/renderers/ShapesRenderer.ts:246](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/ShapesRenderer.ts#L246)

Register a decoration kind. `opts.target` declares whether the decoration
applies to shapes, connectors, or both. `setDecoration` will reject
mismatches at runtime.

The ctor's style parameter type flows through the generic so call-site
inference works without `as` casts (`registerDecoration('halo',
HaloDecoration, ...)` infers `TStyle = HaloStyle`). The registry stores
the ctor with a widened style type — `setDecoration` is responsible for
passing a matching `decoration.style` payload at the runtime boundary.

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

### registerRouter()

> **registerRouter**(`kind`, `fn`): `void`

Defined in: [packages/canvas/src/renderers/ShapesRenderer.ts:231](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/ShapesRenderer.ts#L231)

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

Defined in: [packages/canvas/src/renderers/ShapesRenderer.ts:220](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/ShapesRenderer.ts#L220)

Register a shape kind. Subsequent `addShape({ kind, ... })` calls with a
matching `spec.kind` instantiate this constructor. Re-registering an
existing kind replaces the previous constructor (last-wins, matching
the behaviour-registry conventions).

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

### removeConnector()

> **removeConnector**(`id`): `void`

Defined in: [packages/canvas/src/renderers/ShapesRenderer.ts:355](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/ShapesRenderer.ts#L355)

#### Parameters

##### id

`string`

#### Returns

`void`

***

### removeShape()

> **removeShape**(`id`): `void`

Defined in: [packages/canvas/src/renderers/ShapesRenderer.ts:307](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/ShapesRenderer.ts#L307)

#### Parameters

##### id

`string`

#### Returns

`void`

***

### setDecoration()

> **setDecoration**\<`TStyle`\>(`targetId`, `slot`, `decoration`): `void`

Defined in: [packages/canvas/src/renderers/ShapesRenderer.ts:382](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/ShapesRenderer.ts#L382)

Set / replace / clear a decoration on a host (shape or connector). Pass
`null` to clear that slot.

Slots are caller-defined names. Well-known slot names get a fixed z-band
(`glow` / `halo` below the host; `border` / `pulse` / `badge` / `fx`
above) — see `slotZIndex()`. Other slot names land in a default mid-band.

The decoration kind must have been registered via `registerDecoration`
with a `target` matching the host (`'shape'` / `'connector'` / `'both'`);
mismatches throw.

Replacing an existing decoration on the same slot disposes the previous
one cleanly (and removes it from the animated set if it was animated).

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

### setLODLevel()

> **setLODLevel**(`id`, `level`): `void`

Defined in: [packages/canvas/src/renderers/ShapesRenderer.ts:475](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/ShapesRenderer.ts#L475)

Set a discrete LOD level on a shape. The host Layer owns the policy
(which level a shape should be at given camera zoom / cull state); the
renderer just forwards the request.

Forwarding rules:
  • If the shape implements `setLODLevel`, call it directly — the shape
    decides what each level means.
  • Otherwise apply the default policy: `level === 0` → hide; `level >= 1`
    → visible.

Unknown ids are silent no-ops (matches the rest of the
`update*`/`remove*` API).

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

Defined in: [packages/canvas/src/renderers/ShapesRenderer.ts:504](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/ShapesRenderer.ts#L504)

Advance all animated decorations. Called by the host Canvas tick after
`layer.flush()`. Decorations that return `false` from their `tick`
retire from the animated set; static decorations cost zero per frame.

#### Parameters

##### deltaMs

`number`

#### Returns

`void`

***

### updateConnector()

> **updateConnector**\<`TSpec`\>(`id`, `partial`): `void`

Defined in: [packages/canvas/src/renderers/ShapesRenderer.ts:341](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/ShapesRenderer.ts#L341)

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

Defined in: [packages/canvas/src/renderers/ShapesRenderer.ts:293](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/ShapesRenderer.ts#L293)

Apply a partial update. Re-runs `draw()` on the shape, re-syncs the
hit-index entry, and re-applies any active decorations so they track
the new bounds.

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
