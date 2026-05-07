# Interface: ConnectorHostInfo

Defined in: [packages/canvas/src/renderers/types.ts:151](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L151)

Information a `Connector` instance receives at construction. The connector
gets a surface to attach to plus read-only access to the shape registry —
the latter is needed because connectors paint markers via the registered
shape constructors' static `paintInto` method (markers are shapes; there
is no separate marker registry).

## Properties

### shapeRegistry

> `readonly` **shapeRegistry**: `ReadonlyMap`\<`string`, [`ShapeCtor`](ShapeCtor.md)\<[`BaseShapeSpec`](BaseShapeSpec.md)\>\>

Defined in: [packages/canvas/src/renderers/types.ts:160](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L160)

Read-only view of the renderer's shape registry. The connector looks up
a `ShapeCtor` by `spec.sourceMarker.kind` / `spec.targetMarker.kind` and
invokes its static `paintInto` to render the marker into the connector's
Graphics. Throws (clear error) if the marker's kind is not registered or
its ctor does not expose `paintInto`.

***

### surface

> `readonly` **surface**: `Container`

Defined in: [packages/canvas/src/renderers/types.ts:152](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L152)
