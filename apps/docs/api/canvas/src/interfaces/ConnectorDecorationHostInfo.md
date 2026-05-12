# Interface: ConnectorDecorationHostInfo

Defined in: [packages/canvas/src/primitives/types.ts:539](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L539)

Information a connector decoration receives. Decorations call
`host.connector.paintInto(g, spec, path, style)` for silhouette repaint,
or read `path` directly for parametric walking (e.g. label-along-path).

## Properties

### connector

> `readonly` **connector**: [`IConnector`](IConnector.md)

Defined in: [packages/canvas/src/primitives/types.ts:545](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L545)

***

### connectorSpec

> `readonly` **connectorSpec**: [`BaseConnectorSpec`](BaseConnectorSpec.md)

Defined in: [packages/canvas/src/primitives/types.ts:546](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L546)

***

### hostId

> `readonly` **hostId**: `string`

Defined in: [packages/canvas/src/primitives/types.ts:540](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L540)

***

### path

> `readonly` **path**: [`Path`](../type-aliases/Path.md)

Defined in: [packages/canvas/src/primitives/types.ts:543](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L543)

***

### slot

> `readonly` **slot**: `string`

Defined in: [packages/canvas/src/primitives/types.ts:541](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L541)

***

### slotZIndex

> `readonly` **slotZIndex**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:542](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L542)

***

### surface

> `readonly` **surface**: `Container`

Defined in: [packages/canvas/src/primitives/types.ts:544](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L544)
