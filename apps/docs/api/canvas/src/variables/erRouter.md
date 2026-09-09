# Variable: erRouter

> `const` **erRouter**: [`IRouter`](../../../renderer-pixijs/src/type-aliases/IRouter.md)

ER (entity-relationship) router — exits each endpoint perpendicular to
its boundary, then routes orthogonally between the stub points.

Reads the outward `tangent` set by the `boundary` anchor on each endpoint.
Each stub leg is `tangent * stubLength`. The bridge between stubs is a
single H-or-V segment plus one bend, picked so the bend axis alternates
with each stub direction (horizontal stubs → vertical bridge first).

Falls back to a single bend (manhattan-equivalent) when neither endpoint
has a tangent. Waypoints are inserted between the stubs as plain
polyline points (no extra orthogonalisation pass).
