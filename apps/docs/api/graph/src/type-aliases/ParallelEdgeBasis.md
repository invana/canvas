# Type Alias: ParallelEdgeBasis

> **ParallelEdgeBasis** = `"auto"` \| `"perpendicular"` \| `"axis-aligned"`

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
