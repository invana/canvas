# Function: arrowMarkerSpec()

> **arrowMarkerSpec**(`size`, `style?`): `Omit`\<`PolygonShapeSpec`, `"x"` \| `"y"`\>

Defined in: [packages/canvas/src/renderers/markers/markers.ts:31](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/markers/markers.ts#L31)

Triangle pointing along `+x` (anchored at the tip). Use as a `targetMarker`
for a classic arrowhead-on-line — the connector orients it forward into
the target endpoint.

## Parameters

### size

`number`

### style?

[`MarkerStyle`](../interfaces/MarkerStyle.md)

## Returns

`Omit`\<`PolygonShapeSpec`, `"x"` \| `"y"`\>
