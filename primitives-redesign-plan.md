# Primitives Architecture Redesign — `@invana/canvas`

## Context

The current renderer (`ShapesRenderer`) carries four structural problems:

1. **Asymmetric paint contract.** Connectors expose `paintInto(g, spec, points, style)` so decorations can repaint their silhouette through the host. Shapes don't — instead, decorations branch on `hostKind === 'circle' | 'ellipse'` and either trace an ellipse parametrically or fall back to `outlinePolyline`. This branch exists in **all 5 shape decorations** ([ring.ts:71](packages/canvas/src/draw/decorations/shape/ring.ts#L71), [glow.ts:48](packages/canvas/src/draw/decorations/shape/glow.ts#L48), [marching-ants.ts:145](packages/canvas/src/draw/decorations/shape/marching-ants.ts#L145), [breathing.ts:98](packages/canvas/src/draw/decorations/shape/breathing.ts#L98), [pulse-ring.ts:134](packages/canvas/src/draw/decorations/shape/pulse-ring.ts#L134)). Adding a new round-ish shape (squircle, capsule) silently degrades to AABB rect — the abstraction leaks.

2. **Two parallel folder hierarchies.** `draw/` (pure geometry, ~31 files) and `renderers/` (Pixi wrappers, ~35 files) duplicate the same shape/connector/decoration tree. The split was justified earlier for reusability and testability, but in practice nothing outside the canvas package imports from `draw/`, and the wrappers are mostly Container plumbing. The duplication makes "add a new shape" a two-folder operation.

3. **`Image` is wrongly modelled as a shape kind.** Three image shapes exist today (`ImageShape`, `ImageCircleShape`, `ImageRectShape`) — proof that "shape with an image fill" is a fill mode, not a shape kind. Pixi v8 supports texture fills on `Graphics` natively (`g.fill({ texture, ... })`), so this entire branch can collapse to `BaseShapeSpec.fill`.

4. **Connector kinds are on the wrong axis.** Today, `LineConnector` and `CurveConnector` are separate classes that each render the same router's polyline differently — straight segments vs quadratic interpolation through interior vertices. This produces a 2×3 (connector × router) matrix where most cells are nonsense, and "orthogonal-with-rounded-corners" — a common need — is expressed as a hack (`orthogonal` router + `curve` connector) that mathematically cuts corners. Visual variation belongs to the **router**, not to a separate connector class. Collapsing to one `Connector` class and a richer `Path` output type (router emits `M`/`L`/`Q`/`C` commands) makes each visual style a single coherent concept.

The redesign unifies on a single paint contract (`paintInto`) for all paintable primitives, collapses `draw/` + `renderers/` into one `primitives/` folder, replaces the image shapes with an image fill, collapses `LineConnector` + `CurveConnector` into a single `Connector` class with `Path`-emitting routers, and renames `ShapesRenderer` → `PrimitivesRenderer`. Text moves into a sibling `primitives/texts/` folder but otherwise stays untouched (TextShape still registered as `'text'` shape kind); a future `TextRenderer` plan handles the higher-level text architecture.

---

## Canonical Terminology

Locked vocabulary for the new architecture (aligns with SVG + JointJS where they agree, fills gaps with the most-recognized term):

| Term | Definition |
|---|---|
| **Primitive** | A drawing element managed by `PrimitivesRenderer`. Today: `Shape` or `Connector`. |
| **Shape** | A 2D primitive with a closed silhouette (`circle`, `rect`, `ellipse`, `polygon`, `path`). Has `bounds()` and `drawGeometry()`. |
| **Connector** | A line-like primitive joining two endpoints, optionally passing through waypoints. **One concrete class** (`Connector`); visual variation comes from the `router`. |
| **Endpoint** | The `source` or `target` of a connector. Resolves to either a literal point or a shape id. |
| **Waypoint** | An intermediate, user-supplied point a router must respect. (NEW formal term — JointJS `vertices`.) |
| **Path** | The router's output: an ordered list of `PathCommand`s (`M`/`L`/`Q`/`C`). The connector renders the path natively via Pixi's `moveTo`/`lineTo`/`quadraticCurveTo`/`bezierCurveTo`. |
| **Polyline** | A flat point list. Used as the **derived** form of a path for hit-testing and any decoration that needs uniform-arc-length sampling. Produced by `samplePath(path, n)`. |
| **Router** | Pure function `(source, target, waypoints?, opts?) → Path`. Built-ins: `straight`, `orthogonal`, `orthogonal-rounded`, `bezier`, `curve` (smooth Catmull-Rom). |
| **Marker** | A shape painted at a connector endpoint, oriented along the polyline tangent. Markers are shapes — no separate registry. |
| **Decoration** | A visual augmentation of a shape or connector (`glow`, `ring`, `marching-ants`, `breathing`, `pulse-ring`). |
| **Slot** | A named z-band on a primitive's surface (e.g. `'halo'`, `'glow'`, `'ring'`). Decorations attach to slots. |
| **PaintStyle** | Override flags passed into `paintInto` (color, alpha, strokeWidth, dashArray, dashOffset, inset). |
| **Spec** | The data record describing a primitive instance (`CircleSpec`, `LineConnectorSpec`). Plain JSON. |

Words deliberately **not used**: `vertex` (overlaps "endpoint"), `path` for polyline (reserved for the `path` shape kind), `edge` (graph-domain term, not primitive-domain).

---

## New Folder Structure

Full collapse of `draw/` and `renderers/` into a single `primitives/` folder. Delete both old folders.

```
packages/canvas/src/
├── primitives/
│   ├── PrimitivesRenderer.ts        ← was renderers/ShapesRenderer.ts
│   ├── types.ts                     ← merged renderers/types.ts + draw/types.ts
│   ├── index.ts                     ← public barrel
│   │
│   ├── base/
│   │   ├── PrimitiveBase.ts         ← shared: gfx (Container), destroy()
│   │   ├── ShapeBase.ts             ← extends PrimitiveBase; abstract drawGeometry, paintInto
│   │   ├── ConnectorBase.ts         ← extends PrimitiveBase; abstract drawGeometry, paintInto
│   │   └── DecorationBase.ts        ← extends PrimitiveBase; mount/update/destroy/tick
│   │
│   ├── shapes/
│   │   ├── CircleShape.ts           ← extends ShapeBase
│   │   ├── RectShape.ts
│   │   ├── EllipseShape.ts
│   │   ├── PolygonShape.ts
│   │   ├── PathShape.ts
│   │   └── _polyUtils.ts            ← shared polygon helpers (offsetPolygon, polyToShape)
│   │
│   ├── connectors/
│   │   ├── Connector.ts             ← single concrete class, extends ConnectorBase
│   │   ├── pathSampling.ts          ← samplePath(path, density?) → Polyline; tangentAt(path, t)
│   │   └── routers/
│   │       ├── straight.ts          ← IRouter, returns [M, L]
│   │       ├── orthogonal.ts        ← [M, L, L, ...]
│   │       ├── orthogonal-rounded.ts ← [M, L, Q, L, Q, L, ...]
│   │       ├── bezier.ts            ← [M, C]
│   │       └── curve.ts             ← [M, C, C, ...] (smooth Catmull-Rom)
│   │
│   ├── markers/                     ← shapes used as markers; expose static paintInto
│   │   ├── ArrowMarker.ts
│   │   ├── CircleMarker.ts
│   │   ├── DiamondMarker.ts
│   │   └── SquareMarker.ts
│   │
│   ├── decorations/
│   │   ├── shape/
│   │   │   ├── RingDecoration.ts    ← extends DecorationBase
│   │   │   ├── GlowDecoration.ts
│   │   │   ├── MarchingAntsDecoration.ts
│   │   │   ├── BreathingDecoration.ts
│   │   │   └── PulseRingDecoration.ts
│   │   └── connector/
│   │       ├── RingConnectorDecoration.ts
│   │       ├── PulseRingConnectorDecoration.ts
│   │       ├── MarchingAntsConnectorDecoration.ts
│   │       ├── BreathingConnectorDecoration.ts
│   │       └── PulsatingGlowConnectorDecoration.ts
│   │
│   └── texts/                        ← sibling primitive bucket; managed by future TextRenderer
│       ├── TextShape.ts             ← was renderers/shapes/TextShape.ts; still registered as 'text' shape kind for now
│       ├── PlainText.ts             ← was draw/text/plain.ts
│       └── HTMLText.ts              ← was draw/text/html.ts
│
├── instancing/                       ← internal id-bookkeeping wrappers
│   ├── ShapeInstance.ts             ← was renderers/ShapeInstance.ts
│   └── ConnectorInstance.ts
├── hit/
│   └── HitIndex.ts                  ← was renderers/HitIndex.ts
└── textures/
    └── TextureRegistry.ts           ← was renderers/TextureRegistry.ts
                                      (SpritePool is DELETED — no longer needed)
```

`TextShape` migrates to `primitives/texts/TextShape.ts` unchanged in behavior — still registered as the `'text'` shape kind, still implements `IShape` directly (does **not** extend `ShapeBase` since its draw/paintInto don't share geometry). The folder placement signals that text is a sibling primitive bucket, ready for the future `TextRenderer` plan to take it over without another move.

---

## The Class Hierarchy

```ts
// primitives/base/PrimitiveBase.ts
abstract class PrimitiveBase {
  readonly gfx: Container = new Container();
  abstract destroy(): void;
}

// primitives/base/ShapeBase.ts
abstract class ShapeBase<TSpec extends BaseShapeSpec> extends PrimitiveBase implements IShape<TSpec> {
  protected spec: TSpec;
  protected graphics: Graphics;

  /** The single overrideable method. Author writes once; gets draw + paintInto. */
  protected abstract drawGeometry(g: Graphics, spec: TSpec, style?: ShapePaintStyle): void;
  abstract bounds(): Rect;
  contains?(localX: number, localY: number): boolean;

  draw(spec: TSpec): void {
    this.spec = spec;
    this.graphics.clear();
    this.drawGeometry(this.graphics, spec);   // no style override = use spec's own colors
  }

  /** Decoration entry point — repaint silhouette into someone else's Graphics. */
  paintInto(g: Graphics, spec: TSpec, style?: ShapePaintStyle): void {
    this.drawGeometry(g, spec, style);
  }

  destroy(): void { this.gfx.destroy({ children: true }); }
}

// primitives/base/ConnectorBase.ts
abstract class ConnectorBase<TSpec extends BaseConnectorSpec> extends PrimitiveBase implements IConnector<TSpec> {
  protected spec: TSpec;
  protected path: Path = [];
  protected graphics: Graphics;

  /**
   * Render the path natively via Pixi commands (moveTo / lineTo /
   * quadraticCurveTo / bezierCurveTo). Subclasses override only if they need
   * a special style (e.g. double-line, gradient). The default Connector class
   * provides the universal single-stroke implementation.
   */
  protected abstract drawGeometry(
    g: Graphics, spec: TSpec, path: Path, style?: ConnectorPaintStyle,
  ): void;

  draw(spec: TSpec, path: Path): void {
    this.spec = spec;
    this.path = path;
    this.graphics.clear();
    this.drawGeometry(this.graphics, spec, path);
    this.paintMarkers(this.graphics, spec, path);
  }

  paintInto(g: Graphics, spec: TSpec, path: Path, style?: ConnectorPaintStyle): void {
    this.drawGeometry(g, spec, path, style);
    this.paintMarkers(g, spec, path, style);
  }

  /** Default marker placement: anchor + tangent at path start / end. */
  protected paintMarkers(g: Graphics, spec: TSpec, path: Path, style?: ConnectorPaintStyle): void {
    // calls tangentAt(path, 0) / tangentAt(path, 1) and dispatches to MarkerCtor.paintInto
  }

  destroy(): void { this.gfx.destroy({ children: true }); }
}

// primitives/connectors/Connector.ts — the single concrete connector class
class Connector extends ConnectorBase<BaseConnectorSpec> {
  protected drawGeometry(g: Graphics, spec: BaseConnectorSpec, path: Path, style?: ConnectorPaintStyle): void {
    // Walk path; emit g.moveTo / g.lineTo / g.quadraticCurveTo / g.bezierCurveTo.
    // Stroke once with style (color, alpha, strokeWidth, dashArray, dashOffset).
  }
}

// primitives/base/DecorationBase.ts
abstract class DecorationBase<THostInfo, TStyle> extends PrimitiveBase {
  readonly style: TStyle;
  protected host: THostInfo | null = null;

  constructor(style: TStyle) { super(); this.style = style; }
  abstract mount(host: THostInfo): void;
  update?(host: THostInfo): void;
  tick?(deltaMs: number): boolean;
  destroy(): void { this.gfx.destroy({ children: true }); }
}
```

**Markers expose dual paint surfaces.** `CircleMarker` extends `ShapeBase` (so it works as a regular shape too), AND its class exposes a `static paintInto(g, spec, anchor, angle, style)` for connectors to call without instantiating. Both delegate to the same private `paintCircleAt(g, ...)` function in the file. No duplicated math.

**`markerPlacement` is absorbed into `ConnectorBase`** as protected helpers. With one Connector class, the standalone module is no longer needed; the two anchor/tangent helpers become `tangentAt(path, t)` in `primitives/connectors/pathSampling.ts` (since paths need parametric tangent sampling, not just polyline-endpoint tangents).

---

## The Unified Paint Contract

Every paintable primitive exposes `paintInto`. Decorations call back through it for silhouette repaint:

```ts
// glow on shape
shape.paintInto(g, spec, { color: glowColor, strokeWidth: w + i, fill: false });

// glow on connector — note `path`, not polyline
connector.paintInto(g, spec, path, { color: glowColor, strokeWidth: w + i });

// marching-ants on shape (NEW: native dashed stroke, not polyline-walking)
shape.paintInto(g, spec, { dashArray: [dash, gap], dashOffset: phase, fill: false });

// marching-ants on connector — Pixi native dash works on curved paths too
connector.paintInto(g, spec, path, { dashArray: [dash, gap], dashOffset: phase });

// ring on shape with inset (shape applies inset natively per its geometry)
shape.paintInto(g, spec, { color, strokeWidth, inset: 4, fill: false });
```

`ShapePaintStyle` (final form):
```ts
interface ShapePaintStyle {
  readonly color?: number;
  readonly alpha?: number;
  readonly strokeWidth?: number;
  readonly fill?: boolean;
  readonly dashArray?: readonly [number, number];
  readonly dashOffset?: number;
  readonly inset?: number;     // negative = outset
}
```

`ConnectorPaintStyle` mirrors it (already exists in [packages/canvas/src/draw/types.ts](packages/canvas/src/draw/types.ts), enriched with `dashArray`/`dashOffset` if missing).

**Marching-ants no longer walks the outline.** Pixi v8's stroke supports `dashArray` natively. The decoration just calls `host.paintInto(g, spec, { dashArray, dashOffset })` and the host renders its own dashed silhouette. This deletes most of `_polylineUtils.ts` (we keep `offsetPolygon` for `PolygonShape`'s inset handling).

`hostKind` and `outlinePolyline` are **removed** from `ShapeDecorationHostInfo` — decorations no longer need them.

---

## Image as a Fill Mode

Add to `BaseShapeSpec`:
```ts
readonly fill?: ShapeFill;

type ShapeFill =
  | number
  | { kind: 'solid'; color: number; alpha?: number }
  | { kind: 'image'; url: string; alpha?: number; fit?: 'cover' | 'contain' | 'tile'; matrix?: Matrix };
```

`ShapeBase.drawGeometry` resolves the fill once per draw:
- `solid` / number → `g.fill({ color, alpha })`
- `image` → look up `textureRegistry.get(url)`, then `g.fill({ texture, alpha, matrix })`. Lazy-load on miss; redraw when promise resolves.

**Deleted:** `ImageShape`, `ImageCircleShape`, `ImageRectShape`, `SpritePool`. Storybook stories that used these kinds migrate to `addShape({ kind: 'rect' | 'circle', fill: { kind: 'image', url } })`.

`TextureRegistry` keeps its current role. Texture loading + caching are still centralized.

---

## What `PrimitivesRenderer` Owns

Same surface as `ShapesRenderer` today, with two simplifications from the connector unification:
- Registries: shape kinds, **router kinds**, decoration kinds. **`registerConnector` removed** — there's only one Connector class. Custom rendering styles (e.g., double-line, gradient) extend `Connector` directly via Layer code; no kind-registration plumbing needed.
- CRUD: `addShape`/`updateShape`/`removeShape`, `addConnector`/`updateConnector`/`removeConnector` (connector spec carries `router: 'orthogonal-rounded'` etc. — the renderer instantiates the single Connector class and resolves the router from the registry on every route pass), `setDecoration`
- LOD + label: `setLODLevel`, `rasteriseLabel` (TextShape's hook stays)
- Animation: `tickAnimations(dt)`
- Hit-test: `hitTest(x, y)` via `HitIndex` — connector hit-test samples each connector's path to a polyline via `samplePath` for distance-to-segment testing
- Stats: `getRenderStats()`
- Events: raw pointer/click on shapes/connectors

**Does NOT own:** text-as-primitive (TextShape stays in the shape registry as the `'text'` shape kind; future TextRenderer ships separately), camera/viewport, layer composition.

---

## File-Level Migration Table

| Today | After | Notes |
|---|---|---|
| `renderers/ShapesRenderer.ts` | `primitives/PrimitivesRenderer.ts` | Class renamed. Public methods unchanged. |
| `renderers/types.ts` | `primitives/types.ts` | Merge with `draw/types.ts`. `hostKind`, `outlinePolyline` removed from `ShapeDecorationHostInfo`. `ShapePaintStyle` enriched. |
| `renderers/{ShapeInstance,ConnectorInstance}.ts` | `instancing/{ShapeInstance,ConnectorInstance}.ts` | Move only. |
| `renderers/HitIndex.ts` | `hit/HitIndex.ts` | Move only. |
| `renderers/TextureRegistry.ts` | `textures/TextureRegistry.ts` | Move only. |
| `renderers/SpritePool.ts` | **DELETED** | No more Sprite-per-image. |
| `renderers/shapes/{Circle,Rect,Ellipse,Polygon,Path}Shape.ts` | `primitives/shapes/*` | Refactor to `extends ShapeBase`. Inline geometry (no `draw/shapes/*` import). |
| `renderers/shapes/{ImageShape, ImageCircleShape, ImageRectShape}.ts` | **DELETED** | Replaced by image fill. |
| `renderers/shapes/_imageUtils.ts` | **DELETED** | Logic moves into `ShapeBase` fill resolution. |
| `renderers/shapes/TextShape.ts` | `primitives/texts/TextShape.ts` | Move only. Does NOT extend `ShapeBase`. Implements `IShape` directly. Still registered as `'text'` shape kind. Out of scope to refactor. |
| `draw/text/plain.ts` | `primitives/texts/PlainText.ts` | Move (or rename + relight as a primitive class consumed by TextShape). |
| `draw/text/html.ts` | `primitives/texts/HTMLText.ts` | Same. |
| `renderers/connectors/LineConnector.ts` | **DELETED** | Replaced by single `Connector` class. |
| `renderers/connectors/CurveConnector.ts` | **DELETED** | Same. |
| **NEW** | `primitives/connectors/Connector.ts` | Single concrete connector. Renders any `Path` via Pixi native commands. |
| **NEW** | `primitives/connectors/pathSampling.ts` | `samplePath(path, n) → Polyline`, `tangentAt(path, t) → Vec2`. Used by hit-test and marker placement. |
| `renderers/connectors/markerPlacement.ts` | **DELETED** | Logic absorbed into `ConnectorBase.paintMarkers` + `pathSampling.tangentAt`. |
| `renderers/routers/{straight,orthogonal,bezier}.ts` | `primitives/connectors/routers/{straight,orthogonal,bezier}.ts` | Refactor: now return `Path` instead of `Polyline`. |
| **NEW** | `primitives/connectors/routers/orthogonal-rounded.ts` | First-class rounded-corner Manhattan, replacing the old `orthogonal + curve` hack. |
| **NEW** | `primitives/connectors/routers/curve.ts` | Smooth Catmull-Rom through waypoints — covers what `CurveConnector` provided as a visual style. |
| `renderers/markers/markers.ts` | **DELETED, replaced by** `primitives/markers/{Arrow,Circle,Diamond,Square}Marker.ts` | One class per marker, each `extends ShapeBase` + static `paintInto`. |
| `renderers/decorations/*Decoration.ts` | `primitives/decorations/{shape,connector}/*Decoration.ts` | Refactor to `extends DecorationBase`. Inline geometry/animation (no `draw/decorations/*` import). |
| `draw/shapes/*.ts` | **DELETED** | Geometry inlined into shape classes. |
| `draw/connectors/{line,curve}.ts` | **DELETED** | No longer relevant — single Connector renders any path natively. |
| `draw/routers/*.ts` | **DELETED** | Replaced by Path-aware versions under `primitives/connectors/routers/`. |
| `draw/decorations/shape/*.ts` | **DELETED** | Geometry/animation inlined into decoration classes. The `hostKind === 'circle' \| 'ellipse'` branch disappears entirely. |
| `draw/decorations/connector/*.ts` | **DELETED** | Same. |
| `draw/decorations/_polylineUtils.ts` | **MOSTLY DELETED**; `offsetPolygon` + `polyToShape` survive in `primitives/shapes/_polyUtils.ts` | Dashed-polyline math gone (Pixi native dash replaces it). |
| `draw/types.ts` | **MERGED INTO** `primitives/types.ts` | `ConnectorPaintStyle` + `FillFit` move. New `Path` / `PathCommand` types added. |

---

## Migration Phases

Each phase is independently shippable, type-checks, and passes existing storybook stories. Land in order.

**Phase 1a — Shape scaffolding.**
Create `primitives/` folder. Add `PrimitiveBase`, `ShapeBase`, `DecorationBase` classes. Refactor 5 geometric shapes (`Circle`, `Rect`, `Ellipse`, `Polygon`, `Path`) to extend `ShapeBase`. `paintInto` becomes a method on every shape via `ShapeBase`. Old `renderers/shapes/*` and `draw/shapes/*` deleted. Decorations untouched, still in `renderers/decorations/`, still using `hostKind`. ShapeDecorationHostInfo unchanged for now.

**Phase 1b — Connector unification.**
Add `Path` / `PathCommand` types. Add `ConnectorBase` and the single `Connector` class. Add `pathSampling.ts` (`samplePath`, `tangentAt`). Convert existing routers (`straight`, `orthogonal`, `bezier`) to return `Path` instead of `Polyline`. Add new routers: `orthogonal-rounded` (first-class rounded-corner Manhattan) and `curve` (smooth Catmull-Rom — covers what `CurveConnector` provided). Delete `LineConnector`, `CurveConnector`, `markerPlacement.ts`, `registerConnector` (renderer side). Connector hit-test uses `samplePath` for distance-to-segment. Decorations still in `renderers/decorations/` for now — `ConnectorDecorationHostInfo` switches from `polyline` to `path` with a `polyline()` accessor that lazily samples on demand for any decoration that still wants a flat point list. Stories using `kind: 'line'` / `kind: 'curve'` migrate to a single connector spec with `router: 'straight' | 'curve' | 'orthogonal-rounded'`.

**Phase 2 — Decoration unification.**
Refactor 5 shape decorations and 5 connector decorations to extend `DecorationBase` and call `host.paintInto(...)` exclusively. Drop `hostKind` and `outlinePolyline` from `ShapeDecorationHostInfo`. Connector decorations now take a `path` (with `polyline()` accessor for the few that still want sampled points). Enrich `ShapePaintStyle` and `ConnectorPaintStyle` with `dashArray`/`dashOffset`/`inset`. Delete `draw/decorations/`. Delete the 10 wrappers in `renderers/decorations/`. The `circle | ellipse` branch is gone in 5 places.

**Phase 3 — Image as fill.**
Add `BaseShapeSpec.fill` (solid + image variants). Implement texture-fill resolution in `ShapeBase.drawGeometry`. Migrate storybook stories using `kind: 'image'` / `image-circle` / `image-rect` to `kind: 'rect' | 'circle'` with `fill: { kind: 'image' }`. Delete the three image shapes and `SpritePool`.

**Phase 4 — Rename, text move, and final cleanup.**
Rename `ShapesRenderer` → `PrimitivesRenderer`. Move `ShapeInstance`/`ConnectorInstance`/`HitIndex`/`TextureRegistry` into their new sibling folders. Move `TextShape` from `renderers/shapes/` to `primitives/texts/TextShape.ts`. Move `draw/text/{plain,html}.ts` to `primitives/texts/{PlainText,HTMLText}.ts`. Delete `draw/` and `renderers/` entirely. Update package subpath exports in [packages/canvas/package.json](packages/canvas/package.json) — `@invana/canvas/renderers/shapes` becomes `@invana/canvas/primitives`. Update barrel re-exports in [packages/canvas/src/index.ts](packages/canvas/src/index.ts).

**Phase 5 — Waypoints (deferred, design-only here).**
Add `BaseConnectorSpec.waypoints?: ReadonlyArray<Point>`. Routers in Phase 1b already accept a `waypoints` arg in their signature; this phase wires actual waypoint handling: `straight` inserts verbatim as `L` commands, `orthogonal` / `orthogonal-rounded` anchor stair segments, `bezier` and `curve` use waypoints as control-point hints. Existing connectors continue to work with empty waypoints. **Not in this redesign — separate plan.**

---

## What's NOT in scope

- **TextRenderer / `IText` primitive.** TextShape stays in the shape registry as a registered kind and keeps its current implementation. A separate plan introduces a higher-level `TextRenderer` later. The `setLabelResolution` / `rasteriseLabel` hooks stay where they are.
- **Custom Connector subclasses for special visual styles** (double-line strokes, gradient strokes, "noodle" with random jitter). The single Connector class handles the universal case; if a project genuinely needs a different rendering style, it extends `Connector` and overrides `drawGeometry`. Not shipped here.
- **Waypoint typing.** Phase 5 above sketches the surface but doesn't ship it here.
- **Tests for `packages/canvas`.** Per project rule, no test files added unless explicitly asked.
- **Storybook story rewrites beyond migrations.** Each phase touches stories only enough to keep them rendering.

---

## Verification

After each phase:

1. `pnpm --filter @invana/canvas build` — must succeed.
2. `pnpm check-types` — must succeed across the monorepo (catches consumer breakage in `packages/graph`, storybook).
3. `pnpm --filter @canvas/storybook dev` — open `http://localhost:6006`. Spot-check:
   - **Phase 1:** Every `Canvas/Renderer/Shapes/*` and `Canvas/Renderer/Connectors/*` story renders identically to before. Visual diff shouldn't change.
   - **Phase 2:** Every `Canvas/Renderer/Decorations/*` story renders identically. Animated stories (marching-ants, pulsating-glow, breathing) animate at the same cadence.
   - **Phase 3:** Stories using `kind: 'image'` migrate; verify image renders inside the new shape silhouette.
   - **Phase 4:** All stories above still pass after the rename.
4. **No tests are run on `packages/canvas`** (per project rule); other packages' tests are run via `pnpm test` and must pass.

---

## Critical Files

Files that drive the redesign and will be referenced repeatedly during implementation:

- [packages/canvas/CLAUDE.md](packages/canvas/CLAUDE.md) — package coding rules; update to reflect the new folder layout when Phase 4 lands
- [packages/canvas/src/renderers/ShapesRenderer.ts](packages/canvas/src/renderers/ShapesRenderer.ts) → becomes `primitives/PrimitivesRenderer.ts`
- [packages/canvas/src/renderers/types.ts](packages/canvas/src/renderers/types.ts) → merged into `primitives/types.ts`
- [packages/canvas/src/draw/types.ts](packages/canvas/src/draw/types.ts) → merged into `primitives/types.ts`
- [packages/canvas/src/renderers/decorations/PulsatingGlowConnectorDecoration.ts](packages/canvas/src/renderers/decorations/PulsatingGlowConnectorDecoration.ts) — current "good" pattern; the model to mirror for shape decorations
- [packages/canvas/src/draw/decorations/_polylineUtils.ts](packages/canvas/src/draw/decorations/_polylineUtils.ts) — `offsetPolygon` survives, the rest doesn't
- [packages/canvas/package.json](packages/canvas/package.json) — subpath exports updated in Phase 4
- [packages/canvas/src/index.ts](packages/canvas/src/index.ts) — public re-exports updated in Phase 4
- [architecture-proposal.md](architecture-proposal.md) — terminology section to be reconciled with the canonical glossary above when the redesign lands
