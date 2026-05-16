# Function: sampleStops()

> **sampleStops**(`stops`, `index`, `total`): `number`

Defined in: [graph-layer-d3-contour/src/palettes.ts:93](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph-layer-d3-contour/src/palettes.ts#L93)

Linearly interpolate a `0xRRGGBB` colour from a stop array based on the
band's position `(index / (total - 1))`. Returns the last stop if there's
only one band or one stop.

## Parameters

### stops

`number`[]

### index

`number`

### total

`number`

## Returns

`number`
