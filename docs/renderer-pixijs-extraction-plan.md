# Extracting `@invana/renderer-pixijs` — moving drawing out of `@invana/canvas`

> **Status: PLAN.** The concrete execution plan for **renderer-split P2**: lifting all
> pixi drawing out of `@invana/canvas` into a new `@invana/renderer-pixijs`, leaving
> `canvas` a pixi-free orchestrator. Builds on the **kernel + seam** work already
> landed (the `IRenderer` type, one bus = `store.events`, `view.definition` as source
> of truth — commit `fdfc56b`). Companion to
> [`canvas-renderer-split-plan.md`](./canvas-renderer-split-plan.md) (the direction +
> file census) — this doc adds the *drawing-seam* detail that census missed.

---

## 1. Context — why this is tractable now

Two facts, both verified against the code, make the extraction lower-risk than "move
70 files":

1. **Drawing is already behind one imperative seam.** Every domain layer draws through
   `PrimitivesRenderer` (`addShape` / `updateShape` / `addConnector` / `updateConnector`
   / `setDecoration` / `setEffect` / `setBadge` / `hitTest` / `tickAnimations`). **`@invana/graph`
   has zero pixi imports** — `GraphLayer` only calls this API (e.g. `this._renderer.addShape(node.id, this.nodeSpec(node))`,
   `GraphLayer.ts:1263`). So the highest-risk code (domain draw logic) is *already*
   isolated and does not move.
2. **The kernel + coarse seam already exist.** `IRenderer` (`packages/canvas-store/src/renderer/IRenderer.ts`)
   is defined but **unused** — no code in `canvas` implements or calls it yet.

The trap to avoid: forcing P2 through the coarse `IRenderer.applyView/applyData` (a
*store-projection* model). The engine is **imperative retained-mode** — each Layer holds
a per-layer `PrimitivesRenderer` (constructed in `onMount`, given a pixi `Container` +
`Camera`) and pushes specs into it. The real drawing seam is that imperative API, not
`applyData`.

## 2. The decision — which drawing model (RESOLVED: keep imperative)

**Chosen: extract along the existing imperative seam.** `renderer-pixijs` implements an
`IPrimitivesRenderer` interface (today's `PrimitivesRenderer`, minus pixi). Layers stay
imperative and keep a per-layer renderer, obtained via an **abstract surface handle**.
**`graph`'s draw code changes nothing** — it already targets exactly this API.

- **Why not the store-projection model (`IRenderer.applyData`)?** It's the long-term
  north star ("renderer = pure projection of state"), but it *inverts* the Layer model
  (layers stop holding a renderer; the renderer reads store deltas). That's a much larger
  re-architecture with no near-term payoff and high blast radius. It can be layered on
  **later** — a projection engine can sit on top of `IPrimitivesRenderer`.
- **Role of the coarse `IRenderer`:** keep it, but as the **lifecycle/bootstrap** wrapper
  (mount, surface creation, camera realization, the frame loop) — **not** the drawing
  path. `applyData` stays in the interface for the future projection model but is a no-op
  target for now; the imperative `IPrimitivesRenderer` is what layers use.

So: **two interfaces, both implemented by `renderer-pixijs`** — `IRenderer` (lifecycle)
+ `IPrimitivesRenderer` (drawing).

## 3. Target layout + layering

```
@invana/canvas-store   (kernel; IRenderer lifecycle types already here)
   ▲
@invana/canvas         (orchestrator — PIXI-FREE after P2: Canvas lifecycle, registries,
   │                    Layer/Behaviour/Layout base, Camera commands, hit index,
   │                    IPrimitivesRenderer + the pixi-free SPEC TYPES)
   ├── @invana/graph            (peer: canvas — unchanged; draws via IPrimitivesRenderer)
   └── @invana/renderer-pixijs  (NEW — implements IRenderer + IPrimitivesRenderer with pixi;
                                 owns Application, Viewport, all primitives/*, textures/fonts)
                                 deps: pixi.js, pixi-viewport, rbush?  peer: canvas, canvas-store
```

App wiring becomes: `new Canvas({ renderer: new PixiRenderer() })` — the orchestrator
holds an injected `IRenderer`; a second backend (`canvas-2d`, headless) is a drop-in.

**Interface home (decision):** `IPrimitivesRenderer` + all **spec types** live in
`@invana/canvas` (pixi-free), because they carry drawing vocabulary (shapes/connectors/
decorations) that doesn't belong in the renderer-free kernel. The coarse `IRenderer`
stays in `canvas-store` (generic lifecycle). `renderer-pixijs` depends on both.

## 4. The three hard parts (where the real work is)

### 4.1 Split the spec types pixi-free
`GraphLayer` imports `BaseShapeSpec` (+ connector/decoration spec types) from
`@invana/canvas/primitives`. Today those type declarations sit in `primitives/types.ts`
and the per-primitive files **alongside pixi implementation code**. Split them:
- **Pixi-free spec types** (`ShapeSpec`/`BaseShapeSpec`, connector specs, `IShapeDecoration`/
  `IConnectorDecoration` style specs, marker/router/pathStyle spec shapes, `HitResult`) →
  a `canvas` module (e.g. `src/renderer/specs/`) with **no pixi import**.
- **Pixi implementations** (the `ShapeBase`/`ConnectorBase` classes, `Graphics` geometry,
  `applyFillStroke`, texture paint) → `renderer-pixijs`.
- Gate: `canvas` + `graph` reference only the spec types; the interface `IPrimitivesRenderer`
  is generic over spec types, so `addShape<TSpec>(id, spec: TSpec)` stays intact.

### 4.2 Abstract the surface handle (the `new Container()` in `Layer`)
`WorldLayer.mount()` does `new Container({ isRenderGroup: true })` + `ctx.world.addChild(root)`;
`ScreenLayer.mount()` → `ctx.stage.addChild(root)`. That's raw pixi in the (staying)
orchestrator. Replace with a renderer-provided surface:
```ts
// IRenderer (lifecycle)
createSurface(space: 'world' | 'screen'): ISurface;
interface ISurface {
  readonly primitives: IPrimitivesRenderer;   // the per-layer drawing device
  setVisible(v: boolean): void;
  setZIndex(z: number): void;
  destroy(): void;
}
```
- `WorldLayer`/`ScreenLayer` mount asks `ctx.renderer.createSurface('world'|'screen')`
  instead of newing a `Container`. `createGraphics()`/`createContainer()` helpers on the
  base (raw pixi today) either move behind `ISurface` or are dropped in favour of the
  primitives API.
- `PrimitivesRenderer`'s constructor (`{ container, camera }`) is satisfied **inside**
  the renderer when it builds the surface — canvas never sees the `Container`.
- `Canvas.world`/`Canvas.stage` (public pixi `Container`s today) leave the orchestrator's
  public surface; consumers that reach `ctx.world`/`ctx.stage` move to the renderer side.

### 4.3 Camera / viewport rewire
`Camera` wraps `pixi-viewport`; **4 camera-input behaviours** (`DragPanBehaviour`,
`WheelZoomBehaviour`, `PinchZoomBehaviour`, `ElementSizeLODBehaviour`) reach
`camera.viewport.drag()/.wheel()/.pinch()` directly. Abstract camera transform +
commands already live in `view.interaction.camera` + `actions.camera` (kernel).
- The **abstract camera** (commands, `{x,y,zoom}`) stays in `canvas`; the **pixi-viewport
  realization** moves to `renderer-pixijs` (`IRenderer.applyCamera` already in the seam).
- The 4 behaviours rewire to emit **gesture intents** (`input:camera:pan` / `:zoom`, already
  on the bus) / call `actions.camera.*`, **not** poke `camera.viewport`. The renderer
  installs the actual pixi-viewport plugins and reports gestures back on the bus.
- `camera.viewport` (the raw handle) is removed from the orchestrator's public surface.

## 5. File census — what moves to `renderer-pixijs`

**45 files import pixi** in `packages/canvas/src` (grouped):

| Group | Count | Fate |
|---|---|---|
| `primitives/` (shapes, connectors, decorations/{shape,connector}, effects, paint, base, markers, `PrimitivesRenderer`, `types.ts` impl half) | 37 | → `renderer-pixijs` (the drawing library). `types.ts` **splits** (§4.1). |
| `layers/` World/Screen/Background render bodies | 3 | render body → renderer surface (§4.2); Layer **identity** stays in `canvas`. |
| `camera/Camera.ts` | 1 | viewport binding → renderer; abstract camera/commands stay. |
| `engine/Canvas.ts` | 1 | **split**: pixi `Application`/viewport/ticker bootstrap → renderer; lifecycle/registries/`update`/`get` stay. |
| `context/CanvasContext.ts` | 1 | drop pixi `world`/`stage` handles; add `renderer` + `createSurface`. |
| `textures/`, `fonts/` | 1+assets | GPU textures + icon-font loading → renderer. |
| `index.ts` (root) | 1 | drop the `primitives` subpath re-export from `canvas`; consumers import specs from the new spec module. |

**Pure-geometry, zero-pixi but renderer-only-consumed** (`primitives/connectors/{pathStyles,
routers,anchors}`, `pathSampling`, `badges`, `animation`, `instancing`): travel **with**
`renderer-pixijs` now (YAGNI a shared `canvas-geometry` leaf until a 2nd renderer needs
them — companion plan §5).

## 6. Phasing (each step green + revertible)

- **P2.0 — Spec-type split (in-place).** Extract pixi-free spec types into `canvas`
  `src/renderer/specs/`; `primitives/*` and `graph` import specs from there. No new
  package yet. *De-risks the move; graph keeps compiling.*
- **P2.1 — Define `IPrimitivesRenderer` + `IRenderer.createSurface`/`ISurface`** in `canvas`
  / kernel; make `PrimitivesRenderer` *implement* `IPrimitivesRenderer`; route `Layer`
  base through `ctx.renderer.createSurface(...)` instead of `new Container()`. Renderer
  object still lives **in-package** (pixi still in `canvas`) — just the seam, in place.
- **P2.2 — Stand up `@invana/renderer-pixijs`**; move `primitives/*` + drawing layer bodies
  + textures/fonts + the pixi `Application`/viewport bootstrap + `Camera`'s viewport
  binding + the renderer-side context. `canvas` now depends on `canvas-store` only; pixi
  leaves `canvas` (lint-enforced, like the kernel's no-zustand rule).
- **P2.3 — Rewire the 4 camera/LOD behaviours** to commands/intents; drop `ctx.world`/
  `ctx.stage`/`camera.viewport` from the orchestrator's public surface.
- **P2.4 — (optional) second renderer** (headless/`canvas-2d`) to validate the seam, or a
  store-projection engine experiment on top of `IPrimitivesRenderer`.

**Gate every phase:** `canvas` imports zero pixi (lint) after P2.2; `graph` draw code
unchanged; the hot path (per-frame `layer.flush()` → primitive updates) shows no added
cost; `pnpm check-types` + tests green across canvas-store/canvas/graph/canvas-react.

## 7. Risks & open questions

- **`Canvas.world`/`Canvas.stage` are public** (typed `Container`). Removing them is a
  breaking surface change — audit external reads (`ctx.world`/`ctx.stage`) before P2.3;
  most are renderer-internal, but confirm with a grep gate.
- **`hitTest` ownership.** `PrimitivesRenderer.hitTest` + `HitIndex` (rbush) — the spatial
  index is pixi-free (stays in `canvas`?) but hit geometry is produced by the renderer.
  Decide: index in `canvas`, fed by the renderer via `ISurface`, vs index in the renderer.
- **Animation tick.** `tickAnimations(dt)` is driven by `Canvas.tickOnce`'s duck-typed
  walk; after the split the loop calls the renderer's tick. Confirm the single-clock
  ownership (kernel drains data flush; renderer drives its own animation + pixi render).
- **Interface home** — `IPrimitivesRenderer` + specs in `canvas` (recommended) vs kernel.
  This plan puts them in `canvas`; revisit only if a non-`canvas` consumer appears.
- **Story-side fallout** — `apps/storybook` reaches pixi/`primitives` in some stories;
  those imports repoint to `renderer-pixijs` (rule 11 — done only when explicitly asked).

## 8. One-paragraph summary

Drawing is already isolated behind `PrimitivesRenderer` (graph has zero pixi), so P2 is an
**interface-extraction along the seam that exists**, not a rewrite. `renderer-pixijs`
implements two interfaces — `IRenderer` (lifecycle: mount, `createSurface`, camera, loop)
and `IPrimitivesRenderer` (the per-surface drawing device layers call) — and absorbs the
45 pixi files (37 in `primitives/` + drawing-layer bodies + camera-viewport + the
`Application`/viewport bootstrap + textures/fonts). The three genuine tasks beyond moving
files: **split spec types pixi-free**, **abstract the `Container` handle** into an
`ISurface`, and **rewire the 4 camera behaviours** off `camera.viewport`. Keep the
imperative Layer model now; the store-projection engine (`IRenderer.applyData`) is a later
north star that can sit on top.
