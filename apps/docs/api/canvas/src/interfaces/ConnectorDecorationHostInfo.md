# Interface: ConnectorDecorationHostInfo

Defined in: [canvas/src/primitives/types.ts:590](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L590)

Information a connector decoration receives. Decorations call
`host.connector.paintInto(g, spec, path, style)` for silhouette repaint,
or read `path` directly for parametric walking (e.g. label-along-path).

## Properties

### connector

> `readonly` **connector**: [`IConnector`](IConnector.md)

Defined in: [canvas/src/primitives/types.ts:596](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L596)

***

### connectorSpec

> `readonly` **connectorSpec**: [`BaseConnectorSpec`](BaseConnectorSpec.md)

Defined in: [canvas/src/primitives/types.ts:597](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L597)

***

### hostId

> `readonly` **hostId**: `string`

Defined in: [canvas/src/primitives/types.ts:591](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L591)

***

### path

> `readonly` **path**: [`Path`](../type-aliases/Path.md)

Defined in: [canvas/src/primitives/types.ts:594](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L594)

***

### slot

> `readonly` **slot**: `string`

Defined in: [canvas/src/primitives/types.ts:592](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L592)

***

### slotZIndex

> `readonly` **slotZIndex**: `number`

Defined in: [canvas/src/primitives/types.ts:593](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L593)

***

### surface

> `readonly` **surface**: `Container`

Defined in: [canvas/src/primitives/types.ts:595](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L595)
