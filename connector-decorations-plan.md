# Connector Animations / Effects / Decorations — Catalog & Priorities

## Context

Today `packages/canvas` ships exactly **one** connector decoration (`marching-ants-connector`) and **zero** connector effects, while the shape side has glow, pulse-ring, liquid-fill, marching-ants + shake/breathing effects. The connector pipeline (`anchor → router → pathStyle → Path`) plus existing path-sampling helpers (`pathSampling.samplePath`, `tangentAt`, `pathBounds`) and the per-frame animation driver (`PrimitivesRenderer.tickAnimations`, `Tween`) already give us everything we need to add a richer set of connector visuals. This doc catalogs candidates, classifies them per the three-orthogonal-concepts rule (decoration adds geometry; effect modulates host style/transform; animation is the per-frame driver), and picks a first batch to actually implement.

---

## Classification primer

- **Decoration** — emits *new* geometry onto a graphics object owned by the renderer. May be static or call `tick()` to animate.
- **Effect** — does *not* emit geometry. Returns `readTransform()` / `readStyle()` contributions that the renderer aggregates onto the host primitive each frame.
- **Animation** — the per-frame `tick(deltaMs)` itself. Decorations and effects can both opt-in; not a separate kind.

For connectors today there is *no* `ConnectorEffectBase` — only `ConnectorDecorationBase`. Adding effects would mean teaching `Connector.paintInto` to read aggregated style/transform contributions the same way shapes do.

---

## Catalog

### A. Decorations — animated marker(s) along path

| Name | Kind string | Sketch | Notes |
|---|---|---|---|
| Fly marker | `fly-marker-connector` | Single dot/glyph travels endpoint→endpoint at speed `pxPerSec`. Loops or one-shot. | Use `samplePath` + `tangentAt` for position + rotation. Marker shape selectable: `circle`, `arrow`, `square`, custom Graphics. |
| Flow particles | `flow-particles-connector` | N markers spread evenly along path, all advancing at the same speed. | Same engine as fly-marker, just N phases. |
| Comet | `comet-connector` | Fly-marker with a fading tail of length `tailPx`. | Render tail as a short dashed stroke with alpha-fade per dash, head as a solid disc. |
| Highlight beam | `beam-connector` | Bright segment of length `beamPx` slides along path with alpha falloff. | Like fly-marker but stroke-shaped, not a glyph. |

### B. Decorations — emitter / pulse-style

| Name | Kind string | Sketch | Notes |
|---|---|---|---|
| Ripple along path | `ripple-connector` | At point `t∈[0,1]` of the path, emit concentric ripples that expand perpendicular to the tangent and fade. | Phase-distribute N ripples; analogous to shape `pulse-ring`. |
| Endpoint pulse | `endpoint-pulse-connector` | Pulse rings at source / target / both endpoints. | Cheaper version of ripple; great for "incoming data" cues. Can reuse the shape `PulseRingDecoration` math. |
| Path trace / reveal | `path-trace-connector` | Path draws itself from start to end (or strokes a *visible-length* window that grows then resets). | Implement via dashed stroke with one long dash whose length is animated. |

### C. Decorations — geometry overlay (mostly static, optional pulse)

| Name | Kind string | Sketch | Notes |
|---|---|---|---|
| Glow connector | `glow-connector` | Soft halo around the stroke (parity with shape `glow`). Optional sinusoidal pulse. | Repaint path N times with widening strokeWidth + quadratic alpha falloff. |
| Shadow stroke | `shadow-connector` | Offset drop shadow behind the path. | Static, no `tick()` needed. |
| Double stroke | `double-stroke-connector` | Parallel secondary stroke offset by `gapPx` (e.g. for "two-way", "high-bandwidth" cues). | Static; compute offset polyline once. |
| Lightning / jitter | `jitter-connector` | Noise-perturb sample points each frame for an "electric" stroke. | Animated; uses xorshift32 like `ShakeEffect` for stable per-frame randomness. |
| Gradient flow | `gradient-flow-connector` | Animated color band flowing along the stroke direction. | Implemented as dashed stroke where each dash gets a hue-shifted color; offset advances per frame. |

### D. Effects (require new `ConnectorEffectBase` plumbing)

| Name | Kind string | Sketch | Notes |
|---|---|---|---|
| Breathing stroke | `breathing-connector` | `strokeWidth` and/or `alpha` oscillates sinusoidally. No new geometry. | Direct analogue of shape `BreathingEffect`. Needs `Connector.paintInto` to honour `styleOverride.strokeWidth` / `alpha` from aggregated effects. |
| Fade pulse | `fade-pulse-connector` | Alpha oscillates between two values. | Subset of breathing; could be one option of breathing. |
| Color cycle | `color-cycle-connector` | Hue-rotate the stroke color over time. | Same plumbing as breathing. |
| Shake endpoints | `shake-endpoints-connector` | Wobble endpoint positions slightly. | More complex — has to mutate the input polyline before pathStyle runs. Probably defer. |

---

## First batch (locked in)

1. **`fly-marker-connector`** — bedrock for comet / beam later. Single moving marker; opts: `markerKind: 'circle'|'arrow'|'square'`, `pxPerSec`, `loop`, `phase`, `size`, `color`. **Decoration + animation.** Use `samplePath` + `tangentAt` for position and rotation.
2. **`flow-particles-connector`** — N markers at evenly-spread phases. Same engine as fly-marker, parametrize `count` and per-particle `phaseOffset`. **Decoration + animation.**
3. **`glow-connector`** — parity with shape `glow`. Repaint path N times with widening strokeWidth + quadratic alpha falloff. Static by default, optional `pulse` flag using `Tween`. **Decoration (+ optional animation).**
4. **`ripple-connector`** — parity with shape `pulse-ring`, emitted at a fixed `t∈[0,1]` along the path (default `0.5`). Phase-distribute N rings; ring expands perpendicular to local tangent. **Decoration + animation.**
5. **`breathing-connector`** — first connector **effect**. Sinusoidal modulation of `strokeWidth` and/or `alpha` over period `periodMs` with `amplitude`. **No new geometry.** Requires the plumbing below.

### ConnectorEffectBase plumbing (prerequisite for #5)

Mirror what shape effects already do:

- New base class `packages/canvas/src/primitives/effects/connector/ConnectorEffectBase.ts` with `readStyle(): { strokeWidthMul?: number; alphaMul?: number; tint?: number } | null` and optional `tick(deltaMs): boolean`.
- `PrimitivesRenderer` gets a `connectorEffects` set parallel to its existing shape effects set; aggregates contributions per connector each frame.
- `Connector.paintInto(gfx, spec, path, styleOverride)` already accepts a `styleOverride` — extend `BaseConnectorSpec` resolution to multiply `strokeWidth` and `alpha` by the aggregated factors before painting.
- Verify `MarchingAntsConnectorDecoration` still composes correctly (it bypasses host paint, so it should be unaffected — confirm).

### Deferred (next batch)

- comet, beam, path-trace, shadow-stroke, double-stroke, gradient-flow, color-cycle, fade-pulse, jitter.
- `shake-endpoints` is deferred indefinitely — it has to mutate the polyline pre-router/pathStyle, which is a bigger architectural change.

---

## Critical files

- `packages/canvas/src/primitives/decorations/connector/MarchingAntsConnectorDecoration.ts` — the only existing connector decoration; pattern to follow for new ones.
- `packages/canvas/src/primitives/decorations/connector/ConnectorDecorationBase.ts` — base class to extend.
- `packages/canvas/src/connectors/pathSampling.ts` — `samplePath`, `tangentAt`, `pathBounds` (reuse, don't reimplement).
- `packages/canvas/src/connectors/Connector.ts` — `paintInto`, `emitDashedStroke` helpers.
- `packages/canvas/src/primitives/decorations/shape/PulseRingDecoration.ts` — math to mirror in `ripple-connector`.
- `packages/canvas/src/primitives/decorations/shape/GlowDecoration.ts` — math to mirror in `glow-connector`.
- `packages/canvas/src/primitives/effects/shape/BreathingEffect.ts` — pattern for `breathing-connector` once `ConnectorEffectBase` is added.
- `packages/canvas/src/primitives/renderer/PrimitivesRenderer.ts` (animated set, tick loop) — likely needs a sibling `connectorEffects` aggregator.

---

## Verification

- Add one story per decoration under `apps/storybook/stories/` (memory: code inside `play`, flat JSON, post-render `canvas.camera.fitContent(layer.getBounds(), 100)`).
- Visual smoke: open `pnpm --filter @canvas/storybook dev` (port 6006), verify each animates, then disable to confirm no leaked tickers.
- `pnpm check-types` and `pnpm --filter @invana/canvas build` must pass.
- No tests in `packages/canvas` (per memory).
