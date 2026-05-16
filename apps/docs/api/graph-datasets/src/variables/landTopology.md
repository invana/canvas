# Variable: landTopology

> `const` **landTopology**: [`LandTopology`](../interfaces/LandTopology.md)

Defined in: [graph-datasets/src/air-routes/index.ts:70](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph-datasets/src/air-routes/index.ts#L70)

1:50m world land outline as TopoJSON. Pair with `topojson-client.feature`
to materialize the GeoJSON `MultiPolygon`, then sample with `d3-geo`'s
`geoPath` over a custom canvas projection.
