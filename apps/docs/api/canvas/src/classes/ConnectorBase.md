# Abstract Class: ConnectorBase\<TSpec\>

Defined in: [canvas/src/primitives/base/ConnectorBase.ts:32](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/base/ConnectorBase.ts#L32)

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

Defined in: [canvas/src/primitives/base/ConnectorBase.ts:42](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/base/ConnectorBase.ts#L42)

#### Parameters

##### host

[`ConnectorHostInfo`](../interfaces/ConnectorHostInfo.md)

#### Returns

`ConnectorBase`\<`TSpec`\>

#### Overrides

[`PrimitiveBase`](PrimitiveBase.md).[`constructor`](PrimitiveBase.md#constructor)

## Properties

### bodyGfx

> `protected` `readonly` **bodyGfx**: `Graphics`

Defined in: [canvas/src/primitives/base/ConnectorBase.ts:36](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/base/ConnectorBase.ts#L36)

***

### gfx

> `readonly` **gfx**: `Container`

Defined in: [canvas/src/primitives/base/PrimitiveBase.ts:12](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/base/PrimitiveBase.ts#L12)

#### Implementation of

[`IConnector`](../interfaces/IConnector.md).[`gfx`](../interfaces/IConnector.md#gfx)

#### Inherited from

[`PrimitiveBase`](PrimitiveBase.md).[`gfx`](PrimitiveBase.md#gfx)

***

### host

> `protected` `readonly` **host**: [`ConnectorHostInfo`](../interfaces/ConnectorHostInfo.md)

Defined in: [canvas/src/primitives/base/ConnectorBase.ts:42](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/base/ConnectorBase.ts#L42)

***

### path

> `protected` **path**: [`Path`](../type-aliases/Path.md) = `[]`

Defined in: [canvas/src/primitives/base/ConnectorBase.ts:40](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/base/ConnectorBase.ts#L40)

***

### sourceMarkerGfx

> `protected` `readonly` **sourceMarkerGfx**: `Graphics`

Defined in: [canvas/src/primitives/base/ConnectorBase.ts:37](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/base/ConnectorBase.ts#L37)

***

### spec

> `protected` **spec**: `TSpec`

Defined in: [canvas/src/primitives/base/ConnectorBase.ts:39](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/base/ConnectorBase.ts#L39)

***

### targetMarkerGfx

> `protected` `readonly` **targetMarkerGfx**: `Graphics`

Defined in: [canvas/src/primitives/base/ConnectorBase.ts:38](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/base/ConnectorBase.ts#L38)

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [canvas/src/primitives/base/PrimitiveBase.ts:18](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/base/PrimitiveBase.ts#L18)

#### Returns

`void`

#### Implementation of

[`IConnector`](../interfaces/IConnector.md).[`destroy`](../interfaces/IConnector.md#destroy)

#### Inherited from

[`PrimitiveBase`](PrimitiveBase.md).[`destroy`](PrimitiveBase.md#destroy)

***

### draw()

> **draw**(`spec`, `path`): `void`

Defined in: [canvas/src/primitives/base/ConnectorBase.ts:91](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/base/ConnectorBase.ts#L91)

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

Defined in: [canvas/src/primitives/base/ConnectorBase.ts:84](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/base/ConnectorBase.ts#L84)

Render the path natively via Pixi commands (`moveTo` / `lineTo` /
`quadraticCurveTo` / `bezierCurveTo`) plus the spec's stroke (or `style`
override). Subclasses focus only on stroke style — markers are handled
by the base via `paintMarkers`.

#### Parameters

##### g

`Graphics`

##### spec

`TSpec`

##### path

[`Path`](../type-aliases/Path.md)

##### style?

[`ConnectorPaintStyle`](../interfaces/ConnectorPaintStyle.md)

#### Returns

`void`

***

### getVisiblePath()

> **getVisiblePath**(`spec`, `path`): [`Path`](../type-aliases/Path.md)

Defined in: [canvas/src/primitives/base/ConnectorBase.ts:129](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/base/ConnectorBase.ts#L129)

Path trimmed by the source / target marker insets at the *spec* stroke
width — i.e. the visible body of the connector. Decorations call this
when they need to parameterise along the segment markers actually
cover. Identity when no markers are configured.

#### Parameters

##### spec

`TSpec`

##### path

[`Path`](../type-aliases/Path.md)

#### Returns

[`Path`](../type-aliases/Path.md)

#### Implementation of

[`IConnector`](../interfaces/IConnector.md).[`getVisiblePath`](../interfaces/IConnector.md#getvisiblepath)

***

### paintInto()

> **paintInto**(`g`, `spec`, `path`, `style?`): `void`

Defined in: [canvas/src/primitives/base/ConnectorBase.ts:107](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/base/ConnectorBase.ts#L107)

Repaint the connector's full silhouette (path + markers) into a
caller-supplied `Graphics` with style overrides. Connector decorations
use this to draw with pixel-identical silhouette coverage.

#### Parameters

##### g

`Graphics`

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

> `protected` **paintMarkers**(`g`, `spec`, `path`, `style?`, `strokeWidth?`, `haloStrokeWidth?`): `void`

Defined in: [canvas/src/primitives/base/ConnectorBase.ts:185](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/base/ConnectorBase.ts#L185)

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

`Graphics`

##### spec

`TSpec`

##### path

[`Path`](../type-aliases/Path.md)

##### style?

[`ConnectorPaintStyle`](../interfaces/ConnectorPaintStyle.md)

##### strokeWidth?

`number` = `...`

##### haloStrokeWidth?

`number` = `strokeWidth`

Halo stroke thickness used when `style.markerHalo` is set. Decoupled
from `strokeWidth` (which sizes marker geometry) so a glow can outline
the marker at its halo width without scaling the marker itself.

#### Returns

`void`

***

### paintSourceMarker()

> `protected` **paintSourceMarker**(`g`, `spec`, `path`, `style?`, `strokeWidth?`, `haloStrokeWidth?`): `void`

Defined in: [canvas/src/primitives/base/ConnectorBase.ts:202](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/base/ConnectorBase.ts#L202)

#### Parameters

##### g

`Graphics`

##### spec

`TSpec`

##### path

[`Path`](../type-aliases/Path.md)

##### style?

[`ConnectorPaintStyle`](../interfaces/ConnectorPaintStyle.md)

##### strokeWidth?

`number` = `...`

##### haloStrokeWidth?

`number` = `strokeWidth`

#### Returns

`void`

***

### paintTargetMarker()

> `protected` **paintTargetMarker**(`g`, `spec`, `path`, `style?`, `strokeWidth?`, `haloStrokeWidth?`): `void`

Defined in: [canvas/src/primitives/base/ConnectorBase.ts:228](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/base/ConnectorBase.ts#L228)

#### Parameters

##### g

`Graphics`

##### spec

`TSpec`

##### path

[`Path`](../type-aliases/Path.md)

##### style?

[`ConnectorPaintStyle`](../interfaces/ConnectorPaintStyle.md)

##### strokeWidth?

`number` = `...`

##### haloStrokeWidth?

`number` = `strokeWidth`

#### Returns

`void`

***

### setBodyVisible()

> **setBodyVisible**(`visible`): `void`

Defined in: [canvas/src/primitives/base/ConnectorBase.ts:139](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/base/ConnectorBase.ts#L139)

Toggle the body stroke without affecting markers or decoration children.
Body, source marker, and target marker live in three sibling Graphics
under `gfx`, so each can be hidden independently. The next `draw()`
re-strokes the body but preserves the hidden state.

#### Parameters

##### visible

`boolean`

#### Returns

`void`

#### Implementation of

[`IConnector`](../interfaces/IConnector.md).[`setBodyVisible`](../interfaces/IConnector.md#setbodyvisible)

***

### setSourceMarkerVisible()

> **setSourceMarkerVisible**(`visible`): `void`

Defined in: [canvas/src/primitives/base/ConnectorBase.ts:144](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/base/ConnectorBase.ts#L144)

Toggle just the source-endpoint marker. See `setBodyVisible`.

#### Parameters

##### visible

`boolean`

#### Returns

`void`

#### Implementation of

[`IConnector`](../interfaces/IConnector.md).[`setSourceMarkerVisible`](../interfaces/IConnector.md#setsourcemarkervisible)

***

### setTargetMarkerVisible()

> **setTargetMarkerVisible**(`visible`): `void`

Defined in: [canvas/src/primitives/base/ConnectorBase.ts:149](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/base/ConnectorBase.ts#L149)

Toggle just the target-endpoint marker. See `setBodyVisible`.

#### Parameters

##### visible

`boolean`

#### Returns

`void`

#### Implementation of

[`IConnector`](../interfaces/IConnector.md).[`setTargetMarkerVisible`](../interfaces/IConnector.md#settargetmarkervisible)
