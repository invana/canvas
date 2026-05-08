# Connector marker scaling + arc-length trim

> Note: per your standing preference, plans usually go in the repo (`<feature>-plan.md`). Plan-mode restricts writes to this harness path; once approved I can copy this to the repo before implementation.

## Context

In the `StraightLineNoVertices` story, sliding `strokeWidth` from 3 → 7 thickens the line but leaves the arrow marker visually unchanged — the arrow's base ends up *narrower* than the line feeding into it.

The root cause is **not** the Graphics topology. Line and markers already paint into the same `bodyGfx` (`packages/canvas/src/primitives/base/ConnectorBase.ts:60-63`). The cause is that `ArrowMarkerSpec` exposes absolute `length`/`width` pixel fields that are independent of the connector's `stroke.width`, and the story passes literal `length: 12, width: 10` regardless of the slider.

This decision locks in for upcoming curve work too, because the same single-Graphics + marker-tangent pipeline (`tangentAt(path, 0/1)`) is what curves will reuse. Settle the sizing rule and the trim semantics now, before `Q`/`C` routers land.

## Decisions (from your answers)

1. **Multipliers only.** Replace marker `length`/`width` with `lengthScale`/`widthScale`. Final pixels = scale × strokeWidth. Breaking change to `arrowMarkerSpec` callers — acceptable pre-1.0.
2. **Width clamp.** Final marker base width is clamped to `max(widthScale × strokeWidth, strokeWidth)`. Length is not clamped.
3. **Arc-length trim.** `trimPathEnds` becomes correct on `Q` / `C` curves via De Casteljau subdivision. Forward-looking — has no behavioural effect on today's `straight` router but lights up cleanly when bezier/orthogonal routers ship.

## Changes

### 1. Marker spec — `packages/canvas/src/primitives/markers/ArrowMarker.ts`

Replace pixel fields with multiplier fields.

```ts
export interface ArrowMarkerSpec extends BaseShapeSpec {
  readonly kind: 'arrow';
  /** Length multiplier × strokeWidth = tip-to-base distance. Default 4. */
  readonly lengthScale?: number;
  /** Base-width multiplier × strokeWidth (clamped to ≥ strokeWidth). Default 3. */
  readonly widthScale?: number;
}
```

Update:
- `arrowMarkerSpec(...)` factory accepts the new fields.
- `bounds()` uses defaults (no strokeWidth available at instance-shape time → assume `strokeWidth = 1`, document this caveat; arrow-as-shape is a rare path).
- `static markerInset(spec, strokeWidth)` (signature change — see point 3) returns `(spec.lengthScale ?? 4) * strokeWidth`.
- `static paintInto(g, spec, anchor, angleRad, style, strokeWidth)` resolves
  - `len = (spec.lengthScale ?? 4) * strokeWidth`
  - `wid = max((spec.widthScale ?? 3) * strokeWidth, strokeWidth)` — the clamp.

Defaults rationale: at the story's default `strokeWidth = 2` you get `len=8, wid=6`, comparable to the current visual; at `strokeWidth = 7` you get `len=28, wid=21`, which scales naturally.

### 2. ShapeCtor signatures — `packages/canvas/src/primitives/types.ts`

Extend the optional static methods to accept `strokeWidth`:

```ts
readonly paintInto?: (
  g: Graphics,
  spec: Omit<TSpec, 'x' | 'y'>,
  anchor: Point,
  angleRad: number,
  style?: ShapePaintStyle,
  strokeWidth?: number,           // ← new
) => void;
readonly markerInset?: (
  spec: Omit<TSpec, 'x' | 'y'>,
  strokeWidth?: number,           // ← new
) => number;
```

`strokeWidth` is optional so non-marker uses (instance shapes calling `paintInto` directly) keep working with a sensible default of 1.

### 3. ConnectorBase plumbing — `packages/canvas/src/primitives/base/ConnectorBase.ts`

- Resolve `strokeWidth = spec.stroke?.width ?? 1` once per draw.
- `trimPathForMarkers` — pass `strokeWidth` to `markerInsetFor(...)`, which forwards to `Ctor.markerInset(spec, strokeWidth)`.
- `paintMarkers` — pass `strokeWidth` to `paintMarkerAt(...)` → `Ctor.paintInto(g, spec, anchor, angleRad, style, strokeWidth)`.

When the connector style overrides stroke (`style?.strokeWidth !== undefined` in `Connector.drawGeometry`), the override should also flow through to markers — use `style?.strokeWidth ?? spec.stroke?.width ?? 1`.

### 4. Arc-length trim — `packages/canvas/src/primitives/connectors/pathSampling.ts`

Today's `trimPathEnds` shifts curve endpoints by `endpoint - tangent × inset` — a chord-along-tangent step that diverges from the true curve on tight bends. Replace with arc-length-correct trimming:

- Add `trimSegmentEndByArcLength(segment, prevAnchor, distance)` and the mirror `trimSegmentStartByArcLength(...)` that:
  1. For `L`: solve linearly (current behaviour, exact).
  2. For `Q` / `C`: walk a fine substep table (reuse `QUAD_STEPS` / `CUBIC_STEPS`, double them — 24/32 — for trim accuracy), accumulate chord lengths until `distance` is consumed, refine `t` by linear interpolation between the bracketing samples, then **De Casteljau subdivide** the curve at `t` and keep the appropriate half. Return a new `Q` / `C` command.
- For multi-segment paths where the inset exceeds the last segment's length, consume the full segment and continue trimming into the prior segment. (Today this just produces a degenerate endpoint; arc-length-correct behaviour drops the consumed segment entirely.)

This is forward-looking — has no observable effect with the `straight` router but is the correct foundation for the `bezier` router on the roadmap.

## Storybook update — `apps/storybook/stories/Canvas/Primitives/Connectors/StraightLineNoVertices.stories.ts`

Replace literal marker dims with multipliers and let the resolved size follow `strokeWidth`:

```ts
arrowMarkerSpec({ lengthScale: 4, widthScale: 3, fill: settings.strokeColor })
```

No GUI changes required — sliding `strokeWidth` will now scale the arrow proportionally. Optional follow-up: expose `lengthScale` / `widthScale` sliders too (out of scope for this fix).

## Files touched

| File | Change |
|---|---|
| `packages/canvas/src/primitives/markers/ArrowMarker.ts` | Spec fields, `paintInto`/`markerInset`/`bounds` resolve from multipliers + clamp |
| `packages/canvas/src/primitives/types.ts` | `ShapeCtor.paintInto` and `ShapeCtor.markerInset` gain optional `strokeWidth` arg |
| `packages/canvas/src/primitives/base/ConnectorBase.ts` | Resolve strokeWidth once, plumb through to `markerInsetFor` and `paintMarkerAt` |
| `packages/canvas/src/primitives/connectors/pathSampling.ts` | Arc-length-aware `trimPathEnds` with De Casteljau subdivision for `Q`/`C` |
| `apps/storybook/stories/Canvas/Primitives/Connectors/StraightLineNoVertices.stories.ts` | Use `lengthScale` / `widthScale` instead of `length` / `width` |

## Verification

1. `pnpm --filter @invana/canvas build` and `pnpm check-types` — both must pass after the type-signature changes.
2. `pnpm --filter @canvas/storybook dev` → open `Canvas/Primitives/Connectors/StraightLineNoVertices`:
   - Slide `strokeWidth` from 1 → 10. Arrow length and base width must scale proportionally; arrow base must never look narrower than the line.
   - Toggle `showSourceMarker` / `showTargetMarker`. Markers continue to anchor exactly at the slider-controlled endpoints.
   - Drag source/target to make a near-zero-length connector; nothing should crash, marker rendering should degrade gracefully.
3. Inspect the path-trim by setting strokeWidth = 10 and zooming in — the line's end cap must sit cleanly behind the arrow base, with no visible gap or overshoot.
4. Per `packages/canvas/CLAUDE.md` §"Tests": no new tests in `packages/canvas`. The arc-length trim correctness on curves is forward-looking; visual verification will land with the `bezier` router story when it ships.

## Out of scope (intentional)

- New curve routers (`bezier`, `orthogonal`) — separate effort. This plan only readies the marker + trim pipeline.
- Other marker kinds (`circle`, `square`, `diamond`) — not yet implemented; when they land they should follow the same multiplier+clamp pattern set by `ArrowMarker`.
- Per-marker stroke (markers as outlined shapes rather than filled triangles).
- Connector decorations — `marching-ants`, `glow`, etc. are listed in `packages/canvas/CLAUDE.md` but don't yet exist in active code; unaffected by this change.
