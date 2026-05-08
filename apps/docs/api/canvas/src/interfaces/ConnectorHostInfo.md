# Interface: ConnectorHostInfo

Defined in: packages/canvas/src/primitives/types.ts:276

Information a `Connector` instance receives at construction. The connector
resolves marker shapes via the read-only shape registry, then invokes each
marker class's static `paintInto` to render the marker into the
connector's `Graphics`.

## Properties

### shapeRegistry

> `readonly` **shapeRegistry**: `ReadonlyMap`\<`string`, [`ShapeCtor`](ShapeCtor.md)\<[`BaseShapeSpec`](BaseShapeSpec.md)\>\>

Defined in: packages/canvas/src/primitives/types.ts:278

***

### surface

> `readonly` **surface**: `Container`

Defined in: packages/canvas/src/primitives/types.ts:277
