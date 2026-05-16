# Variable: oneSideRouter

> `const` **oneSideRouter**: [`IRouter`](../type-aliases/IRouter.md)

Defined in: [canvas/src/primitives/connectors/routers/oneSide.ts:40](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/connectors/routers/oneSide.ts#L40)

oneSide router — forces the line to exit the source on a designated side,
then routes orthogonally to the target. Useful for swimlane / "all on one
side" diagrams where every connector must leave the source in the same
direction regardless of where the target is.

Polyline shape:
  `source → exit → midBend → target`

- `exit`     — source stepped `padLength` along the side direction.
- `midBend`  — perpendicular to the side at the target's parallel axis
               (so the leg from exit→midBend is along the side direction
               inverted, and midBend→target is perpendicular).

For 'right' / 'left' the exit/midBend legs are horizontal then vertical;
for 'top' / 'bottom' they're vertical then horizontal. When source and
target are perfectly aligned with the side direction the path collapses
to a single-leg traversal.

Waypoints are not honoured by this router — its purpose is the forced
exit, not free-form routing. Pass `manhattan` for waypoint routing.
