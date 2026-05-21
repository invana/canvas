# Class: ToggleDecoration

Defined in: [canvas/src/primitives/decorations/shape/ToggleDecoration.ts:124](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/ToggleDecoration.ts#L124)

Small circular `+` / `−` button drawn at a configurable anchor on the
host shape. Pure visual; emits no events.

Geometry: one filled + stroked circle, plus one or two glyph strokes
(`+` draws a horizontal and vertical stroke; `−` draws only the
horizontal). Repainted on every `update()` so a `setDecoration` that
flips `state` from `'plus'` to `'minus'` redraws in place without
remounting.

## Extends

- [`ShapeDecorationBase`](ShapeDecorationBase.md)\<[`ToggleDecorationStyle`](../interfaces/ToggleDecorationStyle.md)\>

## Constructors

### Constructor

> **new ToggleDecoration**(`style`): `ToggleDecoration`

Defined in: [canvas/src/primitives/decorations/shape/ToggleDecoration.ts:135](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/ToggleDecoration.ts#L135)

#### Parameters

##### style

[`ToggleDecorationStyle`](../interfaces/ToggleDecorationStyle.md)

#### Returns

`ToggleDecoration`

#### Overrides

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`constructor`](ShapeDecorationBase.md#constructor)

## Properties

### gfx

> `readonly` **gfx**: `Container`

Defined in: [canvas/src/primitives/base/PrimitiveBase.ts:12](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/PrimitiveBase.ts#L12)

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`gfx`](ShapeDecorationBase.md#gfx)

***

### host

> `protected` **host**: [`ShapeDecorationHostInfo`](../interfaces/ShapeDecorationHostInfo.md) = `null`

Defined in: [canvas/src/primitives/base/ShapeDecorationBase.ts:18](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ShapeDecorationBase.ts#L18)

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`host`](ShapeDecorationBase.md#host)

***

### style

> `readonly` **style**: [`ToggleDecorationStyle`](../interfaces/ToggleDecorationStyle.md)

Defined in: [canvas/src/primitives/base/ShapeDecorationBase.ts:17](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ShapeDecorationBase.ts#L17)

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`style`](ShapeDecorationBase.md#style)

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [canvas/src/primitives/base/PrimitiveBase.ts:18](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/PrimitiveBase.ts#L18)

#### Returns

`void`

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`destroy`](ShapeDecorationBase.md#destroy)

***

### getLocalHitGeometry()

> **getLocalHitGeometry**(): [`ToggleHitGeometry`](../interfaces/ToggleHitGeometry.md)

Defined in: [canvas/src/primitives/decorations/shape/ToggleDecoration.ts:146](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/ToggleDecoration.ts#L146)

Most-recently-computed shape-local hit geometry. Returns `{0, 0, 0}`
before the first `mount` / `update` — callers should still defend
against a zero radius as a "not laid out yet" signal.

#### Returns

[`ToggleHitGeometry`](../interfaces/ToggleHitGeometry.md)

***

### getOuterExtent()

> **getOuterExtent**(): `number`

Defined in: [canvas/src/primitives/decorations/shape/ToggleDecoration.ts:209](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/ToggleDecoration.ts#L209)

Outer-extent contribution — outside-placed toggles bulge slightly
past the silhouette, but the bulge is small (one radius) and only on
one side. Reporting it would push `LabelDecoration` outward on all
four sides, which looks worse than letting an outside-bottom label
overlap the toggle. Returning `0` keeps the label flow stable; the
developer can offset the label manually if both fight for the same
slot.

#### Returns

`number`

***

### mount()

> **mount**(`host`): `void`

Defined in: [canvas/src/primitives/base/ShapeDecorationBase.ts:26](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ShapeDecorationBase.ts#L26)

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

Defined in: [canvas/src/primitives/decorations/shape/ToggleDecoration.ts:150](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/ToggleDecoration.ts#L150)

Render the decoration based on the current `host`.

#### Returns

`void`

#### Overrides

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`repaint`](ShapeDecorationBase.md#repaint)

***

### update()

> **update**(`host`): `void`

Defined in: [canvas/src/primitives/base/ShapeDecorationBase.ts:33](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ShapeDecorationBase.ts#L33)

#### Parameters

##### host

[`ShapeDecorationHostInfo`](../interfaces/ShapeDecorationHostInfo.md)

#### Returns

`void`

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`update`](ShapeDecorationBase.md#update)
