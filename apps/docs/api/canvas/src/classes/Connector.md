# Class: Connector

Defined in: [packages/canvas/src/primitives/connectors/Connector.ts:18](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/connectors/Connector.ts#L18)

The single concrete connector class. Renders any `Path` natively via
Pixi commands (`moveTo` / `lineTo` / `quadraticCurveTo` / `bezierCurveTo`),
then strokes once with the spec's stroke or the decoration `style` override.

Visual variation comes from the `router` (which produces the path), not
from connector subclasses. Custom rendering styles (double-line, gradient,
wiggle) are added later by extending `ConnectorBase` directly.

## Extends

- [`ConnectorBase`](ConnectorBase.md)\<[`BaseConnectorSpec`](../interfaces/BaseConnectorSpec.md)\>

## Constructors

### Constructor

> **new Connector**(`host`): `Connector`

Defined in: [packages/canvas/src/primitives/base/ConnectorBase.ts:35](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/base/ConnectorBase.ts#L35)

#### Parameters

##### host

[`ConnectorHostInfo`](../interfaces/ConnectorHostInfo.md)

#### Returns

`Connector`

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`constructor`](ConnectorBase.md#constructor)

## Properties

### bodyGfx

> `protected` `readonly` **bodyGfx**: [`Graphics`](../interfaces/Graphics.md)

Defined in: [packages/canvas/src/primitives/base/ConnectorBase.ts:31](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/base/ConnectorBase.ts#L31)

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`bodyGfx`](ConnectorBase.md#bodygfx)

***

### gfx

> `readonly` **gfx**: `Container`

Defined in: [packages/canvas/src/primitives/base/PrimitiveBase.ts:12](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/base/PrimitiveBase.ts#L12)

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`gfx`](ConnectorBase.md#gfx)

***

### host

> `protected` `readonly` **host**: [`ConnectorHostInfo`](../interfaces/ConnectorHostInfo.md)

Defined in: [packages/canvas/src/primitives/base/ConnectorBase.ts:35](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/base/ConnectorBase.ts#L35)

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`host`](ConnectorBase.md#host)

***

### path

> `protected` **path**: [`Path`](../type-aliases/Path.md) = `[]`

Defined in: [packages/canvas/src/primitives/base/ConnectorBase.ts:33](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/base/ConnectorBase.ts#L33)

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`path`](ConnectorBase.md#path)

***

### spec

> `protected` **spec**: [`BaseConnectorSpec`](../interfaces/BaseConnectorSpec.md)

Defined in: [packages/canvas/src/primitives/base/ConnectorBase.ts:32](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/base/ConnectorBase.ts#L32)

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`spec`](ConnectorBase.md#spec)

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [packages/canvas/src/primitives/base/PrimitiveBase.ts:18](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/base/PrimitiveBase.ts#L18)

#### Returns

`void`

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`destroy`](ConnectorBase.md#destroy)

***

### draw()

> **draw**(`spec`, `path`): `void`

Defined in: [packages/canvas/src/primitives/base/ConnectorBase.ts:54](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/base/ConnectorBase.ts#L54)

(Re)paint the connector with a router-resolved `Path`.

#### Parameters

##### spec

[`BaseConnectorSpec`](../interfaces/BaseConnectorSpec.md)

##### path

[`Path`](../type-aliases/Path.md)

#### Returns

`void`

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`draw`](ConnectorBase.md#draw)

***

### drawGeometry()

> `protected` **drawGeometry**(`g`, `spec`, `path`, `style?`): `void`

Defined in: [packages/canvas/src/primitives/connectors/Connector.ts:19](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/connectors/Connector.ts#L19)

Render the path natively via Pixi commands (`moveTo` / `lineTo` /
`quadraticCurveTo` / `bezierCurveTo`) plus the spec's stroke (or `style`
override). Subclasses focus only on stroke style — markers are handled
by the base via `paintMarkers`.

#### Parameters

##### g

[`Graphics`](../interfaces/Graphics.md)

##### spec

[`BaseConnectorSpec`](../interfaces/BaseConnectorSpec.md)

##### path

[`Path`](../type-aliases/Path.md)

##### style?

[`ConnectorPaintStyle`](../interfaces/ConnectorPaintStyle.md)

#### Returns

`void`

#### Overrides

[`ConnectorBase`](ConnectorBase.md).[`drawGeometry`](ConnectorBase.md#drawgeometry)

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

[`BaseConnectorSpec`](../interfaces/BaseConnectorSpec.md)

##### path

[`Path`](../type-aliases/Path.md)

##### style?

[`ConnectorPaintStyle`](../interfaces/ConnectorPaintStyle.md)

#### Returns

`void`

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`paintInto`](ConnectorBase.md#paintinto)

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

[`BaseConnectorSpec`](../interfaces/BaseConnectorSpec.md)

##### path

[`Path`](../type-aliases/Path.md)

##### style?

[`ConnectorPaintStyle`](../interfaces/ConnectorPaintStyle.md)

##### strokeWidth?

`number` = `...`

#### Returns

`void`

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`paintMarkers`](ConnectorBase.md#paintmarkers)
