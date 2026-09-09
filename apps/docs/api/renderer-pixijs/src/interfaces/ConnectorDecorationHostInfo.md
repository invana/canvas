# Interface: ConnectorDecorationHostInfo

Information a connector decoration receives. Decorations call
`host.connector.paintInto(g, spec, path, style)` for silhouette repaint,
or read `path` directly for parametric walking (e.g. label-along-path).

## Properties

### connector

> `readonly` **connector**: [`IConnector`](IConnector.md)

***

### connectorSpec

> `readonly` **connectorSpec**: [`BaseConnectorSpec`](BaseConnectorSpec.md)

***

### hostId

> `readonly` **hostId**: `string`

***

### path

> `readonly` **path**: [`Path`](../type-aliases/Path.md)

***

### slot

> `readonly` **slot**: `string`

***

### slotZIndex

> `readonly` **slotZIndex**: `number`

***

### surface

> `readonly` **surface**: `Container`
