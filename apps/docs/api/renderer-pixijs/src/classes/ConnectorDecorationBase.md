# Abstract Class: ConnectorDecorationBase\<TStyle\>

Base for decorations that target connector primitives. Mirrors
`ShapeDecorationBase` — subclass implements `repaint`, the base handles
`mount` / `update` lifecycle.

Connector decorations receive the routed `Path` (not a polyline). When a
decoration needs uniform-arc-length sampling (rare — most decorations
call `connector.paintInto` for native dashed/styled strokes), it pulls
`samplePath(path, n)` from `primitives/connectors/pathSampling.ts`.

## Extends

- [`PrimitiveBase`](PrimitiveBase.md)

## Extended by

- [`MarchingAntsConnectorDecoration`](MarchingAntsConnectorDecoration.md)
- [`RingConnectorDecoration`](RingConnectorDecoration.md)
- [`FlyMarkerConnectorDecoration`](FlyMarkerConnectorDecoration.md)
- [`FlowParticlesConnectorDecoration`](FlowParticlesConnectorDecoration.md)
- [`GlowConnectorDecoration`](GlowConnectorDecoration.md)
- [`RippleConnectorDecoration`](RippleConnectorDecoration.md)
- [`RevealConnectorDecoration`](RevealConnectorDecoration.md)
- [`LabelConnectorDecoration`](LabelConnectorDecoration.md)

## Type Parameters

### TStyle

`TStyle`

## Implements

- [`IConnectorDecoration`](../type-aliases/IConnectorDecoration.md)\<`TStyle`\>

## Constructors

### Constructor

> **new ConnectorDecorationBase**\<`TStyle`\>(`style`): `ConnectorDecorationBase`\<`TStyle`\>

#### Parameters

##### style

`TStyle`

#### Returns

`ConnectorDecorationBase`\<`TStyle`\>

#### Overrides

[`PrimitiveBase`](PrimitiveBase.md).[`constructor`](PrimitiveBase.md#constructor)

## Properties

### gfx

> `readonly` **gfx**: `Container`

#### Inherited from

[`PrimitiveBase`](PrimitiveBase.md).[`gfx`](PrimitiveBase.md#gfx)

***

### host

> `protected` **host**: [`ConnectorDecorationHostInfo`](../interfaces/ConnectorDecorationHostInfo.md) = `null`

***

### style

> `readonly` **style**: `TStyle`

#### Implementation of

`IConnectorDecoration.style`

## Methods

### destroy()

> **destroy**(): `void`

#### Returns

`void`

#### Implementation of

`IConnectorDecoration.destroy`

#### Inherited from

[`PrimitiveBase`](PrimitiveBase.md).[`destroy`](PrimitiveBase.md#destroy)

***

### mount()

> **mount**(`host`): `void`

#### Parameters

##### host

[`ConnectorDecorationHostInfo`](../interfaces/ConnectorDecorationHostInfo.md)

#### Returns

`void`

#### Implementation of

`IConnectorDecoration.mount`

***

### repaint()

> `abstract` `protected` **repaint**(): `void`

#### Returns

`void`

***

### update()

> **update**(`host`): `void`

#### Parameters

##### host

[`ConnectorDecorationHostInfo`](../interfaces/ConnectorDecorationHostInfo.md)

#### Returns

`void`

#### Implementation of

`IConnectorDecoration.update`
