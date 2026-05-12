# Function: arrowMarkerSpec()

> **arrowMarkerSpec**(`spec?`): `Omit`\<[`ArrowMarkerSpec`](../interfaces/ArrowMarkerSpec.md), `"x"` \| `"y"`\>

Defined in: [packages/canvas/src/primitives/markers/ArrowMarker.ts:55](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/markers/ArrowMarker.ts#L55)

Convenience builder for connector marker specs (no `x` / `y`).
Usage: `connectorSpec.targetMarker = arrowMarkerSpec({ fill: 0x000000 })`.

## Parameters

### spec?

`Omit`\<[`ArrowMarkerSpec`](../interfaces/ArrowMarkerSpec.md), `"kind"` \| `"x"` \| `"y"`\> = `{}`

## Returns

`Omit`\<[`ArrowMarkerSpec`](../interfaces/ArrowMarkerSpec.md), `"x"` \| `"y"`\>
