# Interface: PathStyleEndpoints

Defined in: [canvas/src/primitives/types.ts:141](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L141)

Anchor-resolved endpoints handed to a pathStyle alongside the polyline.

Tangent-aware pathStyles (`bump-horizontal`, …) read `source.tangent` /
`target.tangent` to place their Bézier handles along each shape's outward
surface normal, so the curve leaves and arrives flush with the silhouette
instead of in a hard-coded direction. Tangent-agnostic pathStyles (`normal`,
`rounded`, …) simply ignore the argument — it's optional and additive.

## Properties

### source

> `readonly` **source**: [`Endpoint`](Endpoint.md)

Defined in: [canvas/src/primitives/types.ts:142](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L142)

***

### target

> `readonly` **target**: [`Endpoint`](Endpoint.md)

Defined in: [canvas/src/primitives/types.ts:143](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L143)
