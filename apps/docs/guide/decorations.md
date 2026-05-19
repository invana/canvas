# Decorations, effects & animations

Three orthogonal concepts. Easy to confuse — pick the right one for what you're adding.

| Concept | Adds | Reads | Writes | Examples |
|---|---|---|---|---|
| **Decoration** | New geometry attached to the host | Host bounds / path | Its own pixi container in a slot on the host | `glow`, `pulse-ring`, `marching-ants`, `flow-particles` |
| **Effect** | Nothing — modulates the host itself | Host gfx | Host transform (`dx`/`dy`/`dRot`/`sx`/`sy`) or style (`tint`/`alpha`) | `shake`, `breathing` |
| **Animation** | Nothing — it's a time engine | `deltaMs` | Any `tick(dt)` consumer | `Tween` primitive + easings |

A pulse ring is a decoration (new rings drawn). A "shape gently breathing" is an effect (the host scale modulates). Both use `Tween` for their interpolation curves.

## Decorations

A decoration attaches to a shape or connector and paints into a slot. `setDecoration` registers/replaces; `null` removes.

```ts
renderer.setDecoration('node-a', 'glow', {
  kind: 'glow',
  style: { color: 0xffd700, radius: 16, layers: 6, innerAlpha: 0.55 },
});

renderer.setDecoration('node-a', 'glow', null); // clear
```

### Slot convention

A host can hold multiple decorations simultaneously, one per named slot. Slot names are free strings; conventional names across the ecosystem:

| Slot | Purpose | Drawn |
|---|---|---|
| `halo` | Selection / focus glow | Behind shape |
| `border` | Outline (solid or dashed) | On shape |
| `glow` | Soft outer aura | Behind shape, behind halo |
| `pulse` | Expanding ring(s) radiating outward | In front of shape |
| `badge` | Status indicator overlay | In front of shape |
| `fx` | Free-form domain effect | In front of everything |

Setting a slot to `null` removes its decoration.

### Built-in shape decorations

| Kind | Class | Style fields |
|---|---|---|
| `glow` | `GlowDecoration` | `{ color, radius?, layers?, innerAlpha? }` — concentric blurred copies of the silhouette. |
| `pulse-ring` | `PulseRingDecoration` | `{ color, radius?, width?, period?, ringCount? }` — animated rings that expand + fade on a Tween cycle. |
| `marching-ants` | `MarchingAntsDecoration` | `{ color, width?, dash?, gap?, speed? }` — animated dashed outline. Pixi-native dash, works on any silhouette. |
| `liquid-fill` | `LiquidFillDecoration` | `{ color, level, waveAmplitude?, wavePeriod? }` — masked wave fill clipped to the host silhouette. |

### Built-in connector decorations

| Kind | Class | Style fields |
|---|---|---|
| `glow` | `GlowConnectorDecoration` | `{ color, radius?, layers?, innerAlpha? }` — soft glow along the path. |
| `marching-ants` | `MarchingAntsConnectorDecoration` | `{ color, width?, dash?, gap?, speed? }` — animated dashed stroke; works on any path including curves. |
| `flow-particles` | `FlowParticlesConnectorDecoration` | `{ color, count?, size?, speed? }` — discrete particles drifting along the path. |
| `fly-marker` | `FlyMarkerConnectorDecoration` | `{ markerSpec, speed?, repeat? }` — a marker that travels from source to target on a Tween. |
| `reveal` | `RevealConnectorDecoration` | `{ duration?, easing? }` — one-shot stroke-on animation revealing the path from source to target. |
| `ripple` | `RippleConnectorDecoration` | `{ color, radius?, period? }` — pulsing radial ripples at path endpoints. |

### Animated decorations

A decoration that exposes `tick(deltaMs): boolean` is registered into the renderer's per-frame animation set. `tickAnimations(dt)` (called by the canvas tick) advances every animated decoration. `tick` returns `true` to keep ticking, `false` to retire.

`GlowDecoration` is static — it does not animate. The other built-ins above are animated.

### Authoring

Subclass `ShapeDecorationBase` or `ConnectorDecorationBase` and declare `target: 'shape' | 'connector' | 'both'` at registration:

```ts
renderer.registerDecoration('halo', HaloDecoration, { target: 'shape' });
```

The base class handles mount/destroy and the slot container. Override `mount(host)`, optional `update(host)`, optional `tick(dt)`, and the renderer dispatches by id namespace. See `ShapeDecorationBase` / `ConnectorDecorationBase` in the API reference.

## Effects

An effect modulates the host itself instead of adding geometry. One `EffectBase` class with a `target: 'transform' | 'style'` discriminator:

- `target: 'transform'` — writes `{ dx, dy, dRot, sx, sy }` deltas. Renderer composes them onto the host gfx transform each frame.
- `target: 'style'` — writes `{ tint?, alpha? }` overrides applied via Pixi tint/alpha on the host gfx.

### Stacking rules

| Channel | Rule |
|---|---|
| `dx`, `dy`, `dRot` | **Sum** across effects |
| `sx`, `sy` | **Multiply** across effects |
| `tint`, `alpha` | **Last-writer-wins** per channel |

Hosts whose effect-set is empty are skipped in the hot path.

### Built-in shape effects

| Kind | Class | Style fields |
|---|---|---|
| `shake` | `ShakeEffect` | `{ amplitude, decay? }` — random per-frame `dx`/`dy` scaled by amplitude; optional decay Tween. |
| `breathing` | `BreathingEffect` | `{ amplitude, period }` — `sx = sy = 1 + amp * sin(2π t / period)`. |

Connector effects ship later — plumbing is symmetric to shape effects but no built-in consumer yet.

### Setting an effect

```ts
renderer.setEffect('node-a', 'breath', { kind: 'breathing', style: { amplitude: 0.05, period: 1600 } });
renderer.setEffect('node-a', 'breath', null);
```

## Animations — the `Tween` primitive

`Tween` is the shared interpolation primitive every animated decoration and effect uses. Nobody reinvents easing.

```ts
import { Tween, easeInOutSine } from '@invana/canvas';

const t = new Tween({
  from: 0,
  to: 1,
  duration: 1200,
  easing: easeInOutSine,
  repeat: 'forever',
  yoyo: true,
  onUpdate: (v) => { /* … */ },
});

t.tick(dt);     // returns false when the tween is done
t.value;        // current eased value
t.reset();
```

Built-in easings: `linear`, `easeInOutSine`, `easeOutCubic`, `easeInOutCubic`. See the `Tween` API reference for the full options surface.

## Composing all three

A single shape can carry decorations, effects, and animations simultaneously. They don't fight:

- Transform deltas across effects compose additively
- Decorations stack by slot z-order
- A pulse decoration's expanding ring and a breathing effect's scale modulation both pull from `tickAnimations(dt)` on the same frame

```ts
renderer.setDecoration('node-a', 'pulse', { kind: 'pulse-ring', style: { color: 0x3b82f6, ringCount: 3 } });
renderer.setEffect    ('node-a', 'breath', { kind: 'breathing',  style: { amplitude: 0.05, period: 1600 } });
renderer.setEffect    ('node-a', 'shake',  { kind: 'shake',      style: { amplitude: 2, decay: 600 } });
```

## Domain-free naming

Decoration and effect kinds must remain geometric. A `pulse-ring` decoration is fine; a `node-halo` decoration is not — call it `halo` and let domain packages name the sugar method `haloNode(id)`. Same for effects: `shake` not `error-shake`.
