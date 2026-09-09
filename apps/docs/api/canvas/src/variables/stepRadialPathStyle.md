# Variable: stepRadialPathStyle

> `const` **stepRadialPathStyle**: [`IPathStyle`](../../../renderer-pixijs/src/type-aliases/IPathStyle.md)

Two-segment **radial step** (a.k.a. "elbow") link, matching the d3
`linkStep` helper used by the canonical Tree of Life example:

 1. Circular **arc** at the source's radius from the source angle to the
    target angle (constant-radius sweep along the parent's tier).
 2. Straight **radial line** outward from there to the target.

Visually this produces the boxy / angular cluster-dendrogram look — every
subtree fans out from a horizontal arc at its parent's radius, then shoots
outward as straight spokes. It's the right pick for radial *clusters*
(where all leaves sit on a single outer rim and the eye reads tiers via
the constant-radius arcs); the smooth [bumpRadialPathStyle](bumpRadialPathStyle.md) is the
right pick for radial *trees* (where edges should curve continuously).

The arc is approximated with cubic Bézier sub-arcs (≤ 90° each) using the
standard `k = (4/3) tan(θ/4) r` handle-length formula — visually
indistinguishable from a true SVG `A` command at any zoom, and stays a
flat sequence of `M / C / L` commands the Pixi renderer already knows
how to consume.

Pair with `router: 'straight'`; intermediate polyline waypoints are
ignored. Use `anchor: 'center'` on the edge so the tangent is computed
from the true node-centre angle (otherwise the arc would launch from the
trimmed boundary cut-point and read crooked).

Edge cases:
 - `r0 === 0` (source at the origin): emits a single straight `M → L`.
 - Source / target angles equal (single-child clade, or angular wrap
   collapses to zero): emits a straight radial `M → L`.
 - Polyline shorter than two points: returns `[]`.
