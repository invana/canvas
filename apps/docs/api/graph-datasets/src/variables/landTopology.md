# Variable: landTopology

> `const` **landTopology**: [`LandTopology`](../interfaces/LandTopology.md)

Defined in: [graph-datasets/src/air-routes/index.ts:70](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-datasets/src/air-routes/index.ts#L70)

1:50m world land outline as TopoJSON. Pair with `topojson-client.feature`
to materialize the GeoJSON `MultiPolygon`, then sample with `d3-geo`'s
`geoPath` over a custom canvas projection.
