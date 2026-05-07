# Interface: LineConnectorSpec

Defined in: [packages/canvas/src/renderers/draw/connectors/line.ts:16](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/connectors/line.ts#L16)

Minimal connector spec. Note: NO marker / label fields. A connector
primitive draws a polyline — nothing else. Layers compose markers/labels
as separate shape entries.

## Extends

- [`BaseConnectorSpec`](BaseConnectorSpec.md)

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [packages/canvas/src/renderers/draw/types.ts:95](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/types.ts#L95)

#### Inherited from

[`BaseConnectorSpec`](BaseConnectorSpec.md).[`alpha`](BaseConnectorSpec.md#alpha)

***

### cap?

> `readonly` `optional` **cap?**: `"butt"` \| `"round"` \| `"square"`

Defined in: [packages/canvas/src/renderers/draw/connectors/line.ts:21](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/connectors/line.ts#L21)

***

### join?

> `readonly` `optional` **join?**: `"round"` \| `"miter"` \| `"bevel"`

Defined in: [packages/canvas/src/renderers/draw/connectors/line.ts:22](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/connectors/line.ts#L22)

***

### kind

> `readonly` **kind**: `"line"`

Defined in: [packages/canvas/src/renderers/draw/connectors/line.ts:17](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/connectors/line.ts#L17)

#### Overrides

[`BaseConnectorSpec`](BaseConnectorSpec.md).[`kind`](BaseConnectorSpec.md#kind)

***

### router?

> `readonly` `optional` **router?**: `string`

Defined in: [packages/canvas/src/renderers/draw/types.ts:93](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/types.ts#L93)

Registered router kind. Default `'straight'`.

#### Inherited from

[`BaseConnectorSpec`](BaseConnectorSpec.md).[`router`](BaseConnectorSpec.md#router)

***

### source

> `readonly` **source**: [`ConnectorEndpointSpec`](../type-aliases/ConnectorEndpointSpec.md)

Defined in: [packages/canvas/src/renderers/draw/types.ts:90](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/types.ts#L90)

#### Inherited from

[`BaseConnectorSpec`](BaseConnectorSpec.md).[`source`](BaseConnectorSpec.md#source)

***

### stroke

> `readonly` **stroke**: `number`

Defined in: [packages/canvas/src/renderers/draw/connectors/line.ts:18](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/connectors/line.ts#L18)

***

### strokeAlpha?

> `readonly` `optional` **strokeAlpha?**: `number`

Defined in: [packages/canvas/src/renderers/draw/connectors/line.ts:20](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/connectors/line.ts#L20)

***

### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`

Defined in: [packages/canvas/src/renderers/draw/connectors/line.ts:19](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/connectors/line.ts#L19)

***

### target

> `readonly` **target**: [`ConnectorEndpointSpec`](../type-aliases/ConnectorEndpointSpec.md)

Defined in: [packages/canvas/src/renderers/draw/types.ts:91](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/types.ts#L91)

#### Inherited from

[`BaseConnectorSpec`](BaseConnectorSpec.md).[`target`](BaseConnectorSpec.md#target)

***

### visible?

> `readonly` `optional` **visible?**: `boolean`

Defined in: [packages/canvas/src/renderers/draw/types.ts:96](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/types.ts#L96)

#### Inherited from

[`BaseConnectorSpec`](BaseConnectorSpec.md).[`visible`](BaseConnectorSpec.md#visible)

***

### zIndex?

> `readonly` `optional` **zIndex?**: `number`

Defined in: [packages/canvas/src/renderers/draw/types.ts:94](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/types.ts#L94)

#### Inherited from

[`BaseConnectorSpec`](BaseConnectorSpec.md).[`zIndex`](BaseConnectorSpec.md#zindex)
