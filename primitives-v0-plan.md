# v0 Implementation Plan — Primitives Slim Slice

> **Macro architecture lives in [primitives-redesign-plan.md](primitives-redesign-plan.md) at the repo root.** This file is the *first concrete cut* of that architecture — one of every new surface, end-to-end, before we expand horizontally to all shapes / connectors / decorations.

## Context

We're rebuilding the rendering layer of `@invana/canvas` from scratch as `primitives/`. Rather than implement every shape and decoration in a single push, v0 delivers **one of every architectural surface**, fully wired through stories. This validates that the contracts (`ShapeBase`, `ConnectorBase`, `ShapeDecorationBase`, `ConnectorDecorationBase`, `Path`-based routers, fill discriminator, decoration `paintInto` callback, marker registry, animation tick, hit-test) all compose cleanly before we replicate the pattern across the remaining 4 shapes, 4 routers, 9 decorations, 3 markers, 2 text classes.

**Strategy: full replace.** Delete `draw/` and `renderers/` entirely on day one and rebuild against `primitives/`. Existing stories that reference `kind: 'line'`, `'curve'`, `'image'`, `'image-circle'`, `'image-rect'`, or `'ellipse'`/`'polygon'`/`'path'` either get migrated in v0 or temporarily disabled — flagged below.

## v0 Scope — one of each

| Surface | v0 deliverable | Deferred to follow-ups |
|---|---|---|
| Shape | `CircleShape`, `RectShape` (rect covers "square") | Ellipse, Polygon, Path |
| Connector | single `Connector` class | (no other connector class needed — visual variation comes from routers) |
| Router | `straight` (returns `[M, L]`) | orthogonal, orthogonal-rounded, bezier, curve |
| Marker | `ArrowMarker` | Circle / Diamond / Square markers |
| Decoration | `GlowDecoration` (halo, animated-capable but static for v0) | ring, marching-ants, breathing, pulse-ring + connector variants |
| Fill — solid | ✓ `0xff0000` shorthand and `{ kind: 'solid' }` | — |
| Fill — image | ✓ via `TextureRegistry` + Pixi texture-fill | tile / matrix transform polish |
| Fill — icon | ✓ Unicode + FontAwesome + Lucide via `IconRegistry` | SVG-arbitrary, color-stops |
| Stroke (border) | ✓ width, color, alpha, alignment, optional dash | (already complete) |
| Decoration host contract | `host.shape.paintInto(g, _, style)` | (already complete) |
| Animation tick | `tickAnimations(dt)` registered in Canvas RAF | (already complete) |
| Hit-test | full `HitIndex` with `samplePath` for connectors | (already complete) |
| Text | `TextShape` moved unchanged into `primitives/texts/` so existing label-based stories keep working | refactor TextShape to extend ShapeBase / introduce TextRenderer (separate plan) |

## Final v0 `packages/canvas/src/` structure

```
packages/canvas/src/
├── index.ts                              ← updated barrel
│
├── engine/Canvas.ts                      ← unchanged
├── camera/Camera.ts                      ← unchanged
├── context/CanvasContext.ts              ← unchanged
├── events/                               ← unchanged
├── state/                                ← unchanged
├── layers/                               ← unchanged
├── behaviours/                           ← unchanged
├── layouts/Layout.ts                     ← unchanged
├── registries/                           ← unchanged
│
├── primitives/
│   ├── PrimitivesRenderer.ts             ← full surface (shape/router/decoration registries, CRUD, decoration slots, tick, hit-test, events, stats)
│   ├── types.ts                          ← Path, PathCommand, ShapeFill, IconRef, ShapeStroke, ShapePaintStyle, BaseShapeSpec, CircleSpec, RectSpec, ShapeHostInfo, ShapeDecorationHostInfo, ConnectorDecorationHostInfo, IShape, IConnector, IDecoration, etc.
│   ├── index.ts
│   │
│   ├── base/
│   │   ├── PrimitiveBase.ts              ← shared: gfx (Container), destroy()
│   │   ├── ShapeBase.ts                  ← abstract drawGeometry; concrete draw/paintInto; iconLayer sync
│   │   ├── ConnectorBase.ts              ← abstract drawGeometry; concrete draw/paintInto; paintMarkers
│   │   ├── ShapeDecorationBase.ts        ← extends PrimitiveBase; host info typed as ShapeDecorationHostInfo
│   │   └── ConnectorDecorationBase.ts    ← extends PrimitiveBase; host info typed as ConnectorDecorationHostInfo
│   │
│   ├── shapes/
│   │   ├── CircleShape.ts                ← extends ShapeBase
│   │   └── RectShape.ts                  ← extends ShapeBase
│   │
│   ├── connectors/
│   │   ├── Connector.ts                  ← single concrete class
│   │   ├── pathSampling.ts               ← samplePath(path, n), tangentAt(path, t)
│   │   └── routers/
│   │       └── straight.ts               ← (src, tgt, waypoints?, opts?) → [M, L]
│   │
│   ├── markers/
│   │   └── ArrowMarker.ts                ← extends ShapeBase + static paintInto
│   │
│   ├── decorations/
│   │   └── shape/
│   │       └── GlowDecoration.ts         ← halo; loops over shape.paintInto with widening stroke
│   │
│   ├── paint/
│   │   ├── applyFillStroke.ts            ← resolves spec.fill / spec.stroke vs style override; routes solid/image/icon
│   │   └── iconLayer.ts                  ← mountIcon / updateIcon / destroyIcon — sibling Container holding Text or Graphics
│   │
│   ├── icons/
│   │   ├── IconRegistry.ts               ← register / resolve glyph + fontFamily / pathD per IconRef
│   │   ├── lucide.ts                     ← starter Lucide name → SVG pathD map (~25 common icons)
│   │   └── fontawesome.ts                ← starter FA name → unicode codepoint map (~25 common glyphs)
│   │
│   └── texts/
│       └── TextShape.ts                  ← moved unchanged from renderers/shapes/TextShape.ts; still registered as 'text' kind
│
├── instancing/
│   ├── ShapeInstance.ts                  ← moved from renderers/
│   └── ConnectorInstance.ts              ← moved from renderers/
├── hit/
│   └── HitIndex.ts                       ← moved from renderers/
└── textures/
    └── TextureRegistry.ts                ← moved from renderers/
```

**Deleted on day one:**
- `packages/canvas/src/draw/` — all 24 files
- `packages/canvas/src/renderers/` — all 29 files (TextShape relocated, ShapeInstance/ConnectorInstance/HitIndex/TextureRegistry relocated, everything else gone)

## Build order

Each step type-checks (`pnpm check-types`) before moving to the next. Storybook is started after step 8.

1. **Types skeleton** — write `primitives/types.ts` with all interfaces (`Path`, `PathCommand`, `ShapeFill`, `IconRef`, `ShapeStroke`, `ShapePaintStyle`, `BaseShapeSpec`, `CircleSpec`, `RectSpec`, `ShapeHostInfo`, `ShapeDecorationHostInfo`, `ConnectorDecorationHostInfo`, `IShape`, `IConnector`, `IDecorationBase`, `ShapeCtor`, `ConnectorCtor`, `DecorationCtor`, `IRouter`, `HitResult`, `ShapesRendererEventMap`, `RenderStats`).
2. **Move infra unchanged** — `TextureRegistry` → `textures/`, `HitIndex` → `hit/`, `ShapeInstance`/`ConnectorInstance` → `instancing/`. Update their internal imports to point at `primitives/types`.
3. **Base classes** — `PrimitiveBase`, `ShapeBase`, `ConnectorBase`, `ShapeDecorationBase`, `ConnectorDecorationBase` in `primitives/base/`. No subclasses yet — pure abstracts that compile against the types. Two distinct decoration bases (one per host kind) make subclassing intent obvious from the class name and prevent shape decorations from accidentally consuming connector geometry at compile time.
4. **Paint helpers** — `primitives/paint/applyFillStroke.ts` (solid + style override; image + icon stubbed for now), `primitives/paint/iconLayer.ts` (mount/update/destroy with Text-based and Graphics-based child rendering).
5. **Icon registry** — `primitives/icons/IconRegistry.ts` with a register-and-resolve API. Bundle `lucide.ts` (~25 names → SVG paths) and `fontawesome.ts` (~25 names → unicode). Unicode provider needs no registration.
6. **Wire image fill** — extend `applyFillStroke.applyFill` with the `image` branch using Pixi's `g.fill({ texture, ... })`. Lazy-load on miss via `TextureRegistry`; trigger redraw when promise resolves.
7. **CircleShape + RectShape** — `primitives/shapes/{CircleShape,RectShape}.ts`. Each ~30 lines extending `ShapeBase`. Both expose static `paintInto` for marker reuse.
8. **PrimitivesRenderer** — full class in `primitives/PrimitivesRenderer.ts`. Methods: `registerShape`, `registerRouter`, `registerDecoration`, `addShape`/`updateShape`/`removeShape`, `addConnector`/`updateConnector`/`removeConnector`, `setDecoration`, `tickAnimations`, `hitTest`, `getRenderStats`, `destroy`, plus `events`. **No `registerConnector`** — single Connector class is hardcoded. Wire to existing `Canvas` RAF (Canvas calls `tickAnimations` per frame).
9. **Connector** — `primitives/connectors/{Connector,pathSampling}.ts` and `primitives/connectors/routers/straight.ts`. Connector renders `Path` via Pixi native commands; uses `pathSampling.tangentAt` for marker placement.
10. **ArrowMarker** — `primitives/markers/ArrowMarker.ts`. Extends `ShapeBase` (so it works as a regular shape) plus exposes `static paintInto(g, spec, anchor, angleRad, style?)` that the Connector calls for source/target arrowheads.
11. **GlowDecoration** — `primitives/decorations/shape/GlowDecoration.ts`, `extends ShapeDecorationBase<GlowStyle>`. Loops `host.shape.paintInto(g, _, { color, alpha, strokeWidth, fill: false })` N times with widening stroke + decreasing alpha. Ships with optional `tick` for breathing-style alpha modulation; v0 stories use it static. Registered as `target: 'shape'` (a connector glow variant ships in a follow-up).
12. **TextShape relocate** — move `renderers/shapes/TextShape.ts` → `primitives/texts/TextShape.ts`, update its imports. **No behavioral change.** Still implements `IShape` directly. Keep registered as `'text'` kind in `PrimitivesRenderer` so existing label-based stories keep rendering.
13. **Delete `draw/` and `renderers/` entirely.** Everything that needs to survive has been moved.
14. **Update `packages/canvas/src/index.ts`** — re-export from `primitives/index.ts`. Update `packages/canvas/package.json` subpath exports: replace `@invana/canvas/renderers/shapes` with `@invana/canvas/primitives`.
15. **Update `packages/canvas/CLAUDE.md`** with the domain-free rule (see "Domain-Free Primitives Rule" section below). Single appended block; no other rule changes in v0.
16. **Storybook stories** — see list below.
17. **Spot-check + iterate.**

## Domain-Free Primitives Rule

Add the following block verbatim to `packages/canvas/CLAUDE.md` at step 15:

> **`primitives/` is domain-free.** No primitive — shape, connector, decoration, marker, router, fill resolver, icon, text — references a domain concept. Forbidden references include: node, edge, vertex, table, column, row, lane, header, port, pin, link, network, graph (the data structure), entity, relationship, swimlane, ER, flowchart, BPMN. The primitives layer only knows about geometric concepts (circle, rect, polygon, path, polyline, fill, stroke, glyph, decoration slot).
>
> Domain packages (`@invana/graph`, future `@invana/swimlane`, `@invana/er`) compose primitives by extending `WorldLayer` / `ScreenLayer` and calling `primitivesRenderer.addShape` / `addConnector` / `setDecoration`. Domain packages may register **new geometric primitives** via `registerShape` / `registerRouter` / `registerDecoration` (e.g., a `hexagon` shape kind, a `manhattan-routed` router, a `pk-badge` decoration), but the registered class itself must remain geometric — its name and its code must not reference the domain concept that motivated it.
>
> **Test:** if you can rename the file by stripping the domain word and the file still makes sense (`PrimaryKeyBadgeDecoration` → `BadgeDecoration` works fine; `SwimlaneShape` → `Shape` does not), it belongs in `primitives/`. Otherwise it belongs in the domain package.

This rule is not enforced by tooling. It's a discipline statement, intentionally placed in `packages/canvas/CLAUDE.md` so any AI agent or contributor sees it before adding code to the package.

## Storybook stories to ship in v0

Under `apps/storybook/stories/Canvas/Primitives/`:

| File | Demonstrates |
|---|---|
| `Shapes/CircleSolid.stories.ts` | `CircleShape` with solid fill (number + `{ kind: 'solid' }`) and a stroke border |
| `Shapes/RectSolid.stories.ts` | `RectShape` with solid fill, varying `cornerRadius`, no border vs stroked |
| `Shapes/CircleImageFill.stories.ts` | `CircleShape` with image fill (avatar example) — exercises `TextureRegistry` lazy-load |
| `Shapes/RectImageFill.stories.ts` | `RectShape` with image fill + `cornerRadius` (screenshot-in-card example) |
| `Shapes/CircleIconFontAwesome.stories.ts` | `CircleShape` with `{ kind: 'icon', icon: { provider: 'fontawesome', name: 'database' } }` + colored background plate |
| `Shapes/RectIconLucide.stories.ts` | `RectShape` with Lucide icon (`alert-triangle`) on dark plate |
| `Shapes/CircleIconUnicode.stories.ts` | `CircleShape` with Unicode glyph (e.g. `'⚡'`, `'★'`, an emoji) — exercises the no-registry-needed path |
| `Connectors/StraightLine.stories.ts` | Two circles linked by a `Connector` with `router: 'straight'`, `targetMarker: ArrowMarker` |
| `Decorations/Halo.stories.ts` | Single `CircleShape` and single `RectShape`, each with `GlowDecoration` applied via `setDecoration(id, 'glow', ...)`. Demonstrates that the same decoration works on both kinds with zero kind branching. |
| `Showcase/AnnotatedNode.stories.ts` | Compound: avatar circle (image fill) + label rect (solid + Lucide icon) + connector with arrow + halo on hover. Smoke test for the full architecture interacting in one frame. |

Per project convention: all story constants and setup live inside the `play` function; data is flat JSON; `canvas.camera.fitContent(layer.getBounds(), 100)` is called after primitives are added.

## Verification

After step 13 (deletes complete):

1. `pnpm --filter @invana/canvas build` — succeeds.
2. `pnpm check-types` — succeeds across the monorepo.

After step 14 (exports updated):

3. `pnpm --filter @canvas/storybook dev` opens at `http://localhost:6006`. Pre-existing stories under `Canvas/Renderer/*` that referenced `kind: 'line' | 'curve' | 'image' | 'image-circle' | 'image-rect' | 'ellipse' | 'polygon' | 'path'` are **expected to be broken or disabled** at this point — they will be migrated in follow-up phases (per the macro plan). Stories under `Canvas/Primitives/*` (the v0 set listed above) all render.

After step 16 (stories shipped):

4. Each v0 story renders correctly.
5. Halo decoration on the circle and on the rect look stylistically identical (same color, same outer radius, same softness) — visual proof that decorations don't branch on shape kind.
6. Image-fill stories: clearing the texture cache forces lazy-load + redraw without flicker.
7. Icon stories: changing `fill.icon` at runtime (via Storybook controls) swaps the glyph without rebuilding the shape.
8. Connector hit-test: clicking near the straight line (within ~6px) registers a connector hit; clicking far from it does not.
9. Animation tick: temporarily set `GlowDecoration.tick` to modulate alpha; verify the halo breathes and the renderer's `getRenderStats().animatedDecorations` reports 1.

No tests are added to `packages/canvas` (per project rule).

## What's explicitly NOT in v0

- Other shapes (Ellipse, Polygon, Path).
- Other routers (orthogonal, orthogonal-rounded, bezier, curve).
- Other decorations (ring, marching-ants, breathing, pulse-ring) and their connector variants.
- Other markers (Circle, Diamond, Square).
- Waypoints in connector specs (the `straight` router accepts the parameter but doesn't yet use it).
- A `TextRenderer`. TextShape stays as a registered shape kind; its eventual migration is a separate plan.
- Custom Connector subclasses (double-line strokes, gradient strokes, etc.).
- Cross-primitive decorations (e.g., highlighting a row composed of 4 shapes via a single decoration call). Workaround for v0: domain Layer applies the same decoration to each constituent shape. A `GroupShape` primitive is a future concern, not v0 scope.
- Tests in `packages/canvas`.
- CLAUDE.md updates **beyond the single domain-free-rule append** at step 15 (the larger folder-structure documentation refresh comes once the macro plan completes).

## Critical files

- [primitives-redesign-plan.md](primitives-redesign-plan.md) — macro architecture this v0 instantiates a slice of
- [packages/canvas/CLAUDE.md](packages/canvas/CLAUDE.md) — package coding rules; only the domain-free rule append happens in v0
- [packages/canvas/src/renderers/ShapesRenderer.ts](packages/canvas/src/renderers/ShapesRenderer.ts) — reference for `PrimitivesRenderer`'s public surface (renamed only)
- [packages/canvas/src/renderers/decorations/PulsatingGlowConnectorDecoration.ts](packages/canvas/src/renderers/decorations/PulsatingGlowConnectorDecoration.ts) — current "good" pattern; mirror it for `GlowDecoration` (the shape-side equivalent)
- [packages/canvas/src/renderers/shapes/TextShape.ts](packages/canvas/src/renderers/shapes/TextShape.ts) — moved verbatim into `primitives/texts/`
- [packages/canvas/src/index.ts](packages/canvas/src/index.ts) — public re-exports updated at step 14
- [packages/canvas/package.json](packages/canvas/package.json) — subpath exports updated at step 14
