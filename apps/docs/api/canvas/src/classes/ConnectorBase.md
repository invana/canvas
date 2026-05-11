# Abstract Class: ConnectorBase\<TSpec\>

Defined in: [packages/canvas/src/primitives/base/ConnectorBase.ts:27](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/base/ConnectorBase.ts#L27)

Base for the single concrete `Connector` class (and any future custom
subclasses). Subclasses implement `drawGeometry` to render a `Path` onto a
`Graphics`. Marker placement is handled by `paintMarkers` — wired in step 9
once `pathSampling.tangentAt` and the shape registry resolution land.

v0 ships only one concrete subclass (`Connector`); custom rendering styles
(double-line strokes, gradient strokes, "noodle" wiggles) are introduced
later by extending `ConnectorBase` directly. See the v0 plan's "What's NOT
in v0" section.

## Extends

- [`PrimitiveBase`](PrimitiveBase.md)

## Extended by

- [`Connector`](Connector.md)

## Type Parameters

### TSpec

`TSpec` *extends* [`BaseConnectorSpec`](../interfaces/BaseConnectorSpec.md)

## Implements

- [`IConnector`](../interfaces/IConnector.md)\<`TSpec`\>

## Constructors

### Constructor

> **new ConnectorBase**\<`TSpec`\>(`host`): `ConnectorBase`\<`TSpec`\>

Defined in: [packages/canvas/src/primitives/base/ConnectorBase.ts:35](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/base/ConnectorBase.ts#L35)

#### Parameters

##### host

[`ConnectorHostInfo`](../interfaces/ConnectorHostInfo.md)

#### Returns

`ConnectorBase`\<`TSpec`\>

#### Overrides

[`PrimitiveBase`](PrimitiveBase.md).[`constructor`](PrimitiveBase.md#constructor)

## Properties

### bodyGfx

> `protected` `readonly` **bodyGfx**: [`Graphics`](../interfaces/Graphics.md)

Defined in: [packages/canvas/src/primitives/base/ConnectorBase.ts:31](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/base/ConnectorBase.ts#L31)

***

### gfx

> `readonly` **gfx**: `Container`

Defined in: [packages/canvas/src/primitives/base/PrimitiveBase.ts:12](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/base/PrimitiveBase.ts#L12)

#### Implementation of

[`IConnector`](../interfaces/IConnector.md).[`gfx`](../interfaces/IConnector.md#gfx)

#### Inherited from

[`PrimitiveBase`](PrimitiveBase.md).[`gfx`](PrimitiveBase.md#gfx)

***

### host

> `protected` `readonly` **host**: [`ConnectorHostInfo`](../interfaces/ConnectorHostInfo.md)

Defined in: [packages/canvas/src/primitives/base/ConnectorBase.ts:35](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/base/ConnectorBase.ts#L35)

***

### path

> `protected` **path**: [`Path`](../type-aliases/Path.md) = `[]`

Defined in: [packages/canvas/src/primitives/base/ConnectorBase.ts:33](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/base/ConnectorBase.ts#L33)

***

### spec

> `protected` **spec**: `TSpec`

Defined in: [packages/canvas/src/primitives/base/ConnectorBase.ts:32](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/base/ConnectorBase.ts#L32)

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [packages/canvas/src/primitives/base/PrimitiveBase.ts:18](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/base/PrimitiveBase.ts#L18)

#### Returns

`void`

#### Implementation of

[`IConnector`](../interfaces/IConnector.md).[`destroy`](../interfaces/IConnector.md#destroy)

#### Inherited from

[`PrimitiveBase`](PrimitiveBase.md).[`destroy`](PrimitiveBase.md#destroy)

***

### draw()

> **draw**(`spec`, `path`): `void`

Defined in: [packages/canvas/src/primitives/base/ConnectorBase.ts:54](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/base/ConnectorBase.ts#L54)

(Re)paint the connector with a router-resolved `Path`.

#### Parameters

##### spec

`TSpec`

##### path

[`Path`](../type-aliases/Path.md)

#### Returns

`void`

#### Implementation of

[`IConnector`](../interfaces/IConnector.md).[`draw`](../interfaces/IConnector.md#draw)

***

### drawGeometry()

> `abstract` `protected` **drawGeometry**(`g`, `spec`, `path`, `style?`): `void`

Defined in: [packages/canvas/src/primitives/base/ConnectorBase.ts:47](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/base/ConnectorBase.ts#L47)

Render the path natively via Pixi commands (`moveTo` / `lineTo` /
`quadraticCurveTo` / `bezierCurveTo`) plus the spec's stroke (or `style`
override). Subclasses focus only on stroke style — markers are handled
by the base via `paintMarkers`.

#### Parameters

##### g

[`Graphics`](../interfaces/Graphics.md)

##### spec

`TSpec`

##### path

[`Path`](../type-aliases/Path.md)

##### style?

[`ConnectorPaintStyle`](../interfaces/ConnectorPaintStyle.md)

#### Returns

`void`

***

### paintInto()

> **paintInto**(`g`, `spec`, `path`, `style?`): `void`

Defined in: [packages/canvas/src/primitives/base/ConnectorBase.ts:67](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/base/ConnectorBase.ts#L67)

Repaint the connector's full silhouette (path + markers) into a
caller-supplied `Graphics` with style overrides. Connector decorations
use this to draw with pixel-identical silhouette coverage.

#### Parameters

##### g

[`Graphics`](../interfaces/Graphics.md)

##### spec

`TSpec`

##### path

[`Path`](../type-aliases/Path.md)

##### style?

[`ConnectorPaintStyle`](../interfaces/ConnectorPaintStyle.md)

#### Returns

`void`

#### Implementation of

[`IConnector`](../interfaces/IConnector.md).[`paintInto`](../interfaces/IConnector.md#paintinto)

***

### paintMarkers()

> `protected` **paintMarkers**(`g`, `spec`, `path`, `style?`, `strokeWidth?`): `void`

Defined in: [packages/canvas/src/primitives/base/ConnectorBase.ts:106](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/base/ConnectorBase.ts#L106)

Paint source/target markers anchored at the path endpoints, oriented
along the local tangent. Looks up each marker's class via
`host.shapeRegistry` and dispatches to its `static paintInto`.

Source angle is the **reversed** tangent so an arrow placed at the
source faces back toward it. Target angle is the forward tangent so an
arrow placed at the target points into it.

When the connector style sets `tintMarkers`, markers paint with the
connector's color/alpha (used by glow / halo for unified silhouette
coverage). Otherwise markers use their own spec colors.

#### Parameters

##### g

[`Graphics`](../interfaces/Graphics.md)

##### spec

`TSpec`

##### path

[`Path`](../type-aliases/Path.md)

##### style?

[`ConnectorPaintStyle`](../interfaces/ConnectorPaintStyle.md)

##### strokeWidth?

`number` = `...`

#### Returns

`void`
