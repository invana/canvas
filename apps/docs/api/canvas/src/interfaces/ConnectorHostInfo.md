# Interface: ConnectorHostInfo

Defined in: [packages/canvas/src/primitives/types.ts:511](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/types.ts#L511)

Information a `Connector` instance receives at construction. The connector
resolves marker shapes via the read-only shape registry, then invokes each
marker class's static `paintInto` to render the marker into the
connector's `Graphics`.

## Properties

### shapeRegistry

> `readonly` **shapeRegistry**: `ReadonlyMap`\<`string`, [`ShapeCtor`](ShapeCtor.md)\<[`BaseShapeSpec`](BaseShapeSpec.md)\>\>

Defined in: [packages/canvas/src/primitives/types.ts:513](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/types.ts#L513)

***

### surface

> `readonly` **surface**: `Container`

Defined in: [packages/canvas/src/primitives/types.ts:512](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/types.ts#L512)
