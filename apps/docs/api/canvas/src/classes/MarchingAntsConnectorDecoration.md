# Class: MarchingAntsConnectorDecoration

Defined in: [canvas/src/primitives/decorations/connector/MarchingAntsConnectorDecoration.ts:35](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/MarchingAntsConnectorDecoration.ts#L35)

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

Defined in: [canvas/src/primitives/base/ConnectorDecorationBase.ts:21](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/base/ConnectorDecorationBase.ts#L21)

#### Parameters

##### style

[`MarchingAntsConnectorDecorationStyle`](../interfaces/MarchingAntsConnectorDecorationStyle.md)

#### Returns

`MarchingAntsConnectorDecoration`

#### Inherited from

[`ConnectorDecorationBase`](ConnectorDecorationBase.md).[`constructor`](ConnectorDecorationBase.md#constructor)

## Properties

### gfx

> `readonly` **gfx**: `Container`

Defined in: [canvas/src/primitives/base/PrimitiveBase.ts:12](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/base/PrimitiveBase.ts#L12)

#### Inherited from

[`ConnectorDecorationBase`](ConnectorDecorationBase.md).[`gfx`](ConnectorDecorationBase.md#gfx)

***

### host

> `protected` **host**: [`ConnectorDecorationHostInfo`](../interfaces/ConnectorDecorationHostInfo.md) = `null`

Defined in: [canvas/src/primitives/base/ConnectorDecorationBase.ts:19](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/base/ConnectorDecorationBase.ts#L19)

#### Inherited from

[`ConnectorDecorationBase`](ConnectorDecorationBase.md).[`host`](ConnectorDecorationBase.md#host)

***

### style

> `readonly` **style**: [`MarchingAntsConnectorDecorationStyle`](../interfaces/MarchingAntsConnectorDecorationStyle.md)

Defined in: [canvas/src/primitives/base/ConnectorDecorationBase.ts:18](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/base/ConnectorDecorationBase.ts#L18)

#### Inherited from

[`ConnectorDecorationBase`](ConnectorDecorationBase.md).[`style`](ConnectorDecorationBase.md#style)

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [canvas/src/primitives/base/PrimitiveBase.ts:18](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/base/PrimitiveBase.ts#L18)

#### Returns

`void`

#### Inherited from

[`ConnectorDecorationBase`](ConnectorDecorationBase.md).[`destroy`](ConnectorDecorationBase.md#destroy)

***

### mount()

> **mount**(`host`): `void`

Defined in: [canvas/src/primitives/base/ConnectorDecorationBase.ts:27](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/base/ConnectorDecorationBase.ts#L27)

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

Defined in: [canvas/src/primitives/decorations/connector/MarchingAntsConnectorDecoration.ts:39](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/MarchingAntsConnectorDecoration.ts#L39)

#### Returns

`void`

#### Overrides

[`ConnectorDecorationBase`](ConnectorDecorationBase.md).[`repaint`](ConnectorDecorationBase.md#repaint)

***

### tick()

> **tick**(`deltaMs`): `boolean`

Defined in: [canvas/src/primitives/decorations/connector/MarchingAntsConnectorDecoration.ts:45](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/MarchingAntsConnectorDecoration.ts#L45)

#### Parameters

##### deltaMs

`number`

#### Returns

`boolean`

***

### update()

> **update**(`host`): `void`

Defined in: [canvas/src/primitives/base/ConnectorDecorationBase.ts:34](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/base/ConnectorDecorationBase.ts#L34)

#### Parameters

##### host

[`ConnectorDecorationHostInfo`](../interfaces/ConnectorDecorationHostInfo.md)

#### Returns

`void`

#### Inherited from

[`ConnectorDecorationBase`](ConnectorDecorationBase.md).[`update`](ConnectorDecorationBase.md#update)
