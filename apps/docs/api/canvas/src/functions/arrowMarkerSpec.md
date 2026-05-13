# Function: arrowMarkerSpec()

> **arrowMarkerSpec**(`spec?`): `Omit`\<[`ArrowMarkerSpec`](../interfaces/ArrowMarkerSpec.md), `"x"` \| `"y"`\>

Defined in: [packages/canvas/src/primitives/markers/ArrowMarker.ts:55](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/markers/ArrowMarker.ts#L55)

Convenience builder for connector marker specs (no `x` / `y`).
Usage: `connectorSpec.targetMarker = arrowMarkerSpec({ fill: 0x000000 })`.

## Parameters

### spec?

`Omit`\<[`ArrowMarkerSpec`](../interfaces/ArrowMarkerSpec.md), `"kind"` \| `"x"` \| `"y"`\> = `{}`

## Returns

`Omit`\<[`ArrowMarkerSpec`](../interfaces/ArrowMarkerSpec.md), `"x"` \| `"y"`\>
