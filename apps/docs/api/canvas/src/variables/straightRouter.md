# Variable: straightRouter

> `const` **straightRouter**: [`IRouter`](../type-aliases/IRouter.md)

Defined in: [canvas/src/primitives/connectors/routers/straight.ts:14](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/connectors/routers/straight.ts#L14)

Direct line from source through any waypoints to target.
Output: `[source, ...waypoints, target]` — a flat polyline.

Routers decide topology (where bends sit). The visual style of segments
between these points is owned by the downstream `PathStyle`:
- `normal` → straight segments (`M, L, L, …`)
- `rounded` → quadratic fillets at corners
- `smooth` → Catmull-Rom cubic spline
- `bezier` → single cubic A→B (intermediate points ignored)
