# Type Alias: ParallelEdgeBasis

> **ParallelEdgeBasis** = `"auto"` \| `"perpendicular"` \| `"axis-aligned"`

Defined in: [graph/src/behaviours/ParallelEdgeBehaviour.ts:72](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/ParallelEdgeBehaviour.ts#L72)

Axis along which a group of parallel edges spreads.

- `'auto'` — derive from each edge's `pathType`. Axis-aligned routers
  (`manhattan`, `orth`, `rounded`) use `'axis-aligned'`; all others use
  `'perpendicular'`.
- `'perpendicular'` — offset along the unit vector perpendicular to
  `target - source`. Suitable for curve-through-midpoint styles
  (`straight`, `smooth`, `bundle`).
- `'axis-aligned'` — offset along the non-dominant axis between source and
  target. Suitable for axis-aligned routers (`manhattan`, `orth`,
  `rounded`) where the bow control point should sit on a horizontal or
  vertical mid-corridor.
