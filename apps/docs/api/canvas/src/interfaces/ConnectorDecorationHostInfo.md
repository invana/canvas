# Interface: ConnectorDecorationHostInfo

Defined in: [packages/canvas/src/renderers/types.ts:210](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L210)

## Properties

### connector

> `readonly` **connector**: [`IConnector`](IConnector.md)

Defined in: [packages/canvas/src/renderers/types.ts:225](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L225)

The host connector instance. Decorations call `connector.paintInto(...)`
with style overrides to repaint the connector's full silhouette into
their own Graphics — see `ConnectorPaintStyle`. Decorations that need
polyline-only access can ignore this field.

***

### connectorSpec

> `readonly` **connectorSpec**: [`BaseConnectorSpec`](BaseConnectorSpec.md)

Defined in: [packages/canvas/src/renderers/types.ts:227](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L227)

Current spec of the host connector — passed into `connector.paintInto`.

***

### hostId

> `readonly` **hostId**: `string`

Defined in: [packages/canvas/src/renderers/types.ts:211](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L211)

***

### hostKind

> `readonly` **hostKind**: `string`

Defined in: [packages/canvas/src/renderers/types.ts:212](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L212)

***

### polyline

> `readonly` **polyline**: readonly [`ShapesPoint`](ShapesPoint.md)[]

Defined in: [packages/canvas/src/renderers/types.ts:215](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L215)

Routed polyline — same points the connector draws between.

***

### slot

> `readonly` **slot**: `string`

Defined in: [packages/canvas/src/renderers/types.ts:213](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L213)

***

### slotZIndex

> `readonly` **slotZIndex**: `number`

Defined in: [packages/canvas/src/renderers/types.ts:218](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L218)

***

### surface

> `readonly` **surface**: `Container`

Defined in: [packages/canvas/src/renderers/types.ts:217](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L217)

Connector-local surface (the connector's `gfx` Container).
