import { createCanvasStore, createOperationLog, historyView, createPlaybook, CanvasThemeState, createReactiveStore } from '@invana/canvas-store';
export { CanvasEventBus, CanvasThemeState, ColumnStore, DirtyBatcher, EventEmitter, INHERIT, PickingIndex, PlaybookStepError, SourceEmitter, SpecStore, connectorHitBoxes, createConsoleMeter, createHttpMeter, createMemoryStore, createOperationLog, createReactiveStore, defaultEqual, historyView, isInherit, resolveThemed, select, shallowEqual } from '@invana/canvas-store';
export * from '@invana/canvas-core/specs';
import { Layer, INHERIT, resolveThemed, Behaviour, attrs, svgNum, DefaultGestureArbiter, LayerRegistry, BehaviourRegistry, LayoutRegistry, CommandRegistry, Tween, resolveEasing, Camera, hexToCss } from '@invana/canvas-core';
export { Behaviour, BehaviourRegistry, Camera, CommandRegistry, DEFAULT_ENDPOINT_BADGE_GAP_PX, DEFAULT_POSITION_TRANSITION_MS, DefaultGestureArbiter, EASING_NAMES, HeadlessCameraBinding, HeadlessElementRenderer, HeadlessRenderer, HeadlessSurface, LOOP_CURVE_PRESETS, Layer, LayerRegistry, Layout, LayoutRegistry, SpecProjector, Tween, animatePositions, bezierPathStyle, boundaryAnchor, bumpHorizontalPathStyle, bumpRadialPathStyle, bundlePathStyle, centerAnchor, connectorToSvg, distanceToPolylineSq, easeInOutCubic, easeInOutSine, easeOutCubic, easeOutQuad, edgePortAnchor, erRouter, linear, loopCurvePathStyle, loopPolylinePathStyle, manhattanRouter, metroRouter, normalPathStyle, oneSideRouter, originToBadgeLocal, orthRouter, pathBounds, pathToSvgD, perpendicularAnchor, quadraticPathStyle, resolveBadgePosition, resolveConnectorBadgePosition, resolveEasing, resolveLabelScale, roundedPathStyle, samplePath, samplePathAt, shapeSpecToSvg, silhouettePortAnchor, smoothPathStyle, stepRadialPathStyle, straightRouter, tangentAt, trimPathEnds } from '@invana/canvas-core';
import { createDefaultRenderer } from '@invana/renderer-pixijs';

// src/index.ts

// src/engine/assertSerialisable.ts
var ALLOWED_CLASS_TAGS = /* @__PURE__ */ new Set(["Object", "Array", "Map", "Set"]);
function findSerialisationViolations(value, rootPath = "") {
  const violations = [];
  const seen = /* @__PURE__ */ new WeakSet();
  function walk(v, path) {
    if (v === null || v === void 0) return;
    const t = typeof v;
    if (t === "string" || t === "number" || t === "boolean") return;
    if (t === "function") {
      violations.push(`${path || "<root>"} \u2014 function reference`);
      return;
    }
    if (t === "symbol" || t === "bigint") {
      violations.push(`${path || "<root>"} \u2014 ${t}`);
      return;
    }
    const obj = v;
    if (seen.has(obj)) return;
    seen.add(obj);
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        walk(obj[i], `${path}[${i}]`);
      }
      return;
    }
    if (obj instanceof Map) {
      let i = 0;
      for (const [k, vv] of obj) {
        if (typeof k !== "string" && typeof k !== "number") {
          violations.push(`${path}.<map key #${i}> \u2014 non-primitive key (${typeof k})`);
        }
        walk(vv, `${path}.<map[${formatMapKey(k)}]>`);
        i++;
      }
      return;
    }
    if (obj instanceof Set) {
      let i = 0;
      for (const item of obj) {
        walk(item, `${path}.<set[${i}]>`);
        i++;
      }
      return;
    }
    const ctorName = obj.constructor?.name ?? "<anonymous>";
    if (typeof Element !== "undefined" && obj instanceof Element) {
      violations.push(`${path || "<root>"} \u2014 DOM Element (${ctorName})`);
      return;
    }
    if (typeof Node !== "undefined" && obj instanceof Node) {
      violations.push(`${path || "<root>"} \u2014 DOM Node (${ctorName})`);
      return;
    }
    if (!ALLOWED_CLASS_TAGS.has(ctorName)) {
      violations.push(
        `${path || "<root>"} \u2014 class instance (${ctorName})`
      );
    }
    for (const [k, vv] of Object.entries(obj)) {
      walk(vv, path ? `${path}.${k}` : k);
    }
  }
  walk(value, rootPath);
  return violations;
}
function formatMapKey(k) {
  if (typeof k === "string") return JSON.stringify(k);
  if (typeof k === "number") return String(k);
  return `<${typeof k}>`;
}
function assertSerialisableInDev(value, context) {
  const proc = globalThis.process;
  if (proc?.env?.NODE_ENV === "production") return;
  const violations = findSerialisationViolations(value);
  if (violations.length === 0) return;
  for (const v of violations) {
    console.warn(`[canvas] ${context}.payload.${v}`);
  }
}
var WorldLayer = class extends Layer {
  /** Backing field — assigned in `mount`, cleared in `unmount`. */
  _surface;
  get surface() {
    if (!this._surface) {
      throw new Error(`WorldLayer "${this.id}" surface accessed before mount`);
    }
    return this._surface;
  }
  constructor(opts) {
    super(opts);
  }
  /**
   * Per-layer options for the drawing device this layer's surface builds.
   * Override when the layer owns policy the renderer can't know — a graph layer
   * with pinpoint nodes wants a larger hit floor than one of big cards.
   * Read once, at mount.
   */
  surfaceOptions() {
    return void 0;
  }
  mount(ctx) {
    const surface = ctx.createSurface("world", this.id, this.surfaceOptions());
    if (this.zIndex !== 0) surface.setZIndex(this.zIndex);
    surface.setVisible(this.visible);
    this._surface = surface;
    super.mount(ctx);
  }
  /** Keep the surface in sync when `layer.visible` is toggled. */
  onVisibleChange(value) {
    this._surface?.setVisible(value);
  }
  unmount() {
    if (!this.mounted) return;
    super.unmount();
    this._surface?.destroy();
    this._surface = void 0;
  }
  /**
   * Update this layer's z-order relative to its peers. Keeps the iteration
   * field (`this.zIndex`, used by `LayerRegistry.byZOrder()`) and the surface's
   * paint order in sync, and flips `surfaces.world` into sorted mode
   * so the change renders.
   */
  setZIndex(z) {
    this.zIndex = z;
    this._surface?.setZIndex(z);
  }
  /**
   * Return the world-space AABB of everything currently rendered on this layer.
   * Delegates to Pixi's `getLocalBounds()` — a one-shot scene-graph traversal.
   * Suitable for "fit to content" calls; do not call every frame.
   */
  getBounds() {
    return null;
  }
};
var ScreenLayer = class extends Layer {
  /** Backing field — built on first {@link surface} access, cleared in `unmount`. */
  _surface;
  /** Kept from `mount` so the surface can be built lazily on first access. */
  _surfaceCtx;
  /**
   * This layer's drawing surface, **built on first access**.
   *
   * Most screen layers never draw through one: the minimap, the legend, the dev
   * HUD and the layers panel paint through `ctx.createOverlay` or straight into
   * the DOM. Creating a surface for them eagerly allocated a whole
   * `PrimitivesRenderer` — a picking index and a spec projector — that never
   * held a single spec. Building on demand means a layer that doesn't draw
   * through a surface doesn't pay for one.
   *
   * Throws before `mount` / after `unmount`, as it always did.
   */
  get surface() {
    if (!this._surface) {
      const ctx = this._surfaceCtx;
      if (!ctx) {
        throw new Error(`ScreenLayer "${this.id}" surface accessed before mount`);
      }
      const surface = ctx.createSurface("screen", this.id, this.surfaceOptions());
      if (this.zIndex !== 0) surface.setZIndex(this.zIndex);
      surface.setVisible(this.visible);
      this._surface = surface;
    }
    return this._surface;
  }
  constructor(opts) {
    super(opts);
  }
  /**
   * Per-layer options for the drawing device this layer's surface builds.
   * Override when the layer owns policy the renderer can't know — a graph layer
   * with pinpoint nodes wants a larger hit floor than one of big cards.
   * Read once, at mount.
   */
  surfaceOptions() {
    return void 0;
  }
  mount(ctx) {
    this._surfaceCtx = ctx;
    super.mount(ctx);
  }
  /** Keep the surface in sync when `layer.visible` is toggled. */
  onVisibleChange(value) {
    this._surface?.setVisible(value);
  }
  unmount() {
    if (!this.mounted) return;
    super.unmount();
    this._surface?.destroy();
    this._surface = void 0;
    this._surfaceCtx = void 0;
  }
  /**
   * Update this layer's z-order relative to its peers. Keeps the iteration
   * field (`this.zIndex`) and the surface's paint order in sync, and
   * flips `ctx.stage` into sorted mode so the change renders.
   */
  setZIndex(z) {
    this.zIndex = z;
    this._surface?.setZIndex(z);
  }
};

// src/layers/DevInfoLayer.ts
var DEFAULT_OPTIONS = {
  corner: "bottom-left",
  margin: 10,
  enabled: true,
  fontSize: 11,
  opacity: 0.92,
  backgroundColor: "rgba(10,10,10,0.82)",
  textColor: "#c8d3e0",
  accentColor: "#4fc3f7"
};
var DevInfoLayer = class extends ScreenLayer {
  kind = "dev-info-layer";
  _opts;
  _overlay = null;
  // Tracked state — updated by events
  _pointerScreen = { x: 0, y: 0 };
  _pointerWorld = { x: 0, y: 0 };
  _onPointerMove = null;
  // Unsubscribers for ctx.events listeners
  _unsubs = [];
  // FPS tracking
  _rafId = null;
  _fps = 0;
  _frameCount = 0;
  _lastFpsTimestamp = 0;
  // Latest per-frame timing sample (from the `render:loop:tick` bus event) — the
  // CPU phase breakdown that tells you whether a slow frame is CPU- or GPU-bound.
  _tick = null;
  constructor(opts = {}) {
    const { id, zIndex, ...rest } = opts;
    super({
      id: id ?? "dev-info",
      options: rest,
      zIndex: zIndex ?? 9999,
      hittable: false,
      cullable: false
    });
    this._opts = { ...DEFAULT_OPTIONS, ...rest };
  }
  createState() {
    return { enabled: true };
  }
  // ── ScreenLayer hit-testing ────────────────────────────────────────────────
  /** Overlay is DOM with `pointer-events:none` — never participates in hit-testing. */
  hitTest(_screenX, _screenY) {
    return null;
  }
  // ── Lifecycle ──────────────────────────────────────────────────────────────
  onMount() {
    if (this._opts.enabled) {
      this._mountOverlay();
    }
  }
  onUnmount() {
    this._stopFpsTicker();
    this._unmountOverlay();
  }
  // ── Public API ─────────────────────────────────────────────────────────────
  /** Show or hide the overlay at runtime without removing the layer. */
  setEnabled(enabled) {
    if (enabled) this.enable();
    else this.disable();
  }
  enable() {
    this._opts.enabled = true;
    if (this.mounted && !this._overlay) this._mountOverlay();
  }
  disable() {
    this._opts.enabled = false;
    this._stopFpsTicker();
    this._unmountOverlay();
  }
  /** Update display options (corner, colors, font size, …) at runtime. */
  setOptions(partial) {
    this._opts = { ...this._opts, ...partial };
    if (this._overlay) {
      this._applyStyles();
      this._update();
    }
  }
  // ── Mount / unmount the DOM overlay ────────────────────────────────────────
  _mountOverlay() {
    const ctx = this.context;
    const canvasEl = ctx.canvasElement;
    if (!canvasEl) return;
    const parent = canvasEl.parentElement;
    if (!parent) return;
    if (window.getComputedStyle(parent).position === "static") {
      parent.style.position = "relative";
    }
    const div = document.createElement("div");
    div.dataset["devInfoLayer"] = this.id;
    this._overlay = div;
    this._applyStyles();
    parent.appendChild(div);
    this._unsubs.push(ctx.events.on("input:camera:pan", () => this._update()));
    this._unsubs.push(ctx.events.on("input:camera:zoom", () => this._update()));
    this._unsubs.push(ctx.events.on("render:loop:tick", (tick) => this._tick = tick));
    this._onPointerMove = (e) => {
      const rect = canvasEl.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      this._pointerScreen = { x: sx, y: sy };
      this._pointerWorld = ctx.camera.toWorld(sx, sy);
      this._update();
    };
    canvasEl.addEventListener("pointermove", this._onPointerMove);
    this._lastFpsTimestamp = performance.now();
    this._startFpsTicker();
    this._update();
  }
  _unmountOverlay() {
    for (const unsub of this._unsubs) unsub();
    this._unsubs = [];
    if (this._onPointerMove && this.ctx?.canvasElement) {
      this.ctx.canvasElement.removeEventListener("pointermove", this._onPointerMove);
    }
    this._onPointerMove = null;
    this._overlay?.remove();
    this._overlay = null;
  }
  // ── Styles ─────────────────────────────────────────────────────────────────
  _applyStyles() {
    if (!this._overlay) return;
    const { corner, margin, fontSize, opacity, backgroundColor, textColor } = this._opts;
    const mx = typeof margin === "number" ? margin : margin.x ?? 10;
    const my = typeof margin === "number" ? margin : margin.y ?? 10;
    const position = {
      "top-left": `top:${my}px; left:${mx}px;`,
      "top-right": `top:${my}px; right:${mx}px;`,
      "bottom-left": `bottom:${my}px; left:${mx}px;`,
      "bottom-right": `bottom:${my}px; right:${mx}px;`
    };
    this._overlay.style.cssText = [
      "position:absolute;",
      position[corner],
      `font-size:${fontSize}px;`,
      `opacity:${opacity};`,
      `background:${backgroundColor};`,
      `color:${textColor};`,
      'font-family:"SF Mono","Fira Code","Cascadia Code","Courier New",monospace;',
      "padding:8px 12px;",
      "border-radius:6px;",
      "line-height:1.65;",
      "pointer-events:none;",
      "z-index:9999;",
      "white-space:pre;",
      "min-width:230px;",
      "border:1px solid rgba(255,255,255,0.08);",
      "box-shadow:0 4px 16px rgba(0,0,0,0.5);",
      "user-select:none;"
    ].join("");
  }
  // ── FPS ticker ─────────────────────────────────────────────────────────────
  _startFpsTicker() {
    const tick = (now) => {
      this._frameCount++;
      const elapsed = now - this._lastFpsTimestamp;
      if (elapsed >= 500) {
        this._fps = Math.round(this._frameCount / elapsed * 1e3);
        this._frameCount = 0;
        this._lastFpsTimestamp = now;
        this._update();
      }
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  }
  _stopFpsTicker() {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }
  // ── Render ─────────────────────────────────────────────────────────────────
  _update() {
    if (!this._overlay || !this.ctx) return;
    const ctx = this.ctx;
    const canvasEl = ctx.canvasElement;
    if (!canvasEl) return;
    const { accentColor } = this._opts;
    const cam = ctx.camera;
    const bounds = cam.getVisibleBounds();
    const w = canvasEl.clientWidth || canvasEl.width;
    const h = canvasEl.clientHeight || canvasEl.height;
    const sep = `<span style="color:${accentColor};opacity:0.5">${"\u2500".repeat(28)}</span>`;
    const header = (label) => `<span style="color:${accentColor};font-weight:bold"> ${label}</span>`;
    const row = (label, value) => `  <span style="opacity:0.6">${label.padEnd(12)}</span>${value}`;
    const lines = [
      header("DEV INFO"),
      sep,
      header("Canvas"),
      row("size", `${w} \xD7 ${h} px`),
      sep,
      header("Camera"),
      row("x", n(cam.x)),
      row("y", n(cam.y)),
      row("zoom", `${cam.scale.toFixed(3)}\xD7`),
      sep,
      header("World Bounds"),
      row("x (left)", n(bounds.x)),
      row("y (top)", n(bounds.y)),
      row("right", n(bounds.x + bounds.width)),
      row("bottom", n(bounds.y + bounds.height)),
      row("width", n(bounds.width)),
      row("height", n(bounds.height)),
      sep,
      header("Pointer"),
      row("screen", `${n(this._pointerScreen.x)}, ${n(this._pointerScreen.y)}`),
      row("world", `${n(this._pointerWorld.x)}, ${n(this._pointerWorld.y)}`),
      sep,
      header("Performance"),
      row("fps", String(this._fps)),
      // Per-frame timing breakdown. `frame` = real inter-frame time; `cpu` = sum
      // of the tick phases; `gpu≈` = the remainder (frame − cpu), i.e. pixi's GPU
      // pass + browser compositing. A slow frame with high `layers` is CPU-bound
      // (culling / layer work); a slow frame with low `cpu` but high `gpu≈` is
      // GPU-bound (too many draw calls → needs batching / more aggressive LOD).
      ...this._tick ? [
        row("frame", `${this._tick.dt.toFixed(1)} ms`),
        row("cpu", `${this._tick.cpuMs.toFixed(1)} ms`),
        row("gpu\u2248", `${Math.max(0, this._tick.dt - this._tick.cpuMs).toFixed(1)} ms`),
        row("\xB7 camera", `${this._tick.phases.camera.toFixed(1)} ms`),
        row("\xB7 dataFlush", `${this._tick.phases.dataFlush.toFixed(1)} ms`),
        row("\xB7 layers", `${this._tick.phases.layers.toFixed(1)} ms`),
        row("gesture", this._tick.interaction)
      ] : []
    ];
    this._overlay.innerHTML = lines.join("\n");
  }
};
function n(value) {
  return value.toFixed(1).padStart(9);
}
var FALLBACK = {
  background: { light: "#f8fafc", dark: "#0f172a" },
  pattern: { light: "#6f7b8b", dark: "#475569" }
  // background: { light: 'inherit', dark: 'inherit' },
  // pattern: { light: 'inherit', dark: 'inherit' },
};
var DEFAULTS = {
  type: "solid",
  patternType: "dots",
  color: INHERIT,
  backgroundColor: INHERIT,
  size: 1,
  spacing: 12,
  alpha: 0.6,
  followCamera: true,
  hidePatternBelowZoom: 0.5,
  mode: "auto",
  surfaceRole: "surface",
  patternRole: "divider"
};
function colorToCss(c) {
  if (typeof c === "number") return `#${c.toString(16).padStart(6, "0")}`;
  return c;
}
var BackgroundLayer = class extends ScreenLayer {
  kind = "background-layer";
  opts;
  /**
   * The rasterised pattern tile, kept so a camera-following repaint reuses it —
   * the surface caches its texture on this object's identity.
   */
  patternTile = null;
  /** DPR baked into the current pattern texture — used to compensate `tileScale`. */
  textureDpr = window.devicePixelRatio || 1;
  resizeObserver = null;
  offCameraPan = null;
  offCameraZoom = null;
  offTheme = null;
  // Cached camera state used by tile-transform sync.
  camX = 0;
  camY = 0;
  camScale = 1;
  constructor(opts) {
    super({
      ...opts,
      // Background sits below everything by default. Caller can override.
      zIndex: opts.zIndex ?? -1e3,
      // Always render — viewport-culling is meaningless for a full-screen background.
      cullable: opts.cullable ?? false,
      // Not hittable by default; the world's `background:click` already covers it.
      hittable: opts.hittable ?? false
    });
    this.opts = { ...DEFAULTS, ...opts.options };
  }
  createState() {
    return {};
  }
  onMount(ctx) {
    this.camX = ctx.camera.x;
    this.camY = ctx.camera.y;
    this.camScale = ctx.camera.scale;
    this.render();
    this.offTheme = ctx.events.on("theme:change", () => {
      if (this.mounted) this.render();
    });
    this.offCameraPan = ctx.events.on("input:camera:pan", ({ x, y }) => {
      this.camX = x;
      this.camY = y;
      this.paint();
    });
    this.offCameraZoom = ctx.events.on("input:camera:zoom", ({ scale }) => {
      this.camScale = scale;
      this.paint();
    });
    if (typeof ResizeObserver !== "undefined" && ctx.canvasElement) {
      this.resizeObserver = new ResizeObserver(() => this.render());
      this.resizeObserver.observe(ctx.canvasElement);
    }
  }
  onUnmount() {
    this.offTheme?.();
    this.offTheme = null;
    this.offCameraPan?.();
    this.offCameraZoom?.();
    this.offCameraPan = null;
    this.offCameraZoom = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.patternTile = null;
  }
  /**
   * Hit tests on the background always miss — clicks fall through to the
   * world layer beneath, which is what users expect for a bg.
   */
  hitTest() {
    return null;
  }
  // ─── Public API ─────────────────────────────────────────────────────────
  /** Merge-update options + re-render. */
  setOptions(changes) {
    this.opts = { ...this.opts, ...changes };
    if (this.mounted) this.render();
  }
  /** Snapshot of the resolved options. */
  getOptions() {
    return { ...this.opts };
  }
  /**
   * Set the colour-resolution mode. `'auto'` re-arms the system listener;
   * `'light'` / `'dark'` pin explicitly. No-op when mode is unchanged.
   */
  setMode(mode) {
    if (this.opts.mode === mode) return;
    this.opts = { ...this.opts, mode };
    if (this.mounted) this.render();
  }
  /** Current mode setting. */
  getMode() {
    return this.opts.mode;
  }
  /**
   * Concrete kind currently being rendered. A pinned `mode` wins; otherwise
   * `'auto'` follows the active theme on `ctx.theme` (defaulting to `'light'`
   * when no theme has been published yet).
   */
  getResolvedKind() {
    if (this.opts.mode === "light" || this.opts.mode === "dark") return this.opts.mode;
    return this.ctx?.theme.current()?.kind ?? "light";
  }
  /**
   * The resolved (mode-applied) solid colour currently painted behind the
   * pattern. Layers that want to match the canvas backdrop read this instead of
   * re-implementing `{ light, dark }` resolution — e.g. {@link MiniMapLayer}
   * pointed here via its `backgroundLayerId` mirrors the canvas background so
   * its chrome never drifts from the real one. Returns a `number` or CSS string
   * (whichever form the option carried), suitable for any pixi fill.
   */
  getResolvedBackgroundColor() {
    return this.resolvedBackgroundColor();
  }
  // ─── Internals ──────────────────────────────────────────────────────────
  viewportSize() {
    const el = this.context.canvasElement;
    if (el) return { width: el.clientWidth || 800, height: el.clientHeight || 600 };
    return { width: 800, height: 600 };
  }
  render() {
    this.patternTile = null;
    this.paint();
  }
  /**
   * Push the current backdrop to the surface. Cheap enough to call on every
   * camera move: the tile image is reused unless {@link render} dropped it, and
   * the surface rebuilds its texture only when that identity changes.
   */
  paint() {
    const { width, height } = this.viewportSize();
    const color = this.resolvedBackgroundColor();
    if (this.opts.type === "solid") {
      this.surface.setBackdrop({ color, width, height });
      return;
    }
    this.patternTile ??= this.createPatternTile();
    this.surface.setBackdrop({
      color,
      width,
      height,
      tile: { source: this.patternTile, ...this.tileTransform(), alpha: this.opts.alpha }
    });
  }
  /**
   * Scale, offset and visibility for the pattern tile.
   *
   * Low-zoom cutoff: below the threshold the tiles are too dense to read, so we
   * hide the pattern and leave the solid backdrop. Evaluated here (rather than
   * in a zoom behaviour) so every camera source — wheel, pinch, keyboard,
   * programmatic — goes through the same check.
   */
  tileTransform() {
    const visible = this.opts.hidePatternBelowZoom <= 0 || this.camScale >= this.opts.hidePatternBelowZoom;
    const dpr = this.textureDpr;
    if (!this.opts.followCamera) {
      return { scale: 1 / dpr, offsetX: 0, offsetY: 0, visible };
    }
    const s = this.camScale;
    const period = this.opts.spacing * s;
    return {
      scale: s / dpr,
      offsetX: this.camX % period,
      offsetY: this.camY % period,
      visible
    };
  }
  createPatternTile() {
    const { patternType, size, spacing } = this.opts;
    const dpr = typeof window !== "undefined" && typeof window.devicePixelRatio === "number" ? Math.max(1, window.devicePixelRatio) : 1;
    this.textureDpr = dpr;
    const off = document.createElement("canvas");
    off.width = Math.round(spacing * dpr);
    off.height = Math.round(spacing * dpr);
    const ctx2d = off.getContext("2d");
    ctx2d.scale(dpr, dpr);
    ctx2d.fillStyle = colorToCss(this.resolvedPatternColor());
    switch (patternType) {
      case "dots":
        ctx2d.beginPath();
        ctx2d.arc(spacing / 2, spacing / 2, size, 0, Math.PI * 2);
        ctx2d.fill();
        break;
      case "grid":
        ctx2d.fillRect(0, 0, spacing, size);
        ctx2d.fillRect(0, 0, size, spacing);
        break;
      case "lines":
        ctx2d.fillRect(0, 0, spacing, size);
        break;
    }
    return off;
  }
  /** The solid backdrop colour as painted — {@link INHERIT} resolved, pins honoured. */
  resolvedBackgroundColor() {
    return this.resolveColor(this.opts.backgroundColor, this.opts.surfaceRole, FALLBACK.background);
  }
  /**
   * The pattern colour as painted. Falls back to the `'stroke'` role when the
   * configured {@link BackgroundLayerOptions.patternRole} is absent from the
   * palette — a theme may carry one without the other.
   */
  resolvedPatternColor() {
    return this.resolveColor(
      this.opts.color,
      [this.opts.patternRole, "stroke"],
      FALLBACK.pattern
    );
  }
  /**
   * Resolve a colour option to something paintable, in two stages:
   *
   * 1. **Pick the variant** — a `{ light, dark }` pair collapses to one half via
   *    {@link getResolvedKind} (the layer's `mode`, else the published theme's kind).
   * 2. **Resolve the sentinel** — `'inherit'` reads `roles` off the live palette;
   *    anything else is an author-set colour and passes through untouched.
   *
   * Called on every paint rather than adopted into `this.opts`, which is what
   * keeps a pinned colour pinned across theme switches and keeps `getOptions()`
   * reporting what the author wrote rather than what the theme last painted.
   */
  resolveColor(c, roles, fallback) {
    const kind = this.getResolvedKind();
    const picked = typeof c === "object" && c !== null ? kind === "dark" ? c.dark : c.light : c;
    return resolveThemed(
      picked,
      this.ctx?.theme.current()?.palette,
      roles,
      kind === "dark" ? fallback.dark : fallback.light
    );
  }
};

// src/layers/LayersPanelLayer.ts
var DEFAULT_OPTIONS2 = {
  corner: "top-right",
  enabled: true,
  fontSize: 11,
  opacity: 0.92,
  backgroundColor: "rgba(10,10,10,0.82)",
  textColor: "#c8d3e0",
  accentColor: "#4fc3f7",
  hideIds: []
};
var LayersPanelLayer = class extends ScreenLayer {
  _opts;
  _overlay = null;
  _onChange = null;
  // Unsubscribers for ctx.events listeners.
  _unsubs = [];
  constructor(opts = {}) {
    const { id, zIndex, ...rest } = opts;
    super({
      id: id ?? "layers-panel",
      options: rest,
      zIndex: zIndex ?? 9998,
      hittable: false,
      cullable: false
    });
    this._opts = { ...DEFAULT_OPTIONS2, ...rest };
  }
  createState() {
    return { enabled: true };
  }
  // ── ScreenLayer hit-testing ────────────────────────────────────────────────
  /** Overlay is DOM — never participates in the engine's hit-testing. */
  hitTest(_screenX, _screenY) {
    return null;
  }
  // ── Lifecycle ──────────────────────────────────────────────────────────────
  onMount() {
    if (this._opts.enabled) {
      this._mountOverlay();
    }
  }
  onUnmount() {
    this._unmountOverlay();
  }
  // ── Public API ─────────────────────────────────────────────────────────────
  /** Show or hide the panel at runtime without removing the layer. */
  setEnabled(enabled) {
    if (enabled) this.enable();
    else this.disable();
  }
  enable() {
    this._opts.enabled = true;
    if (this.mounted && !this._overlay) this._mountOverlay();
  }
  disable() {
    this._opts.enabled = false;
    this._unmountOverlay();
  }
  /** Update display options (corner, colors, font size, …) at runtime. */
  setOptions(partial) {
    this._opts = { ...this._opts, ...partial };
    if (this._overlay) {
      this._applyStyles();
      this._render();
    }
  }
  /**
   * Force a re-render of the panel. Call this if external code mutates
   * `layer.visible` on a registered layer and you want the checkboxes to
   * reflect the new state. (The engine does not emit an event for visibility
   * mutations.)
   */
  refresh() {
    if (this._overlay) this._render();
  }
  // ── Mount / unmount the DOM overlay ────────────────────────────────────────
  _mountOverlay() {
    const ctx = this.context;
    const canvasEl = ctx.canvasElement;
    if (!canvasEl) return;
    const parent = canvasEl.parentElement;
    if (!parent) return;
    if (window.getComputedStyle(parent).position === "static") {
      parent.style.position = "relative";
    }
    const div = document.createElement("div");
    div.dataset["layersPanelLayer"] = this.id;
    this._overlay = div;
    this._applyStyles();
    parent.appendChild(div);
    this._unsubs.push(ctx.events.on("scene:layer:add", () => this._render()));
    this._unsubs.push(ctx.events.on("scene:layer:remove", () => this._render()));
    this._onChange = (e) => {
      const target = e.target;
      if (!target || target.tagName !== "INPUT") return;
      const input = target;
      const layerId = input.dataset["layerId"];
      if (!layerId || !this.ctx) return;
      const layer = this.ctx.layers.get(layerId);
      if (layer) layer.visible = input.checked;
    };
    div.addEventListener("change", this._onChange);
    this._render();
  }
  _unmountOverlay() {
    for (const unsub of this._unsubs) unsub();
    this._unsubs = [];
    if (this._onChange && this._overlay) {
      this._overlay.removeEventListener("change", this._onChange);
    }
    this._onChange = null;
    this._overlay?.remove();
    this._overlay = null;
  }
  // ── Styles ─────────────────────────────────────────────────────────────────
  _applyStyles() {
    if (!this._overlay) return;
    const { corner, fontSize, opacity, backgroundColor, textColor } = this._opts;
    const position = {
      "top-left": "top:10px; left:10px;",
      "top-right": "top:10px; right:10px;",
      "bottom-left": "bottom:10px; left:10px;",
      "bottom-right": "bottom:10px; right:10px;"
    };
    this._overlay.style.cssText = [
      "position:absolute;",
      position[corner],
      `font-size:${fontSize}px;`,
      `opacity:${opacity};`,
      `background:${backgroundColor};`,
      `color:${textColor};`,
      'font-family:"SF Mono","Fira Code","Cascadia Code","Courier New",monospace;',
      "padding:8px 12px;",
      "border-radius:6px;",
      "line-height:1.5;",
      "pointer-events:auto;",
      "z-index:9998;",
      "width:260px;",
      "max-width:320px;",
      "box-sizing:border-box;",
      "border:1px solid rgba(255,255,255,0.08);",
      "box-shadow:0 4px 16px rgba(0,0,0,0.5);",
      "user-select:none;"
    ].join("");
  }
  // ── Render ─────────────────────────────────────────────────────────────────
  _render() {
    if (!this._overlay || !this.ctx) return;
    const { accentColor, hideIds } = this._opts;
    const all = this.ctx.layers.list().filter((l) => {
      if (l.id === this.id) return false;
      if (hideIds.includes(l.id)) return false;
      return true;
    });
    const headerHtml = `<div style="color:${accentColor};font-weight:bold;margin-bottom:6px;"> LAYERS (${all.length})</div>`;
    if (all.length === 0) {
      this._overlay.innerHTML = headerHtml + `<div style="opacity:0.5;font-style:italic;padding:2px 0;">no other layers</div>`;
      return;
    }
    const headerCellStyle = `text-align:left;padding:2px 6px 4px 0;color:${accentColor};border-bottom:1px solid rgba(255,255,255,0.12);font-weight:600;`;
    const cellStyle = "padding:2px 6px 2px 0;vertical-align:middle;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";
    const tableHead = `<thead><tr><th style="${headerCellStyle}width:16px;"></th><th style="${headerCellStyle}">id</th><th style="${headerCellStyle}">class</th><th style="${headerCellStyle}text-align:right;padding-right:0;width:46px;">z</th></tr></thead>`;
    const rows = all.map((l) => {
      const checked = l.visible ? "checked" : "";
      const className = l.constructor?.name ?? "";
      const idHtml = escapeHtml(l.id);
      const classHtml = escapeHtml(className);
      return `<tr><td style="${cellStyle}width:16px;"><input type="checkbox" data-layer-id="${escapeAttr(l.id)}" ${checked} style="cursor:pointer;margin:0;display:block;" /></td><td style="${cellStyle}" title="${idHtml}">${idHtml}</td><td style="${cellStyle}opacity:0.75;" title="${classHtml}">${classHtml}</td><td style="${cellStyle}text-align:right;padding-right:0;opacity:0.75;width:46px;">${escapeHtml(String(l.zIndex))}</td></tr>`;
    }).join("");
    this._overlay.innerHTML = headerHtml + `<table style="border-collapse:collapse;width:100%;table-layout:fixed;font-size:inherit;font-family:inherit;color:inherit;">` + tableHead + `<tbody>${rows}</tbody></table>`;
  }
};
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function escapeAttr(s) {
  return escapeHtml(s);
}
function toCameraModifier(modifier) {
  return modifier === "none" ? null : modifier;
}
var DragPanBehaviour = class extends Behaviour {
  kind = "drag-pan";
  // Live-read from `_options` so `setOptions` takes effect: event-time reads
  // (cursor / button / modifier) pick up immediately, and the viewport plugins
  // are re-armed with the new config in onOptionsChanged.
  get modifier() {
    return this._options.modifier ?? "none";
  }
  get mouseButtons() {
    return this._options.mouseButtons ?? "left";
  }
  get withDecelerate() {
    return this._options.decelerate ?? true;
  }
  get dragCursor() {
    return this._options.dragCursor ?? "grabbing";
  }
  /** Canvas the cursor swap targets; `null` on headless / custom stages. */
  canvasEl = null;
  /** Cursor saved when the pan pointer is pressed, restored on release. */
  prevCursor = null;
  /** Unsubscribe from the gesture arbiter; set while enabled. */
  offGestures;
  /** Unsubscribe from the camera's `drag-start`; set while enabled. */
  offDragStart;
  /** Whether the pan plugin is currently suspended for another gesture owner. */
  yielding = false;
  constructor(opts) {
    const modifier = opts.modifier ?? "none";
    const gesture = modifier === "none" ? "drag" : `${modifier}+drag`;
    super({ ...opts, shortcuts: opts.shortcuts ?? [gesture] });
  }
  onRegister(ctx) {
    this.canvasEl = ctx.canvasElement ?? null;
  }
  /** Re-arm the camera's drag input with the merged options. */
  onOptionsChanged() {
    this.reArm();
  }
  onEnable() {
    const camera = this.ctx.camera;
    camera.configureInput({
      drag: {
        mouseButtons: this.mouseButtons,
        modifier: toCameraModifier(this.modifier),
        decelerate: this.withDecelerate
      }
    });
    this.canvasEl?.addEventListener("pointerdown", this.onPointerDown);
    this.offDragStart = camera.onDragStart(this.armCursor);
    const gestures = this.ctx.gestures;
    this.yielding = false;
    this.offGestures = gestures.onOwnerChange(this.applyYield);
    this.applyYield(gestures.owner);
  }
  onDisable() {
    this.offGestures?.();
    this.offGestures = void 0;
    this.yielding = false;
    this.canvasEl?.removeEventListener("pointerdown", this.onPointerDown);
    this.offDragStart?.();
    this.offDragStart = void 0;
    this.restoreCursor();
    this.ctx.camera.configureInput({ drag: null });
  }
  /**
   * Suspend / restore panning to match gesture ownership. Momentum is left
   * running so an in-flight glide finishes as it always has — see
   * `Camera.setDragSuspended`.
   */
  applyYield = (owner) => {
    const shouldYield = owner !== null && owner !== this.id;
    if (shouldYield === this.yielding) return;
    this.yielding = shouldYield;
    this.ctx?.camera.setDragSuspended(shouldYield);
  };
  onPointerDown = (e) => {
    if (!this._enabled) return;
    if (!this.buttonAllowed(e.button)) return;
    if (!this.modifierHeld(e)) return;
    this.armCursor();
    window.addEventListener("pointerup", this.restoreCursor);
    window.addEventListener("pointercancel", this.restoreCursor);
  };
  /** Swap to the drag cursor, saving the prior value. No-op if already armed. */
  armCursor = () => {
    if (!this.canvasEl || this.prevCursor !== null) return;
    this.prevCursor = this.canvasEl.style.cursor;
    this.canvasEl.style.cursor = this.dragCursor;
  };
  /** Restore the saved cursor and detach the release listeners. */
  restoreCursor = () => {
    window.removeEventListener("pointerup", this.restoreCursor);
    window.removeEventListener("pointercancel", this.restoreCursor);
    if (this.prevCursor === null || !this.canvasEl) return;
    this.canvasEl.style.cursor = this.prevCursor;
    this.prevCursor = null;
  };
  /** Does this pointer button match the configured `mouseButtons`? */
  buttonAllowed(button) {
    switch (this.mouseButtons) {
      case "all":
        return true;
      case "middle":
        return button === 1;
      case "right":
        return button === 2;
      default:
        return button === 0;
    }
  }
  /**
   * Is the configured modifier satisfied for this press? `shift` / `alt` read
   * off the event; `none` is always true; `space` returns `false` here (not
   * detectable on a pointer event) and is handled by the `drag-start` fallback.
   */
  modifierHeld(e) {
    switch (this.modifier) {
      case "shift":
        return e.shiftKey;
      case "alt":
        return e.altKey;
      case "space":
        return false;
      default:
        return true;
    }
  }
};
var DragShapeBehaviour = class extends Behaviour {
  kind = "drag-shape";
  // The renderer is fixed at construction; the tuning knobs live-read from
  // `_options` (all consumed at event-time) so `setOptions` takes effect.
  get renderer() {
    return this._options.renderer;
  }
  get filter() {
    return this._options.filter;
  }
  get reRouteConnectors() {
    return this._options.reRouteConnectors ?? true;
  }
  get dragCursor() {
    return this._options.dragCursor ?? "grabbing";
  }
  state = null;
  offShapeDown;
  canvasEl = null;
  prevCursor = null;
  constructor(opts) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ["shape+drag"] });
  }
  onRegister(ctx) {
    this.canvasEl = ctx.canvasElement ?? null;
    const onShapeDown = (e) => {
      if (!this._enabled) return;
      if (this.filter && !this.filter(e.id)) return;
      const pos = this.renderer.getShapePosition(e.id);
      if (!pos) return;
      this.startDrag(e.id, e.worldX, e.worldY, pos);
    };
    this.renderer.events.on("shape:pointerdown", onShapeDown);
    this.offShapeDown = () => this.renderer.events.off("shape:pointerdown", onShapeDown);
  }
  onDestroy(_ctx) {
    this.endDrag();
    this.offShapeDown?.();
    this.offShapeDown = void 0;
  }
  onDisable() {
    if (this.state) this.endDrag();
  }
  startDrag(id, worldX, worldY, shapePos) {
    if (!this.claimGesture()) return;
    this.state = {
      id,
      pointerWorldStart: { x: worldX, y: worldY },
      shapePosStart: shapePos
    };
    window.addEventListener("pointermove", this.onWindowPointerMove);
    window.addEventListener("pointerup", this.onWindowPointerUp);
    window.addEventListener("pointercancel", this.onWindowPointerUp);
    if (this.canvasEl) {
      this.prevCursor = this.canvasEl.style.cursor;
      this.canvasEl.style.cursor = this.dragCursor;
    }
  }
  endDrag() {
    if (!this.state) return;
    window.removeEventListener("pointermove", this.onWindowPointerMove);
    window.removeEventListener("pointerup", this.onWindowPointerUp);
    window.removeEventListener("pointercancel", this.onWindowPointerUp);
    if (this.prevCursor !== null && this.canvasEl) {
      this.canvasEl.style.cursor = this.prevCursor;
      this.prevCursor = null;
    }
    this.releaseGesture();
    this.state = null;
  }
  onWindowPointerMove = (e) => {
    if (!this.state || !this.ctx) return;
    const { screenX, screenY } = this.clientToScreen(e.clientX, e.clientY);
    const world = this.ctx.camera.toWorld(screenX, screenY);
    const dx = world.x - this.state.pointerWorldStart.x;
    const dy = world.y - this.state.pointerWorldStart.y;
    const nextX = this.state.shapePosStart.x + dx;
    const nextY = this.state.shapePosStart.y + dy;
    this.renderer.updateShape(this.state.id, { x: nextX, y: nextY });
    if (this.reRouteConnectors) this.renderer.reRouteAllConnectors();
  };
  onWindowPointerUp = () => {
    this.endDrag();
  };
  /** Convert a window-level `(clientX, clientY)` to canvas-relative screen coords. */
  clientToScreen(clientX, clientY) {
    if (!this.canvasEl) return { screenX: clientX, screenY: clientY };
    const rect = this.canvasEl.getBoundingClientRect();
    return { screenX: clientX - rect.left, screenY: clientY - rect.top };
  }
};
var WheelZoomBehaviour = class extends Behaviour {
  kind = "wheel-zoom";
  constructor(opts) {
    const requireCtrl = opts.requireCtrl ?? false;
    const gesture = requireCtrl ? "ctrl+wheel" : "wheel";
    super({ ...opts, shortcuts: opts.shortcuts ?? [gesture] });
  }
  onRegister(_ctx) {
  }
  onEnable() {
    this.ctx.camera.configureInput({
      wheel: {
        percent: this._options.percent ?? 0.1,
        smooth: this._options.smooth ?? false,
        modifier: this._options.requireCtrl ?? false ? "control" : null,
        trackpadPinch: true
      }
    });
  }
  onDisable() {
    this.ctx.camera.configureInput({ wheel: null });
  }
  /**
   * The camera's wheel input reads its config only at install time, so a live
   * edit means remove-then-reinstall. Re-arm picks up the merged
   * `this._options`. (`setOptions` / `getOptions` come from the base.)
   */
  onOptionsChanged() {
    this.reArm();
  }
  /** Include the wheel options (beyond the base `enabled`) in a state snapshot. */
  serializeDefinition() {
    return {
      ...super.serializeDefinition(),
      requireCtrl: this._options.requireCtrl ?? false,
      percent: this._options.percent ?? 0.1,
      smooth: this._options.smooth ?? false
    };
  }
};
var PinchZoomBehaviour = class extends Behaviour {
  kind = "pinch-zoom";
  get noDrag() {
    return this._options.noDrag ?? false;
  }
  get percent() {
    return this._options.percent ?? 0.1;
  }
  constructor(opts) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ["pinch"] });
  }
  onRegister(_ctx) {
  }
  onEnable() {
    this.ctx.camera.configureInput({ pinch: { noDrag: this.noDrag, percent: this.percent } });
  }
  onDisable() {
    this.ctx.camera.configureInput({ pinch: null });
  }
  /** Re-arm the camera's pinch input with the merged options. */
  onOptionsChanged() {
    this.reArm();
  }
};
var DEFAULT_KEYMAP = {
  panUp: ["ArrowUp"],
  panDown: ["ArrowDown"],
  panLeft: ["ArrowLeft"],
  panRight: ["ArrowRight"],
  zoomIn: ["+", "=", "NumpadAdd"],
  zoomOut: ["-", "NumpadSubtract"],
  resetZoom: ["0", "Numpad0"]
};
var KeyboardCameraInputBehaviour = class extends Behaviour {
  kind = "keyboard-camera";
  // Live-read from `_options` so `setOptions` takes effect. The keydown handler
  // is bound once in onEnable but reads these per-event, so no re-arm is needed.
  get panStep() {
    return this._options.panStep ?? 40;
  }
  get zoomFactor() {
    return this._options.zoomFactor ?? 1.1;
  }
  get keymap() {
    return { ...DEFAULT_KEYMAP, ...this._options.keymap };
  }
  _handler;
  constructor(opts) {
    const keymap = { ...DEFAULT_KEYMAP, ...opts.keymap };
    const allKeys = [...new Set(Object.values(keymap).flat())];
    super({ ...opts, shortcuts: opts.shortcuts ?? allKeys });
  }
  onRegister(_ctx) {
  }
  onEnable() {
    this._handler = (e) => this._onKeyDown(e);
    document.addEventListener("keydown", this._handler);
  }
  onDisable() {
    if (this._handler) {
      document.removeEventListener("keydown", this._handler);
      this._handler = void 0;
    }
  }
  _onKeyDown(e) {
    const tag = e.target?.tagName?.toUpperCase();
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    const camera = this.ctx.camera;
    const key = e.key;
    const code = e.code;
    if (this._match(key, code, this.keymap.panUp)) {
      e.preventDefault();
      camera.pan(0, this.panStep);
    } else if (this._match(key, code, this.keymap.panDown)) {
      e.preventDefault();
      camera.pan(0, -this.panStep);
    } else if (this._match(key, code, this.keymap.panLeft)) {
      e.preventDefault();
      camera.pan(this.panStep, 0);
    } else if (this._match(key, code, this.keymap.panRight)) {
      e.preventDefault();
      camera.pan(-this.panStep, 0);
    } else if (this._match(key, code, this.keymap.zoomIn)) {
      e.preventDefault();
      camera.zoomAt(this.zoomFactor);
    } else if (this._match(key, code, this.keymap.zoomOut)) {
      e.preventDefault();
      camera.zoomAt(1 / this.zoomFactor);
    } else if (this._match(key, code, this.keymap.resetZoom)) {
      e.preventDefault();
      camera.setZoom(1);
    }
  }
  _match(key, code, candidates) {
    return candidates.includes(key) || candidates.includes(code);
  }
};
var DEFAULT_SHORTCUTS = [
  { keys: "mod+z", command: "history.undo" },
  { keys: "mod+shift+z, mod+y", command: "history.redo" },
  { keys: "mod+x", command: "clipboard.cut" },
  { keys: "mod+c", command: "clipboard.copy" },
  { keys: "mod+v", command: "clipboard.paste" },
  { keys: "delete, backspace", command: "clipboard.delete" },
  { keys: "escape", command: "tool.active", args: { value: "select" } }
];
var MODIFIER_ORDER = ["ctrl", "alt", "shift", "meta"];
var KEY_ALIASES = {
  esc: "escape",
  del: "delete",
  return: "enter",
  " ": "space",
  spacebar: "space",
  up: "arrowup",
  down: "arrowdown",
  left: "arrowleft",
  right: "arrowright",
  plus: "+"
};
var MODIFIER_ALIASES = {
  ctrl: "ctrl",
  control: "ctrl",
  alt: "alt",
  option: "alt",
  opt: "alt",
  shift: "shift",
  meta: "meta",
  cmd: "meta",
  command: "meta",
  super: "meta"
};
function isMacPlatform() {
  const nav = typeof navigator !== "undefined" ? navigator : void 0;
  return /mac|iphone|ipad|ipod/i.test(nav?.platform ?? nav?.userAgent ?? "");
}
function comboString(mods, key) {
  return [...MODIFIER_ORDER.filter((m) => mods.has(m)), key].join("+");
}
function normalizeShortcut(keys, mac = isMacPlatform()) {
  const out = [];
  for (const alt of keys.split(",")) {
    const parts = alt.trim().toLowerCase().split("+");
    if (parts.length > 1 && parts[parts.length - 1] === "" && parts[parts.length - 2] === "") parts.splice(-2, 2, "+");
    const mods = /* @__PURE__ */ new Set();
    let key = "";
    for (const raw of parts) {
      const part = raw.trim();
      if (part === "") continue;
      if (part === "mod") mods.add(mac ? "meta" : "ctrl");
      else if (MODIFIER_ALIASES[part]) mods.add(MODIFIER_ALIASES[part]);
      else key = KEY_ALIASES[part] ?? part;
    }
    if (key) out.push(comboString(mods, key));
  }
  return out;
}
var ALNUM = /^[a-z0-9]$/;
function physicalAlnum(code) {
  const m = code ? /^(?:Key([A-Z])|Digit([0-9]))$/.exec(code) : null;
  return m ? (m[1] ?? m[2]).toLowerCase() : void 0;
}
function eventMods(e) {
  const mods = /* @__PURE__ */ new Set();
  if (e.ctrlKey) mods.add("ctrl");
  if (e.altKey) mods.add("alt");
  if (e.shiftKey) mods.add("shift");
  if (e.metaKey) mods.add("meta");
  return mods;
}
function eventShortcut(e) {
  const raw = e.key.toLowerCase();
  if (raw === "control" || raw === "alt" || raw === "shift" || raw === "meta" || raw === "os") return null;
  const mods = eventMods(e);
  let key = KEY_ALIASES[raw] ?? raw;
  if (mods.size > 0 && !ALNUM.test(key)) key = physicalAlnum(e.code) ?? key;
  return comboString(mods, key);
}
function eventCandidates(e) {
  const combo = eventShortcut(e);
  if (!combo) return [];
  const out = [combo];
  const raw = e.key.toLowerCase();
  const key = KEY_ALIASES[raw] ?? raw;
  if (e.shiftKey && [...key].length === 1 && key !== " " && !ALNUM.test(key)) {
    const mods = eventMods(e);
    mods.delete("shift");
    out.push(comboString(mods, key));
  }
  return out;
}
function isEditable(target) {
  const el = target;
  const tag = el?.tagName?.toUpperCase();
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable === true;
}
var KeyboardShortcutsBehaviour = class extends Behaviour {
  kind = "keyboard-shortcuts";
  mac = isMacPlatform();
  onKeyDown;
  onPointerDown;
  /** Whether the last pointer-down on the page landed inside the scope root. */
  lastPointerInside = false;
  constructor(opts) {
    const labels = (opts.bindings ?? []).flatMap((b) => b.keys.split(",").map((k) => k.trim()).filter(Boolean));
    super({ ...opts, shortcuts: opts.shortcuts ?? labels });
  }
  get bindings() {
    return this._options.bindings ?? [];
  }
  onRegister(_ctx) {
  }
  onEnable() {
    if (typeof document === "undefined" || typeof document.addEventListener !== "function") return;
    this.onKeyDown = (e) => {
      if (this.inScope(e.target)) this.handleKey(e);
    };
    this.onPointerDown = (e) => {
      const root = this.scopeRoot();
      this.lastPointerInside = root !== null && e.target instanceof Node && root.contains(e.target);
    };
    document.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("pointerdown", this.onPointerDown, true);
  }
  onDisable() {
    if (this.onKeyDown) document.removeEventListener("keydown", this.onKeyDown);
    if (this.onPointerDown) document.removeEventListener("pointerdown", this.onPointerDown, true);
    this.onKeyDown = void 0;
    this.onPointerDown = void 0;
  }
  /**
   * Run the first binding matching `e` whose command is registered and enabled.
   * Returns whether one ran — and then calls `e.preventDefault()` when the event
   * has it. Keys typed into editable elements are ignored. Scope is checked by
   * the DOM listener, not here, so this is callable directly.
   */
  handleKey(e) {
    const commands = this.ctx?.commands;
    if (!commands || isEditable(e.target)) return false;
    const combos = eventCandidates(e);
    if (combos.length === 0) return false;
    for (const binding of this.bindings) {
      const keys = normalizeShortcut(binding.keys, this.mac);
      if (!combos.some((c) => keys.includes(c))) continue;
      if (!commands.isEnabled(binding.command, binding.args)) continue;
      commands.run(binding.command, binding.args);
      e.preventDefault?.();
      return true;
    }
    return false;
  }
  /** The element keys must come from (or follow a click inside) — see the class doc. */
  scopeRoot() {
    const el = this.ctx?.canvasElement;
    if (!el) return null;
    return el.closest("[data-canvas-scope]") ?? el.parentElement ?? el;
  }
  inScope(target) {
    if ((this._options.scope ?? "canvas") === "document") return true;
    const root = this.scopeRoot();
    if (!root) return false;
    if (target instanceof Node && root.contains(target)) return true;
    const onPage = target === null || target === document.body || target === document.documentElement;
    return onPage && this.lastPointerInside;
  }
};
function resolveNumberOrGetter(v) {
  if (v === void 0) return void 0;
  return typeof v === "function" ? v() : v;
}
var ElementScaleLODBehaviour = class extends Behaviour {
  subs = [];
  /**
   * Pending `requestAnimationFrame` handle. Non-null while a reflow is
   * scheduled but hasn't fired yet — collapses bursts of `camera:zoom`
   * events (the wheel-zoom gesture fires 100+/sec) into one `apply`
   * call per animation frame. Critical for keeping fps above 60 during
   * a continuous zoom over thousands of entities.
   */
  rafHandle = null;
  /**
   * Settle timer (debounce) handle. Used instead of `rafHandle` when
   * `settleMs > 0`. Re-armed on every `camera:zoom`; firing triggers a
   * single `apply` at the latest scale.
   */
  settleTimer = null;
  /**
   * Scale at the last `apply` call. Drives the `scaleEpsilon` skip:
   * the next scheduled apply bails if the current scale is within
   * epsilon of this value. `null` means "no prior apply, never skip".
   */
  lastAppliedScale = null;
  // Live-read from `_options` so `setOptions({ scaleEpsilon, settleMs })` takes
  // effect on the next scheduled reflow (both are read at schedule/apply time).
  get scaleEpsilon() {
    return this._options.scaleEpsilon ?? 5e-3;
  }
  get settleMs() {
    return this._options.settleMs ?? 0;
  }
  constructor(opts) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
  }
  onRegister(ctx) {
    this.onResolveTargets(ctx);
    this.subs.push(ctx.events.on("input:camera:zoom", () => this.scheduleReflow()));
    if (this.isEnabled) this.applyAndRemember(ctx.camera.scale);
  }
  onDestroy() {
    this.cancelScheduledReflow();
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.onReleaseTargets();
  }
  onEnable() {
    if (!this.ctx) return;
    this.lastAppliedScale = null;
    this.applyAndRemember(this.ctx.camera.scale);
  }
  onDisable() {
    this.cancelScheduledReflow();
    this.apply(1);
    this.lastAppliedScale = null;
  }
  /**
   * Force an immediate reflow at the current camera scale. Useful after
   * tuning a config knob (e.g. moving a GUI slider that a `NumberOrGetter`
   * reads from) — push the new sizes without waiting for the next zoom.
   *
   * Bypasses the epsilon skip and the settle debounce — explicit calls
   * are always treated as "apply now."
   */
  reflow() {
    this.cancelScheduledReflow();
    if (!this.isEnabled || !this.ctx) return;
    this.applyAndRemember(this.ctx.camera.scale);
  }
  /** Optional teardown hook — drop layer refs / caches. Default no-op. */
  onReleaseTargets() {
  }
  // ─── Internals ───────────────────────────────────────────────────────────
  /**
   * Route a `camera:zoom` to either the RAF path (default) or the
   * trailing-edge debounce path (`settleMs > 0`). Both eventually call
   * {@link tryApply}, which honours the epsilon skip.
   */
  scheduleReflow() {
    if (this.settleMs > 0) {
      if (this.settleTimer !== null) clearTimeout(this.settleTimer);
      this.settleTimer = setTimeout(() => {
        this.settleTimer = null;
        this.tryApply();
      }, this.settleMs);
      return;
    }
    if (this.rafHandle !== null) return;
    this.rafHandle = requestAnimationFrame(() => {
      this.rafHandle = null;
      this.tryApply();
    });
  }
  /**
   * Apply at the current camera scale if (a) still enabled, (b) the
   * scale has moved by more than `scaleEpsilon` since the last apply.
   * Updates {@link lastAppliedScale} only on a real apply, so cumulative
   * sub-epsilon drift is eventually caught.
   */
  tryApply() {
    if (!this.isEnabled || !this.ctx) return;
    const scale = this.ctx.camera.scale;
    const last = this.lastAppliedScale;
    if (last !== null && last > 0 && this.scaleEpsilon > 0 && Math.abs(scale - last) / last < this.scaleEpsilon) {
      return;
    }
    this.applyAndRemember(scale);
  }
  applyAndRemember(scale) {
    this.apply(scale);
    this.lastAppliedScale = scale;
  }
  cancelScheduledReflow() {
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
    if (this.settleTimer !== null) {
      clearTimeout(this.settleTimer);
      this.settleTimer = null;
    }
  }
};

// src/engine/FrameMeter.ts
var FrameMeter = class _FrameMeter {
  /** Ring storage; `undefined` slots are unwritten (only before first wrap). */
  buf;
  /** Next write index (round-robin). */
  head = 0;
  /** Whether the ring has wrapped at least once (i.e. is full). */
  wrapped = false;
  /** Capacity of the ring. */
  capacity;
  /** `dt` (ms) at or above which a frame counts as long / janky. */
  longFrameMs;
  /** FPS ceiling — guards against a ~0ms `dt` producing an absurd value. */
  static FPS_CEILING = 240;
  /**
   * @param opts.capacity   Ring size in frames. Default `240` (~4s at 60fps).
   * @param opts.longFrameMs `dt` threshold for {@link FrameTick.longFrame}.
   *   Default `25` (below ~40fps).
   */
  constructor(opts = {}) {
    this.capacity = Math.max(1, opts.capacity ?? 240);
    this.longFrameMs = opts.longFrameMs ?? 1e3 / 40;
    this.buf = new Array(this.capacity);
  }
  /**
   * Derive a {@link FrameTick} from one frame's raw measurements, store it, and
   * return it (for emission). `dt` is the inter-frame period; `phases` are the
   * measured CPU sub-costs — their sum becomes {@link FrameTick.cpuMs}.
   */
  sample(input) {
    const { ts, dt, phases, interaction } = input;
    const cpuMs = phases.camera + phases.dataFlush + phases.layers;
    const fps = dt > 0 ? Math.min(_FrameMeter.FPS_CEILING, Math.round(1e3 / dt)) : _FrameMeter.FPS_CEILING;
    const tick = {
      ts,
      dt,
      fps,
      cpuMs,
      phases,
      interaction,
      longFrame: dt >= this.longFrameMs
    };
    this.buf[this.head] = tick;
    this.head = (this.head + 1) % this.capacity;
    if (this.head === 0) this.wrapped = true;
    return tick;
  }
  /** The most recently recorded frame, or `undefined` before the first sample. */
  get last() {
    const i = (this.head - 1 + this.capacity) % this.capacity;
    return this.buf[i];
  }
  /** Number of samples currently held (≤ capacity). */
  get size() {
    return this.wrapped ? this.capacity : this.head;
  }
  /**
   * The last `n` samples in chronological (oldest → newest) order. Defaults to
   * every held sample. Returns a fresh array; the {@link FrameTick}s themselves
   * are shared (treat as read-only).
   */
  recent(n3) {
    const size = this.size;
    const count = n3 === void 0 ? size : Math.min(Math.max(0, n3), size);
    const out = [];
    for (let k = size - count; k < size; k++) {
      const i = (this.head - size + k + this.capacity) % this.capacity;
      const t = this.buf[i];
      if (t) out.push(t);
    }
    return out;
  }
  /**
   * Summarise the most recent `windowMs` of frames (default 1000ms) into
   * percentile frame-times + median FPS + a dropped-frame count. Cheap enough to
   * call every HUD repaint. Returns a zeroed summary when no samples fall in the
   * window.
   */
  stats(windowMs = 1e3) {
    const all = this.recent();
    const newest = all[all.length - 1];
    if (!newest) return { count: 0, fps: 0, p50Ms: 0, p95Ms: 0, maxMs: 0, dropped: 0 };
    const cutoff = newest.ts - windowMs;
    const window2 = all.filter((t) => t.ts >= cutoff);
    const times = window2.map((t) => t.dt).sort((a, b) => a - b);
    const count = times.length;
    const pct = (p) => count === 0 ? 0 : times[Math.min(count - 1, Math.floor(p * count))];
    const p50Ms = pct(0.5);
    return {
      count,
      fps: p50Ms > 0 ? Math.round(1e3 / p50Ms) : 0,
      p50Ms,
      p95Ms: pct(0.95),
      maxMs: count > 0 ? times[count - 1] : 0,
      dropped: window2.reduce((n3, t) => n3 + (t.longFrame ? 1 : 0), 0)
    };
  }
  /** Drop every recorded sample. */
  clear() {
    this.buf.fill(void 0);
    this.head = 0;
    this.wrapped = false;
  }
};

// src/engine/InteractionTracker.ts
var InteractionTracker = class _InteractionTracker {
  constructor(bus, now = () => typeof performance !== "undefined" ? performance.now() : Date.now()) {
    this.now = now;
    this.offs.push(
      bus.on("input:camera:zoom", () => this.markMomentary("zoom")),
      bus.on("input:camera:pan", () => this.markMomentary("pan")),
      bus.on("input:node:drag:start", () => {
        this.dragActive = true;
      }),
      bus.on("input:node:drag:end", () => {
        this.dragActive = false;
      }),
      bus.on("input:node:hover", ({ id }) => {
        this.hoverActive = id !== null;
      }),
      bus.on("layout:run:start", () => {
        this.layoutActive = true;
      }),
      bus.on("layout:run:end", () => {
        this.layoutActive = false;
      })
    );
  }
  /** Revert to `'idle'` this many ms after the last momentary (zoom/pan) event. */
  static IDLE_MS = 140;
  layoutActive = false;
  dragActive = false;
  hoverActive = false;
  /** Most recent momentary gesture (`zoom` / `pan`) and when it last fired. */
  momentary = "idle";
  momentaryAt = 0;
  offs = [];
  /** Record a momentary gesture and stamp its time so it decays to idle. */
  markMomentary(kind) {
    this.momentary = kind;
    this.momentaryAt = this.now();
  }
  /**
   * The interaction the frame at `now` (a `performance.now()`-scale timestamp)
   * should be attributed to. Pass the frame's own start time so the idle-decay
   * is measured against the frame, not wall-clock drift.
   */
  current(now = this.now()) {
    if (this.layoutActive) return "layout";
    if (this.dragActive) return "drag";
    if (this.hoverActive) return "hover";
    if (now - this.momentaryAt < _InteractionTracker.IDLE_MS) return this.momentary;
    return "idle";
  }
  /** Detach every bus subscription. */
  dispose() {
    for (const off of this.offs) off();
    this.offs.length = 0;
  }
};

// src/engine/viewLock.ts
var DEFAULT_LOCK_IDS = ["pan", "drag-node"];
function lockTargets(canvas, behaviourIds) {
  return (behaviourIds ?? DEFAULT_LOCK_IDS).filter((id) => canvas.behaviours.has(id));
}
function isViewLocked(canvas, behaviourIds) {
  const ids = lockTargets(canvas, behaviourIds);
  return ids.length > 0 && ids.every((id) => !canvas.behaviours.get(id)?.enabled);
}
function setViewLocked(canvas, locked, behaviourIds) {
  for (const id of lockTargets(canvas, behaviourIds)) canvas.behaviours.setEnabled(id, !locked);
}
function canLockView(canvas, behaviourIds) {
  return lockTargets(canvas, behaviourIds).length > 0;
}

// src/engine/builtinCommands.ts
var ZOOM_STEP = 1.2;
var ZOOM_LEVELS = [0.25, 0.5, 1, 2, 4];
var DEFAULT_LOCK_IDS2 = ["pan", "drag-node"];
function arg(args, key) {
  return args && typeof args === "object" ? args[key] : void 0;
}
function backgroundId(args) {
  return arg(args, "layerId") ?? "background";
}
var levelValue = (zoom) => String(zoom);
function zoomLevels(args) {
  const levels = arg(args, "levels");
  return Array.isArray(levels) && levels.length > 0 ? levels : ZOOM_LEVELS;
}
var currentLevel = (canvas) => Math.round(canvas.camera.scale * 100) / 100;
var whenInitialised = (canvas) => canvas.isInitialised;
var FACTOR_ARG = {
  factor: { kind: "number", label: "Factor", default: ZOOM_STEP, description: "Zoom step per click" }
};
var BUILTIN_COMMANDS = {
  "camera.zoomIn": {
    label: "Zoom in",
    args: FACTOR_ARG,
    run: (canvas, args) => canvas.camera.zoomAt(arg(args, "factor") ?? ZOOM_STEP),
    isEnabled: whenInitialised
  },
  "camera.zoomOut": {
    label: "Zoom out",
    args: FACTOR_ARG,
    run: (canvas, args) => canvas.camera.zoomAt(1 / (arg(args, "factor") ?? ZOOM_STEP)),
    isEnabled: whenInitialised
  },
  "camera.fit": {
    label: "Fit to content",
    args: {
      padding: { kind: "number", label: "Padding", default: 80 },
      layerId: { kind: "layer", label: "Layer", description: "Fit this layer instead of all content" }
    },
    run: (canvas, args) => {
      const padding = arg(args, "padding");
      const layerId = arg(args, "layerId");
      if (layerId === void 0) return canvas.fitView(padding);
      const layer = canvas.layers.get(layerId);
      if (typeof layer?.getBounds === "function") canvas.camera.fitContent(layer.getBounds(), padding ?? 80);
    },
    isEnabled: whenInitialised
  },
  "camera.pan": {
    label: "Pan",
    args: {
      dx: { kind: "number", label: "\u0394x (px)", default: 0 },
      dy: { kind: "number", label: "\u0394y (px)", default: 0 }
    },
    run: (canvas, args) => canvas.camera.pan(arg(args, "dx") ?? 0, arg(args, "dy") ?? 0),
    isEnabled: whenInitialised
  },
  "camera.zoomTo": {
    label: "Zoom to",
    args: {
      value: { kind: "number", label: "Zoom", default: 1, pick: true },
      levels: { kind: "json", label: "Levels", default: ZOOM_LEVELS, description: "Zoom factors the picker offers" }
    },
    // A picker's `value` arrives as a string; a fixed-level button passes a number.
    run: (canvas, args) => {
      const zoom = Number(arg(args, "value") ?? 1);
      if (Number.isFinite(zoom) && zoom > 0) canvas.camera.setZoom(zoom);
    },
    isEnabled: whenInitialised,
    // The current zoom, to 2 dp. When it sits between levels `options` adds it,
    // so the picker reads "137%" rather than a wrong level.
    value: (canvas) => canvas.isInitialised ? levelValue(currentLevel(canvas)) : null,
    options: (canvas, args) => {
      const levels = zoomLevels(args);
      const current = canvas.isInitialised ? currentLevel(canvas) : null;
      const all = current === null || levels.includes(current) ? levels : [...levels, current].sort((a, b) => a - b);
      return all.map((l) => ({ value: levelValue(l), label: `${Math.round(l * 100)}%` }));
    }
  },
  "camera.reset": {
    label: "Reset view",
    run: (canvas) => {
      const cam = canvas.camera;
      cam.setTransform({ x: cam.screenWidth / 2, y: cam.screenHeight / 2, zoom: 1 });
    },
    isEnabled: whenInitialised
  },
  "behaviour.toggle": {
    label: "Toggle behaviour",
    args: { id: { kind: "behaviour", label: "Behaviour", required: true } },
    isActive: (canvas, args) => {
      const id = arg(args, "id");
      return id ? canvas.behaviours.get(id)?.enabled === true : false;
    },
    isEnabled: (canvas, args) => {
      const id = arg(args, "id");
      return !!id && canvas.behaviours.has(id);
    },
    // Through the registry, so `scene:behaviour:enable`/`disable` fire and a
    // bound toggle re-renders.
    run: (canvas, args) => {
      const id = arg(args, "id");
      const b = id ? canvas.behaviours.get(id) : void 0;
      if (id && b) canvas.behaviours.setEnabled(id, !b.enabled);
    }
  },
  "view.lock": {
    label: "Lock view",
    args: { behaviourIds: { kind: "strings", label: "Behaviours", default: DEFAULT_LOCK_IDS2 } },
    // The rule is `viewLock.ts`, shared with `useLock`.
    isActive: (canvas, args) => isViewLocked(canvas, arg(args, "behaviourIds")),
    isEnabled: (canvas, args) => canLockView(canvas, arg(args, "behaviourIds")),
    run: (canvas, args) => {
      const ids = arg(args, "behaviourIds");
      setViewLocked(canvas, !isViewLocked(canvas, ids), ids);
    }
  },
  "layout.run": {
    label: "Run layout",
    args: { id: { kind: "layout", label: "Layout", description: "Default: the active layout" } },
    run: (canvas, args) => {
      const id = arg(args, "id");
      return id ? canvas.runLayout(id) : canvas.runActiveLayout();
    },
    isEnabled: (canvas, args) => {
      const id = arg(args, "id");
      return id ? canvas.layouts.has(id) : canvas.store.view.getState().definition.activeLayout !== null;
    }
  },
  "layout.activate": {
    label: "Layout",
    args: { value: { kind: "layout", label: "Layout", pick: true } },
    value: (canvas) => canvas.store.view.getState().definition.activeLayout,
    options: (canvas) => canvas.layouts.list().map((l) => ({ value: l.id, label: l.id })),
    isEnabled: (canvas) => canvas.layouts.list().length > 0,
    // Record it, then run it. A domain facade that auto-runs `activeLayout`
    // (`GraphCanvas`) overrides this to skip the second run.
    run: (canvas, args) => {
      const id = arg(args, "value");
      if (!id || !canvas.layouts.has(id)) return;
      canvas.update({ activeLayout: id });
      return canvas.runLayout(id);
    }
  },
  "background.grid": {
    label: "Toggle grid",
    args: {
      layerId: { kind: "layer", label: "Layer", default: "background" },
      patternType: {
        kind: "enum",
        label: "Pattern",
        options: [
          { value: "dots", label: "Dots" },
          { value: "grid", label: "Grid" },
          { value: "lines", label: "Lines" }
        ]
      }
    },
    // Read the definition first — `canvas.update` writes it, so the toggle
    // follows every write path — falling back to the layer's own options.
    isActive: (canvas, args) => {
      const id = backgroundId(args);
      const fromDefinition = canvas.store.view.getState().definition.layers[id]?.type;
      const type = fromDefinition ?? canvas.layers.get(id)?.getOptions().type;
      return type === "pattern";
    },
    isEnabled: (canvas, args) => canvas.layers.has(backgroundId(args)),
    run: (canvas, args) => {
      const id = backgroundId(args);
      const on = !BUILTIN_COMMANDS["background.grid"].isActive(canvas, args);
      const patternType = arg(args, "patternType");
      canvas.update({ layers: { [id]: { type: on ? "pattern" : "solid", ...on && patternType ? { patternType } : {} } } });
    }
  },
  "layout.stop": {
    label: "Stop layout",
    run: (canvas) => canvas.stopLayout(),
    isEnabled: (canvas) => canvas.store.view.getState().runtime.layout.running
  },
  "history.undo": {
    label: "Undo",
    isEnabled: (canvas) => canvas.history.canUndo(),
    run: (canvas) => canvas.history.undo()
  },
  "history.redo": {
    label: "Redo",
    isEnabled: (canvas) => canvas.history.canRedo(),
    run: (canvas) => canvas.history.redo()
  },
  "layer.visible": {
    label: "Show layer",
    args: { id: { kind: "layer", label: "Layer", required: true } },
    isActive: (canvas, args) => {
      const id = arg(args, "id");
      return id ? canvas.layers.get(id)?.visible === true : false;
    },
    isEnabled: (canvas, args) => {
      const id = arg(args, "id");
      return !!id && canvas.layers.has(id);
    },
    run: (canvas, args) => {
      const id = arg(args, "id");
      const layer = id ? canvas.layers.get(id) : void 0;
      if (!layer) return;
      layer.setVisible(!layer.visible);
    }
  },
  "layout.toggle": {
    label: "Run layout",
    args: { id: { kind: "layout", label: "Layout", description: "Default: the active layout" } },
    isActive: (canvas) => canvas.store.view.getState().runtime.layout.running,
    isEnabled: (canvas, args) => canvas.store.view.getState().runtime.layout.running || BUILTIN_COMMANDS["layout.run"].isEnabled(canvas, args),
    run: (canvas, args) => {
      if (canvas.store.view.getState().runtime.layout.running) canvas.stopLayout();
      else BUILTIN_COMMANDS["layout.run"].run(canvas, args);
    }
  }
};
var BUILTIN_META = {
  "camera.zoomIn": { category: "Camera", keywords: ["magnify", "bigger"] },
  "camera.zoomOut": { category: "Camera", keywords: ["smaller"] },
  "camera.fit": { category: "Camera", keywords: ["frame", "zoom to fit", "show all"] },
  "camera.pan": { category: "Camera", keywords: ["move", "scroll"] },
  "camera.zoomTo": { category: "Camera", keywords: ["zoom level", "percent"] },
  "camera.reset": { category: "Camera", keywords: ["home", "actual size", "origin"] },
  "behaviour.toggle": { category: "Behaviours" },
  "view.lock": { category: "View", keywords: ["freeze", "pin view"] },
  "layout.run": { category: "Layout", keywords: ["arrange", "start"] },
  "layout.stop": { category: "Layout", keywords: ["halt", "pause"] },
  "layout.toggle": { category: "Layout", keywords: ["run", "stop"] },
  "layout.activate": { category: "Layout", keywords: ["switch layout"] },
  "background.grid": { category: "View", keywords: ["dots", "lines", "pattern"] },
  "layer.visible": { category: "View", keywords: ["show", "hide"] },
  "history.undo": { category: "Edit", keywords: ["revert", "back"] },
  "history.redo": { category: "Edit", keywords: ["again", "forward"] }
};
function registerBuiltinCommands(registry) {
  for (const [name, command] of Object.entries(BUILTIN_COMMANDS)) {
    registry.register(name, { ...BUILTIN_META[name], ...command });
  }
}

// src/engine/playbook.ts
var CAMERA_INTENTS = /* @__PURE__ */ new Set(["focus", "visible", "all"]);
var PLAYBOOK_SETTINGS_ACTION = "edit:playbook";
function validateStepSpec(canvas, log, step, source) {
  const problems = [];
  if (typeof step.id !== "string" || step.id === "") problems.push("id must be a non-empty string");
  if (typeof step.title !== "string") problems.push("title must be a string");
  if (step.data) {
    const adapter = source === void 0 ? void 0 : log.source(source);
    if (source === void 0) problems.push("data needs a source (the step's `source` or the playbook's)");
    else if (!adapter?.applyDelta) problems.push(`no data source "${source}" takes deltas`);
    for (const v of findSerialisationViolations(step.data, "data")) problems.push(v);
    if (adapter?.hasElement) {
      const addedNodes = new Set((step.data.added?.nodes ?? []).map((n3) => n3.id));
      const removedNodes = new Set(step.data.removed?.nodeIds ?? []);
      const exists = (id) => typeof id === "string" && (addedNodes.has(id) || !removedNodes.has(id) && adapter.hasElement(id));
      for (const e of step.data.added?.edges ?? []) {
        for (const end of ["source", "target"]) {
          if (!exists(e[end])) problems.push(`data.added.edges "${e.id}": unknown ${end} "${String(e[end])}"`);
        }
      }
    }
  }
  if (step.settings !== void 0) {
    for (const v of findSerialisationViolations(step.settings, "settings")) problems.push(v);
  }
  const view = step.view;
  if (view) {
    const added = /* @__PURE__ */ new Set();
    for (const n3 of step.data?.added?.nodes ?? []) added.add(n3.id);
    for (const e of step.data?.added?.edges ?? []) added.add(e.id);
    const removed = /* @__PURE__ */ new Set([...step.data?.removed?.nodeIds ?? [], ...step.data?.removed?.edgeIds ?? []]);
    const sources = canvas.layers.list().map((l) => log.source(l.id)).filter((s) => s?.hasElement !== void 0);
    const known = (id) => added.has(id) || !removed.has(id) && sources.some((s) => s.hasElement(id));
    const check = (where, ids) => {
      for (const id of ids ?? []) if (!known(id)) problems.push(`${where}: unknown id "${id}"`);
    };
    check("view.select", view.select);
    if (view.focus) check("view.focus", view.focus.ids);
    if (typeof view.inspect === "string") check("view.inspect", [view.inspect]);
    if (view.camera !== void 0 && !CAMERA_INTENTS.has(view.camera)) {
      problems.push(`view.camera: "${String(view.camera)}" is not 'focus', 'visible' or 'all'`);
    }
  }
  for (const verb of step.do ?? []) {
    if (!canvas.commands.has(verb.command)) problems.push(`do: unknown command "${verb.command}"`);
  }
  return problems;
}
function canvasPlaybookEnv(canvas, log, whenSettled) {
  return {
    validate: (step, source) => validateStepSpec(canvas, log, step, source),
    apply(step, source) {
      const actor = step.actor ?? canvas.actor;
      if (step.data && source !== void 0) log.source(source)?.applyDelta?.(step.data, { actor });
      if (step.settings !== void 0) canvas.update(step.settings, PLAYBOOK_SETTINGS_ACTION);
      const view = step.view;
      if (!view) return;
      const actions = canvas.store.actions;
      if (view.select !== void 0) actions.selection.set(view.select);
      if (view.focus !== void 0) {
        if (view.focus === null) actions.focus.clear();
        else actions.focus.set(view.focus.ids, view.focus.dim ?? true);
      }
      if (view.inspect !== void 0) {
        if (view.inspect === null) actions.inspect.clear();
        else actions.inspect.set(view.inspect);
      }
      if (view.camera !== void 0) actions.cameraIntent.request(view.camera);
    },
    runCommand: (name, args) => canvas.commands.runAsync(name, args),
    whenSettled,
    actor: () => canvas.actor
  };
}
var ID_SECTIONS = /* @__PURE__ */ new Set(["layers", "behaviours", "layouts"]);
var SCENE_KEYS = /* @__PURE__ */ new Set(["fitOnLoad", "fitAnimation", "entrance", "defaultViewMode"]);
var copy = (value) => value === void 0 ? value : JSON.parse(JSON.stringify(value));
function describeViewParts(state, parts) {
  const def = state.definition;
  const settings = {};
  const view = {};
  const touched = /* @__PURE__ */ new Set();
  for (const part of parts) {
    for (const patch of part.patches) {
      const path = patch.path.map(String);
      const key = path.slice(0, 4).join("/");
      if (touched.has(key)) continue;
      touched.add(key);
      const [root, section, id, field] = path;
      if (root === "definition") {
        if (section === "activeLayout") settings["activeLayout"] = state.definition.activeLayout;
        else if (section === "controlPanels" && id !== void 0) {
          const panels = settings["controlPanels"] ??= {};
          panels[id] = copy(state.definition.controlPanels[id]) ?? null;
        } else if (section === "canvas" && id !== void 0 && SCENE_KEYS.has(id)) {
          const value = state.definition.canvas[id];
          if (value !== void 0) settings[id] = copy(value);
        } else if (section !== void 0 && ID_SECTIONS.has(section)) {
          const bag = def[section];
          if (id === void 0) {
            settings[section] = copy(bag);
            continue;
          }
          const instance = bag[id];
          const value = field === void 0 ? instance : instance?.[field];
          if (value === void 0) continue;
          const out = settings[section] ??= {};
          if (field === void 0) out[id] = copy(value);
          else (out[id] ??= {})[field] = copy(value);
        }
      } else if (root === "interaction") {
        const i = state.interaction;
        if (section === "selection") view.select = [...i.selection];
        else if (section === "focus") view.focus = i.focus ? { ids: [...i.focus.ids], dim: i.focus.dim } : null;
        else if (section === "inspect") view.inspect = i.inspect;
        else if (section === "cameraIntent" && i.cameraIntent) view.camera = i.cameraIntent.intent;
      }
    }
  }
  return {
    ...Object.keys(settings).length > 0 ? { settings } : {},
    ...Object.keys(view).length > 0 ? { view } : {}
  };
}

// src/engine/CanvasConfig.ts
function configurable(inst) {
  return inst && typeof inst.setOptions === "function" ? inst : void 0;
}
function currentOption(inst, key) {
  if (!inst || typeof inst !== "object") return void 0;
  const getOptions = inst.getOptions;
  const live = typeof getOptions === "function" ? getOptions.call(inst) : void 0;
  if (live && typeof live === "object" && live[key] !== void 0) return live[key];
  const options = inst.options;
  return options && typeof options === "object" ? options[key] : void 0;
}
function isPlainObject(v) {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}
function deepMerge(base, patch) {
  if (!isPlainObject(base) || !isPlainObject(patch)) return patch;
  const out = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (k === "__proto__" || k === "constructor" || k === "prototype") continue;
    out[k] = isPlainObject(v) && isPlainObject(out[k]) ? deepMerge(out[k], v) : v;
  }
  return out;
}
function resolveExportBackground(canvas, bg) {
  if (bg === "transparent") return null;
  if (typeof bg === "number") return hexToCss(bg);
  if (typeof bg === "string" && bg !== "canvas") return bg;
  for (const layer of canvas.layers.byZOrder()) {
    const getter = layer.getResolvedBackgroundColor;
    if (typeof getter === "function") {
      const c = getter.call(layer);
      return typeof c === "number" ? hexToCss(c) : c;
    }
  }
  const surface = canvas.context?.theme?.current?.()?.palette?.surface;
  if (typeof surface === "number") return hexToCss(surface);
  const optColor = canvas.options.backgroundColor;
  return typeof optColor === "number" ? hexToCss(optColor) : null;
}
function captureRect(canvas, area, padding = 24, aspectRatio) {
  let rect;
  if (area === "content") {
    const b = canvas.renderer?.worldContentBounds();
    rect = b ? { x: b.x - padding, y: b.y - padding, width: b.width + padding * 2, height: b.height + padding * 2 } : { x: 0, y: 0, width: 0, height: 0 };
  } else {
    rect = canvas.camera.getVisibleBounds();
  }
  return aspectRatio && aspectRatio > 0 ? applyAspectRatio(rect, aspectRatio) : rect;
}
function applyAspectRatio(rect, target) {
  if (!(rect.width > 0) || !(rect.height > 0)) return rect;
  const current = rect.width / rect.height;
  if (Math.abs(current - target) < 1e-6) return rect;
  if (current < target) {
    const width = rect.height * target;
    return { x: rect.x - (width - rect.width) / 2, y: rect.y, width, height: rect.height };
  }
  const height = rect.width / target;
  return { x: rect.x, y: rect.y - (height - rect.height) / 2, width: rect.width, height };
}

// src/io/imageExport.ts
function mimeFor(format) {
  return format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
}
function rasterFormat(format) {
  return format === "jpeg" || format === "webp" ? format : "png";
}
function renderToCanvas(canvas, opts) {
  const format = rasterFormat(opts.format);
  const area = opts.area ?? "viewport";
  const maxSize = opts.maxSize ?? 8192;
  const userScale = opts.scale ?? (typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
  const renderer = canvas.renderer;
  if (!renderer?.extract) {
    throw new Error("Canvas.export: a GPU renderer is required (unavailable in headless mode).");
  }
  const frame = captureRect(canvas, area, opts.padding ?? 24, opts.aspectRatio);
  let resolution = area === "content" ? userScale : canvas.camera.scale * userScale;
  if (!(frame.width > 0) || !(frame.height > 0)) {
    throw new Error("Canvas.export: nothing to export (empty capture region).");
  }
  const longest = Math.max(frame.width, frame.height) * resolution;
  if (longest > maxSize) resolution *= maxSize / longest;
  const extracted = renderer.extract({ region: frame, resolution });
  const bg = resolveExportBackground(canvas, opts.background ?? "canvas");
  const needsFill = bg !== null || format === "jpeg";
  if (!needsFill) return extracted;
  const out = document.createElement("canvas");
  out.width = extracted.width;
  out.height = extracted.height;
  const g = out.getContext("2d");
  if (!g) throw new Error("Canvas.export: 2D context unavailable for background composite.");
  g.fillStyle = bg ?? "#ffffff";
  g.fillRect(0, 0, out.width, out.height);
  g.drawImage(extracted, 0, 0);
  return out;
}
function exportImage(canvas, opts = {}) {
  const el = renderToCanvas(canvas, opts);
  const mime = mimeFor(rasterFormat(opts.format));
  return new Promise((resolve, reject) => {
    el.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("Canvas.export: toBlob() returned null.")),
      mime,
      opts.quality
    );
  });
}
function exportImageDataURL(canvas, opts = {}) {
  const el = renderToCanvas(canvas, opts);
  return el.toDataURL(mimeFor(rasterFormat(opts.format)), opts.quality);
}
function exportSVG(canvas, opts = {}) {
  const area = opts.area ?? "viewport";
  const rect = captureRect(canvas, area, opts.padding ?? 24, opts.aspectRatio);
  if (!(rect.width > 0) || !(rect.height > 0)) {
    throw new Error("Canvas.exportSVG: nothing to export (empty capture region).");
  }
  const body = [];
  for (const layer of canvas.layers.byZOrder()) {
    if (!layer.visible) continue;
    const fn = layer.toSVG;
    if (typeof fn === "function") {
      const frag = fn.call(layer);
      if (frag) body.push(frag);
    }
  }
  const bg = resolveExportBackground(canvas, opts.background ?? "canvas");
  const bgRect = bg ? `<rect ${attrs({ x: rect.x, y: rect.y, width: rect.width, height: rect.height, fill: bg })}/>` : "";
  const pxScale = (area === "viewport" ? canvas.camera.scale : 1) * (opts.scale ?? 1);
  const header = attrs({
    xmlns: "http://www.w3.org/2000/svg",
    width: rect.width * pxScale,
    height: rect.height * pxScale,
    viewBox: `${svgNum(rect.x)} ${svgNum(rect.y)} ${svgNum(rect.width)} ${svgNum(rect.height)}`
  });
  return `<svg ${header}>${bgRect}${body.join("")}</svg>`;
}

// src/io/stateExport.ts
var CANVAS_STATE_VERSION = 1;
function jsonClone(value) {
  return JSON.parse(JSON.stringify(value));
}
function jsonSafe(value) {
  const json = JSON.stringify(value);
  return json === void 0 ? void 0 : JSON.parse(json);
}
function setsToArrays(states) {
  const out = {};
  for (const [name, set] of Object.entries(states)) out[name] = [...set];
  return out;
}
function arraysToSets(states) {
  const out = {};
  for (const [name, ids] of Object.entries(states)) out[name] = new Set(ids);
  return out;
}
function asDataSerializable(layer) {
  return typeof layer?.exportData === "function" && typeof layer?.importData === "function" ? layer : void 0;
}
function serializeDefinitionOf(inst) {
  const fn = inst?.serializeDefinition;
  return typeof fn === "function" ? fn.call(inst) : void 0;
}
function exportCanvasState(canvas) {
  const view = canvas.store.view.getState();
  const { interaction } = view;
  const data = {};
  for (const layer of canvas.layers.list()) {
    const ser = asDataSerializable(layer);
    if (ser) data[layer.id] = ser.exportData();
  }
  const definition = jsonClone(view.definition);
  const overlay = (slice, id, inst) => {
    const d = serializeDefinitionOf(inst);
    if (d) slice[id] = { ...slice[id] ?? {}, ...d };
  };
  for (const layer of canvas.layers.list()) overlay(definition.layers, layer.id, layer);
  for (const behaviour of canvas.behaviours.list()) overlay(definition.behaviours, behaviour.id, behaviour);
  for (const layout of canvas.layouts.list()) overlay(definition.layouts, layout.id, layout);
  return {
    version: CANVAS_STATE_VERSION,
    view: {
      definition,
      interaction: {
        selection: [...interaction.selection],
        hover: interaction.hover,
        states: setsToArrays(interaction.states),
        camera: { ...interaction.camera },
        focus: interaction.focus ? { ids: [...interaction.focus.ids], dim: interaction.focus.dim } : null,
        inspect: interaction.inspect,
        cameraIntent: interaction.cameraIntent ? { ...interaction.cameraIntent } : null,
        transientPins: [...interaction.transientPins],
        viewMode: interaction.viewMode,
        viewModeArgs: { ...interaction.viewModeArgs }
      }
    },
    data
  };
}
function importCanvasState(canvas, snapshot, opts = {}) {
  if (snapshot.version > CANVAS_STATE_VERSION) {
    throw new Error(
      `importCanvasState: snapshot version ${snapshot.version} is newer than the supported version ${CANVAS_STATE_VERSION}. Upgrade @invana/canvas to import it.`
    );
  }
  const { definition, interaction } = snapshot.view;
  for (const layer of canvas.layers.list()) {
    const ser = asDataSerializable(layer);
    if (ser && Object.prototype.hasOwnProperty.call(snapshot.data, layer.id)) {
      ser.importData(snapshot.data[layer.id]);
      layer.redraw();
    }
  }
  const scene = definition.canvas ?? {};
  canvas.update({
    layers: definition.layers,
    behaviours: definition.behaviours,
    layouts: definition.layouts,
    ...definition.activeLayout !== null ? { activeLayout: definition.activeLayout } : {},
    ...scene.fitOnLoad !== void 0 ? { fitOnLoad: scene.fitOnLoad } : {},
    ...scene.fitAnimation !== void 0 ? { fitAnimation: scene.fitAnimation } : {},
    ...scene.entrance !== void 0 ? { entrance: scene.entrance } : {}
  });
  canvas.store.view.update((s) => {
    s.definition.canvas = jsonClone(definition.canvas);
    s.definition.templates = jsonClone(definition.templates);
    s.definition.theme = jsonClone(definition.theme);
    s.definition.controlPanels = jsonClone(definition.controlPanels ?? {});
  }, "canvas:importState:scene");
  canvas.history.clear();
  if (!opts.skipInteraction) {
    canvas.store.view.update((s) => {
      s.interaction.selection = new Set(interaction.selection);
      s.interaction.hover = interaction.hover;
      s.interaction.states = arraysToSets(interaction.states);
      s.interaction.focus = interaction.focus ? { ids: new Set(interaction.focus.ids), dim: interaction.focus.dim } : null;
      s.interaction.inspect = interaction.inspect ?? null;
      s.interaction.cameraIntent = interaction.cameraIntent ? { ...interaction.cameraIntent } : null;
      s.interaction.transientPins = new Set(interaction.transientPins);
      s.interaction.viewMode = interaction.viewMode;
      s.interaction.viewModeArgs = { ...interaction.viewModeArgs ?? {} };
    }, "canvas:importState:interaction");
    canvas.store.actions.camera.set({ ...interaction.camera });
  }
}
function canvasStateToJSON(canvas, space = 2) {
  return JSON.stringify(exportCanvasState(canvas), null, space);
}
function triggerBlobDownload(blob, filename) {
  if (typeof document === "undefined") return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
function downloadCanvasState(canvas, filename = "canvas-state.json") {
  const blob = new Blob([JSON.stringify(exportCanvasState(canvas))], {
    type: "application/json"
  });
  triggerBlobDownload(blob, filename);
}
async function toSnapshot(source) {
  if (typeof source === "string") return JSON.parse(source);
  if (source instanceof Blob) return JSON.parse(await source.text());
  return source;
}
async function importCanvasStateFromFile(canvas, source, opts) {
  importCanvasState(canvas, await toSnapshot(source), opts);
}

// src/engine/Canvas.ts
var perfNow = () => typeof performance !== "undefined" ? performance.now() : Date.now();
var CULL_PAD_FRACTION = 0.15;
var EDIT_ACTION_PREFIX = "edit:";
var EDIT_MERGE_MS = 600;
var HISTORY_EDIT_ACTION = /^(undo|redo):edit:/;
var RECORDED_INTERACTION = /* @__PURE__ */ new Set(["selection", "focus", "inspect", "cameraIntent"]);
function classifyViewPatch(patch, change) {
  if (change.action?.startsWith(EDIT_ACTION_PREFIX)) return patch.path[0] === "definition" ? "undoable" : "skip";
  if (patch.path[0] === "interaction" && RECORDED_INTERACTION.has(patch.path[1])) return "record";
  return "skip";
}
var DEFINITION_SECTIONS = ["layers", "behaviours", "layouts"];
var COMMAND_STATE_EVENTS = [
  "scene:layer:add",
  "scene:layer:remove",
  "scene:layer:visibilitychange",
  "scene:layout:add",
  "scene:layout:remove",
  "scene:behaviour:register",
  "scene:behaviour:unregister",
  "scene:behaviour:enable",
  "scene:behaviour:disable",
  "canvas:renderer:ready"
];
var Canvas = class {
  id;
  options;
  /**
   * The renderer-free kernel (`@invana/canvas-store`) — the observable truth this
   * engine projects. **`store.view.definition` is the single source of truth for
   * serialisable config**: {@link update} writes it and {@link get} reads it (no
   * parallel `this.config`). Readers subscribe to slices via `useStore`/`select`.
   *
   * The store owns `view`, `data`, `events` (the one canvas-wide bus — {@link events}
   * *is* `store.events`) and `theme`. Undo for the definition is {@link history}.
   */
  store;
  /**
   * The record: **one operation log** of what changed, who changed it, and how
   * to take it back (RFC `feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`).
   * Written only by the canvas — nobody writes to it directly.
   *
   * What enters it (G5):
   * - **undoable** — a user edit to the definition: an {@link update} whose
   *   action starts with `edit:` (`canvas.update(patch, 'edit:control-panels')`),
   *   its `definition/*` patches only; and every recorded data write of an
   *   attached data source (a `GraphLayer`'s `store.applyDelta` and the store
   *   writers that wrap it);
   * - **recorded, skipped by plain undo** — selection, focus, inspect and
   *   camera-intent changes;
   * - **not recorded** — programmatic config (a React root's `config` prop, a
   *   `<ControlPanel>` mount), camera, hover, layout progress, and derived
   *   writes (`store.internal`).
   *
   * Undo is linear across actors and across data and view: it takes back the
   * newest undoable entry. Reverting a definition edit re-applies the reverted
   * `layers` / `behaviours` / `layouts` slices to the live instances, so what's
   * drawn follows the store. Every entry carries an `actor` (see
   * {@link actor}); read them with `history.entries({ actor })`.
   */
  history;
  /**
   * Who a recorded change is attributed to when its write names nobody. Free
   * text; set it per session (`canvas.actor = 'user:ravi'`). Initialised from
   * `CanvasOptions.actor`, default `'user'`.
   */
  actor;
  /**
   * The script: a list of JSON steps and a position (RFC
   * `feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`, G8).
   * `addStep(json)` only appends — the canvas doesn't change until a step is
   * moved to. `next()` validates the step (a bad one writes nothing), writes
   * its `data` (through the named source's `applyDelta`), `settings`
   * (`update`, as an `edit:` change) and `view` (select / focus / inspect /
   * camera intent) as **one** {@link history} entry tagged with the step, runs
   * its `do` verbs (`commands.runAsync`, each awaited), then waits for the
   * canvas to settle. `previous()` takes the step back; `next()` again replays
   * it. Steps are plain JSON, so an engine or assistant can send them.
   *
   * @example
   * ```ts
   * canvas.playbook.addStep({
   *   id: 'narrow', title: 'Only the Thénardiers',
   *   data: { hidden: { nodeIds: ['Javert', 'Fantine'] } },
   *   view: { focus: { ids: ['Thenardier', 'MmeThenardier'] }, camera: 'focus' },
   * });
   * await canvas.playbook.next();
   * ```
   */
  playbook;
  /** The log behind {@link history}; handed to data layers through the context. */
  log;
  /**
   * Public surface — populated by `init()` / `initWithRenderer()`. Accessing
   * before init throws (definite-assignment via `!`). Use `isInitialised`
   * to guard if needed.
   */
  events;
  camera;
  /**
   * Pointer-gesture arbitration for this canvas — see `input/GestureArbiter.ts`.
   * Built in the constructor (no dependency on the scene graph) so it is live
   * before any behaviour registers, and handed to every participant as
   * `ctx.gestures`.
   */
  gestures;
  layers;
  behaviours;
  layouts;
  /**
   * Named commands (`'camera.fit'`, `'view.lock'`, …) run against this canvas —
   * what serialised UI such as control panels dispatches through. Holds the
   * engine built-ins from construction (see `builtinCommands.ts`); domain
   * packages and apps register their own. Typed with {@link EngineCommandMap}:
   * those names' args are checked at compile time, any other name takes
   * `unknown`. A subclass that registers more redeclares it with a wider map
   * (`GraphCanvas`).
   */
  commands;
  context;
  /**
   * The shared theme channel — a single publisher (the domain `ThemeBehaviour`)
   * sets the resolved theme here and every theme-aware layer recolours from it.
   * Lives for the whole `Canvas` lifetime (the bus already exists at construct).
   */
  themeState;
  /**
   * The drawing backend. `Canvas` drives it through {@link IRenderer} and owns
   * no pixi object of its own — the `Application`, the viewport, the surfaces
   * and the texture pool all live behind this.
   */
  _renderer;
  /** Handle for the engine's own rAF loop. Set while initialised (G3). */
  _rafHandle = null;
  _isInitialised = false;
  /** True once this canvas has acquired the shared TexturePool (real `init` only). */
  /** Last message pushed on the message channel; `null` when idle / cleared. */
  _currentMessage = null;
  /**
   * Per-frame performance recorder — FPS + per-phase CPU breakdown for the last
   * N frames. Fed from {@link tickOnce}; read via {@link frames}. Always on (a
   * ring-buffer write per frame is near-free); an OTel adapter opts in by tapping
   * the `render:loop:tick` event this emits.
   */
  _frames = new FrameMeter();
  /** Attributes each frame to the active gesture so {@link _frames} can tag it. */
  _interactions;
  /** `performance.now()` at the previous frame — for the true (unclamped) frame time. */
  _lastFrameTs = 0;
  /** Guards {@link _armAutoFit} against attaching duplicate follow listeners
   *  when `config.fitOnLoad: true` is applied more than once. */
  _autoFitArmed = false;
  /** Set once `config.defaultViewMode` has seeded the live mode — later configs
   *  only update the stored default. */
  _viewModeSeeded = false;
  /** Pending grace timer from {@link _armAutoFit} — fires only if the declared
   *  `activeLayout` never reports a run. Cleared on the first run and on destroy. */
  _autoFitGrace;
  /** Rounded visible-bounds key from the last cull — re-cull only when it changes. */
  _lastCullKey = "";
  /**
   * Every **world** surface handed out by {@link _buildContext}'s factory, in
   * creation order. The entrance fades these and only these: screen-fixed
   * chrome blinking in reads as a glitch.
   *
   * Tracked here rather than walked off the layers because a surface is the
   * thing with an alpha, and a layer need not expose its own.
   */
  _worldSurfaces = /* @__PURE__ */ new Set();
  /**
   * Entrance state machine, or `null` when `config.entrance` is absent (the
   * default — nothing is armed and no alpha is ever written).
   *
   * `armed` means the world is being held at alpha 0 waiting for the trigger;
   * `tween` is non-null only while the fade is actually running. Once `played`
   * is true the entrance never fires again for this canvas's life.
   */
  _entrance = null;
  /** `config.fitAnimation`, applied to the first auto-fit only. */
  _fitAnimation;
  /** False until the auto-fitter has issued its first fit — gates {@link _fitAnimation}. */
  _firstFitDone = false;
  /** {@link runLayout} calls whose promise hasn't settled — read by {@link _whenSettled}. */
  _runsInFlight = 0;
  constructor(opts = {}) {
    this.id = opts.id ?? "canvas";
    this.options = opts;
    this.store = createCanvasStore(opts.telemetry ? { telemetry: opts.telemetry } : {});
    this.events = this.store.events;
    this.actor = opts.actor ?? "user";
    this.log = createOperationLog({
      view: this.store.view,
      actor: () => this.actor,
      classify: classifyViewPatch,
      // Live editors write per keystroke / drag frame: one step per burst.
      mergeWithinMs: EDIT_MERGE_MS
    });
    this.history = historyView(this.log, {
      describeView: (parts) => describeViewParts(this.store.view.getState(), parts)
    });
    this.playbook = createPlaybook(
      this.log,
      canvasPlaybookEnv(this, this.log, () => this._whenSettled())
    );
    this.store.view.subscribeChanges((change) => {
      if (HISTORY_EDIT_ACTION.test(change.action ?? "")) {
        this._reconcileDefinition(change.prev.definition, change.state.definition);
      }
    });
    this.store.view.subscribeChanges((change) => {
      const next = change.state.interaction.cameraIntent;
      if (!next || next === change.prev.interaction.cameraIntent) return;
      if (change.action === "canvas:importState:interaction") return;
      if (next.intent === "focus") return;
      void this._whenSettled().then(() => {
        if (this.store.view.getState().interaction.cameraIntent !== next) return;
        this._frameIntent(next.intent === "all");
      });
    });
    this.themeState = new CanvasThemeState(this.events);
    this.gestures = new DefaultGestureArbiter();
    this._interactions = new InteractionTracker(this.events);
    this.layers = new LayerRegistry({ getContext: () => this.context, bus: this.events });
    this.behaviours = new BehaviourRegistry({ getContext: () => this.context, bus: this.events });
    this.layouts = new LayoutRegistry({ bus: this.events });
    this.commands = new CommandRegistry({ getContext: () => this });
    registerBuiltinCommands(this.commands);
    this.history.subscribe(() => this.commands.invalidate());
    const invalidate = () => this.commands.invalidate();
    for (const type of COMMAND_STATE_EVENTS) this.events.on(type, invalidate);
    this.events.on("scene:layer:add", ({ id }) => {
      const slice = this.store.view.getState().definition.layers[id];
      if (slice) configurable(this.layers.get(id))?.setOptions(slice);
    });
  }
  get isInitialised() {
    return this._isInitialised;
  }
  /**
   * The mounted drawing backend, or `undefined` before `init()`.
   *
   * Replaces the old `application` getter, which handed out pixi's
   * `Application` and could not survive the backend split — a getter typed in
   * pixi nouns forces every consumer to know which backend is mounted. Reach
   * for a *capability* (`renderer.capabilities`, `renderer.extract?.()`)
   * instead; if you genuinely need the pixi object, narrow the backend
   * yourself with an `instanceof PixiRenderer` at the call site.
   */
  get renderer() {
    return this._renderer;
  }
  // ─── Init paths ──────────────────────────────────────────────────────────
  /**
   * Production init: create a pixi `Application`, mount its canvas into the
   * supplied DOM container, wire the ticker, and emit
   * `'canvas:renderer:ready'` on the bus.
   *
   * The selected backend (and capabilities) flows through the bus event so
   * consumers see which renderer pixi resolved.
   */
  async init(opts) {
    if (this._isInitialised) {
      throw new Error(`Canvas "${this.id}" already initialised`);
    }
    const container = opts.container;
    if (!container) throw new Error(`Canvas "${this.id}": init() requires a container element`);
    const renderer = opts.renderer ?? createDefaultRenderer({ events: this.events });
    this._renderer = renderer;
    await renderer.mount(container, {
      ...opts.preference ? { preference: opts.preference } : {},
      ...opts.width !== void 0 ? { width: opts.width } : {},
      ...opts.height !== void 0 ? { height: opts.height } : {},
      ...opts.resolution !== void 0 ? { resolution: opts.resolution } : {},
      ...opts.antialias !== void 0 ? { antialias: opts.antialias } : {},
      ...opts.backgroundColor !== void 0 ? { background: opts.backgroundColor } : {},
      ...opts.powerPreference !== void 0 ? { powerPreference: opts.powerPreference } : {},
      ...opts.opaque !== void 0 ? { opaque: opts.opaque } : {},
      ...opts.autoResize !== void 0 ? { autoResize: opts.autoResize } : {},
      ...opts.suppressBrowserContextMenu !== void 0 ? { suppressBrowserContextMenu: opts.suppressBrowserContextMenu } : {}
    });
    const width = opts.width ?? container.clientWidth;
    const height = opts.height ?? container.clientHeight;
    this._wireScene(width, height);
    this._startFrameLoop();
    this._isInitialised = true;
    this.events.emit("canvas:renderer:ready", {
      backend: renderer.backend,
      capabilities: { ...renderer.capabilities }
    });
    this._activate(opts.config);
  }
  /**
   * Init against a renderer the caller already built and mounted — the seam for
   * a **headless** backend, and the reason the engine's own test suite needs no
   * drawing library.
   *
   * Synchronous on purpose. {@link init} resolves its default backend with a
   * lazy `import()` and is therefore async; this path takes the renderer as an
   * argument instead, so it stays callable from a plain test body.
   *
   * The caller owns the renderer's `mount` — this only wires the camera, the
   * context and the layer/behaviour registries on top of it.
   */
  initWithRenderer(renderer, screenWidth, screenHeight) {
    if (this._isInitialised) {
      throw new Error(`Canvas "${this.id}" already initialised`);
    }
    this._renderer = renderer;
    this._wireScene(screenWidth, screenHeight);
    this._startFrameLoop();
    this._isInitialised = true;
    this.events.emit("canvas:renderer:ready", {
      backend: renderer.backend,
      capabilities: { ...renderer.capabilities }
    });
    this._activate(this.options.config);
  }
  // ─── Tick ────────────────────────────────────────────────────────────────
  /**
   * Run one tick manually with a fixed delta. Useful in tests; in production
   * pixi's ticker calls `tick` automatically.
   */
  tickOnce(deltaMs = 16) {
    if (!this._isInitialised) return;
    const t0 = perfNow();
    const dt = this._lastFrameTs > 0 && t0 - this._lastFrameTs > 0.5 ? t0 - this._lastFrameTs : deltaMs;
    this._lastFrameTs = t0;
    this.camera.tick(deltaMs);
    this._tickEntrance(dt);
    const t1 = perfNow();
    for (const id in this.store.data) this.store.data[id]?.flush();
    const t2 = perfNow();
    const visBounds = this.camera.getVisibleBounds();
    const cullKey = `${Math.round(visBounds.x)},${Math.round(visBounds.y)},${Math.round(visBounds.width)},${Math.round(visBounds.height)}`;
    const cameraMoved = cullKey !== this._lastCullKey;
    if (cameraMoved) this._lastCullKey = cullKey;
    const cullPad = Math.max(visBounds.width, visBounds.height) * CULL_PAD_FRACTION;
    for (const layer of this.layers.byZOrder()) {
      if (!layer.visible) continue;
      if (layer.hasPending()) layer.flush();
      const ticker = layer;
      if (ticker.tickAnimations) {
        ticker.tickAnimations(deltaMs);
      } else if (ticker.renderer?.tickAnimations) {
        ticker.renderer.tickAnimations(deltaMs);
      }
      if (cameraMoved && layer.cullable) ticker.renderer?.cull?.(visBounds, cullPad);
    }
    const t3 = perfNow();
    const tick = this._frames.sample({
      ts: t0,
      dt,
      phases: { camera: t1 - t0, dataFlush: t2 - t1, layers: t3 - t2 },
      interaction: this._interactions.current(t0)
    });
    this.events.emit("render:loop:tick", tick);
  }
  /**
   * Resolve on the first frame with no layout run in flight (its position
   * transition included), no reported layout run status and no camera glide
   * (RFC F12). Always waits at least one frame, so a write made just before
   * the call has flushed and any layout it triggered has started. Resolves
   * anyway after `timeoutMs`, so a simulation that never cools can't hold a
   * caller forever.
   *
   * Private on purpose: behaviours reach it as `CanvasContext.whenSettled`,
   * and `canvas.playbook` waits on it between steps.
   */
  _whenSettled(opts = {}) {
    const timeoutMs = opts.timeoutMs ?? 15e3;
    const started = performance.now();
    const nextFrame = (fn) => {
      if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => fn());
      else setTimeout(fn, 16);
    };
    return new Promise((resolve) => {
      const check = () => {
        if (!this._isInitialised) return resolve();
        const settled = this._runsInFlight === 0 && !this.store.view.getState().runtime.layout.running && !(this.camera?.isAnimating ?? false);
        if (settled || performance.now() - started >= timeoutMs) return resolve();
        nextFrame(check);
      };
      nextFrame(check);
    });
  }
  /**
   * Fit the camera to all content — zoom + centre so every world layer's content
   * fits the viewport (the "zoom to extent" action; the same
   * `camera.fitContent` the Fit toolbar button calls, over the union of layers).
   * No-op when there's nothing with real extent to fit.
   *
   * @param padding Screen-px margin around the content. Default `80`.
   */
  fitView(padding = 80) {
    const rect = this._contentBounds();
    if (rect) this.camera.fitContent(rect, padding);
  }
  /**
   * {@link fitView}, eased — glide to the fitted transform instead of snapping.
   * Used for the first auto-fit when `config.fitAnimation` is set.
   *
   * Solves for the same transform `Camera.fitContent` would write, then hands it
   * to `Camera.animateTo` rather than applying it. Any user camera write during
   * the glide cancels it.
   */
  _fitViewAnimated(opts, padding = 80) {
    const rect = this._contentBounds();
    if (!rect) return;
    this.camera.animateTo(
      this._fitTransform(rect, padding),
      {
        ...opts.durationMs !== void 0 ? { durationMs: opts.durationMs } : {},
        ...opts.easing !== void 0 ? { easing: opts.easing } : {}
      }
    );
  }
  /**
   * The camera transform `Camera.fitContent(rect, padding)` would write:
   * the zoom that fits `rect` inside the padded viewport, centred on it. Not
   * clamped — `Camera.setTransform` / `animateTo` clamp on write.
   */
  _fitTransform(rect, padding) {
    const cam = this.camera;
    const availW = Math.max(1, cam.screenWidth - padding * 2);
    const availH = Math.max(1, cam.screenHeight - padding * 2);
    const zoom = Math.min(availW / Math.max(1, rect.width), availH / Math.max(1, rect.height));
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    return { x: cam.screenWidth / 2 - cx * zoom, y: cam.screenHeight / 2 - cy * zoom, zoom };
  }
  /**
   * Start following one layout run with the camera — the engine side of
   * {@link LayoutRunOptions.fitCamera}. Returns a per-frame step to call with
   * the transition's eased `progress`, and a `settle` for when the run ends.
   *
   * Each step blends from the transform the camera had when the run started
   * toward a fit of the content **as it is on that frame**, by `progress`:
   * the world point at the screen centre moves linearly and the zoom moves in
   * log space (so a 4× zoom-out reads as evenly paced as a 4× zoom-in). At
   * `progress` 0 that is exactly the starting camera — no jump when the run's
   * new node sizes landed before it — and at `1` it is exactly the fit, so the
   * glide ends framed without a second write.
   *
   * Bounds are read from the store (`GraphLayer.getBounds` is store-derived),
   * so a step sees the positions the transition wrote this same frame.
   *
   * A user gesture takes the camera: if the transform no longer matches the
   * one this follow last wrote, the follow stands down for the rest of the
   * run and `settle` does nothing.
   */
  _followRun(padding) {
    const cam = this.camera;
    const W = cam.screenWidth;
    const H = cam.screenHeight;
    const z0 = cam.scale;
    const c0x = (W / 2 - cam.x) / z0;
    const c0y = (H / 2 - cam.y) / z0;
    let last = null;
    let active = true;
    let stepped = false;
    const taken = () => {
      if (!last) return false;
      return Math.abs(cam.x - last.x) > 0.5 || Math.abs(cam.y - last.y) > 0.5 || Math.abs(cam.scale - last.zoom) > 1e-6 * Math.max(1, last.zoom);
    };
    const step = (progress) => {
      if (!active) return;
      if (taken()) {
        active = false;
        return;
      }
      const rect = this._contentBounds();
      if (!rect) return;
      stepped = true;
      const fit = this._fitTransform(rect, padding);
      const p = Math.min(1, Math.max(0, progress));
      const zoom = Math.exp(Math.log(z0) + (Math.log(Math.max(1e-9, fit.zoom)) - Math.log(z0)) * p);
      const c1x = (W / 2 - fit.x) / fit.zoom;
      const c1y = (H / 2 - fit.y) / fit.zoom;
      const cx = c0x + (c1x - c0x) * p;
      const cy = c0y + (c1y - c0y) * p;
      cam.setTransform({ x: W / 2 - cx * zoom, y: H / 2 - cy * zoom, zoom });
      last = { x: cam.x, y: cam.y, zoom: cam.scale };
    };
    const settle = () => {
      if (!active || taken()) return;
      active = false;
      if (stepped) return;
      requestAnimationFrame(() => this.fitView(padding));
    };
    return { step, settle };
  }
  /**
   * Whether `config.fitOnLoad` has armed the engine's auto-fitter — i.e. whether
   * **this canvas already owns framing**.
   *
   * Read it before fitting the camera from outside the engine (a layout wrapper,
   * an app shell). The auto-fitter frames on the same `layout:run:end` a layout
   * consumer would, using the union of *every* world layer's bounds; a second
   * owner writing the transform with a different padding lands as an extra
   * visible hop after the graph has already settled. The engine is the better
   * owner of the two — it is the only one that can see the other layers.
   */
  get autoFitArmed() {
    return this._autoFitArmed;
  }
  /**
   * Arm `config.fitOnLoad`: keep the view framed on the graph as its layout
   * runs. With no `activeLayout`, this is a single fit on the next frame (the
   * extra frame lets a just-loaded scene flush before {@link fitView} reads its
   * bounds).
   *
   * With an `activeLayout`, the layout owns the positions, so we frame it around
   * every **run**. An **animated** layout keeps expanding as it settles, so a
   * single end-fit would frame an intermediate (smaller) state and leave nodes
   * spilling outside once the graph grows — so we *follow* the run: re-fit
   * (throttled — a live sim ticks every frame) on each `layout:run:tick`, then an
   * exact fit on `layout:run:end`/`settled`. A static layout ticks ~once then
   * ends, degrading to the same single settle-fit.
   *
   * Scope is the **active layout's `runLayout` calls** — the initial load and
   * engine re-runs (topology change / {@link refresh}). Gating on the layout id
   * (not on catching `start`) means we still follow a run already in flight when
   * arming lands. Crucially, the bridged `layout:run:*` events only flow while a
   * `runLayout` is in flight (torn down on settle); a live **drag** / hover /
   * `setOptions` re-heat re-`apply()`s the layout *directly*, without
   * re-bridging, so it never reaches the bus and the camera stays put during
   * interaction. Listeners live for the canvas lifetime (cleared by `destroy`'s
   * `removeAllListeners`); {@link _autoFitArmed} keeps a repeated
   * `fitOnLoad: true` from attaching duplicates.
   */
  _armAutoFit() {
    if (this._autoFitArmed) return;
    this._autoFitArmed = true;
    const FLUSH_WATCH_MS = 1e3;
    const FLUSH_THROTTLE_MS = 100;
    const LAYOUT_GRACE_MS = 1200;
    let watchUntil = 0;
    let lastFlushFit = 0;
    let fitQueued = false;
    let fitGeneration = 0;
    let layoutHasPlaced = false;
    const requestFit = () => {
      if (fitQueued) return;
      fitQueued = true;
      const generation = fitGeneration;
      requestAnimationFrame(() => {
        fitQueued = false;
        if (generation !== fitGeneration) return;
        const first = !this._firstFitDone;
        this._firstFitDone = true;
        if (first && this._fitAnimation) this._fitViewAnimated(this._fitAnimation);
        else this.fitView();
        if (first) this._playEntrance();
      });
    };
    this.events.on("data:flush", () => {
      const now = performance.now();
      if (now > watchUntil || now - lastFlushFit < FLUSH_THROTTLE_MS) return;
      lastFlushFit = now;
      requestFit();
    });
    const fit = () => {
      watchUntil = performance.now() + FLUSH_WATCH_MS;
      requestFit();
    };
    const activeLayout = () => this.store.view.getState().definition.activeLayout;
    requestAnimationFrame(() => {
      if (activeLayout() && !layoutHasPlaced) {
        this._autoFitGrace = setTimeout(() => {
          this._autoFitGrace = void 0;
          if (!layoutHasPlaced) fit();
        }, LAYOUT_GRACE_MS);
        return;
      }
      fit();
    });
    const THROTTLE_MS = 100;
    let lastFit = 0;
    this.events.on("layout:run:start", ({ id, preserveCamera, fitCamera }) => {
      if (!(preserveCamera || fitCamera) || id !== activeLayout()) return;
      watchUntil = 0;
      fitGeneration++;
    });
    this.events.on("layout:run:tick", ({ id, preserveCamera, fitCamera }) => {
      if (id !== activeLayout() || preserveCamera || fitCamera) return;
      this._clearAutoFitGrace();
      layoutHasPlaced = true;
      const now = performance.now();
      if (now - lastFit < THROTTLE_MS) return;
      lastFit = now;
      fit();
    });
    this.events.on("layout:run:end", ({ id, reason, preserveCamera, fitCamera }) => {
      if (id !== activeLayout() || reason !== "settled" || preserveCamera || fitCamera) {
        if (id === activeLayout() && fitCamera) {
          this._clearAutoFitGrace();
          layoutHasPlaced = true;
        }
        return;
      }
      this._clearAutoFitGrace();
      layoutHasPlaced = true;
      fit();
    });
  }
  /**
   * Arm `config.entrance`: hold the world at alpha 0 and wait for the first
   * frame worth showing.
   *
   * Arming writes alpha **immediately**, before any trigger. That ordering is
   * the whole design: if the world were left opaque until the trigger fired,
   * the content would paint normally for several frames and then snap to
   * invisible to begin its fade — a pop, which is worse than the cut the
   * entrance exists to remove.
   *
   * The trigger is the first fit when {@link CanvasConfig.fitOnLoad} is armed
   * (the camera has framed real positions by then), otherwise the first
   * `data:flush`. Either way a grace timer releases the fade regardless, so a
   * canvas whose trigger never arrives cannot be left permanently invisible —
   * the same reasoning as the auto-fitter's `LAYOUT_GRACE_MS`, and for the same
   * reason: a feature that can hide a scene forever must have a floor.
   */
  _armEntrance(cfg) {
    if (this._entrance) return;
    const ENTRANCE_GRACE_MS = 2e3;
    this._entrance = {
      durationMs: Math.max(1, cfg.durationMs ?? 320),
      easing: cfg.easing,
      armed: true,
      played: false,
      tween: null,
      grace: setTimeout(() => {
        if (this._entrance) this._entrance.grace = void 0;
        this._playEntrance();
      }, ENTRANCE_GRACE_MS)
    };
    for (const surface of this._worldSurfaces) surface.setAlpha(0);
    if (this._firstFitDone) {
      requestAnimationFrame(() => this._playEntrance());
      return;
    }
    this.events.on("data:flush", () => {
      if (this._autoFitArmed) return;
      this._playEntrance();
    });
  }
  /**
   * Start the fade. Idempotent and one-shot: re-layouts, data changes and
   * re-fits never replay it (G-5) — an entrance that fires twice is an
   * animation tax, not a welcome.
   */
  _playEntrance() {
    const e = this._entrance;
    if (!e || e.played) return;
    e.played = true;
    e.armed = false;
    if (e.grace !== void 0) {
      clearTimeout(e.grace);
      e.grace = void 0;
    }
    e.tween = new Tween({
      from: 0,
      to: 1,
      duration: e.durationMs,
      easing: resolveEasing(e.easing)
    });
  }
  /**
   * Advance the entrance fade by one frame. Called from {@link tickOnce}; a
   * no-op on every canvas that did not opt in, which is the default.
   */
  _tickEntrance(dt) {
    const e = this._entrance;
    if (!e?.tween) return;
    const running = e.tween.tick(dt);
    const alpha = running ? e.tween.value : 1;
    for (const surface of this._worldSurfaces) surface.setAlpha(alpha);
    if (running) return;
    e.tween = null;
    this._entrance = null;
  }
  /** Cancel the pending {@link _armAutoFit} grace timer, if any. */
  _clearAutoFitGrace() {
    if (this._autoFitGrace === void 0) return;
    clearTimeout(this._autoFitGrace);
    this._autoFitGrace = void 0;
  }
  /**
   * Union of the world layers' content bounds (screen-fixed layers are excluded —
   * they don't pan/zoom). Returns `null` when nothing has real extent yet.
   *
   * World layers are detected by duck-typing on `getBounds` (a `WorldLayer`-only
   * method — screen layers don't have it) rather than `instanceof WorldLayer`,
   * which is unreliable when a bundler serves a domain package (e.g.
   * `@invana/graph`'s `GraphLayer`) a *separate copy* of the base class.
   */
  /**
   * Glide the camera to fit the content — every visible element, or with
   * `includeHidden` all of it. The engine side of the `'visible'` / `'all'`
   * camera intents.
   */
  _frameIntent(includeHidden, padding = 80) {
    if (!this._isInitialised) return;
    const rect = this._contentBounds(includeHidden);
    if (!rect) return;
    this.camera.animateTo(this._fitTransform(rect, padding), { durationMs: 450 });
  }
  _contentBounds(includeHidden = false) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let any = false;
    for (const layer of this.layers.byZOrder()) {
      const getBounds = layer.getBounds;
      if (typeof getBounds !== "function") continue;
      const r = includeHidden ? getBounds.call(layer, { includeHidden }) : getBounds.call(layer);
      if (!r || r.width <= 0 && r.height <= 0) continue;
      any = true;
      if (r.x < minX) minX = r.x;
      if (r.y < minY) minY = r.y;
      if (r.x + r.width > maxX) maxX = r.x + r.width;
      if (r.y + r.height > maxY) maxY = r.y + r.height;
    }
    return any ? { x: minX, y: minY, width: maxX - minX, height: maxY - minY } : null;
  }
  /**
   * Frame-performance recorder — instantaneous + windowed FPS and the per-phase
   * CPU breakdown for the last N frames. Read it for a HUD (`canvas.frames.stats()`)
   * or subscribe to the per-frame `render:loop:tick` event for streaming.
   */
  get frames() {
    return this._frames;
  }
  // ─── Serialisable config ────────────────────────────────────────────────
  /**
   * Run at the end of `init()`: mount every layer added so far, wire every
   * behaviour (layers first so behaviour `onRegister` finds them mounted), then
   * apply the init `config` and enable the behaviours it flags.
   */
  _activate(config) {
    this.layers.mountAll();
    this.behaviours.registerAll();
    if (!config) return;
    this.update(config);
    for (const [id, options] of Object.entries(config.behaviours ?? {})) {
      if (options.enabled) this.behaviours.setEnabled(id, true);
    }
  }
  /**
   * Apply a JSON config patch. Writes `store.view.definition` (the source of
   * truth) and pushes each layer/behaviour slice to that instance's `setOptions`,
   * resolved by id (unknown ids no-op — register the instance first). Observers
   * subscribe to `store.view` slices (`useStore` / `select`) or `state:change`
   * rather than a coarse bus event.
   *
   * The config is pure JSON keyed by id — instances themselves are registered
   * imperatively (`canvas.layers.add(new XLayer({ id }))`).
   *
   * @param action Names the write on the store's change stream. An action that
   *   starts with `edit:` marks a **user edit** (a Studio editor's apply), which
   *   {@link history} records so it can be undone; the default
   *   `'canvas:update'` is programmatic config and is not recorded.
   */
  update(patch, action = "canvas:update") {
    if (action.startsWith(EDIT_ACTION_PREFIX)) this._writeBaseline(patch);
    this._applyToInstances(patch);
    this.store.view.update((s) => {
      for (const [id, o] of Object.entries(patch.layers ?? {})) {
        s.definition.layers[id] = deepMerge(s.definition.layers[id] ?? {}, o);
      }
      for (const [id, o] of Object.entries(patch.behaviours ?? {})) {
        s.definition.behaviours[id] = deepMerge(s.definition.behaviours[id] ?? {}, o);
      }
      for (const [id, o] of Object.entries(patch.layouts ?? {})) {
        s.definition.layouts[id] = deepMerge(s.definition.layouts[id] ?? {}, o);
      }
      if (patch.activeLayout !== void 0) s.definition.activeLayout = patch.activeLayout;
      for (const [id, spec] of Object.entries(patch.controlPanels ?? {})) {
        if (spec === null) delete s.definition.controlPanels[id];
        else s.definition.controlPanels[id] = spec;
      }
      if (patch.fitOnLoad !== void 0) s.definition.canvas.fitOnLoad = patch.fitOnLoad;
      if (patch.fitAnimation !== void 0) s.definition.canvas.fitAnimation = patch.fitAnimation;
      if (patch.entrance !== void 0) s.definition.canvas.entrance = patch.entrance;
      if (patch.defaultViewMode !== void 0) {
        s.definition.canvas.defaultViewMode = patch.defaultViewMode;
        if (!this._viewModeSeeded) s.interaction.viewMode = patch.defaultViewMode;
      }
    }, action);
    if (patch.defaultViewMode !== void 0) this._viewModeSeeded = true;
    if (patch.fitAnimation !== void 0) this._fitAnimation = patch.fitAnimation;
    if (patch.entrance !== void 0) this._armEntrance(patch.entrance);
    if (patch.fitOnLoad === true) this._armAutoFit();
  }
  /**
   * Push the `layers` / `behaviours` / `layouts` slices of a config patch to the
   * live instances (no store write). Shared by {@link update} and the undo
   * reconciler.
   */
  _applyToInstances(patch) {
    for (const [id, options] of Object.entries(patch.layers ?? {})) {
      configurable(this.layers.get(id))?.setOptions(options);
    }
    for (const [id, options] of Object.entries(patch.behaviours ?? {})) {
      configurable(this.behaviours.get(id))?.setOptions(options);
      const enabled = options.enabled;
      if (enabled !== void 0) this.behaviours.setEnabled(id, enabled);
      if ("modes" in options) {
        this.behaviours.get(id)?.setModes?.(options.modes);
      }
    }
    for (const [id, options] of Object.entries(patch.layouts ?? {})) {
      this.layouts.get(id)?.setOptions(options);
    }
  }
  /**
   * Before an `edit:` write, copy the instance's **current** value of every key
   * the edit sets but the definition doesn't hold yet into the definition — an
   * unrecorded write. The recorded edit then *changes* those keys from their real
   * old value instead of adding them, so undo restores the old value rather than
   * removing the key (which would leave the instance on the new one). Values that
   * aren't JSON (resolver functions) are skipped.
   */
  _writeBaseline(patch) {
    const def = this.store.view.getState().definition;
    const fills = [];
    for (const section of DEFINITION_SECTIONS) {
      for (const [id, o] of Object.entries(patch[section] ?? {})) {
        const inst = this._instance(section, id);
        if (!inst) continue;
        const held = def[section][id] ?? {};
        for (const key of Object.keys(o)) {
          if (key in held) continue;
          const value = jsonSafe(currentOption(inst, key));
          if (value !== void 0) fills.push([section, id, key, value]);
        }
      }
    }
    if (fills.length === 0) return;
    this.store.view.update((s) => {
      for (const [section, id, key, value] of fills) {
        (s.definition[section][id] ??= {})[key] = value;
      }
    }, "canvas:update:baseline");
  }
  /**
   * After a {@link history} undo / redo: diff the definition's `layers` /
   * `behaviours` / `layouts` slices before and after, and push each changed key to
   * its instance — the new value, or `undefined` for a key the step removed (most
   * `setOptions` read that as "back to the default"). `fitAnimation` and
   * `activeLayout` follow too.
   */
  _reconcileDefinition(prev, next) {
    const patch = {};
    for (const section of DEFINITION_SECTIONS) {
      if (prev[section] === next[section]) continue;
      const out = {};
      for (const id of /* @__PURE__ */ new Set([...Object.keys(prev[section]), ...Object.keys(next[section])])) {
        const before = prev[section][id] ?? {};
        const after = next[section][id] ?? {};
        if (before === after) continue;
        const diff = {};
        for (const key of /* @__PURE__ */ new Set([...Object.keys(before), ...Object.keys(after)])) {
          if (before[key] !== after[key]) diff[key] = after[key];
        }
        if (Object.keys(diff).length > 0) out[id] = diff;
      }
      if (Object.keys(out).length > 0) patch[section] = out;
    }
    this._applyToInstances(patch);
    if (prev.canvas.fitAnimation !== next.canvas.fitAnimation) this._fitAnimation = next.canvas.fitAnimation;
    if (prev.activeLayout !== next.activeLayout && next.activeLayout !== null) {
      this.update({ activeLayout: next.activeLayout }, "canvas:update:reconcile");
    }
  }
  /** The registered instance behind a definition slice, if any. */
  _instance(section, id) {
    if (section === "layers") return this.layers.get(id);
    if (section === "behaviours") return this.behaviours.get(id);
    return this.layouts.get(id);
  }
  /**
   * Current serialisable config snapshot — drive a settings UI / save-load from
   * this. Projected from `store.view.definition` (the source of truth).
   */
  get() {
    const d = this.store.view.getState().definition;
    return {
      layers: d.layers,
      behaviours: d.behaviours,
      layouts: d.layouts,
      ...d.activeLayout !== null ? { activeLayout: d.activeLayout } : {},
      ...Object.keys(d.controlPanels).length > 0 ? { controlPanels: d.controlPanels } : {},
      ...d.canvas.fitOnLoad !== void 0 ? { fitOnLoad: d.canvas.fitOnLoad } : {},
      ...d.canvas.fitAnimation !== void 0 ? { fitAnimation: d.canvas.fitAnimation } : {},
      ...d.canvas.entrance !== void 0 ? { entrance: d.canvas.entrance } : {},
      ...d.canvas.defaultViewMode !== void 0 ? { defaultViewMode: d.canvas.defaultViewMode } : {}
    };
  }
  /**
   * Run a registered layout against the layer named by its `targetLayerId`.
   * No-op if the layout or its target layer isn't found. Layouts run against
   * data, so call this after the target layer has data.
   *
   * @param run Per-run behaviour (anchor node, leave the camera alone) — see
   *            {@link LayoutRunOptions}. Forwarded to `layout.apply`, and
   *            `preserveCamera` / `fitCamera` are stamped on this run's
   *            `layout:run:*` events so the other fitters can skip it. With
   *            `fitCamera`, this method itself moves the camera with the run's
   *            position transition (see `LayoutRunOptions.fitCamera`).
   */
  runLayout(id, run) {
    const layout = this.layouts.get(id);
    const target = layout?.targetLayerId ? this.layers.get(layout.targetLayerId) : void 0;
    if (!layout || !target) return Promise.resolve();
    const layerId = layout.targetLayerId ?? "";
    const preserveCamera = run?.preserveCamera === true;
    const fitCamera = !preserveCamera && run?.fitCamera != null && run.fitCamera !== false;
    const fitPadding = typeof run?.fitCamera === "object" && run.fitCamera.padding !== void 0 ? run.fitCamera.padding : 80;
    const cameraFlags = {
      ...preserveCamera ? { preserveCamera } : {},
      ...fitCamera ? { fitCamera } : {}
    };
    let follow = null;
    const offStart = layout.events.on("start", ({ nodeCount, edgeCount, animate }) => {
      if (fitCamera) follow = this._followRun(fitPadding);
      this.store.actions.layoutStatus.begin(layout.id, animate ?? false);
      this.events.emit("layout:run:start", {
        id: layout.id,
        layerId,
        nodeCount: nodeCount ?? 0,
        edgeCount: edgeCount ?? 0,
        animate: animate ?? false,
        ...cameraFlags
      });
    });
    const offEnd = layout.events.on("end", ({ reason }) => {
      this.store.actions.layoutStatus.end();
      if (reason === "completed") follow?.settle();
      this.events.emit("layout:run:end", {
        id: layout.id,
        layerId,
        reason: reason === "completed" ? "settled" : "stopped",
        ...cameraFlags
      });
    });
    const offTransition = layout.events.on("transition", ({ progress }) => {
      follow?.step(progress);
    });
    const offTick = layout.events.on("tick", () => {
      this.events.emit("layout:run:tick", { id: layout.id, ...cameraFlags });
    });
    this._runsInFlight++;
    return layout.apply(target, run).finally(() => {
      this._runsInFlight--;
      offStart();
      offEnd();
      offTick();
      offTransition();
    });
  }
  /**
   * Re-run the **active** layout (`definition.activeLayout`) with per-run
   * options. The engine side of `CanvasContext.runActiveLayout`; resolves
   * immediately when no layout is active.
   */
  runActiveLayout(run) {
    const activeLayout = this.store.view.getState().definition.activeLayout;
    return activeLayout ? this.runLayout(activeLayout, run) : Promise.resolve();
  }
  /**
   * Cancel the layout run that's currently in flight, if any. Reads the running
   * layout id from the reactive run-status (`runtime.layout.activeId`, written by
   * {@link runLayout}) and calls its optional `stop()` — which settles the run,
   * emits `end` (`reason: 'stopped'`), and clears `runtime.layout.running` back
   * through the same bridge. No-op when nothing is running or the layout has no
   * `stop()`. This is the engine-level counterpart a "Stop layout" control calls
   * to halt the active (e.g. load-time) layout, distinct from any layout a UI
   * applied out-of-band.
   */
  stopLayout() {
    const id = this.store.view.getState().runtime.layout.activeId;
    if (!id) return;
    const layout = this.layouts.get(id);
    layout?.stop?.();
  }
  /**
   * Repaint every layer from its current state — calls {@link Layer.redraw} on
   * each (a no-op for layers that don't override it). A pure render pass:
   * positions and data are untouched. Use after an external style/theme change
   * that bypassed the per-layer dirty path, or to recover from a suspected
   * render desync. For layout re-positioning use {@link runLayout}; for both at
   * once use {@link refresh}.
   */
  redraw() {
    for (const layer of this.layers.byZOrder()) layer.redraw();
  }
  /**
   * Full refresh: re-run the active layout (`config.activeLayout`) to
   * re-position items, then {@link redraw} every layer. The single call behind
   * a toolbar "re-render" button — re-layout + repaint in one. Resolves once
   * the layout settles; the layout step is skipped when no `activeLayout` is set.
   */
  async refresh() {
    const activeLayout = this.store.view.getState().definition.activeLayout;
    if (activeLayout) await this.runLayout(activeLayout);
    this.redraw();
  }
  // ─── Message channel ───────────────────────────────────────────────────────
  /**
   * Show a transient message on the shared canvas message channel — emits a
   * `message` event for a status surface (e.g. canvas-react's `CanvasMessageBar`)
   * to display. Last-write-wins: a newer message replaces the current one. With
   * `timeout` (ms) the surface auto-clears it after that delay; without, it
   * stays until replaced or {@link clearMessage}-ed. Reachable from layers /
   * behaviours / layouts too, via `ctx.showMessage`.
   */
  showMessage(text, timeout) {
    this._currentMessage = text;
    this.events.emit("canvas:message:show", { text, timeout });
  }
  /** Clear the current canvas message (emits `message` with `text: null`). */
  clearMessage() {
    this._currentMessage = null;
    this.events.emit("canvas:message:show", { text: null });
  }
  /**
   * The message currently on the channel, or `null` when idle. Stored so a
   * status surface that subscribes *after* a message was pushed (e.g. a footer
   * `CanvasMessageBar` mounting once the engine is ready) can show the current
   * line instead of missing the one-shot `message` event. Note: a `timeout`ed
   * message is auto-cleared by the displaying surface, not the engine, so this
   * keeps reporting it until replaced or {@link clearMessage}-ed.
   */
  get currentMessage() {
    return this._currentMessage;
  }
  // ─── Export ────────────────────────────────────────────────────────────────
  /**
   * Export the canvas as a raster image `Blob` (PNG / JPEG / WebP).
   *
   * Renders a region of the world container off-screen via the renderer's
   * `extract` system — `area: 'viewport'` (default) captures what's currently
   * visible at the on-screen zoom; `area: 'content'` captures the whole diagram
   * at native scale. Screen overlays (minimap, dev-info) are excluded; the
   * background is reproduced from the `background` option. See
   * {@link ExportImageOptions}.
   *
   * Rejects if called before {@link init} / in headless mode (no GPU renderer),
   * or when the capture region is empty. SVG export is a separate API (Phase 2).
   *
   * With `format: 'svg'` this returns a vector `image/svg+xml` blob via
   * {@link exportSVG} instead of a raster extract (see {@link exportSVGString}
   * for coverage notes).
   *
   * @example
   * const blob = await canvas.export({ format: 'png', area: 'content' });
   * const url = URL.createObjectURL(blob);
   */
  export(opts = {}) {
    if (opts.format === "svg") {
      const svg = this.exportSVGString(opts);
      return Promise.resolve(new Blob([svg], { type: "image/svg+xml" }));
    }
    return exportImage(this, opts);
  }
  /**
   * Export the canvas as a **true vector SVG** string — a second projection of
   * the scene (shape specs + routed connector paths) into scalable markup,
   * independent of the GPU raster path. Resolution-independent and faithful for
   * geometric shapes, connectors, solid fills/strokes, composite cards, and
   * text labels.
   *
   * Not represented (use raster {@link export} when these matter): `image` /
   * `glyph` / `svg` fills, decorations other than labels, effects, and blur /
   * shadow filters — see `export/svgExport.ts`. Throws when the capture region
   * is empty. Unlike raster export this works headless (no GPU renderer needed).
   */
  exportSVGString(opts = {}) {
    return exportSVG(this, opts);
  }
  /**
   * Export the canvas as a `data:` URL — the synchronous counterpart to
   * {@link export}, handy for `<img src>` / quick previews. Prefer {@link export}
   * for downloads (a `Blob` URL avoids a large base64 string). Same options and
   * throw conditions as {@link export}.
   */
  exportDataURL(opts = {}) {
    return exportImageDataURL(this, opts);
  }
  /**
   * Serialise the canvas's **full render state** to a plain JSON object — view
   * definition (scene / layers / behaviours / layouts / templates / theme +
   * styling), live interaction (selection / hover / camera / focus), and every
   * data-owning layer's records (nodes / edges with positions). The result is a
   * pure POJO safe to `JSON.stringify` / persist / diff.
   *
   * The state counterpart to {@link export} (which produces an *image*). Restore
   * with {@link importState}. Delegates to {@link exportCanvasState}.
   *
   * @example
   * const snapshot = canvas.exportState();
   * await fetch('/scene', { method: 'PUT', body: JSON.stringify(snapshot) });
   */
  exportState() {
    return exportCanvasState(this);
  }
  /**
   * Restore the canvas from a {@link CanvasStateSnapshot} produced by
   * {@link exportState}. Loads each layer's data, pushes the definition to the
   * registered instances, and restores the live interaction (unless
   * `skipInteraction`). The canvas's layers/behaviours/layouts must already be
   * registered under the snapshot's ids — import addresses instances by id, it
   * does not create them. Delegates to {@link importCanvasState}.
   */
  importState(snapshot, opts = {}) {
    importCanvasState(this, snapshot, opts);
  }
  /**
   * The current full canvas state as a JSON string (pretty-printed by default).
   * Sugar over `JSON.stringify(this.exportState(), null, space)`; delegates to
   * {@link canvasStateToJSON}.
   */
  stateToJSON(space = 2) {
    return canvasStateToJSON(this, space);
  }
  /**
   * Serialise the full canvas state and trigger a browser download of the
   * `.json` file. No-op outside a DOM environment. Delegates to
   * {@link downloadCanvasState}.
   */
  downloadState(filename = "canvas-state.json") {
    downloadCanvasState(this, filename);
  }
  /**
   * Restore the canvas from a {@link CanvasStateSnapshot}, a JSON string, or a
   * picked `File` / `Blob` (e.g. from an `<input type="file">`). Parses the
   * source then applies it like {@link importState}. Delegates to
   * {@link importCanvasStateFromFile}.
   */
  importStateFrom(source, opts) {
    return importCanvasStateFromFile(this, source, opts);
  }
  // ─── Lifecycle ───────────────────────────────────────────────────────────
  /**
   * Tear down everything: ticker callback, registries (which unmount their
   * Layers / destroy their Behaviours and any ScreenLayer roots they own),
   * the world subtree, bus subscriptions, pixi Application. Idempotent.
   */
  destroy() {
    if (!this._isInitialised) return;
    this._interactions.dispose();
    this._clearAutoFitGrace();
    this._stopFrameLoop();
    this._clearAutoFitGrace();
    if (this._entrance?.grace !== void 0) {
      clearTimeout(this._entrance.grace);
      this._entrance.grace = void 0;
    }
    this._entrance = null;
    this.layers?.clear();
    this.behaviours?.clear();
    this.layouts?.clear();
    this.camera?.dispose();
    this.history.clear();
    this.events.clearTaps();
    this.events.removeAllListeners();
    this._renderer?.destroy();
    this._renderer = void 0;
    this._isInitialised = false;
  }
  // ─── Internals ───────────────────────────────────────────────────────────
  /**
   * Start the engine's frame loop — **the only `requestAnimationFrame` in the
   * system** (G3).
   *
   * Each frame advances engine state first (`tickOnce`: camera easing, data
   * flush, culling, layer updates) and *then* asks the backend to present
   * (`renderer.tick`). That order is the point: a renderer scheduling its own
   * frames would present state from the previous tick, and two clocks make
   * frame order — and any timing bug — impossible to reason about.
   *
   * No-op where `requestAnimationFrame` doesn't exist (node tests); those drive
   * `tickOnce` by hand, which is exactly what one clock buys.
   */
  _startFrameLoop() {
    if (typeof requestAnimationFrame !== "function") return;
    let last = typeof performance !== "undefined" ? performance.now() : Date.now();
    const frame = (now) => {
      this._rafHandle = requestAnimationFrame(frame);
      const dt = now - last;
      last = now;
      this.tickOnce(dt);
      this._renderer?.tick(dt);
    };
    this._rafHandle = requestAnimationFrame(frame);
  }
  _stopFrameLoop() {
    if (this._rafHandle !== null && typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(this._rafHandle);
    }
    this._rafHandle = null;
  }
  // No _resolveDefaultRenderer() — renderer-pixijs is a required dependency,
  // imported directly at module scope above.
  /**
   * Build the camera and the `CanvasContext` on top of the mounted renderer.
   * No pixi object is constructed here: the scene root came from
   * `renderer.mount`, the camera rides a renderer-supplied binding, and every
   * surface / overlay is a renderer factory call.
   */
  _wireScene(screenWidth, screenHeight) {
    const renderer = this._renderer;
    this.camera = new Camera({
      binding: renderer.createCameraBinding(),
      screenWidth,
      screenHeight,
      bus: this.events,
      store: this.store
    });
    renderer.attachCamera(this.camera);
    this.camera.setPosition(screenWidth / 2, screenHeight / 2);
    this.context = {
      events: this.events,
      store: this.store,
      theme: this.themeState,
      camera: this.camera,
      gestures: this.gestures,
      layers: this.layers,
      behaviours: this.behaviours,
      commands: this.commands,
      log: this.log,
      ...renderer.canvasElement ? { canvasElement: renderer.canvasElement } : {},
      // The reactive-store factory behind `Layer.state` — injected here because
      // `@invana/canvas-core` is dependency-free and cannot construct one. A
      // collaborative canvas swaps this for a Yjs-backed factory.
      createStateStore: (initial) => createReactiveStore(initial),
      createSurface: (space, id, opts) => {
        const surface = renderer.createSurface(space, id, opts);
        if (space === "world") {
          this._worldSurfaces.add(surface);
          const e = this._entrance;
          if (e && !e.played) surface.setAlpha(e.tween ? e.tween.value : 0);
          const destroy = surface.destroy.bind(surface);
          surface.destroy = () => {
            this._worldSurfaces.delete(surface);
            destroy();
          };
        }
        return surface;
      },
      createOverlay: (label, space) => renderer.createOverlay(label, space),
      showMessage: (text, timeout) => this.showMessage(text, timeout),
      clearMessage: () => this.clearMessage(),
      runActiveLayout: (run) => this.runActiveLayout(run),
      whenSettled: (opts) => this._whenSettled(opts)
    };
  }
};

export { BackgroundLayer, CANVAS_STATE_VERSION, Canvas, DEFAULT_SHORTCUTS, DevInfoLayer, DragPanBehaviour, DragShapeBehaviour, ElementScaleLODBehaviour, FrameMeter, InteractionTracker, KeyboardCameraInputBehaviour, KeyboardShortcutsBehaviour, LayersPanelLayer, PinchZoomBehaviour, ScreenLayer, WheelZoomBehaviour, WorldLayer, assertSerialisableInDev, canvasStateToJSON, deepMerge, downloadCanvasState, eventShortcut, exportCanvasState, exportImage, exportImageDataURL, exportSVG, findSerialisationViolations, importCanvasState, importCanvasStateFromFile, isMacPlatform, isViewLocked, jsonSafe, normalizeShortcut, resolveNumberOrGetter, setViewLocked };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map