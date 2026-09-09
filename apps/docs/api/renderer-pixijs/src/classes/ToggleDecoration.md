# Class: ToggleDecoration

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

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`gfx`](ShapeDecorationBase.md#gfx)

***

### host

> `protected` **host**: [`ShapeDecorationHostInfo`](../interfaces/ShapeDecorationHostInfo.md) = `null`

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`host`](ShapeDecorationBase.md#host)

***

### style

> `readonly` **style**: [`ToggleDecorationStyle`](../interfaces/ToggleDecorationStyle.md)

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`style`](ShapeDecorationBase.md#style)

## Methods

### destroy()

> **destroy**(): `void`

#### Returns

`void`

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`destroy`](ShapeDecorationBase.md#destroy)

***

### getLocalHitGeometry()

> **getLocalHitGeometry**(): [`ToggleHitGeometry`](../interfaces/ToggleHitGeometry.md)

Most-recently-computed shape-local hit geometry. Returns `{0, 0, 0}`
before the first `mount` / `update` — callers should still defend
against a zero radius as a "not laid out yet" signal.

#### Returns

[`ToggleHitGeometry`](../interfaces/ToggleHitGeometry.md)

***

### getOuterExtent()

> **getOuterExtent**(): `number`

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

Render the decoration based on the current `host`.

#### Returns

`void`

#### Overrides

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`repaint`](ShapeDecorationBase.md#repaint)

***

### update()

> **update**(`host`): `void`

#### Parameters

##### host

[`ShapeDecorationHostInfo`](../interfaces/ShapeDecorationHostInfo.md)

#### Returns

`void`

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`update`](ShapeDecorationBase.md#update)
