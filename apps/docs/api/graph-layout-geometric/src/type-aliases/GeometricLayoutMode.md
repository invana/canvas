# Type Alias: GeometricLayoutMode

> **GeometricLayoutMode** = `"grid"` \| `"snake"` \| `"circular"`

Geometric layout mode.

- `'grid'` — nodes on a regular grid, filled row-major (left→right, top→bottom).
- `'snake'` — like `grid`, but every other row reverses direction (a serpentine
  / boustrophedon fill) so consecutive nodes stay adjacent across row breaks.
- `'circular'` — nodes spaced evenly around a single circle.
