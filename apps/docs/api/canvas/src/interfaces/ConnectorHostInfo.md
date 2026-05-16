# Interface: ConnectorHostInfo

Defined in: [canvas/src/primitives/types.ts:562](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L562)

Information a `Connector` instance receives at construction. The connector
resolves marker shapes via the read-only shape registry, then invokes each
marker class's static `paintInto` to render the marker into the
connector's `Graphics`.

## Properties

### shapeRegistry

> `readonly` **shapeRegistry**: `ReadonlyMap`\<`string`, [`ShapeCtor`](ShapeCtor.md)\<[`BaseShapeSpec`](BaseShapeSpec.md)\>\>

Defined in: [canvas/src/primitives/types.ts:564](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L564)

***

### surface

> `readonly` **surface**: `Container`

Defined in: [canvas/src/primitives/types.ts:563](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L563)
