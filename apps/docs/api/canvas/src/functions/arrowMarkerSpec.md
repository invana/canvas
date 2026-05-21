# Function: arrowMarkerSpec()

> **arrowMarkerSpec**(`spec?`): `Omit`\<[`ArrowMarkerSpec`](../interfaces/ArrowMarkerSpec.md), `"x"` \| `"y"`\>

Defined in: [canvas/src/primitives/markers/ArrowMarker.ts:55](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/markers/ArrowMarker.ts#L55)

Convenience builder for connector marker specs (no `x` / `y`).
Usage: `connectorSpec.targetMarker = arrowMarkerSpec({ fill: 0x000000 })`.

## Parameters

### spec?

`Omit`\<[`ArrowMarkerSpec`](../interfaces/ArrowMarkerSpec.md), `"kind"` \| `"x"` \| `"y"`\> = `{}`

## Returns

`Omit`\<[`ArrowMarkerSpec`](../interfaces/ArrowMarkerSpec.md), `"x"` \| `"y"`\>
