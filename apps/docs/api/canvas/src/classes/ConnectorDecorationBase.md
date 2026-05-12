# Abstract Class: ConnectorDecorationBase\<TStyle\>

Defined in: [packages/canvas/src/primitives/base/ConnectorDecorationBase.ts:14](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/base/ConnectorDecorationBase.ts#L14)

Base for decorations that target connector primitives. Mirrors
`ShapeDecorationBase` — subclass implements `repaint`, the base handles
`mount` / `update` lifecycle.

Connector decorations receive the routed `Path` (not a polyline). When a
decoration needs uniform-arc-length sampling (rare — most decorations
call `connector.paintInto` for native dashed/styled strokes), it pulls
`samplePath(path, n)` from `primitives/connectors/pathSampling.ts`.

## Extends

- [`PrimitiveBase`](PrimitiveBase.md)

## Type Parameters

### TStyle

`TStyle`

## Implements

- [`IConnectorDecoration`](../type-aliases/IConnectorDecoration.md)\<`TStyle`\>

## Constructors

### Constructor

> **new ConnectorDecorationBase**\<`TStyle`\>(`style`): `ConnectorDecorationBase`\<`TStyle`\>

Defined in: [packages/canvas/src/primitives/base/ConnectorDecorationBase.ts:21](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/base/ConnectorDecorationBase.ts#L21)

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

Defined in: [packages/canvas/src/primitives/base/PrimitiveBase.ts:12](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/base/PrimitiveBase.ts#L12)

#### Inherited from

[`PrimitiveBase`](PrimitiveBase.md).[`gfx`](PrimitiveBase.md#gfx)

***

### host

> `protected` **host**: [`ConnectorDecorationHostInfo`](../interfaces/ConnectorDecorationHostInfo.md) = `null`

Defined in: [packages/canvas/src/primitives/base/ConnectorDecorationBase.ts:19](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/base/ConnectorDecorationBase.ts#L19)

***

### style

> `readonly` **style**: `TStyle`

Defined in: [packages/canvas/src/primitives/base/ConnectorDecorationBase.ts:18](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/base/ConnectorDecorationBase.ts#L18)

#### Implementation of

`IConnectorDecoration.style`

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [packages/canvas/src/primitives/base/PrimitiveBase.ts:18](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/base/PrimitiveBase.ts#L18)

#### Returns

`void`

#### Implementation of

`IConnectorDecoration.destroy`

#### Inherited from

[`PrimitiveBase`](PrimitiveBase.md).[`destroy`](PrimitiveBase.md#destroy)

***

### mount()

> **mount**(`host`): `void`

Defined in: [packages/canvas/src/primitives/base/ConnectorDecorationBase.ts:27](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/base/ConnectorDecorationBase.ts#L27)

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

Defined in: [packages/canvas/src/primitives/base/ConnectorDecorationBase.ts:39](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/base/ConnectorDecorationBase.ts#L39)

#### Returns

`void`

***

### update()

> **update**(`host`): `void`

Defined in: [packages/canvas/src/primitives/base/ConnectorDecorationBase.ts:34](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/base/ConnectorDecorationBase.ts#L34)

#### Parameters

##### host

[`ConnectorDecorationHostInfo`](../interfaces/ConnectorDecorationHostInfo.md)

#### Returns

`void`

#### Implementation of

`IConnectorDecoration.update`
