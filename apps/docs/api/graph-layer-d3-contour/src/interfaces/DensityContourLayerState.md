# Interface: DensityContourLayerState

Defined in: [graph-layer-d3-contour/src/types.ts:153](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layer-d3-contour/src/types.ts#L153)

Reserved. Neither layer currently projects user-mutated state — the
computed contour data is held as a private field, not in `Layer.state`,
because it's bulk geometry that's rebuilt wholesale on each recompute
rather than diffed.

## Properties

### \_placeholder?

> `readonly` `optional` **\_placeholder?**: `never`

Defined in: [graph-layer-d3-contour/src/types.ts:154](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layer-d3-contour/src/types.ts#L154)
