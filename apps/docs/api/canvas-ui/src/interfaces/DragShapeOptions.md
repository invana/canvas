# Interface: DragShapeOptions

The subset of `DragShapeBehaviourOptions` this editor produces — a
serialisable patch. The base `id` / `targetLayerId` / `enabled` / `shortcuts`
fields are out of scope, and the non-serialisable `renderer` handle + `filter`
predicate are omitted; only the tunable scalars round-trip.

## Properties

### dragCursor?

> `optional` **dragCursor?**: `string`

Cursor applied while a shape is being dragged.

***

### reRouteConnectors?

> `optional` **reRouteConnectors?**: `boolean`

Re-route every connector after each move (obstacle-aware routers).
