# Interface: DensityContourLayerState

Defined in: [graph-layer-d3-contour/src/types.ts:153](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph-layer-d3-contour/src/types.ts#L153)

Reserved. Neither layer currently projects user-mutated state — the
computed contour data is held as a private field, not in `Layer.state`,
because it's bulk geometry that's rebuilt wholesale on each recompute
rather than diffed.

## Properties

### \_placeholder?

> `readonly` `optional` **\_placeholder?**: `never`

Defined in: [graph-layer-d3-contour/src/types.ts:154](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph-layer-d3-contour/src/types.ts#L154)
