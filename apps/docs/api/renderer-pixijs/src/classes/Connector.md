# Class: Connector

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

#### Parameters

##### host

[`ConnectorHostInfo`](../interfaces/ConnectorHostInfo.md)

#### Returns

`Connector`

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`constructor`](ConnectorBase.md#constructor)

## Properties

### bodyGfx

> `protected` `readonly` **bodyGfx**: `Graphics`

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`bodyGfx`](ConnectorBase.md#bodygfx)

***

### gfx

> `readonly` **gfx**: `Container`

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`gfx`](ConnectorBase.md#gfx)

***

### host

> `protected` `readonly` **host**: [`ConnectorHostInfo`](../interfaces/ConnectorHostInfo.md)

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`host`](ConnectorBase.md#host)

***

### path

> `protected` **path**: [`Path`](../type-aliases/Path.md) = `[]`

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`path`](ConnectorBase.md#path)

***

### sourceMarkerGfx

> `protected` `readonly` **sourceMarkerGfx**: `Graphics`

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`sourceMarkerGfx`](ConnectorBase.md#sourcemarkergfx)

***

### spec

> `protected` **spec**: [`BaseConnectorSpec`](../interfaces/BaseConnectorSpec.md)

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`spec`](ConnectorBase.md#spec)

***

### targetMarkerGfx

> `protected` `readonly` **targetMarkerGfx**: `Graphics`

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`targetMarkerGfx`](ConnectorBase.md#targetmarkergfx)

## Methods

### destroy()

> **destroy**(): `void`

#### Returns

`void`

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`destroy`](ConnectorBase.md#destroy)

***

### draw()

> **draw**(`spec`, `path`): `void`

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

Render the path natively via Pixi commands (`moveTo` / `lineTo` /
`quadraticCurveTo` / `bezierCurveTo`) plus the spec's stroke (or `style`
override). Subclasses focus only on stroke style — markers are handled
by the base via `paintMarkers`.

#### Parameters

##### g

`Graphics`

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

### getVisiblePath()

> **getVisiblePath**(`spec`, `path`): [`Path`](../type-aliases/Path.md)

Path trimmed by the source / target marker insets at the *spec* stroke
width — i.e. the visible body of the connector. Decorations call this
when they need to parameterise along the segment markers actually
cover. Identity when no markers are configured.

#### Parameters

##### spec

[`BaseConnectorSpec`](../interfaces/BaseConnectorSpec.md)

##### path

[`Path`](../type-aliases/Path.md)

#### Returns

[`Path`](../type-aliases/Path.md)

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`getVisiblePath`](ConnectorBase.md#getvisiblepath)

***

### paintInto()

> **paintInto**(`g`, `spec`, `path`, `style?`): `void`

Repaint the connector's full silhouette (path + markers) into a
caller-supplied `Graphics` with style overrides. Connector decorations
use this to draw with pixel-identical silhouette coverage.

#### Parameters

##### g

`Graphics`

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

> `protected` **paintMarkers**(`g`, `spec`, `path`, `style?`, `strokeWidth?`, `haloStrokeWidth?`): `void`

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

[`BaseConnectorSpec`](../interfaces/BaseConnectorSpec.md)

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

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`paintMarkers`](ConnectorBase.md#paintmarkers)

***

### paintSourceMarker()

> `protected` **paintSourceMarker**(`g`, `spec`, `path`, `style?`, `strokeWidth?`, `haloStrokeWidth?`): `void`

#### Parameters

##### g

`Graphics`

##### spec

[`BaseConnectorSpec`](../interfaces/BaseConnectorSpec.md)

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

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`paintSourceMarker`](ConnectorBase.md#paintsourcemarker)

***

### paintTargetMarker()

> `protected` **paintTargetMarker**(`g`, `spec`, `path`, `style?`, `strokeWidth?`, `haloStrokeWidth?`): `void`

#### Parameters

##### g

`Graphics`

##### spec

[`BaseConnectorSpec`](../interfaces/BaseConnectorSpec.md)

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

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`paintTargetMarker`](ConnectorBase.md#painttargetmarker)

***

### setBodyVisible()

> **setBodyVisible**(`visible`): `void`

Toggle the body stroke without affecting markers or decoration children.
Body, source marker, and target marker live in three sibling Graphics
under `gfx`, so each can be hidden independently. The next `draw()`
re-strokes the body but preserves the hidden state.

#### Parameters

##### visible

`boolean`

#### Returns

`void`

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`setBodyVisible`](ConnectorBase.md#setbodyvisible)

***

### setSourceMarkerVisible()

> **setSourceMarkerVisible**(`visible`): `void`

Toggle just the source-endpoint marker. See `setBodyVisible`.

#### Parameters

##### visible

`boolean`

#### Returns

`void`

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`setSourceMarkerVisible`](ConnectorBase.md#setsourcemarkervisible)

***

### setTargetMarkerVisible()

> **setTargetMarkerVisible**(`visible`): `void`

Toggle just the target-endpoint marker. See `setBodyVisible`.

#### Parameters

##### visible

`boolean`

#### Returns

`void`

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`setTargetMarkerVisible`](ConnectorBase.md#settargetmarkervisible)
