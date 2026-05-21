# Interface: PathStyleEndpoints

Defined in: [canvas/src/primitives/types.ts:141](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L141)

Anchor-resolved endpoints handed to a pathStyle alongside the polyline.

Tangent-aware pathStyles (`bump-horizontal`, …) read `source.tangent` /
`target.tangent` to place their Bézier handles along each shape's outward
surface normal, so the curve leaves and arrives flush with the silhouette
instead of in a hard-coded direction. Tangent-agnostic pathStyles (`normal`,
`rounded`, …) simply ignore the argument — it's optional and additive.

## Properties

### source

> `readonly` **source**: [`Endpoint`](Endpoint.md)

Defined in: [canvas/src/primitives/types.ts:142](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L142)

***

### target

> `readonly` **target**: [`Endpoint`](Endpoint.md)

Defined in: [canvas/src/primitives/types.ts:143](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L143)
