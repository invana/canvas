# Type Alias: GeometricLayoutMode

> **GeometricLayoutMode** = `"grid"` \| `"snake"` \| `"circular"`

Defined in: [graph-layout-geometric/src/types.ts:11](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-geometric/src/types.ts#L11)

Geometric layout mode.

- `'grid'` — nodes on a regular grid, filled row-major (left→right, top→bottom).
- `'snake'` — like `grid`, but every other row reverses direction (a serpentine
  / boustrophedon fill) so consecutive nodes stay adjacent across row breaks.
- `'circular'` — nodes spaced evenly around a single circle.
