# Variable: metroRouter

> `const` **metroRouter**: [`IRouter`](../type-aliases/IRouter.md)

Defined in: [packages/canvas/src/primitives/connectors/routers/metro.ts:34](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/connectors/routers/metro.ts#L34)

Metro router — manhattan-style topology with 45° diagonals.

Pipeline (lazy A*):
  1. Compute the simple geometric metro polyline first — one straight
     axis-aligned leg followed by a 45° diagonal absorbing the remaining
     distance. Mirrors classic transit-map line drawing.
  2. If `ctx.obstacles` is empty OR no segment of the simple polyline
     crosses an inflated obstacle, return it directly.
  3. Otherwise run A* with **connectivity 8** (H + V + 45° moves) on a
     coarse grid. Simplify cell runs and convert back to world coords.

Connectivity 8 is what makes this metro-shaped: diagonal cost `√2` is
cheaper than two cardinals (`1 + 1 = 2`), so A* prefers 45° moves where
obstacles permit — producing the metro look around obstacles too.
