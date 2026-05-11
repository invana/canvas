# Type Alias: PathCommand

> **PathCommand** = \{ `kind`: `"M"`; `x`: `number`; `y`: `number`; \} \| \{ `kind`: `"L"`; `x`: `number`; `y`: `number`; \} \| \{ `cx`: `number`; `cy`: `number`; `kind`: `"Q"`; `x`: `number`; `y`: `number`; \} \| \{ `c1x`: `number`; `c1y`: `number`; `c2x`: `number`; `c2y`: `number`; `kind`: `"C"`; `x`: `number`; `y`: `number`; \}

Defined in: [packages/canvas/src/primitives/types.ts:66](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/types.ts#L66)

One step of a `Path`. Mirrors SVG path commands one-for-one:
- `M` move to absolute (x, y) — must be the first command of any Path.
- `L` line to (x, y) from the current point.
- `Q` quadratic Bézier with one control point.
- `C` cubic Bézier with two control points.

No relative variants, no arcs, no shorthand — pathStyles emit one of these
four. Connector renders by walking the path and dispatching to Pixi's
`moveTo` / `lineTo` / `quadraticCurveTo` / `bezierCurveTo`.
