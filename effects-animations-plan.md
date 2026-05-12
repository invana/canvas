# Effects and Animations — implementation plan

## Context

The canvas engine has Decorations (additive geometry attached to shapes/connectors — only `GlowDecoration` exists today, static) and a per-frame ticker hook (`renderer.tickAnimations(dt)` called from `Canvas.tickOnce`). It has **no** Effect concept (modulations of the host's transform or style) and **no** shared Tween primitive — any animated decoration would have to roll its own easing/duration math.

This change introduces a clean three-concept model — **Decoration**, **Effect**, **Animation** — so authors can compose visuals like pulse rings (decoration), shake/breathing (transform effects), liquid-fill (style effect, deferred), and so on, without bloating the Decoration contract or forking the animation loop.

Initial shipping scope is the smallest end-to-end slice that proves the architecture: the Tween primitive plus one concrete consumer per kind.

## Conceptual model

Three orthogonal concepts:

1. **Decoration** — an *added* visual layer attached to a host. New geometry, drawn in the host's surface at a slot z-index. (Already exists. Examples: glow, halo, pulse-ring, marching-ants, ring.)
2. **Effect** — a *modulation* of the host itself. Single `EffectBase` with `target: 'transform' | 'style'` discriminator.
   - `target: 'transform'` — writes `{dx, dy, dRot, sx, sy}` deltas. Renderer composes onto the host gfx transform each frame. Spec is untouched.
   - `target: 'style'` — writes `{tint?, alpha?}` overrides. Renderer applies via Pixi tint/alpha on the host gfx.
3. **Animation** — the time engine. The Canvas ticker. Animated decorations and effects subscribe via `tick(dt)`. `Tween` is the primitive authors use inside `tick` to drive interpolation.

Stacking: multiple effects/decorations per host, slot-keyed.
- Transform deltas: dx/dy/dRot **sum**; sx/sy **multiply**.
- Style overrides: **last-writer-wins per channel** (alpha, tint).
- Decorations stack by z-index as today.

## What we're building (initial slice)

### 1. `Tween` primitive

`packages/canvas/src/primitives/animation/Tween.ts`

```ts
interface TweenOptions {
  from: number;
  to: number;
  duration: number;            // ms
  easing?: (t: number) => number;
  repeat?: number | 'forever';
  yoyo?: boolean;
  onUpdate?: (v: number) => void;
  onComplete?: () => void;
}

class Tween {
  constructor(opts: TweenOptions);
  tick(dt: number): boolean;   // false ⇒ done
  reset(): void;
  get value(): number;
  get done(): boolean;
}
```

`packages/canvas/src/primitives/animation/easings.ts` — `linear`, `easeInOutSine`, `easeOutCubic`, `easeInOutCubic`.

### 2. `EffectBase` + `setEffect` API

- `packages/canvas/src/primitives/base/EffectBase.ts` — abstract class with `target`, `style`, `mount/update/destroy`, optional `tick`, and one of `readTransform()` / `readStyle()`.
- `packages/canvas/src/primitives/types.ts` — add `IEffect`, `EffectSpec`, `EffectTarget`, `EffectHostInfo`, `TransformDelta`, `StyleOverride`.

Renderer changes in `packages/canvas/src/primitives/PrimitivesRenderer.ts`:

- New `effectRegistry: Map<string, EffectRegistryEntry>`.
- `registerEffect(kind, ctor, { target: 'shape' | 'connector' | 'both' })` — mirrors `registerDecoration` (line ~199).
- `setEffect(targetId, slot, spec | null)` — symmetric to `setDecoration` (line ~306).
- `ShapeInstance.effects: Map<string, IEffect<unknown>>` (and same on `ConnectorInstance`).
- Extend `tickAnimations(dt)` (line ~485):
  1. Tick animated decorations (current behaviour).
  2. Tick each effect. Track which hosts have transform/style writes.
  3. For each dirty host: aggregate transform-effects → write host gfx transform; aggregate style-effects → write tint/alpha.
  4. Retire any decoration/effect whose `tick` returned `false`.
- Hot path: hosts whose effect-set is empty are skipped entirely.

### 3. Concrete primitives (one of each)

| File | Kind | Class |
|---|---|---|
| `primitives/effects/shape/ShakeEffect.ts` | `shake` | transform effect — random dx/dy each frame, scaled by `amplitude`; optional `decay` Tween |
| `primitives/effects/shape/BreathingEffect.ts` | `breathing` | transform effect — `sx = sy = 1 + amp * sin(2π t / period)` |
| `primitives/decorations/shape/PulseRingDecoration.ts` | `pulse-ring` | animated decoration — concentric rings expand+fade on a Tween cycle |
| `primitives/decorations/shape/GlowDecoration.ts` (extend) | — | optional `pulse?: { period, amplitudeAlpha }` in style → animated brightness via Tween |

All four use `Tween`; nobody reinvents easing.

### 4. Built-in registration

In `PrimitivesRenderer.registerBuiltins()` (currently line 148, after `registerDecoration('glow', …)` at line 178):

```ts
this.registerEffect('shake', ShakeEffect, { target: 'shape' });
this.registerEffect('breathing', BreathingEffect, { target: 'shape' });
this.registerDecoration('pulse-ring', PulseRingDecoration, { target: 'shape' });
```

### 5. CLAUDE.md / proposal updates

- `packages/canvas/CLAUDE.md` currently lists `breathing` and `pulse-ring` under **decorations**. Reclassify:
  - `breathing` → **transform effect** (not a decoration).
  - `pulse-ring` → stays as animated decoration.
  - Add an **"Effects"** section alongside the **"Decorations"** section listing built-in effects (`shake`, `breathing`) and the design rule (effects modulate host transform/style; decorations add geometry).
- `architecture-proposal.md` (repo root): update §2.7 to introduce the Effect concept and `Tween` primitive (§2.7 currently flags "Animation runner (Tweens) … land in later steps" — this is that step).

## Out of scope (deferred follow-ups)

- **Liquid-fill** — ship later as a decoration masked to the shape silhouette (the masking plumbing has no other consumer yet, and we don't want to design it in the abstract).
- **Connector effects** — plumbing is symmetric to shape effects; defer until needed.
- **Effect priorities / explicit ordering** — additive compose is enough until we hit a concrete conflict.
- **Marching-ants, ring decorations** named in CLAUDE.md — separate follow-up.

## Files

| File | Change |
|---|---|
| `packages/canvas/src/primitives/animation/Tween.ts` | new |
| `packages/canvas/src/primitives/animation/easings.ts` | new |
| `packages/canvas/src/primitives/base/EffectBase.ts` | new |
| `packages/canvas/src/primitives/types.ts` | add IEffect, EffectSpec, EffectTarget, EffectHostInfo, TransformDelta, StyleOverride |
| `packages/canvas/src/primitives/PrimitivesRenderer.ts` | effect registry, `setEffect`, `ShapeInstance.effects`, transform+style aggregation in `tickAnimations` |
| `packages/canvas/src/primitives/effects/shape/ShakeEffect.ts` | new |
| `packages/canvas/src/primitives/effects/shape/BreathingEffect.ts` | new |
| `packages/canvas/src/primitives/decorations/shape/PulseRingDecoration.ts` | new |
| `packages/canvas/src/primitives/decorations/shape/GlowDecoration.ts` | optional `pulse` style |
| `packages/canvas/src/primitives/index.ts` (and any barrel) | re-export new types/classes |
| `packages/canvas/CLAUDE.md` | reclassify breathing → effect; add Effects section |
| `architecture-proposal.md` (repo root) | extend §2.7 with Effect concept + Tween |

## Verification

Build / types:
- `pnpm --filter @invana/canvas build`
- `pnpm check-types`

Storybook (one story per concrete primitive — all logic inside `play`, flat-literal data, call `canvas.camera.fitContent(layer.getBounds(), 100)` after adding shapes):
- `apps/storybook/stories/canvas/effects/Shake.stories.ts` — circle that jitters; amplitude slider.
- `apps/storybook/stories/canvas/effects/Breathing.stories.ts` — circle scaling 1 → 1.1 → 1; period + amplitude sliders.
- `apps/storybook/stories/canvas/decorations/PulseRing.stories.ts` — circle with expanding+fading rings.
- `apps/storybook/stories/canvas/decorations/AnimatedGlow.stories.ts` — circle whose glow brightness pulses.

**Architecture proof story:** one story that puts **shake + breathing + animated-glow + pulse-ring** on the same shape and confirms they coexist without fighting (transform deltas compose, style overrides don't trample decorations).

No tests in `packages/canvas`.
