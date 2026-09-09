# Class: GlowDecoration

Base for decorations that target shape primitives. Subclass implements
`repaint`; this base handles the `mount` / `update` lifecycle (attach gfx
to the host's surface, set the slot z-index, cache the host, repaint).

Animation: subclass adds `tick(deltaMs)` if it wants to be advanced per
frame. The renderer registers any decoration with a `tick` method into
its animation set; a falsy return retires the decoration.

## Extends

- [`ShapeDecorationBase`](ShapeDecorationBase.md)\<[`GlowDecorationStyle`](../interfaces/GlowDecorationStyle.md)\>

## Constructors

### Constructor

> **new GlowDecoration**(`style`): `GlowDecoration`

#### Parameters

##### style

[`GlowDecorationStyle`](../interfaces/GlowDecorationStyle.md)

#### Returns

`GlowDecoration`

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

> `readonly` **style**: [`GlowDecorationStyle`](../interfaces/GlowDecorationStyle.md)

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

### getOuterExtent()

> **getOuterExtent**(): `number`

Outer edge of the halo — the widest stroke layer paints at roughly
`strokeWidth` past the silhouette (`paintInto` defaults to `'outside'`
alignment, so the full stroke sits outward). Reported so
`LabelDecoration` can push outside-placement labels past the glow.
The optional `pulse` only modulates alpha, not geometry, so the
resting extent is the only one worth reporting.

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

### tick()

> **tick**(`deltaMs`): `boolean`

Advance the optional pulse phase. Geometry is repainted once at mount
(cheap) and never again — only `this.gfx.alpha` is touched per frame,
so animated pulse is essentially free.

#### Parameters

##### deltaMs

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
