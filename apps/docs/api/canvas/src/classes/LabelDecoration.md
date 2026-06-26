# Class: LabelDecoration

Defined in: [canvas/src/primitives/decorations/shape/LabelDecoration.ts:32](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/LabelDecoration.ts#L32)

Base for decorations that target shape primitives. Subclass implements
`repaint`; this base handles the `mount` / `update` lifecycle (attach gfx
to the host's surface, set the slot z-index, cache the host, repaint).

Animation: subclass adds `tick(deltaMs)` if it wants to be advanced per
frame. The renderer registers any decoration with a `tick` method into
its animation set; a falsy return retires the decoration.

## Extends

- [`ShapeDecorationBase`](ShapeDecorationBase.md)\<[`ShapeLabelStyle`](../interfaces/ShapeLabelStyle.md)\>

## Constructors

### Constructor

> **new LabelDecoration**(`style`): `LabelDecoration`

Defined in: [canvas/src/primitives/base/ShapeDecorationBase.ts:20](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/base/ShapeDecorationBase.ts#L20)

#### Parameters

##### style

[`ShapeLabelStyle`](../interfaces/ShapeLabelStyle.md)

#### Returns

`LabelDecoration`

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`constructor`](ShapeDecorationBase.md#constructor)

## Properties

### gfx

> `readonly` **gfx**: `Container`

Defined in: [canvas/src/primitives/base/PrimitiveBase.ts:12](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/base/PrimitiveBase.ts#L12)

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`gfx`](ShapeDecorationBase.md#gfx)

***

### host

> `protected` **host**: [`ShapeDecorationHostInfo`](../interfaces/ShapeDecorationHostInfo.md) = `null`

Defined in: [canvas/src/primitives/base/ShapeDecorationBase.ts:18](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/base/ShapeDecorationBase.ts#L18)

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`host`](ShapeDecorationBase.md#host)

***

### style

> `readonly` **style**: [`ShapeLabelStyle`](../interfaces/ShapeLabelStyle.md)

Defined in: [canvas/src/primitives/base/ShapeDecorationBase.ts:17](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/base/ShapeDecorationBase.ts#L17)

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`style`](ShapeDecorationBase.md#style)

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [canvas/src/primitives/base/PrimitiveBase.ts:18](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/base/PrimitiveBase.ts#L18)

#### Returns

`void`

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`destroy`](ShapeDecorationBase.md#destroy)

***

### getResolution()

> **getResolution**(): `number`

Defined in: [canvas/src/primitives/decorations/shape/LabelDecoration.ts:65](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/LabelDecoration.ts#L65)

Last-applied rasterisation resolution, or `null` if `setResolution`
has never been called. The renderer's viewport sweep uses this to
skip labels already at the target so a converged scene costs nothing
past one bounds check per label per frame.

#### Returns

`number`

***

### mount()

> **mount**(`host`): `void`

Defined in: [canvas/src/primitives/base/ShapeDecorationBase.ts:26](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/base/ShapeDecorationBase.ts#L26)

#### Parameters

##### host

[`ShapeDecorationHostInfo`](../interfaces/ShapeDecorationHostInfo.md)

#### Returns

`void`

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`mount`](ShapeDecorationBase.md#mount)

***

### repaint()

> `protected` **repaint**(): `void`

Defined in: [canvas/src/primitives/decorations/shape/LabelDecoration.ts:69](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/LabelDecoration.ts#L69)

Render the decoration based on the current `host`.

#### Returns

`void`

#### Overrides

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`repaint`](ShapeDecorationBase.md#repaint)

***

### setResolution()

> **setResolution**(`resolution`): `void`

Defined in: [canvas/src/primitives/decorations/shape/LabelDecoration.ts:54](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/LabelDecoration.ts#L54)

Pixi rasterises `Text` to a glyph texture once and re-uses it across
frames. The default resolution is the renderer's DPR, so when the
camera zooms in the texture is sampled up and labels get fuzzy.
Bumping `resolution` re-rasterises at higher fidelity. Idempotent
with the same value (Pixi short-circuits internally).

#### Parameters

##### resolution

`number`

#### Returns

`void`

***

### tick()

> **tick**(`_deltaMs`): `boolean`

Defined in: [canvas/src/primitives/decorations/shape/LabelDecoration.ts:189](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/LabelDecoration.ts#L189)

Per-frame check for LOD — when the camera-zoom (effective world scale)
leaves the `visibility` range, detach `gfx` from the surface so Pixi
skips it entirely. Re-attach when zoom re-enters the range.

Without `visibility` set this hook is a no-op and the renderer never
registers it as animated (we return `false`).

#### Parameters

##### \_deltaMs

`number`

#### Returns

`boolean`

***

### update()

> **update**(`host`): `void`

Defined in: [canvas/src/primitives/base/ShapeDecorationBase.ts:33](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/base/ShapeDecorationBase.ts#L33)

#### Parameters

##### host

[`ShapeDecorationHostInfo`](../interfaces/ShapeDecorationHostInfo.md)

#### Returns

`void`

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`update`](ShapeDecorationBase.md#update)
