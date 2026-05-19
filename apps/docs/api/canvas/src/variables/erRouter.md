# Variable: erRouter

> `const` **erRouter**: [`IRouter`](../type-aliases/IRouter.md)

Defined in: [canvas/src/primitives/connectors/routers/er.ts:26](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/connectors/routers/er.ts#L26)

ER (entity-relationship) router — exits each endpoint perpendicular to
its boundary, then routes orthogonally between the stub points.

Reads the outward `tangent` set by the `boundary` anchor on each endpoint.
Each stub leg is `tangent * stubLength`. The bridge between stubs is a
single H-or-V segment plus one bend, picked so the bend axis alternates
with each stub direction (horizontal stubs → vertical bridge first).

Falls back to a single bend (manhattan-equivalent) when neither endpoint
has a tangent. Waypoints are inserted between the stubs as plain
polyline points (no extra orthogonalisation pass).
