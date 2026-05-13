# Class: Connector

Defined in: [packages/canvas/src/primitives/connectors/Connector.ts:20](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/connectors/Connector.ts#L20)

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

Defined in: [packages/canvas/src/primitives/base/ConnectorBase.ts:37](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/base/ConnectorBase.ts#L37)

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

Defined in: [packages/canvas/src/primitives/base/ConnectorBase.ts:31](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/base/ConnectorBase.ts#L31)

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`bodyGfx`](ConnectorBase.md#bodygfx)

***

### gfx

> `readonly` **gfx**: `Container`

Defined in: [packages/canvas/src/primitives/base/PrimitiveBase.ts:12](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/base/PrimitiveBase.ts#L12)

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`gfx`](ConnectorBase.md#gfx)

***

### host

> `protected` `readonly` **host**: [`ConnectorHostInfo`](../interfaces/ConnectorHostInfo.md)

Defined in: [packages/canvas/src/primitives/base/ConnectorBase.ts:37](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/base/ConnectorBase.ts#L37)

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`host`](ConnectorBase.md#host)

***

### path

> `protected` **path**: [`Path`](../type-aliases/Path.md) = `[]`

Defined in: [packages/canvas/src/primitives/base/ConnectorBase.ts:35](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/base/ConnectorBase.ts#L35)

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`path`](ConnectorBase.md#path)

***

### sourceMarkerGfx

> `protected` `readonly` **sourceMarkerGfx**: [`Graphics`](../interfaces/Graphics.md)

Defined in: [packages/canvas/src/primitives/base/ConnectorBase.ts:32](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/base/ConnectorBase.ts#L32)

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`sourceMarkerGfx`](ConnectorBase.md#sourcemarkergfx)

***

### spec

> `protected` **spec**: [`BaseConnectorSpec`](../interfaces/BaseConnectorSpec.md)

Defined in: [packages/canvas/src/primitives/base/ConnectorBase.ts:34](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/base/ConnectorBase.ts#L34)

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`spec`](ConnectorBase.md#spec)

***

### targetMarkerGfx

> `protected` `readonly` **targetMarkerGfx**: [`Graphics`](../interfaces/Graphics.md)

Defined in: [packages/canvas/src/primitives/base/ConnectorBase.ts:33](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/base/ConnectorBase.ts#L33)

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`targetMarkerGfx`](ConnectorBase.md#targetmarkergfx)

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [packages/canvas/src/primitives/base/PrimitiveBase.ts:18](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/base/PrimitiveBase.ts#L18)

#### Returns

`void`

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`destroy`](ConnectorBase.md#destroy)

***

### draw()

> **draw**(`spec`, `path`): `void`

Defined in: [packages/canvas/src/primitives/base/ConnectorBase.ts:65](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/base/ConnectorBase.ts#L65)

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

Defined in: [packages/canvas/src/primitives/connectors/Connector.ts:21](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/connectors/Connector.ts#L21)

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

### getVisiblePath()

> **getVisiblePath**(`spec`, `path`): [`Path`](../type-aliases/Path.md)

Defined in: [packages/canvas/src/primitives/base/ConnectorBase.ts:103](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/base/ConnectorBase.ts#L103)

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

Defined in: [packages/canvas/src/primitives/base/ConnectorBase.ts:81](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/base/ConnectorBase.ts#L81)

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

> `protected` **paintMarkers**(`g`, `spec`, `path`, `style?`, `strokeWidth?`, `haloStrokeWidth?`): `void`

Defined in: [packages/canvas/src/primitives/base/ConnectorBase.ts:159](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/base/ConnectorBase.ts#L159)

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

Defined in: [packages/canvas/src/primitives/base/ConnectorBase.ts:176](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/base/ConnectorBase.ts#L176)

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

##### haloStrokeWidth?

`number` = `strokeWidth`

#### Returns

`void`

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`paintSourceMarker`](ConnectorBase.md#paintsourcemarker)

***

### paintTargetMarker()

> `protected` **paintTargetMarker**(`g`, `spec`, `path`, `style?`, `strokeWidth?`, `haloStrokeWidth?`): `void`

Defined in: [packages/canvas/src/primitives/base/ConnectorBase.ts:202](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/base/ConnectorBase.ts#L202)

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

##### haloStrokeWidth?

`number` = `strokeWidth`

#### Returns

`void`

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`paintTargetMarker`](ConnectorBase.md#painttargetmarker)

***

### setBodyVisible()

> **setBodyVisible**(`visible`): `void`

Defined in: [packages/canvas/src/primitives/base/ConnectorBase.ts:113](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/base/ConnectorBase.ts#L113)

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

Defined in: [packages/canvas/src/primitives/base/ConnectorBase.ts:118](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/base/ConnectorBase.ts#L118)

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

Defined in: [packages/canvas/src/primitives/base/ConnectorBase.ts:123](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/base/ConnectorBase.ts#L123)

Toggle just the target-endpoint marker. See `setBodyVisible`.

#### Parameters

##### visible

`boolean`

#### Returns

`void`

#### Inherited from

[`ConnectorBase`](ConnectorBase.md).[`setTargetMarkerVisible`](ConnectorBase.md#settargetmarkervisible)
