# Visual decorations & animation extension model for `ShapesRenderer`

**Status:** Draft. Captures the design discussion for Decorations, animation paths, and texture-baking.
**Predecessors:** [architecture-proposal.md](architecture-proposal.md) §2.6, §2.7.

## Context

`architecture-proposal.md` §2.6 originally listed `setHalo(id, style)` as a renderer primitive — one of three concrete decoration methods (`setHalo`, `setLODLevel`, `rasteriseLabel`). That works for one-off visuals but doesn't scale: borders, dashed borders, marching-ants animations, soft glows, expanding pulse rings, and future domain-specific effects (lightning bolts on edges, conflict-warning badges on ER tables, etc.) would each demand a new method on the renderer.

We need a **uniform extension point** for visual augmentations of shapes, with first-class support for animation, that stays consistent with the registry pattern already used for shapes / connectors / markers / routers.

**Outcome:** ShapesRenderer gains a fifth primitive — `Decoration` — registered, slot-composed, optionally animated, ticked from the single Canvas RAF. `setHalo` becomes a built-in decoration (`'halo'`) rather than a hard-coded method.

---

## Design

### 1. Decoration is the fifth primitive

| Primitive | Job | Animated? |
|---|---|---|
| Shape | Drawable thing positioned by `(x,y)` | no |
| Connector | Drawable thing from source to target endpoint | no |
| Marker | Shape positioned by host connector | no |
| Router | Pure function: endpoints → polyline | no |
| **Decoration** | **Visual augmentation of a host shape OR connector. Drawn relative to host. May be animated.** | **optionally** |

Decorations are registered like the other primitives and instantiated by kind name. **Decorations target both shapes and connectors** — the renderer dispatches by id namespace.

### 2. Base interfaces — two variants

Shapes and connectors have different "host geometry" (a bounding rect vs. a path), so two interfaces share a common base. The interface uses a `mount` / `tick` / `update` / `destroy` lifecycle so decorations can pick the optimal pixi primitive (Graphics, Mesh, Filter, Sprite) inside the container they're given:

```ts
interface IDecorationBase<TStyle = unknown> {
  style: TStyle;

  // Called once when setDecoration() applies this decoration.
  // Decoration creates its pixi objects in `host.container` — Graphics, Mesh, Filter, etc.
  mount(host: ShapeHostInfo | ConnectorHostInfo): void;

  // Called when the host's spec changes in a way that affects geometry
  // (host resized, connector re-routed). Decoration re-lays out without re-mounting.
  update?(host: ShapeHostInfo | ConnectorHostInfo): void;

  // Called per frame ONLY if present. Mutates the decoration's own pixi objects in place
  // (uniform updates, dash offset, mesh vertex shifts) — no Graphics.clear()+redraw.
  // Return true to flag a redraw hint (pixi v8 mostly auto-detects).
  tick?(deltaMs: number): boolean;

  // Called when the slot is cleared or replaced. Destroy textures, filters, meshes.
  destroy(): void;
}

interface IShapeDecoration<TStyle = unknown> extends IDecorationBase<TStyle> {}
interface IConnectorDecoration<TStyle = unknown> extends IDecorationBase<TStyle> {}

type ShapeHostInfo = {
  container: Container;          // decoration's container (child of host's parent)
  bounds: Rect;
  shape: IShape;                 // full host instance for advanced reads
};

type ConnectorHostInfo = {
  container: Container;
  path: Point[];                 // routed polyline
  connector: IConnector;
};
```

A decoration declares which target type it supports at registration time:

```ts
renderer.registerDecoration('halo',          HaloDecoration,        { target: 'shape' });
renderer.registerDecoration('marching-ants', MarchingAntsDecoration,{ target: 'both' });
renderer.registerDecoration('traffic-flow',  TrafficFlowDecoration, { target: 'connector' });
```

`{ target: 'both' }` means the same decoration class handles both forms.

For decorations that need the host's exact contour (a glow that hugs a star polygon) or a connector's stroke width, hosts may expose optional accessors:

```ts
interface IShape {
  // existing draw / getBounds / hitTest …
  getOutline?(): Point[];        // closed polyline of outer contour
  getMaskShape?(): Graphics;     // pixi Graphics suitable for use as a mask
  getCenter?(): Point;
}

interface IConnector {
  // existing draw / hitTest …
  getStrokeWidth?(): number;
}
```

If a host doesn't implement an accessor, decorations needing it fall back to bounds (or refuse to mount with a clear error).

### 3. Slot-based stacking on the host

Each host can hold **multiple decorations simultaneously**, one per named slot. Slot name is a free string, conventional across the ecosystem:

| Slot | Convention | Drawn |
|---|---|---|
| `halo` | Selection / focus glow | Behind shape |
| `border` | Outline (solid or dashed) | On shape (inside bounds) |
| `glow` | Soft outer aura | Behind shape, behind halo |
| `pulse` | Expanding ring(s) radiating outward | In front of shape |
| `badge` | Status indicator overlay | In front of shape (top-right by convention) |
| `fx` | Free-form domain effect | In front of everything |

Slot z-order is fixed by the renderer (configurable later if needed). A consumer can write to any slot — there's no enum, just convention. Setting a slot to `null` removes its decoration.

### 4. ShapesRenderer additions

The core API stays small and orthogonal — no per-decoration sugar methods (no `setHalo`, no `setBorder`). Domain packages add ergonomic shortcuts on top.

```ts
class ShapesRenderer {
  // ─── existing ─────────────────────────────────────────
  registerShape(kind, ctor, opts?: { cacheable?: boolean; cacheKey?: (spec) => string; bulkRender?: boolean })
  registerConnector(kind, ctor)
  registerMarker(kind, ctor)
  registerRouter(kind, ctor)

  // ─── new ──────────────────────────────────────────────
  registerDecoration(
    kind: string,
    ctor: DecorationCtor,
    opts: { target: 'shape' | 'connector' | 'both' }
  ): void;

  setDecoration(
    targetId: string,                           // shape id OR connector id
    slot: string,
    decoration: { kind: string; style: unknown } | null
  ): void;

  // canvas.tick() calls this once per frame, after layer.flush(),
  // before surfaces.render().
  tickAnimations(deltaMs: number): void;

  // ─── texture utilities (see §11.3) ────────────────────
  bakeToTexture(
    drawFn: (g: Graphics) => void,
    opts: {
      width: number;
      height: number;
      resolution?: number;            // default: window.devicePixelRatio, capped at maxBakeResolution
      antialias?: boolean;
      mipmap?: 'on' | 'off';          // pixi v8 mipmap generation; default 'off'
      associateWith?: string;         // host id; bake re-runs on host LOD change
      redrawOnLODChange?: boolean;    // if drawFn output varies by LOD level, opt in to update() callbacks
    }
  ): RenderTexture;
  releaseTexture(tex: RenderTexture): void;

  // ─── LOD / DPR / cache controls ───────────────────────
  setLODLevel(id: string, level: number): void;
  setLODResolutionMap(map: Record<number, number>): void;   // LOD level → resolution multiplier
  setMaxBakeResolution(r: number): void;                    // hard cap; default 3.0
  setTextureCacheBudget(bytes: number): void;               // LRU eviction; default 128 MB
  getTextureCacheStats(): { textureCount: number; bytes: number; hits: number; misses: number };

  // ─── compressed textures ──────────────────────────────
  loadCompressedTexture(url: string): Promise<Texture>;     // KTX2 / Basis Universal

  // ─── atlas / culling / draw-call telemetry ────────────
  setMaxAtlasDimension(px: number): void;                   // default 4096
  setBulkRenderThreshold(n: number): void;                  // auto-promote to ParticleContainer; default 5000
  setDrawCallWarningThreshold(n: number): void;             // telemetry warning; default 100
  getRenderStats(): { drawCalls: number; activeAtlases: number; visibleShapes: number; visibleConnectors: number };
}
```

Renderer dispatches by id — it knows which ids are shapes and which are connectors from its internal `shapes` / `connectors` Maps. If a decoration's registered `target` doesn't match the id's kind (e.g. shape-only decoration on a connector id), `setDecoration` throws with a clear error in dev, no-ops in prod.

#### Container hierarchy per host

```
ShapesRenderer
└─ shapeLayer       Container({ isRenderGroup: true })   ← independent GPU transform/cull unit
   ├─ topDecorationLayer  RenderLayer ← optional; decorations with alwaysOnTop: true attach here
   ├─ dragLayer           RenderLayer ← used by DragMoveBehaviour during drag
   └─ shape-42 container  Container                      ← regular; rides parent RenderGroup
      ├─ glow      decoration container  Container
      ├─ halo      decoration container  Container
      ├─ host shape graphics
      ├─ border    decoration container  Container
      ├─ pulse     decoration container  Container
      └─ fx        decoration container  Container
└─ connectorLayer   Container({ isRenderGroup: true })
   └─ connector-7 container  Container
      ├─ pulsating-glow  decoration container
      ├─ host connector graphics
      ├─ marching-ants   decoration container
      └─ flying-marker   decoration container
```

- The two top-level containers (`shapeLayer`, `connectorLayer`) are **RenderGroups** — pixi v8 composes their transforms on the GPU. See §11.9 for the rationale and the full scene-graph layout.
- Per-host containers are **regular Containers** — never render groups (one-per-shape would mean tens of thousands of groups, defeating the optimization).
- Decorations are siblings of the host's pixi objects under the host's parent container:
  - `setTransform(id, { scale, rotation, tx, ty })` on the parent → host AND all decorations move together via the parent RenderGroup's GPU transform pass.
  - Each decoration owns its own subtree; it picks Graphics, Mesh, Filter, or Sprite as fits its perf profile.
- "Always on top" decorations attach to the renderer's `topDecorationLayer` RenderLayer (logical parent stays the host container; render order detaches from sibling z-order).

`setDecoration()` is O(1): if the slot already has a decoration, call `destroy()`, instantiate the new one (or remove if null), call `mount(host)`. If the new decoration has a `tick()`, register it in the renderer's animation set.

### 5. Animation runs on the Canvas tick

`Canvas` delegates frame timing to **pixi v8's `Application.ticker`** (see §11.9 for rationale) — one RAF, production-hardened. Our `canvas.tick(ticker)` registers as a ticker callback. Pixi commits the GPU render automatically at the end of each tick.

Per-frame ordering:

```
ticker fires →
canvas.tick(ticker):
  dt = ticker.deltaMS
  animationRunner.tick(dt)              ← Tweens (effect + data) — see §6
  for layer in layers (z-order):
    if !layer.visible: continue
    if layer.dirty.hasPending(): layer.flush()
    layer.renderer.tickAnimations(dt)   ← decoration internal animations
← pixi auto-commits: renderer.render(stage)
```

`tickAnimations(dt)` walks a Set of animated decoration instances and calls each `tick(dt)`. The decoration mutates its own pixi objects in place (uniforms / dash offsets / vertex positions) — no Graphics.clear()+redraw cost when avoidable.

**Cost model for animations:**
- 100 marching-ants borders → 100 `tick()` per frame ≈ 0.5–1 ms on M1 (one stroke prop update each).
- 100 pulsating-glow connectors with Mesh+shader → 100 uniform writes ≈ ~100 µs/frame; GPU does per-pixel work.
- 1000 animated decorations → measurable; budget guard rail catches it.

### 6. Animation system — three paths, one RAF

Animations come from **three sources**, all driven by the same Canvas RAF:

| Source | What animates | Owns the time | Example |
|---|---|---|---|
| **Decoration `tick()`** | The decoration around the host | The decoration itself | marching-ants, pulse-ring |
| **Effect tween** | The host's container transform — scale, rotation, position offset, alpha. **Transient — bypasses state.** | A `Tween` on the `AnimationRunner` | breathing, scale-pop, hover-rotate |
| **Data tween** | A persistent field in state — node color, position, edge thickness. **Durable — through state.** | A `Tween` on the `AnimationRunner` | layout transition, color fade |

The split between **effect** and **data** tweens is the load-bearing call: transient flourishes shouldn't pollute state with 60 mutations/sec; durable changes must, so devtools / time-travel / inspectors stay accurate.

#### `Tween` primitive

```ts
type EasingFn = (t: number) => number;        // 0..1 → 0..1

interface TweenOptions<T = number> {
  from: T;
  to: T;
  durationMs: number;
  easing?: EasingFn;
  delayMs?: number;
  repeat?: number;                              // 0 = once, Infinity = forever
  yoyo?: boolean;                               // reverse on alt iterations
  interpolate?: (from: T, to: T, t: number) => T;
  onUpdate: (value: T) => void;
  onComplete?: () => void;
  onIteration?: (iter: number) => void;
}

class Tween<T = number> {
  start(): this; pause(): this; resume(): this; stop(): this;
  isComplete: boolean;
  tick(deltaMs: number): boolean;               // returns true while alive
}
```

#### `AnimationRunner` — lives on Canvas

```ts
class AnimationRunner {
  private active = new Set<Tween<any>>();
  add(t: Tween<any>): void;
  remove(t: Tween<any>): void;
  tick(deltaMs: number): void {
    for (const t of this.active) if (!t.tick(deltaMs)) this.active.delete(t);
  }
}

interface CanvasContext {
  // existing fields …
  animations: AnimationRunner;
}
```

Tweens run **before** `layer.flush()` so data tweens' state mutations land in the same frame's flush. Decoration ticks run **after** flush so they redraw against just-updated host bounds/path.

#### Renderer addition for effect tweens

For effect tweens that bypass state, the renderer needs a transient transform API:

```ts
class ShapesRenderer {
  // Effect-only — does NOT update state, does NOT update spatial index.
  // null resets the container to identity.
  setTransform(
    id: string,
    transform: Partial<{ scale: number; rotation: number; tx: number; ty: number; alpha: number }> | null
  ): void;
}
```

Transforms compose with the host's existing position (`spec.x, spec.y`) — additive overlays. Decorations ride along automatically because they're children of the same parent container.

### 7. Domain extension example (ER diagrams)

```ts
// @invana/er-diagram — register a custom "conflict warning" decoration
renderer.registerDecoration('conflict-warning', ConflictWarningDecoration, { target: 'shape' });

// In ER layer's flush:
for (const id of snap.buckets.get('conflictDecoration') ?? []) {
  const hasConflict = state.conflictTableIds.has(id);
  renderer.setDecoration(id, 'badge', hasConflict
    ? { kind: 'conflict-warning', style: { color: 0xef4444 } }
    : null);
}
```

`ConflictWarningDecoration` could be animated (pulsing red dot) or static (solid badge). The ER layer doesn't care — it just sets the slot.

### 8. Domain-package sugar (e.g. `GraphLayer.haloNode()`)

The renderer surface is intentionally one method: `setDecoration(targetId, slot, spec)`. That's terse and orthogonal but not always memorable for app code ("which slot? which kind string?"). Domain packages own the friendly developer-facing API on top.

`@invana/graph`'s `GraphLayer` adds discoverable, typed shortcuts that **mutate state**, not the renderer directly — preserving the state-as-truth contract:

```ts
class GraphLayer extends WorldLayer<GraphOptions, GraphState> {
  // Decoration sugar — through state
  haloNode(id: string, style?: HaloStyle | null): void {
    this.state.setState(s => {
      const halos = new Map(s.haloStyles);
      style ? halos.set(id, style) : halos.delete(id);
      return { ...s, haloStyles: halos };
    });
  }
  pulseNode(id: string, opts: PulseRingStyle | false): void { /* state mutation */ }
  dashBorderNode(id: string, style: BorderStyle | null): void { /* state mutation */ }

  // Effect-tween sugar — through AnimationRunner, bypasses state
  pulsateNode(id: string, opts?): TweenHandle { /* effect tween */ }
  rotateNode(id: string, opts): TweenHandle { /* effect tween */ }
  scaleInNode(id: string, opts): TweenHandle { /* effect tween */ }

  // Data-tween sugar — through state
  transitionNodeColor(id: string, opts): TweenHandle { /* state mutation per frame */ }
  transitionLayout(layout: Layout, opts): TweenGroupHandle { /* batched state mutation */ }

  // Path-based
  flyMarkerAlongEdge(edgeId: string, opts): { markerId; tween } { /* tween + free Shape */ }
  marchingAntsEdge(id: string, style): void { /* decoration sugar — state mutation */ }
}
```

The layer's `flush()` projects `haloStyles` / `pulseStyles` etc. → `renderer.setDecoration(id, 'halo', ...)`. App code never touches the renderer.

**Why this layering is the right call:**
- Core `setDecoration` is one method; total API surface stays small
- App developers get domain-named methods (`haloNode`, not `setDecoration(..., 'halo', ...)`)
- Each domain package can name decorations its way (`@invana/er-diagram` ships `markConflict(tableId)`)
- Sugar methods funnel through state, so devtools / time-travel / telemetry catch them
- A consumer writing a custom decoration goes through the generic API; doesn't need a sugar method

**Convention** (documented in graph package's CLAUDE.md): every sugar method takes `id` as first arg, `style | null | false` as second to clear/disable. Consistent shape across `haloNode`, `pulseNode`, `dashBorderNode`, etc.

### 9. Integration with state-as-truth

State holds the **intent**: "selectedIds", "conflictIds", "hoveredId", "haloStyles". The layer's `flush()` projects state → renderer decorations. The decorations themselves hold no application state — only their style and animation phase.

Crucially: **animated decorations don't pollute state**. A pulse-ring decoration ticks its phase internally in the renderer; state holds only the intent (this id is pulsed). Telemetry tap doesn't get spammed. Devtools timeline stays clean.

Effect tweens also don't pollute state (transforms applied directly to pixi container). Only data tweens go through state — and only because the values they tween *are* durable data.

### 10. What is NOT in scope here

- **Cross-shape decorations** (a halo around a group of shapes). Layer-level concern; the layer can add a temporary "group-halo" Shape rather than a decoration.

(Custom per-vertex / per-fragment shader effects ARE in scope — they're how the built-in animated decorations work, and the Mesh+Shader path is a first-class extension point for any consumer-defined decoration.)

### 11. GPU-first rendering — core performance design

The renderer is GPU-first by default. Every performance feature in this section ships as part of the core, not as future work or v2 polish — they're the reason the architecture exists. The four pillars:

1. **WebGPU backend** with WebGL2 fallback (pixi v8 native)
2. **Custom shaders + meshes** as the default path for animated decorations
3. **Texture-baking, atlases, and compressed textures** for static content
4. **GPU-side culling, instancing, and batching** for massive scenes

Each is described below.

#### 11.1 Three rendering backends — WebGPU, WebGL, Canvas

The renderer supports all three pixi v8 systems via the `ExtensionType` extension categories: `ExtensionType.WebGPUSystem`, `ExtensionType.WebGLSystem`, `ExtensionType.CanvasSystem`. `Canvas.init()` selects in priority order, falling through automatically:

```ts
class Canvas {
  async init() {
    this.app = new Application();
    await this.app.init({
      preference: 'webgpu',                 // pixi v8 — try WebGPU first
      fallback: ['webgl', 'canvas'],        // then WebGL2, then Canvas2D
      antialias: true,                      // GPU MSAA on WebGPU/WebGL; CPU AA on Canvas
      resolution: window.devicePixelRatio,
      autoDensity: true,
      powerPreference: 'high-performance',
      backgroundAlpha: this.options.opaque ? 1 : 0,   // opaque saves one alpha-blend/frame
      hello: false,                         // suppress pixi banner
    });
  }
}
```

Backend tradeoffs:

| Backend | When used | Wins | Limitations |
|---|---|---|---|
| **WebGPU** (`ExtensionType.WebGPUSystem`) | Modern Chrome / Safari TP / Edge | Compute shaders, lower CPU overhead, better pipeline-state caching, native bind groups, higher draw-call ceiling | Browser support still rolling out |
| **WebGL2** (`ExtensionType.WebGLSystem`) | Most current browsers | Mature, fast, MSAA, instanced rendering | Higher CPU draw-call cost than WebGPU; no compute |
| **Canvas2D** (`ExtensionType.CanvasSystem`) | Headless tests, SSR thumbnails, very old browsers | No GPU required, deterministic output, works in jsdom | Slow at scale; no shaders, no filters, no MSAA |

A telemetry event fires on init so consumers see which backend won:
```
canvas:renderer:initialised  { backend: 'webgpu' | 'webgl' | 'canvas', adapter, limits, capabilities }
```

**Capability gating.** `ShapesRenderer` exposes a `capabilities` object derived from the active backend. Decorations and shapes check before using advanced features:

```ts
interface RendererCapabilities {
  backend: 'webgpu' | 'webgl' | 'canvas';
  shaders: boolean;          // false on canvas
  filters: boolean;          // false on canvas
  computeShaders: boolean;   // true only on webgpu
  msaa: boolean;             // true on webgpu/webgl
  maxTextureSize: number;
  maxAtlasDimension: number;
  compressedTextures: boolean;
  particleContainer: boolean;
}
```

Shader-based decorations (`marching-ants`, `pulse-ring`, `pulsating-flow`, etc.) check `caps.shaders` and degrade to Graphics-based equivalents on Canvas2D. The decoration's `mount(host)` receives `host.capabilities` for this check; the decoration picks its rendering primitive accordingly. Same decoration, three implementations chosen at mount time.

All built-in shaders are written in WGSL with GLSL transpilation (pixi v8 ships this dual-path) so WebGPU and WebGL2 backends both run the shader-based decoration path.

#### 11.2 Custom shaders + meshes — the default for animated decorations

All animated built-in decorations are Mesh + Shader, never per-frame Graphics redraws:

| Decoration | Implementation | Why |
|---|---|---|
| `marching-ants` | Mesh along path, fragment shader scrolls dash via `uPhase` uniform | One uniform write per frame; GPU does per-pixel work |
| `pulse-ring` | Instanced quad mesh, vertex shader expands radius, fragment shader handles fade | All N rings in one draw call |
| `pulsating-flow` | Tube mesh along connector path, fragment shader applies sine intensity | Per-pixel sine on GPU |
| `glow` | Mesh expanding host outline + Gaussian falloff in fragment shader | No CPU blur cost |

Custom decorations get the same path. Decoration's `mount()` creates the Mesh + Shader; `tick()` updates one or two uniforms; never touches CPU drawing code per frame. CPU cost ≈ N tiny uniform writes; GPU does the rest.

Filters (pixi `Filter` class — pixel shaders applied to entire containers) are also first-class: a decoration can install a custom filter (`DisplacementFilter`, `BlurFilter`, custom WGSL/GLSL) on its container to compose post-processing effects.

#### 11.3 Texture-baking for high performance

After GPU shaders, **texture-baking** is the second-biggest perf lever. The architecture supports it as a first-class option without changing the decoration interface — decorations and shapes opt in at `mount()` / registration time.

#### When textures win vs. lose

| Scenario | Vector (Graphics) | Texture (Sprite) | Winner |
|---|---|---|---|
| 10,000 identical dot nodes | 10,000 Graphics, per-frame tessellation | 1 RenderTexture, 10,000 Sprites in one batch | **Texture by ~100×** |
| Static halo / border / glow | Graphics drawn once | Bake once, display as Sprite | **Texture (small win)** |
| Marching-ants on 50 edges | Graphics with dash offset per frame | Texture with UV scroll | **Texture by ~3×** |
| Zoomed-in inspection of one shape | Crisp at any zoom | Blurs unless re-baked | **Vector** |
| Shape whose color changes per frame | Update fill, redraw | Re-bake every frame (slow) | **Vector** |
| ER table at far zoom (LOD: blob) | Wasteful full geometry | Single tinted Sprite | **Texture** |

**Rule of thumb:** if the *visual content* is stable, bake. If it changes per frame, stay vector or use a shader.

#### Cacheable shapes — opt-in at registration

For shapes drawn many times with identical or near-identical specs:

```ts
renderer.registerShape('dot-node', DotNodeShape, {
  cacheable: true,
  // Spec → cache key. Specs producing the same key share one texture per LOD.
  cacheKey: spec => `${spec.color}:${spec.size}:${spec.borderColor}`,
  // Optional: route Sprites into a ParticleContainer (pixi v8) for massive scenes
  bulkRender: false,
  // Optional: bake at all configured LOD resolutions on first add — instant zoom transitions
  prebakeAllLODs: false,
  // Optional: enable pixi v8 mipmap generation on baked textures — smooth zoom-out at ~33% extra GPU mem
  mipmap: 'off',
});
```

Behaviour:
1. `addShape(id, spec)` — compute `cacheKey(spec)`. If cached → create Sprite. Otherwise bake via `draw()` into a RenderTexture, cache, then Sprite.
2. `updateShape` with a spec mapping to the **same key** → re-use cached Sprite; just update position/scale/tint.
3. `updateShape` with a spec mapping to a **different key** → swap to that key's Sprite (bake on-demand if missing).
4. Last referrer dropped → `releaseTexture` frees the GPU memory.

50k graph nodes with 5 visual variants → 5 textures, 50k cheap Sprites, one batch per variant.

#### `ParticleContainer` for massive sprite scenes

Pixi v8's `ParticleContainer` stores only `(texture, x, y, scale, rotation, tint)` per child with near-zero per-particle overhead. Enabled via `bulkRender: true` on registration. Trades per-shape filters / Container flexibility for raw throughput.

**Auto-promotion heuristic.** When a shape kind's instance count exceeds `bulkRenderThreshold` (default `5000`) and the kind is `cacheable`, the renderer automatically promotes its container to `ParticleContainer` (logs a telemetry event so consumers see it happened). 100k network-graph dots needs no opt-in — it just works. Consumers who require Container features (per-shape filters, blend modes) set `bulkRender: 'never'` on registration to inhibit promotion.

#### Decorations choose vector vs. texture in `mount()`

The interface (`mount` / `tick` / `update` / `destroy`) doesn't change — `mount` gives the decoration a Container to populate however it wants. A static decoration (halo, border, glow, badge) bakes once; an animated decoration (marching-ants, pulse-ring, pulsating-flow) uses Graphics or Mesh+shader instead:

```ts
class HaloDecoration implements IShapeDecoration<HaloStyle> {
  private sprite!: Sprite;
  private bakedTexture!: RenderTexture;

  mount(host: ShapeHostInfo) {
    const pad = this.style.width + (this.style.blur ?? 0);
    this.bakedTexture = renderer.bakeToTexture(
      g => this.drawHalo(g, host.bounds, pad),
      { width: host.bounds.w + pad * 2, height: host.bounds.h + pad * 2, resolution: 2 }
    );
    this.sprite = new Sprite(this.bakedTexture);
    this.sprite.position.set(host.bounds.x - pad, host.bounds.y - pad);
    host.container.addChildAt(this.sprite, 0);
  }

  update(host: ShapeHostInfo) {
    // host resized — release & re-bake at new bounds, swap sprite.texture
    renderer.releaseTexture(this.bakedTexture);
    /* re-bake */
  }

  destroy() {
    renderer.releaseTexture(this.bakedTexture);
    this.sprite.destroy();
  }
}
```

#### Defaults for built-ins — performance-first

| Feature | Default | Rationale |
|---|---|---|
| Renderer backend | `webgpu` → `webgl` → `canvas` (auto-fallback) | Compute shaders + lowest CPU on modern; broad compatibility on older; headless/SSR on Canvas |
| Antialias | `on` (GPU MSAA on WebGPU/WebGL; off on Canvas) | Free GPU-side AA where supported |
| Background alpha | `0` for transparent canvas, `1` for `opaque: true` | Saves alpha-blend per frame in opaque mode |
| Resolution | `devicePixelRatio` | Crisp on retina by default |
| Built-in shapes | `cacheable: true`, `prebakeAllLODs: true` | Free perf for the common case; instant zoom |
| Built-in static decorations (`halo`, `border`, `glow`, `badge`) | Texture-baked + cached | One bake per `(spec, lodLevel)`, infinite reuse |
| Built-in animated decorations (`marching-ants`, `pulse-ring`, `pulsating-flow`) | Mesh + Shader | One uniform write per frame; per-pixel work on GPU |
| Mipmap | Auto-on for textures larger than `512²` px | Smooth zoom-out without re-bake |
| `ParticleContainer` promotion | Auto when shape kind exceeds `bulkRenderThreshold` (5000) | 100k+ scenes work without explicit opt-in |
| Texture atlasing | `on` for cached textures sharing a `cacheCategory` | Single-digit draw-call counts |
| GPU viewport culling | `on` per layer (override per `Layer.cullable`) | Scene size doesn't bound frame cost |
| Compressed textures (KTX2 / Basis) | Accepted everywhere images are accepted | 5-10× GPU memory savings when consumer prepares assets |
| Texture cache budget | `128 MB` GPU memory, LRU eviction | Bounded; never evicts displayed textures |

Every feature above lands in the v1 implementation. None are deferred.

#### DPR-aware bake resolution

Texture quality must follow the display density and the camera zoom — otherwise a "performant" sprite is also a blurry sprite at retina or zoomed-in inspection.

**Defaults:**
- `bakeToTexture` `resolution` defaults to `window.devicePixelRatio` (typically 1.0, 2.0, or 3.0).
- Capped at `maxBakeResolution` (default `3.0`) to bound GPU memory.

**DPR change handling:**
- `ShapesRenderer` listens for DPR changes via `window.matchMedia('(resolution: Xdppx)')`. When the user drags a window between a 1× and 2× monitor, every cached texture's `resolution` shifts and re-bakes are scheduled.
- Re-bakes are batched into the next Canvas tick — the swap is one frame of (cached-but-stale) display, then crisp on the following frame.

**Per-bake override:**
```ts
renderer.bakeToTexture(drawFn, {
  width: 200, height: 100,
  resolution: 2,         // explicit; ignores DPR
  antialias: true,
});
```

For content that's intentionally chunky (pixel-art shapes, low-res icons), pass an explicit lower `resolution` and ignore DPR.

#### LOD-driven re-bake

The architecture already has `setLODLevel(id, level)` (proposal §2.6 / §2.7) for layers to drive level-of-detail policy. We tie texture resolution to LOD so far-zoom shapes get cheap small textures and zoomed-in shapes get large crisp ones.

**The mechanism:**

1. **LOD-to-resolution mapping** lives on the renderer (overridable by layer):
   ```ts
   // default mapping; renderer.setLODResolutionMap() to customize
   const DEFAULT_LOD_RESOLUTION = {
     0: 0.5,      // far zoom — quarter-resolution texture, tiny GPU footprint
     1: 1.0,      // normal zoom — DPR baseline
     2: 2.0,      // close zoom — 4× pixels, sharp
     3: 4.0,      // inspection zoom — capped at maxBakeResolution
   };
   ```
   Effective resolution = `dpr × LOD_RESOLUTION[level]`, then clamped to `maxBakeResolution`.

2. **Cache key includes LOD level.** Textures are cached per `(specCacheKey, lodLevel)` tuple so the same shape spec at LOD 0 and LOD 2 are independent textures.

3. **Layer drives LOD changes.** Layer subscribes to camera zoom, computes per-shape LOD (or global), calls `renderer.setLODLevel(id, level)`. Renderer:
   - Looks up the texture at the new (cacheKey, lodLevel).
   - If present → swap `sprite.texture` (instantaneous, no re-bake).
   - If missing → schedule a re-bake; until done, keep displaying the old-LOD texture (no flash).

4. **Debounce during continuous zoom.** During an active zoom gesture, LOD changes can fire 60×/sec. The renderer debounces re-bakes (default `100ms` after the last zoom event) so a quick zoom-and-settle only re-bakes once at the final LOD. Mid-zoom display uses the closest-cached LOD scaled by pixi (slightly blurry, but no jank).

5. **Pre-bake all LODs.** Default `prebakeAllLODs: true` for every cacheable shape — bake at every LOD level on first add. Costs ~4× GPU memory per spec key (negligible at small spec counts; the LRU cache handles the bound) and eliminates re-bake hitches during interactive zoom. Memory-constrained scenes can opt out:
   ```ts
   renderer.registerShape('huge-er-table', HugeERTableShape, {
     cacheable: true,
     cacheKey: spec => `${spec.kind}:${spec.width}:${spec.columns.length}`,
     prebakeAllLODs: false,       // bake on demand; relies on debounce + mipmap fallback
   });
   ```

6. **Decorations participate transparently.** A texture-baked decoration calls `bakeToTexture` once in `mount()`; the renderer holds the `drawFn` ref. When the host's LOD changes, the renderer re-runs `drawFn` at the new resolution and swaps the Sprite. The decoration's `update(host)` is *not* called for LOD changes — they're handled below the decoration interface. This keeps decorations simple and lets all baked content benefit from one mechanism.

   Opt-out for decorations whose draw output materially changes by LOD (e.g. simplifies geometry at far zoom): pass `redrawOnLODChange: true` to receive `update(host)` calls with a `host.lodLevel` field.

#### Mipmap fallback

For content where re-baking on every LOD change is wasteful (a 2000×400 ER table baked at 4 resolutions = lots of GPU memory and bake time), the bake can opt into pixi v8's automatic mipmap generation:

```ts
renderer.bakeToTexture(drawFn, {
  width, height, resolution: 2,
  mipmap: 'on',          // pixi generates mip levels; smooth zoom-out filtering, ~33% extra GPU memory
});
```

Mipmaps look slightly soft at intermediate zooms vs. an at-resolution re-bake but eliminate the re-bake entirely. **Recommended for large texture-baked content; not needed for small icons.**

#### Texture cache eviction

Textures consume GPU memory; the cache must bound itself.

- **LRU eviction** with configurable budget (default `128 MB` GPU memory).
- Tracked per texture: byte size (`width × height × resolution² × 4 bytes for RGBA`), last-used frame.
- Critical: textures **currently displayed** are never evicted (their refcount > 0).
- **Telemetry events** emitted on eviction (`canvas:texture-cache:evicted`) so dev mode can warn if the budget is too tight.
- Override: `renderer.setTextureCacheBudget(bytes)`.

#### End-to-end performance trace — zoom from far to close on 1000 ER tables

```
Initial state: 1000 tables visible at LOD 0 (zoom 0.3).
  Cache:   5 unique specCacheKeys × LOD 0 (0.5× resolution) = 5 textures (~2 MB total).
  Display: 1000 Sprites batched into ~5 draw calls.
  Frame:   ~3 ms.

User zooms in. Camera fires 'zoom' events at 60 Hz.
  Layer recomputes LOD per visible table → calls setLODLevel(id, 2) for ones now in close-zoom range.
  Debounce timer: 100 ms.
  Display continues with LOD-0 textures (slight blur during zoom — acceptable).

Zoom settles.
  Renderer wakes the debouncer.
  For each (cacheKey, LOD 2) miss, schedule a bake on the next tick.
  ~5 bakes happen across the next 1-2 frames (each ~1 ms; budgeted via the existing per-frame guard).
  Sprite.texture swapped per shape on each bake completion.
  Final frame: 1000 Sprites at LOD 2, batched into ~5 draw calls.
  Frame: ~3 ms (Sprite count unchanged; resolution doesn't affect draw cost).

GPU memory: was 2 MB, now 2 + 32 = 34 MB. Well under 128 MB budget.
```

#### 11.4 Texture atlases — fewer GPU bind switches

Each unique baked texture becomes its own `BaseTexture`. A scene with 50 distinct decoration textures = 50 bind operations per frame even with batching. The renderer packs cached textures into shared atlases:

- **Auto-atlasing** — when the texture cache holds N textures sharing a `cacheCategory` (e.g. all built-in halos, all built-in borders), the renderer consolidates them into a `BaseTexture` atlas using a shelf-packing algorithm. Sprites point to sub-rectangles via `Texture(baseTexture, frame)`.
- Re-packed lazily during idle ticks (after `flush` + `tickAnimations`, if no input pending and tick budget remaining).
- Atlas size capped at `maxAtlasDimension` (default `4096` — within WebGPU/WebGL2 minimum guarantees).
- Telemetry: `canvas:atlas:packed { textureCount, atlasBytes, batchReduction }`.

Effect: 50k mixed shape Sprites batched into ~1-3 draw calls, regardless of variant count. Pixi v8's batcher handles same-base-texture Sprites in one call automatically.

#### 11.5 Compressed GPU textures (KTX2 / Basis Universal)

For consumer-supplied texture assets (icons, logos, raster brand marks), `bakeToTexture` and `addShape` accept KTX2 / Basis-Universal compressed textures. These transcode on the GPU to native compressed formats (BC7, ASTC, ETC2) — typically **5-10× smaller GPU memory footprint** than raw RGBA, sampled at the same speed.

```ts
const tex = await renderer.loadCompressedTexture('/icons/db-table.ktx2');
renderer.addShape('icon-1', { kind: 'image', texture: tex, x, y });
```

Built-in shapes that accept image input (`image`, `text` once SDF lands) prefer compressed formats when supplied. Documentation directs consumers to Basis Universal CLI for asset prep.

#### 11.6 GPU-side viewport culling

The renderer maintains a per-frame view of which shapes/connectors are inside the camera's visible bounds (using the existing rbush spatial index plus camera bounds from `CanvasContext.camera.getVisibleBounds()`). Off-screen shapes:

- Skip per-frame `tick()` calls (decorations don't burn CPU/GPU on invisible content).
- Skip GPU draw via pixi `cullable: true` flag (pixi tests bounds vs. screen and short-circuits the draw command).
- Are kept in memory and texture cache (so re-entering the viewport doesn't re-bake).

Combined effect on a large scene: a 100k-node graph with only 2k visible nodes pays GPU cost for ~2k Sprites + ~2k decorations, not 100k. Frame stays at 60 fps regardless of total scene size — the bound is **what fits on screen**, not what exists.

Layers can opt a Layer out of culling (`Layer.cullable = false`) for full-canvas effects (background layer, gradient overlay).

#### 11.7 Native pixi v8 batching

Pixi v8 automatically batches:
- **Sprites with the same texture / base-texture** → one draw call.
- **Sprites across up to 16 textures** at once (hardware-dependent multi-texture batching).
- **Graphics with same blend mode and no filters** → automatic batched mesh under the hood.
- **Graphics under 100 points** → batched alongside sprites at near-sprite cost.
- **Particles in a `ParticleContainer`** → one draw call total.

Combined with the atlas (§11.4), the renderer aims for **single-digit draw call counts** for typical scenes (<10k visible items) and **<50 draw calls** for large scenes (100k+ items).

The renderer enforces this by:
- Keeping all decoration containers under a single per-host parent (so siblings batch where compatible).
- Avoiding spurious filter / blend-mode changes between siblings unless decoration explicitly opts in.
- Atlasing cached textures into ≤16 base textures where possible (matching pixi's multi-texture batch limit).
- Logging a `canvas:perf:draw-call-warning` telemetry event when a frame's draw count exceeds `drawCallWarningThreshold` (default `100`).

#### 11.8 Pixi v8 best-practice defaults — applied throughout

Encoding the [pixi v8 performance tips](https://pixijs.com/8.x/guides/concepts/performance-tips) directly into the renderer's defaults so consumers get them without thinking about it:

| Pixi tip | How it lands in our renderer |
|---|---|
| Group objects by type (sprites together, graphics together) | Slot z-order + per-host container layout already groups Sprite-based decorations vs. Graphics-based ones into separate sibling chains; `ShapesRenderer` keeps shape Sprites under one bulk container per kind |
| Sprites batch across up to 16 textures | Atlas size and layout target ≤16 base textures per scene; `getRenderStats().activeAtlases` exposes the count |
| Keep Graphics under 100 points for batching | Built-in shape `draw()` implementations stay under 100 points where possible (curves are tessellated minimally); a vitest enforces this for built-ins |
| Don't mutate Graphics every frame; transform/alpha/tint changes are fine | Animated decorations use Mesh + Shader (uniforms only) or update transform/tint, never re-stroke per frame |
| Replace many complex graphics with sprites | Built-in shapes are `cacheable: true` — first instance bakes once, subsequent instances are Sprites |
| Bitmap text for dynamic content | Built-in `text` shape uses pixi `BitmapText` when the spec sets `dynamic: true` (frequent content changes); falls back to `Text` for static content. SDF text planned as part of `text` spec |
| Text `resolution` reduces memory | Built-in `text` shape sets `resolution = devicePixelRatio` by default; consumer can override |
| `useContextAlpha: false` / `backgroundAlpha: 1` for opaque scenes | `Canvas` accepts `opaque: true` option; sets `backgroundAlpha: 1` to skip per-frame alpha-blend |
| Lower-resolution textures for older devices | `setMaxBakeResolution(1)` for low-power targets; the LOD-resolution map is overridable per scene |
| Texture garbage collector + `texture.destroy()` | LRU cache (§11.3) handles GC; `releaseTexture` is the public hook; `destroy()` chains correctly |
| Stagger texture destruction | Bulk `removeShape` calls staggered across N frames when count > `staggerThreshold` (default `500`); telemetry event fires when staggering kicks in |
| Rect masks fastest (scissor); graphics masks (stencil); sprite masks slowest (filter) | When a decoration / shape needs a mask, the renderer prefers the cheapest option that fits — axis-aligned rect bounds → scissor; non-rect → Graphics; only fallback to Sprite mask if explicitly requested |
| Different blend modes fragment batches | Slot z-order layout puts decorations with the same blend mode adjacent; `setDecoration` rejects mid-stack blend-mode changes that would cause a batch split (warns in dev) |
| Pre-define `filterArea` to avoid measurement | Decorations using filters set `filterArea` from `host.bounds` at `mount()`; avoids per-frame bounds computation |
| Release filter memory: `container.filters = null` | Decoration `destroy()` chains: clear filters, destroy meshes, release textures |
| `interactiveChildren = false` when no per-child events | `ShapesRenderer` sets `interactiveChildren = false` on every host container — pixi event system never traverses into shape graphics; hit-testing routes through the renderer's rbush + shape `hitTest()` |
| `hitArea = Rectangle(...)` to short-circuit hit-tests | Each host container's `hitArea` is set from the shape's `getBounds()` so pixi's broad-phase rejects misses immediately |

#### 11.9 Pixi v8 scene-graph: RenderGroups, RenderLayers, Ticker

Pixi v8 introduces three architectural primitives that map cleanly onto our needs. The renderer's job is to use each at the right granularity.

##### RenderGroup — major scene divisions only

A `Container({ isRenderGroup: true })` becomes a "mini scene-graph" with cached render instructions and **GPU-side transform composition**. Mutating positions/rotations/tints inside a RenderGroup costs near-zero CPU because pixi composes them on the GPU.

Pixi's own warning: don't overuse — every RenderGroup carries fixed overhead. Use it for *scene divisions*, not per-object.

Our scene-graph layout:

```
app.stage                                 (auto-RenderGroup, pixi default)
├─ surfaces.world         RenderGroup ✓   ← one camera transform composed on GPU for all world content
│  ├─ WorldLayer A.shapeLayer        RenderGroup ✓   ← independent transform/cull unit per Layer
│  │  ├─ shape-1 container                            (regular Container)
│  │  │  ├─ glow decoration container                 (regular Container — Sprite/Mesh inside)
│  │  │  ├─ halo decoration container
│  │  │  ├─ host shape graphics
│  │  │  ├─ border decoration container
│  │  │  └─ pulse decoration container
│  │  ├─ shape-2 container               …
│  │  └─ … bulkRender ParticleContainer for 5k+ kinds (effectively a render group)
│  ├─ WorldLayer A.connectorLayer    RenderGroup ✓
│  ├─ WorldLayer B.shapeLayer        RenderGroup ✓
│  └─ …
└─ surfaces.screen        RenderGroup ✓   ← viewport-fixed; never transformed by camera
   ├─ ScreenLayer A container                         (regular Container)
   └─ ScreenLayer B container
```

**Render-group budget per Layer:** 2 (shapes + connectors). For typical scenes with 5–10 Layers, total render-group count stays at 12–22 — well within pixi's "don't overuse" guidance.

**Per-shape containers are explicitly NOT render groups.** Each shape would be one group → 50k groups at 50k nodes → catastrophic. Per-host transforms (the `setTransform(id, …)` API for effect tweens) ride the parent RenderGroup's GPU composition path for free.

##### RenderLayer — for "always on top" decorations & overlays

Pixi's `RenderLayer` (different from our `Layer` concept!) decouples render order from scene-graph hierarchy. Object stays a logical child of its host container but renders at the RenderLayer's position in the tree.

Use cases in our renderer:

| Use case | Mechanism |
|---|---|
| **Selection halo always visible above all shapes** within a Layer | Each Layer's renderer has an optional `topDecorationLayer: RenderLayer`; decorations registered with `alwaysOnTop: true` attach to it instead of riding default slot z-order |
| **Drag preview** — dragged shape renders above all others mid-drag | `DragMoveBehaviour` attaches the dragged shape to a per-Layer `dragLayer: RenderLayer` for the duration of the gesture, detaches on release |
| **Lasso polygon, brush rectangle** | `LassoSelectBehaviour` / `BrushSelectBehaviour` attach their transient overlay shapes to a `transientLayer: RenderLayer` at the top of the world RenderGroup |
| **Hover tooltip** | Same as above |

Each Layer instance creates ≤3 RenderLayers internally (top-decoration / drag / transient). Total RenderLayer count stays small.

##### Ticker — delegate to pixi, don't run our own RAF

Pixi `Application` ships a `Ticker`. We hook our `canvas.tick()` into it instead of calling `requestAnimationFrame` ourselves:

```ts
class Canvas {
  async init() {
    await this.app.init({ /* …backend config… */ });
    this.app.ticker.add(this.tick, this);   // single RAF, owned by pixi
  }

  tick(ticker: Ticker) {
    const dt = ticker.deltaMS;
    this.context.animations.tick(dt);                // tweens (effect + data)
    for (const layer of this.layers.byZOrder()) {
      if (!layer.visible) continue;
      if (layer.dirty.hasPending()) layer.flush();
      layer.renderer.tickAnimations(dt);
    }
    // pixi's ticker auto-calls renderer.render(stage) at the end of the tick frame
  }
}
```

Why pixi's ticker, not our own RAF:
- Already production-hardened (pause/resume on tab visibility, FPS limiting, priority ordering, autoStart)
- Pixi's renderer commit (`renderer.render(stage)`) runs at the right point in the tick relative to GPU resource updates
- One less moving part in our code
- `ticker.minFPS` / `ticker.maxFPS` give consumers easy frame-rate caps without us building a budget API

The `Canvas` tick callback uses pixi's `priority` slot — added at `UPDATE_PRIORITY.NORMAL` (or `LOW` for animation-tick if we want render to commit before our next pass; tunable).

### 12. Built-in decorations shipped with `@invana/canvas`

Pre-registered in `ShapesRenderer`:

| Kind | Static / Animated | Implementation | Visual |
|---|---|---|---|
| `halo` | static | Texture-baked | Solid blurred ring outside host bounds |
| `border` | static | Texture-baked or Graphics | Outline; `dash: [on, off]` for dashed |
| `glow` | static | Texture-baked + filter | Soft outer glow |
| `marching-ants` | **animated** | Mesh + shader | Dashed border with scrolling `dashOffset` |
| `pulse-ring` | **animated** | Graphics or Mesh | Expanding ring(s) radiating from host |
| `pulsating-flow` (connector only) | **animated** | Mesh + shader | Sine-wave intensity along connector path |

Style shapes (sketch — not final):

```ts
type HaloStyle = { color: number; width: number; blur?: number; alpha?: number };
type BorderStyle = { color: number; width: number; dash?: [number, number]; alpha?: number };
type GlowStyle = { color: number; spread: number; alpha: number };
type MarchingAntsStyle = BorderStyle & { speedPxPerSec?: number; direction?: 1 | -1 };
type PulseRingStyle = {
  color: number; width: number;
  count: number;
  periodMs: number;
  maxRadiusOffsetPx: number;
  easing?: 'linear' | 'ease-out' | 'ease-in-out';
  fadeOut?: boolean;
};
type PulsatingFlowStyle = {
  color: number;
  glowWidth: number;
  frequencyHz: number;
  intensity?: number;
  sampleCount?: number;
};
```

### 13. Why this scales

- Adding a new visual = one class + one `register()` call. Zero changes to `ShapesRenderer`'s API surface.
- Slot composition = a node can have halo + dashed border + pulse simultaneously without any of them knowing about the others.
- Animation contract is one optional method (`tick`). Static decorations cost zero per frame.
- Single RAF, single pixi commit — no animation system fragmentation.
- High-perf paths (Mesh+shader, texture-bake, ParticleContainer) are first-class options; the interface accommodates them without forcing them.

---

## Files to modify

When this design is approved, the following land:

| File | Change |
|---|---|
| `architecture-proposal.md` | Already partially updated: §2.6 responsibility table now lists generic `setDecoration`; §2.7 added describing the Decoration primitive, slot composition, animation tick, and domain-package sugar. Still TODO: refold §2.1 ordering to mention `animationRunner.tick()` before layer flush, and add §2.8 (Animations) covering the three-path model (decoration / effect tween / data tween). |
| `packages/canvas/CLAUDE.md` | Already updated: scope list mentions five extensible registries, built-in decorations, subpath exports, and the rationale for decoration logic living in canvas. |
| `packages/graph/CLAUDE.md` | Already updated: documents the sugar convention. Add tween-handle types and the effect/data split when implementation begins. |
| `packages/canvas/src/renderers/types.ts` (new, when implementation begins) | Add `IShapeDecoration` / `IConnectorDecoration` interfaces (with `mount` / `tick` / `update` / `destroy` lifecycle), `ShapeHostInfo` / `ConnectorHostInfo`, optional `getOutline()` / `getStrokeWidth()` on host interfaces, style types, ctor types. |
| `packages/canvas/src/renderers/ShapesRenderer.ts` (new) | Implement five registries + `setDecoration` + `tickAnimations` + `bakeToTexture` + `releaseTexture` + cacheable-shape texture cache (keyed by `(specCacheKey, lodLevel)`) + `prebakeAllLODs` default true + LOD-driven re-bake with debounce + DPR change listener + LRU eviction with budget + auto-promotion to `ParticleContainer` past threshold + `setTransform` for effect tweens + LOD/DPR/cache controls + auto-atlasing of textures sharing a `cacheCategory` + `loadCompressedTexture` (KTX2/Basis) + GPU viewport culling via `Layer.cullable` + draw-call telemetry / warnings + `getRenderStats` / `getTextureCacheStats`. |
| `packages/canvas/src/renderers/TextureCache.ts` (new) | LRU cache implementation: byte accounting, refcounted entries, never-evict-displayed invariant, telemetry events on miss/evict. Used internally by `ShapesRenderer`. |
| `packages/canvas/src/renderers/TextureAtlas.ts` (new) | Shelf-packing texture atlas; lazy re-pack during idle ticks; cap at `maxAtlasDimension` (default 4096). |
| `packages/canvas/src/renderers/CompressedTextureLoader.ts` (new) | KTX2 / Basis Universal loader using pixi v8's compressed texture support; transcodes to native compressed formats (BC7/ASTC/ETC2) per device. |
| `packages/canvas/src/renderers/shaders/` (new directory) | WGSL + GLSL transpilations for built-in animated decorations: `marching-ants.wgsl`/`.glsl`, `pulse-ring.wgsl`/`.glsl`, `pulsating-flow.wgsl`/`.glsl`, `glow.wgsl`/`.glsl`. |
| `packages/canvas/src/engine/Canvas.ts` (new) | Calls `app.init({ preference: 'webgpu', fallback: ['webgl', 'canvas'], antialias: true, backgroundAlpha, powerPreference: 'high-performance' })`. Hooks `tick(ticker)` into `app.ticker.add(...)` at `UPDATE_PRIORITY.NORMAL` — no own RAF. Emits `canvas:renderer:initialised` telemetry with backend + capabilities. Tick body: `animationRunner.tick(dt)` → per-layer `flush` + culling + `tickAnimations(dt)`; pixi auto-commits the GPU render at end of tick. |
| `packages/canvas/src/surfaces/SurfaceManager.ts` (new) | Constructs world + screen containers as `Container({ isRenderGroup: true })`. Each Layer registers its `shapeLayer` / `connectorLayer` (also RenderGroups) into the surface tree. Provides per-Layer `topDecorationLayer` / `dragLayer` / `transientLayer` RenderLayers on demand. |
| `packages/canvas/src/renderers/capabilities.ts` (new) | `RendererCapabilities` derivation from active pixi backend (`ExtensionType.WebGPUSystem` / `WebGLSystem` / `CanvasSystem`); exposed via `host.capabilities` for decorations and shapes to gate features. |
| `packages/canvas/src/renderers/decorations/` (new directory) | Built-in decoration classes: `HaloDecoration.ts` (texture-baked), `BorderDecoration.ts` (texture-baked or Graphics), `GlowDecoration.ts` (texture-baked + filter), `MarchingAntsDecoration.ts` (Mesh+shader), `PulseRingDecoration.ts` (Graphics or Mesh), `PulsatingFlowConnectorDecoration.ts` (Mesh+shader). |
| `packages/canvas/src/animations/` (new directory) | `Tween.ts`, `AnimationRunner.ts`, `easings.ts`, `interpolate.ts` (lerpRGB, lerp2D, etc.). |
| `packages/canvas/src/engine/Canvas.ts` (new) | Tick loop calls `animationRunner.tick(dt)` before layer flush, and `layer.renderer.tickAnimations(dt)` after. |

---

## Verification (when implementation lands — not now)

- Storybook story `decorations/halo` — single shape, halo appears/disappears on toggle. Visual diff.
- Storybook story `decorations/marching-ants` — animated, visually scrolls at the configured speed. Confirm no per-frame state mutations (devtools timeline silent).
- Storybook story `decorations/pulse-ring` — single shape, multiple concurrent rings, fades correctly.
- Storybook story `decorations/pulsating-flow` — connector with shader-driven sine-wave intensity. Visual diff at 60 fps.
- Storybook story `decorations/stacked` — one shape with halo + dashed border + pulse simultaneously. Z-order correct: glow → halo → shape → border → pulse.
- Storybook story `decorations/perf` — 500 shapes, 250 with marching-ants, 50 with pulse-ring. Frame time stays under 12 ms on M1.
- Storybook story `decorations/texture-baked-halo` — toggle 1000 selected nodes with halo. Texture-baked path stays under 4 ms/frame; vector path documented for comparison.
- Storybook story `shapes/cacheable` — 50,000 dot nodes with 5 visual variants. Verify only 5 textures created (`renderer.getTextureCacheStats()`) and rendering stays at 60 fps.
- Storybook story `shapes/particle-container` — 100,000 dots via `bulkRender: true`. Verify 60 fps on integrated GPU.
- Storybook story `animations/pulsate-rotate-scale` — host-transform effect tweens; state stays clean (no per-frame state changes).
- Storybook story `animations/color-transition` — data tween; state values smoothly interpolate; inspector shows live values.
- Storybook story `animations/layout-swap` — `transitionLayout` with d3-force → ELK. Smooth tween of all node positions.
- Storybook story `animations/marker-flying` — both Option A (decoration) and Option B (free Shape + tween) demos with comparable visuals.
- Vitest: `setDecoration(id, slot, null)` removes the decoration, calls `destroy()`, unregisters from animation set, releases any baked textures.
- Vitest: `setDecoration(id, slot, X)` then `setDecoration(id, slot, Y)` calls `destroy()` on X before mounting Y.
- Vitest: animated decoration's `tick()` is called from `tickAnimations()`; not called when layer is invisible.
- Vitest: `bakeToTexture` ref-counts correctly — second consumer of same key bumps refcount, last `releaseTexture` frees GPU memory.
- Vitest: cacheable shape with same `cacheKey` shares one underlying texture across many shape ids.
- Vitest: `Tween.stop()` removes from `AnimationRunner`; `onComplete` fires correctly with repeat / yoyo.
- Vitest (DPR): `bakeToTexture` defaults `resolution = devicePixelRatio`; explicit `resolution: 1` ignores DPR; cap respected at `maxBakeResolution`.
- Vitest (DPR change): mock `window.matchMedia('(resolution: 2dppx)')` change → all cached textures re-baked at new DPR within next tick.
- Vitest (LOD re-bake): `setLODLevel(id, 2)` swaps Sprite.texture to the LOD-2 cached entry; if missing, schedules a bake; old texture displayed in the meantime.
- Vitest (LOD debounce): rapid `setLODLevel` calls during 60 Hz zoom only trigger one bake after the configured debounce window.
- Vitest (`prebakeAllLODs`): registering with the flag immediately bakes at every level in `LOD_RESOLUTION` map.
- Vitest (eviction): texture cache evicts LRU entry when budget exceeded; never evicts a texture with refcount > 0.
- Vitest (`mipmap: 'on'`): baked texture has `mipmap` enabled on its base texture; subsequent zooms use pixi mipmap filtering, no re-bake fired.
- Storybook story `textures/dpr-change` — drag window between 1× and 2× monitors; verify crispness restored within one frame.
- Storybook story `textures/lod-zoom-trace` — zoom from 0.1 to 4.0 across 1000 ER tables; record bake count, frame times, GPU memory; matches the §11.3 end-to-end trace within ±20%.
- Storybook story `textures/atlas` — 50 distinct halo textures auto-packed into one atlas; assert draw-call count via `getRenderStats()` ≤ 3.
- Storybook story `textures/compressed` — load a KTX2 image asset, display 1000 sprites of it; assert GPU memory < raw-RGBA equivalent / 5.
- Storybook story `culling/viewport` — 100k offscreen + 2k onscreen shapes; frame stays at 60 fps; `getRenderStats().visibleShapes ≈ 2000`.
- Storybook story `webgpu/backend-detect` — `getRendererBackend()` reports `webgpu` on Chrome / Safari TP; falls back to `webgl` on older browsers; `canvas` in jsdom.
- Storybook story `backends/canvas2d-degrade` — force Canvas backend (`preference: 'canvas'`); shader-based decorations gracefully degrade to Graphics-equivalent visuals (assert `MarchingAntsDecoration.getImpl() === 'graphics'`).
- Storybook story `pixi-tips/graphics-100-points` — assert all built-in shape `draw()` calls produce ≤100 points (vitest snapshot of `g.geometry.bounds.points.length`).
- Storybook story `pixi-tips/bitmap-text` — `text` shape with `dynamic: true` uses `BitmapText`; verify ~5× lower per-frame upload cost vs. `Text`.
- Storybook story `pixi-tips/opaque-scene` — `Canvas({ opaque: true })` skips alpha-blend; verify `app.renderer.background.alpha === 1` and one fewer GPU op per frame.
- Storybook story `pixi-tips/staggered-destroy` — bulk-remove 1000 shapes; verify destroy operations spread across multiple frames; no frame exceeds 16 ms.
- Storybook story `pixi-v8/render-groups` — pan a 50k-node scene; assert `surfaces.world` is a RenderGroup (`container.isRenderGroup === true`); CPU profile shows transform composition staying near-flat regardless of node count (GPU-side composition).
- Storybook story `pixi-v8/render-group-budget` — count active RenderGroups in a 5-Layer scene; assert ≤ `2 + 2 × layerCount` (world + screen + per-Layer shape/connector); telemetry warning fires when budget exceeded.
- Storybook story `pixi-v8/render-layer-drag` — drag a node beneath/around overlapping nodes; verify dragged node stays visually on top via `dragLayer` RenderLayer attachment; auto-detaches on drop.
- Storybook story `pixi-v8/render-layer-halo-on-top` — register halo with `alwaysOnTop: true`; verify halo on a "lower" shape draws above an "upper" shape's body via `topDecorationLayer`.
- Vitest: `Canvas.init()` registers `tick` on `app.ticker`; calling `app.ticker.stop()` halts our tick; `start()` resumes; no separate `requestAnimationFrame` registered by our code (verify via spy on `window.requestAnimationFrame`).
- Vitest: `app.ticker.maxFPS = 30` caps our tick rate at 30 Hz; animation tween advances at correct delta-time.
- Vitest: tab-visibility hidden → pixi pauses ticker → our `tick` not called → animation phases preserved on resume.
- Storybook story `bulkrender/auto-promote` — register a cacheable shape, add 5001 instances; assert auto-promotion telemetry fires; draw call count drops to 1.
- Storybook story `shaders/marching-ants-mesh` — verify implementation is Mesh + Shader (assert via `getDecorationImpl(slot).constructor.name`); CPU profiler shows zero per-frame draw-call construction.
- Vitest: WebGPU init is preferred; WebGL2 fallback fires telemetry when WebGPU unavailable.
- Vitest: auto-atlas packs textures sharing a `cacheCategory`; un-categorized textures stay independent.
- Vitest: `cullable: false` Layer renders even when its shapes are off-screen.
- Vitest: `loadCompressedTexture` decodes a KTX2 file into a usable Texture; rejects malformed input with a clear error.
- Vitest: auto-promotion to `ParticleContainer` triggers at threshold; downgrades back to regular Container if instance count drops below threshold (with a hysteresis margin).
- Vitest: `getRenderStats().drawCalls` reflects the actual pixi draw-call count for the previous frame.
- Manual: register a custom decoration in a Storybook story; verify it works with no canvas-package changes.
