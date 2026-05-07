# Interface: BaseConnectorSpec

Defined in: [packages/canvas/src/renderers/draw/types.ts:88](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/types.ts#L88)

Minimal connector spec. Note: NO marker / label fields. A connector
primitive draws a polyline — nothing else. Layers compose markers/labels
as separate shape entries.

## Extended by

- [`LineConnectorSpec`](LineConnectorSpec.md)
- [`CurveConnectorSpec`](CurveConnectorSpec.md)

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [packages/canvas/src/renderers/draw/types.ts:95](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/types.ts#L95)

***

### kind

> `readonly` **kind**: `string`

Defined in: [packages/canvas/src/renderers/draw/types.ts:89](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/types.ts#L89)

***

### router?

> `readonly` `optional` **router?**: `string`

Defined in: [packages/canvas/src/renderers/draw/types.ts:93](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/types.ts#L93)

Registered router kind. Default `'straight'`.

***

### source

> `readonly` **source**: [`ConnectorEndpointSpec`](../type-aliases/ConnectorEndpointSpec.md)

Defined in: [packages/canvas/src/renderers/draw/types.ts:90](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/types.ts#L90)

***

### target

> `readonly` **target**: [`ConnectorEndpointSpec`](../type-aliases/ConnectorEndpointSpec.md)

Defined in: [packages/canvas/src/renderers/draw/types.ts:91](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/types.ts#L91)

***

### visible?

> `readonly` `optional` **visible?**: `boolean`

Defined in: [packages/canvas/src/renderers/draw/types.ts:96](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/types.ts#L96)

***

### zIndex?

> `readonly` `optional` **zIndex?**: `number`

Defined in: [packages/canvas/src/renderers/draw/types.ts:94](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/types.ts#L94)
