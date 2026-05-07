# Interface: CurveConnectorSpec

Defined in: [packages/canvas/src/renderers/draw/connectors/curve.ts:22](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/connectors/curve.ts#L22)

Minimal connector spec. Note: NO marker / label fields. A connector
primitive draws a polyline — nothing else. Layers compose markers/labels
as separate shape entries.

## Extends

- [`BaseConnectorSpec`](BaseConnectorSpec.md)

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [packages/canvas/src/renderers/draw/types.ts:95](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/types.ts#L95)

#### Inherited from

[`BaseConnectorSpec`](BaseConnectorSpec.md).[`alpha`](BaseConnectorSpec.md#alpha)

***

### cap?

> `readonly` `optional` **cap?**: `"butt"` \| `"round"` \| `"square"`

Defined in: [packages/canvas/src/renderers/draw/connectors/curve.ts:27](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/connectors/curve.ts#L27)

***

### kind

> `readonly` **kind**: `"curve"`

Defined in: [packages/canvas/src/renderers/draw/connectors/curve.ts:23](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/connectors/curve.ts#L23)

#### Overrides

[`BaseConnectorSpec`](BaseConnectorSpec.md).[`kind`](BaseConnectorSpec.md#kind)

***

### router?

> `readonly` `optional` **router?**: `string`

Defined in: [packages/canvas/src/renderers/draw/types.ts:93](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/types.ts#L93)

Registered router kind. Default `'straight'`.

#### Inherited from

[`BaseConnectorSpec`](BaseConnectorSpec.md).[`router`](BaseConnectorSpec.md#router)

***

### source

> `readonly` **source**: [`ConnectorEndpointSpec`](../type-aliases/ConnectorEndpointSpec.md)

Defined in: [packages/canvas/src/renderers/draw/types.ts:90](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/types.ts#L90)

#### Inherited from

[`BaseConnectorSpec`](BaseConnectorSpec.md).[`source`](BaseConnectorSpec.md#source)

***

### stroke

> `readonly` **stroke**: `number`

Defined in: [packages/canvas/src/renderers/draw/connectors/curve.ts:24](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/connectors/curve.ts#L24)

***

### strokeAlpha?

> `readonly` `optional` **strokeAlpha?**: `number`

Defined in: [packages/canvas/src/renderers/draw/connectors/curve.ts:26](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/connectors/curve.ts#L26)

***

### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`

Defined in: [packages/canvas/src/renderers/draw/connectors/curve.ts:25](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/connectors/curve.ts#L25)

***

### target

> `readonly` **target**: [`ConnectorEndpointSpec`](../type-aliases/ConnectorEndpointSpec.md)

Defined in: [packages/canvas/src/renderers/draw/types.ts:91](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/types.ts#L91)

#### Inherited from

[`BaseConnectorSpec`](BaseConnectorSpec.md).[`target`](BaseConnectorSpec.md#target)

***

### visible?

> `readonly` `optional` **visible?**: `boolean`

Defined in: [packages/canvas/src/renderers/draw/types.ts:96](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/types.ts#L96)

#### Inherited from

[`BaseConnectorSpec`](BaseConnectorSpec.md).[`visible`](BaseConnectorSpec.md#visible)

***

### zIndex?

> `readonly` `optional` **zIndex?**: `number`

Defined in: [packages/canvas/src/renderers/draw/types.ts:94](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/types.ts#L94)

#### Inherited from

[`BaseConnectorSpec`](BaseConnectorSpec.md).[`zIndex`](BaseConnectorSpec.md#zindex)
