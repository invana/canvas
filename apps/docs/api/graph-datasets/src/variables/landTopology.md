# Variable: landTopology

> `const` **landTopology**: `LandTopology`

1:50m world land outline as TopoJSON. Pair with `topojson-client.feature`
to materialize the GeoJSON `MultiPolygon`, then sample with `d3-geo`'s
`geoPath` over a custom canvas projection.
