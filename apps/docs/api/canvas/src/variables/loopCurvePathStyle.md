# Variable: loopCurvePathStyle

> `const` **loopCurvePathStyle**: [`IPathStyle`](../type-aliases/IPathStyle.md)

Defined in: [canvas/src/primitives/connectors/pathStyles/loopCurve.ts:157](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/connectors/pathStyles/loopCurve.ts#L157)

Self-loop pathStyle — single cubic Bézier "balloon / petal / teardrop"
drawn between two foot points. Mirrors AntV G6's `loop-curve` placement
model: cardinal placements (`top`, `right`, `bottom`, `left`) put both
feet on the same edge of the host; diagonal placements (`top-right`,
`bottom-right`, `bottom-left`, `top-left`) put the two feet on the two
adjacent edges that meet at the named corner.

The path style runs in one of two modes depending on the polyline it
receives:

 - **Two-foot mode** (preferred): when `polyline[0]` and `polyline[N-1]`
   are distinct (chord length > COINCIDENT\_EPS), they are used
   as the two feet. The caller positions them via anchors — typically
   an `edge-port` anchor on the source endpoint and another on the
   target endpoint. The path style only shapes the curve between them.

 - **Single-pivot mode** (legacy): when the two endpoints coincide
   (typical when both source and target use the `center` anchor on the
   same shape), the feet are synthesised from `pivotOffset`,
   `baseOffset` and `width`. `baseOffset` shifts the foot midpoint
   along `angle`; `width` separates the feet perpendicular to it.
   Useful when no edge-port anchor is configured.

Geometry (both modes): given two feet `start` and `end`, the tip sits
at `chordMid + bloom * radius`, and the two cubic control points are
placed at `tip ± chordDir * bulge`. `bulge > chordLen/2` → balloon
(controls splayed outward past the feet); `bulge = chordLen/2` →
parallel-sided U; `bulge < chordLen/2` → teardrop (controls converge).

Pair with `router: 'straight'`. The polyline content between
`polyline[0]` and `polyline[N-1]` is ignored.

Edge cases:
 - Polyline shorter than one point: returns `[]`.
 - `width = 0` in single-pivot mode: feet coincide → closed teardrop
   cusp; the arrow marker lands on the start point.
