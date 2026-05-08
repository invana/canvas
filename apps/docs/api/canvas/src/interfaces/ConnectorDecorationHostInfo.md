# Interface: ConnectorDecorationHostInfo

Defined in: packages/canvas/src/primitives/types.ts:304

Information a connector decoration receives. Decorations call
`host.connector.paintInto(g, spec, path, style)` for silhouette repaint,
or read `path` directly for parametric walking (e.g. label-along-path).

## Properties

### connector

> `readonly` **connector**: [`IConnector`](IConnector.md)

Defined in: packages/canvas/src/primitives/types.ts:310

***

### connectorSpec

> `readonly` **connectorSpec**: [`BaseConnectorSpec`](BaseConnectorSpec.md)

Defined in: packages/canvas/src/primitives/types.ts:311

***

### hostId

> `readonly` **hostId**: `string`

Defined in: packages/canvas/src/primitives/types.ts:305

***

### path

> `readonly` **path**: [`Path`](../type-aliases/Path.md)

Defined in: packages/canvas/src/primitives/types.ts:308

***

### slot

> `readonly` **slot**: `string`

Defined in: packages/canvas/src/primitives/types.ts:306

***

### slotZIndex

> `readonly` **slotZIndex**: `number`

Defined in: packages/canvas/src/primitives/types.ts:307

***

### surface

> `readonly` **surface**: `Container`

Defined in: packages/canvas/src/primitives/types.ts:309
