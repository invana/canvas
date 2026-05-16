# Function: arrowMarkerSpec()

> **arrowMarkerSpec**(`spec?`): `Omit`\<[`ArrowMarkerSpec`](../interfaces/ArrowMarkerSpec.md), `"x"` \| `"y"`\>

Defined in: [canvas/src/primitives/markers/ArrowMarker.ts:55](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/markers/ArrowMarker.ts#L55)

Convenience builder for connector marker specs (no `x` / `y`).
Usage: `connectorSpec.targetMarker = arrowMarkerSpec({ fill: 0x000000 })`.

## Parameters

### spec?

`Omit`\<[`ArrowMarkerSpec`](../interfaces/ArrowMarkerSpec.md), `"kind"` \| `"x"` \| `"y"`\> = `{}`

## Returns

`Omit`\<[`ArrowMarkerSpec`](../interfaces/ArrowMarkerSpec.md), `"x"` \| `"y"`\>
