# Interface: DensityContourLayerState

Reserved. Neither layer currently projects user-mutated state — the
computed contour data is held as a private field, not in `Layer.state`,
because it's bulk geometry that's rebuilt wholesale on each recompute
rather than diffed.

## Properties

### \_placeholder?

> `readonly` `optional` **\_placeholder?**: `never`
