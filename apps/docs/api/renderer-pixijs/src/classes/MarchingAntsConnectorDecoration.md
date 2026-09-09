# Class: MarchingAntsConnectorDecoration

Base for decorations that target connector primitives. Mirrors
`ShapeDecorationBase` — subclass implements `repaint`, the base handles
`mount` / `update` lifecycle.

Connector decorations receive the routed `Path` (not a polyline). When a
decoration needs uniform-arc-length sampling (rare — most decorations
call `connector.paintInto` for native dashed/styled strokes), it pulls
`samplePath(path, n)` from `primitives/connectors/pathSampling.ts`.

## Extends

- [`ConnectorDecorationBase`](ConnectorDecorationBase.md)\<[`MarchingAntsConnectorDecorationStyle`](../interfaces/MarchingAntsConnectorDecorationStyle.md)\>

## Constructors

### Constructor

> **new MarchingAntsConnectorDecoration**(`style`): `MarchingAntsConnectorDecoration`

#### Parameters

##### style

[`MarchingAntsConnectorDecorationStyle`](../interfaces/MarchingAntsConnectorDecorationStyle.md)

#### Returns

`MarchingAntsConnectorDecoration`

#### Overrides

[`ConnectorDecorationBase`](ConnectorDecorationBase.md).[`constructor`](ConnectorDecorationBase.md#constructor)

## Properties

### gfx

> `readonly` **gfx**: `Container`

#### Inherited from

[`ConnectorDecorationBase`](ConnectorDecorationBase.md).[`gfx`](ConnectorDecorationBase.md#gfx)

***

### host

> `protected` **host**: [`ConnectorDecorationHostInfo`](../interfaces/ConnectorDecorationHostInfo.md) = `null`

#### Inherited from

[`ConnectorDecorationBase`](ConnectorDecorationBase.md).[`host`](ConnectorDecorationBase.md#host)

***

### style

> `readonly` **style**: [`MarchingAntsConnectorDecorationStyle`](../interfaces/MarchingAntsConnectorDecorationStyle.md)

#### Inherited from

[`ConnectorDecorationBase`](ConnectorDecorationBase.md).[`style`](ConnectorDecorationBase.md#style)

## Methods

### destroy()

> **destroy**(): `void`

#### Returns

`void`

#### Inherited from

[`ConnectorDecorationBase`](ConnectorDecorationBase.md).[`destroy`](ConnectorDecorationBase.md#destroy)

***

### mount()

> **mount**(`host`): `void`

#### Parameters

##### host

[`ConnectorDecorationHostInfo`](../interfaces/ConnectorDecorationHostInfo.md)

#### Returns

`void`

#### Inherited from

[`ConnectorDecorationBase`](ConnectorDecorationBase.md).[`mount`](ConnectorDecorationBase.md#mount)

***

### repaint()

> `protected` **repaint**(): `void`

#### Returns

`void`

#### Overrides

[`ConnectorDecorationBase`](ConnectorDecorationBase.md).[`repaint`](ConnectorDecorationBase.md#repaint)

***

### tick()

> **tick**(`deltaMs`): `boolean`

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

[`ConnectorDecorationHostInfo`](../interfaces/ConnectorDecorationHostInfo.md)

#### Returns

`void`

#### Inherited from

[`ConnectorDecorationBase`](ConnectorDecorationBase.md).[`update`](ConnectorDecorationBase.md#update)
