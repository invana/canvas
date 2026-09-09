# Interface: PathStyleEndpoints

Anchor-resolved endpoints handed to a pathStyle alongside the polyline.

Tangent-aware pathStyles (`bump-horizontal`, …) read `source.tangent` /
`target.tangent` to place their Bézier handles along each shape's outward
surface normal, so the curve leaves and arrives flush with the silhouette
instead of in a hard-coded direction. Tangent-agnostic pathStyles (`normal`,
`rounded`, …) simply ignore the argument — it's optional and additive.

## Properties

### source

> `readonly` **source**: [`Endpoint`](Endpoint.md)

***

### target

> `readonly` **target**: [`Endpoint`](Endpoint.md)
