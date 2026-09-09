# Function: trimPathEnds()

> **trimPathEnds**(`path`, `startInset`, `endInset`): [`Path`](../../../renderer-pixijs/src/type-aliases/Path.md)

Pull the path's start / end anchors inward by the requested arc-length
insets so the connector body stops short of where its markers will be
drawn. Markers themselves still anchor at the *original* endpoints (their
tips touch the target) — only the body is shortened.

Correctness:
  - `L` segments are trimmed in closed form (exact).
  - `Q` / `C` segments are trimmed by walking arc length over a fine
    sub-step table, refining the parameter `t` between bracketing samples,
    and **De Casteljau subdividing** the curve at `t`. The kept half is
    emitted as a new `Q` / `C` command, preserving correct curvature on
    tight bends — chord-along-tangent approximation would diverge.
  - When an inset exceeds the trailing segment's arc length, the segment
    is consumed entirely and the trim continues into the prior segment.

v0 only ships the `straight` router, so curve trimming is forward-looking
scaffolding for the upcoming `bezier` / `orthogonal` routers.

## Parameters

### path

[`Path`](../../../renderer-pixijs/src/type-aliases/Path.md)

### startInset

`number`

### endInset

`number`

## Returns

[`Path`](../../../renderer-pixijs/src/type-aliases/Path.md)
