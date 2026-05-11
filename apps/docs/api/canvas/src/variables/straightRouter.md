# Variable: straightRouter

> `const` **straightRouter**: [`IRouter`](../type-aliases/IRouter.md)

Defined in: [packages/canvas/src/primitives/connectors/routers/straight.ts:14](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/connectors/routers/straight.ts#L14)

Direct line from source through any waypoints to target.
Output: `[source, ...waypoints, target]` — a flat polyline.

Routers decide topology (where bends sit). The visual style of segments
between these points is owned by the downstream `PathStyle`:
- `normal` → straight segments (`M, L, L, …`)
- `rounded` → quadratic fillets at corners
- `smooth` → Catmull-Rom cubic spline
- `bezier` → single cubic A→B (intermediate points ignored)
