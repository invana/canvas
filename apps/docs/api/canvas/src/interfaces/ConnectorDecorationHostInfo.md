# Interface: ConnectorDecorationHostInfo

Defined in: [canvas/src/primitives/types.ts:668](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L668)

Information a connector decoration receives. Decorations call
`host.connector.paintInto(g, spec, path, style)` for silhouette repaint,
or read `path` directly for parametric walking (e.g. label-along-path).

## Properties

### connector

> `readonly` **connector**: [`IConnector`](IConnector.md)

Defined in: [canvas/src/primitives/types.ts:674](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L674)

***

### connectorSpec

> `readonly` **connectorSpec**: [`BaseConnectorSpec`](BaseConnectorSpec.md)

Defined in: [canvas/src/primitives/types.ts:675](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L675)

***

### hostId

> `readonly` **hostId**: `string`

Defined in: [canvas/src/primitives/types.ts:669](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L669)

***

### path

> `readonly` **path**: [`Path`](../type-aliases/Path.md)

Defined in: [canvas/src/primitives/types.ts:672](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L672)

***

### slot

> `readonly` **slot**: `string`

Defined in: [canvas/src/primitives/types.ts:670](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L670)

***

### slotZIndex

> `readonly` **slotZIndex**: `number`

Defined in: [canvas/src/primitives/types.ts:671](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L671)

***

### surface

> `readonly` **surface**: `Container`

Defined in: [canvas/src/primitives/types.ts:673](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L673)
