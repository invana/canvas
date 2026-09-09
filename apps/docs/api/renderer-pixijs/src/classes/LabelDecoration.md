# Class: LabelDecoration

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

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`gfx`](ShapeDecorationBase.md#gfx)

***

### host

> `protected` **host**: [`ShapeDecorationHostInfo`](../interfaces/ShapeDecorationHostInfo.md) = `null`

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`host`](ShapeDecorationBase.md#host)

***

### style

> `readonly` **style**: [`ShapeLabelStyle`](../interfaces/ShapeLabelStyle.md)

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

### getResolution()

> **getResolution**(): `number`

Last-applied rasterisation resolution, or `null` if `setResolution`
has never been called. The renderer's viewport sweep uses this to
skip labels already at the target so a converged scene costs nothing
past one bounds check per label per frame.

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

### setResolution()

> **setResolution**(`resolution`): `void`

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

#### Parameters

##### host

[`ShapeDecorationHostInfo`](../interfaces/ShapeDecorationHostInfo.md)

#### Returns

`void`

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`update`](ShapeDecorationBase.md#update)
