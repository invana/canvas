import { EventMap, FramePhaseTimings, InteractionKind, FrameTick, FrameStats, CanvasView, CameraTransform, CameraIntent, CanvasTelemetryConfig, CanvasStore, HistoryView, Playbook, CanvasEventBus } from '@invana/canvas-store';
export { CameraIntent, CanvasEvent, CanvasEventBus, CanvasGlobalEvents, CanvasTelemetryConfig, CanvasThemeState, CanvasView, ColumnArray, ColumnSchema, ColumnStore, ColumnStoreOptions, ColumnType, ColumnValue, ConnectorHitRecord, ControlChoiceItemSpec, ControlChoiceOption, ControlCommandItemSpec, ControlDividerItemSpec, ControlItemSpec, ControlPanelAnchor, ControlPanelInsets, ControlPanelPlacement, ControlPanelPosition, ControlPanelSpec, ControlSlotItemSpec, ControlTextItemSpec, ControlToggleItemSpec, ControlWidgetItemSpec, DataLogPart, DataOpAdapter, DataSource, DeepPartial, Delta, DeltaOptions, DeltaRecord, DirtyBatcher, DirtySnapshot, ElementEventMap, EventEmitter, EventMap, EventSource, EventSourceKind, FlushMode, HistoryView, HitGeometrySource, HitPolyline, HttpMeterOptions, HttpMetricRecord, INHERIT, Inherit, KindDelta, LayerFlush, Listener, LogEntry, LogEntryFilter, LogEntryStatus, LogGroupMeta, LogPart, LogStepInfo, Meter, NodeDelta, OperationLog, OperationLogOptions, PickingCamera, PickingIndex, PickingIndexOptions, Playbook, PlaybookSpec, PlaybookStepError, ReactiveStore, Recipe, ResolvedTheme, RowOf, Selected, ShapeHitRecord, SourceEmitter, SpecFlush, SpecStore, StepSpec, StoreChange, Tap, TapOptions, ThemeKind, ThemeMode, ThemeState, Themed, Update, ViewLogPart, ViewPatchMode, connectorHitBoxes, createConsoleMeter, createHttpMeter, createMemoryStore, createOperationLog, createReactiveStore, defaultEqual, historyView, isInherit, resolveThemed, select, shallowEqual } from '@invana/canvas-store';
export * from '@invana/canvas-core/specs';
import { Layer, ISurface, LayerOptions, SurfaceOptions, CanvasContext, Themed, Behaviour, BehaviourOptions, IElementRenderer, ControlPanelSpec, EasingName, RenderPreference, IRenderer, Camera, GestureArbiter, LayerRegistry, BehaviourRegistry, LayoutRegistry, CommandRegistry, LayoutRunOptions } from '@invana/canvas-core';
export { BadgeOptions, BadgePlacement, Behaviour, BehaviourOptions, BehaviourRegistry, BehaviourRegistryOptions, Camera, CameraChangeKind, CameraInputConfig, CameraInputModifier, CameraOptions, CameraTransform, CameraTransformValue, CanvasCommand, CanvasContext, CommandArgKind, CommandArgSpec, CommandArgsOf, CommandMap, CommandName, CommandOption, CommandRegistry, CommandRegistryOptions, ConnectorBadgePlacement, CustomElementCtor, DEFAULT_ENDPOINT_BADGE_GAP_PX, DEFAULT_POSITION_TRANSITION_MS, DefaultGestureArbiter, EASING_NAMES, Easing, EasingName, GestureArbiter, GestureClaimOptions, HeadlessCameraBinding, HeadlessElementRenderer, HeadlessRenderer, HeadlessSurface, IBehaviour, ICameraBinding, IElementRenderer, ILayer, IOverlayDevice, IRenderer, ISurface, ISurfaceHost, LOOP_CURVE_PRESETS, LabelSizePolicy, LabelSizeTarget, Layer, LayerOptions, LayerRegistry, LayerRegistryOptions, Layout, LayoutDataRunOptions, LayoutEndReason, LayoutEvents, LayoutOptions, LayoutRegistry, LayoutRegistryOptions, LayoutRunOptions, LoopCurvePresetName, MountedDecoration, NamedBadgePlacement, OverlayFill, OverlayFillLike, OverlaySpace, OverlayStroke, PinchInputOptions, PositionTransition, PositionTransitionOptions, RenderPreference, RendererCapabilities, RendererMountOptions, ShapeDisplayOverride, SpecProjectionTarget, SpecProjector, SpecProjectorOptions, SurfaceBackdrop, SurfaceOptions, SurfaceSpace, Tween, TweenOptions, WheelInputOptions, animatePositions, bezierPathStyle, boundaryAnchor, bumpHorizontalPathStyle, bumpRadialPathStyle, bundlePathStyle, centerAnchor, connectorToSvg, distanceToPolylineSq, easeInOutCubic, easeInOutSine, easeOutCubic, easeOutQuad, edgePortAnchor, erRouter, linear, loopCurvePathStyle, loopPolylinePathStyle, manhattanRouter, metroRouter, normalPathStyle, oneSideRouter, originToBadgeLocal, orthRouter, pathBounds, pathToSvgD, perpendicularAnchor, quadraticPathStyle, resolveBadgePosition, resolveConnectorBadgePosition, resolveEasing, resolveLabelScale, roundedPathStyle, samplePath, samplePathAt, shapeSpecToSvg, silhouettePortAnchor, smoothPathStyle, stepRadialPathStyle, straightRouter, tangentAt, trimPathEnds } from '@invana/canvas-core';

/**
 * Dev-mode walker that asserts an event payload is serialisable.
 *
 * Architecture: see `architecture-proposal.md` §2.5 (Serialisability discipline).
 *
 * Once the canvas advertises `tap()` as telemetry-ready, payloads must be
 * serialisable: only ids, numbers, strings, plain objects, arrays, and
 * `Map`/`Set` containing the same. PixiJS objects, DOM nodes, function refs,
 * and class instances must NOT appear in payloads — they break:
 *
 *   - JSON-based telemetry sinks (Datadog, log shippers)
 *   - structured-clone-based sinks (BroadcastChannel, postMessage to workers)
 *   - devtools time-travel
 *   - test snapshots
 *
 * The walker is **dev-only**. The exported `assertSerialisable` is
 * unconditionally callable, but `assertSerialisableInDev` is the public
 * entry point that the bus uses — it inlines a build-time NODE_ENV check
 * so production bundlers tree-shake the entire walker out.
 *
 * @example violation log
 *   [canvas] payload at 'node.shape' is not serialisable: BaseShape (class instance)
 */
/**
 * Walk `value`, returning a list of human-readable violation messages.
 * Empty array means "fully serialisable".
 *
 * The walker is iterative-ish: it uses recursion but with explicit cycle
 * detection so a self-referencing payload doesn't blow the stack.
 */
declare function findSerialisationViolations(value: unknown, rootPath?: string): string[];
/**
 * Convenience: assert a payload is serialisable. In dev, logs warnings via
 * `console.warn` for each violation (with offending path). In production,
 * compiles to a no-op via `process.env.NODE_ENV` substitution.
 *
 * Pass a `context` string so the warning includes which event triggered it,
 * e.g. `assertSerialisableInDev(payload, "emit('node:click')")`.
 */
declare function assertSerialisableInDev(value: unknown, context: string): void;

/**
 * `WorldLayer` — abstract base for layers that live in **world coordinate space**.
 *
 * Architecture: see `architecture-proposal.md` §2.1.
 *
 * - Camera-affected: pans / zooms with the camera.
 * - Owns a `world`-space surface, obtained from the renderer at mount.
 * - `hitTest(worldX, worldY)` — input is in world coordinates.
 *
 * Subclasses publish specs (durable content) or draw through
 * `this.surface.overlay(...)` (transient visuals), and override `onMount(ctx)`
 * to wire themselves up. No display object is ever constructed by a layer.
 * For stacked draw-order (e.g. edges below nodes), use separate Layer instances.
 *
 * The type-distinct `hitTest` signature (vs. `ScreenLayer`'s) is what stops
 * consumers passing screen coords to a world layer or vice versa.
 */

interface WorldLayerHit {
    /** Whatever the subclass chooses to return — a node id, a sub-region, etc. */
    readonly id: string;
    readonly subId?: string;
    readonly kind?: string;
}
declare abstract class WorldLayer<TOptions = unknown, TState extends object = object, TEvents extends EventMap = EventMap, TDirtyBucket extends string = string, THit extends WorldLayerHit = WorldLayerHit> extends Layer<TOptions, TState, TEvents, TDirtyBucket> {
    /** Backing field — assigned in `mount`, cleared in `unmount`. */
    protected _surface?: ISurface;
    protected get surface(): ISurface;
    constructor(opts: LayerOptions<TOptions>);
    /**
     * Per-layer options for the drawing device this layer's surface builds.
     * Override when the layer owns policy the renderer can't know — a graph layer
     * with pinpoint nodes wants a larger hit floor than one of big cards.
     * Read once, at mount.
     */
    protected surfaceOptions(): SurfaceOptions | undefined;
    mount(ctx: CanvasContext): void;
    /** Keep the surface in sync when `layer.visible` is toggled. */
    protected onVisibleChange(value: boolean): void;
    unmount(): void;
    /**
     * Update this layer's z-order relative to its peers. Keeps the iteration
     * field (`this.zIndex`, used by `LayerRegistry.byZOrder()`) and the surface's
     * paint order in sync, and flips `surfaces.world` into sorted mode
     * so the change renders.
     */
    setZIndex(z: number): void;
    /**
     * Return the world-space AABB of everything currently rendered on this layer.
     * Delegates to Pixi's `getLocalBounds()` — a one-shot scene-graph traversal.
     * Suitable for "fit to content" calls; do not call every frame.
     */
    getBounds(): {
        x: number;
        y: number;
        width: number;
        height: number;
    } | null;
    /**
     * Hit-test in world coordinates. Returns the topmost hit or `null`.
     * Concrete layers implement this against their own data + spatial index.
     *
     * The `Canvas`-level hit-test orchestration (top-down by z-order, stop on
     * first hit, screen-layers-before-world per proposal Q6) calls this.
     */
    abstract hitTest(worldX: number, worldY: number): THit | null;
}

/**
 * `ScreenLayer` — abstract base for layers that live in **screen / viewport coordinate space**.
 *
 * Architecture: see `architecture-proposal.md` §2.1.
 *
 * - Viewport-fixed: NOT camera-affected. Pans / zooms do not transform it.
 * - Owns a `screen`-space surface, obtained from the renderer at mount.
 *   Plain `Container` (not a RenderGroup) — screen-space content is typically
 *   lightweight HUD-style rendering that doesn't need its own GPU batch boundary.
 * - `hitTest(screenX, screenY)` — input is in screen pixels.
 *
 * Examples: `MiniMapLayer`, `DevInfoLayer`, HUD, tool palettes.
 *
 * The type-distinct `hitTest` signature (vs. `WorldLayer`'s) is what stops
 * consumers passing world coords to a screen layer or vice versa.
 */

interface ScreenLayerHit {
    readonly id: string;
    readonly subId?: string;
    readonly kind?: string;
}
declare abstract class ScreenLayer<TOptions = unknown, TState extends object = object, TEvents extends EventMap = EventMap, TDirtyBucket extends string = string, THit extends ScreenLayerHit = ScreenLayerHit> extends Layer<TOptions, TState, TEvents, TDirtyBucket> {
    /** Backing field — built on first {@link surface} access, cleared in `unmount`. */
    protected _surface?: ISurface;
    /** Kept from `mount` so the surface can be built lazily on first access. */
    private _surfaceCtx?;
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
    protected get surface(): ISurface;
    constructor(opts: LayerOptions<TOptions>);
    /**
     * Per-layer options for the drawing device this layer's surface builds.
     * Override when the layer owns policy the renderer can't know — a graph layer
     * with pinpoint nodes wants a larger hit floor than one of big cards.
     * Read once, at mount.
     */
    protected surfaceOptions(): SurfaceOptions | undefined;
    mount(ctx: CanvasContext): void;
    /** Keep the surface in sync when `layer.visible` is toggled. */
    protected onVisibleChange(value: boolean): void;
    unmount(): void;
    /**
     * Update this layer's z-order relative to its peers. Keeps the iteration
     * field (`this.zIndex`) and the surface's paint order in sync, and
     * flips `ctx.stage` into sorted mode so the change renders.
     */
    setZIndex(z: number): void;
    /** Hit-test in screen / viewport coordinates. Top-most hit or `null`. */
    abstract hitTest(screenX: number, screenY: number): THit | null;
}

/**
 * `DevInfoLayer` — developer overlay that continuously displays:
 *   - Canvas display size
 *   - Camera position (x, y) and zoom scale
 *   - Visible world bounds
 *   - Pointer position (screen and world coords)
 *   - Frame rate (FPS)
 *
 * Implemented as a `ScreenLayer` whose visible artifact is a plain
 * absolutely-positioned HTML `<div>` layered above the canvas (so it never
 * interferes with pointer events on the scene). The pixi `container` from
 * `ScreenLayer` is unused — overlay rendering is pure DOM.
 *
 * Headless / offscreen mode: when `ctx.canvasElement` is undefined (i.e.
 * `Canvas.initWithStage`), the layer mounts cleanly but renders nothing.
 *
 * @example
 * ```ts
 * import { DevInfoLayer } from '@invana/canvas/toolkit';
 *
 * const devInfo = new DevInfoLayer({ corner: 'top-right' });
 * canvas.layers.add(devInfo);
 *
 * // Toggle at runtime
 * devInfo.setEnabled(false);
 * ```
 */

type DevInfoCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
interface DevInfoLayerOptions {
    /** Which corner to anchor the overlay. Default: 'bottom-left' */
    corner?: DevInfoCorner;
    /**
     * Inset from the chosen `corner`, in screen pixels. A single number applies to
     * both axes; `{ x, y }` sets them independently (e.g. bump `y` to clear a top
     * header bar). Default: 10.
     */
    margin?: number | {
        x?: number;
        y?: number;
    };
    /** Show the overlay. Can be toggled at runtime via setEnabled(). Default: true */
    enabled?: boolean;
    /** Font size in px. Default: 11 */
    fontSize?: number;
    /** Panel opacity 0–1. Default: 0.92 */
    opacity?: number;
    /** Overlay background CSS color. Default: 'rgba(10,10,10,0.82)' */
    backgroundColor?: string;
    /** Text color. Default: '#c8d3e0' */
    textColor?: string;
    /** Accent / header color. Default: '#4fc3f7' */
    accentColor?: string;
}
interface DevInfoLayerCtorOptions extends DevInfoLayerOptions {
    /** Layer id. Default: 'dev-info'. */
    id?: string;
    /** Pixi z-index inside the screen stage. Default: 9999 (top). */
    zIndex?: number;
}
interface DevInfoState {
    enabled: boolean;
}
declare class DevInfoLayer extends ScreenLayer<DevInfoLayerOptions, DevInfoState> {
    readonly kind = "dev-info-layer";
    private _opts;
    private _overlay;
    private _pointerScreen;
    private _pointerWorld;
    private _onPointerMove;
    private _unsubs;
    private _rafId;
    private _fps;
    private _frameCount;
    private _lastFpsTimestamp;
    private _tick;
    constructor(opts?: DevInfoLayerCtorOptions);
    protected createState(): DevInfoState;
    /** Overlay is DOM with `pointer-events:none` — never participates in hit-testing. */
    hitTest(_screenX: number, _screenY: number): ScreenLayerHit | null;
    protected onMount(): void;
    protected onUnmount(): void;
    /** Show or hide the overlay at runtime without removing the layer. */
    setEnabled(enabled: boolean): void;
    enable(): void;
    disable(): void;
    /** Update display options (corner, colors, font size, …) at runtime. */
    setOptions(partial: Partial<DevInfoLayerOptions>): void;
    private _mountOverlay;
    private _unmountOverlay;
    private _applyStyles;
    private _startFpsTicker;
    private _stopFpsTicker;
    private _update;
}

/**
 * `BackgroundLayer` — solid colour or tiled pattern fill behind the world.
 *
 * Architecture: see `architecture-proposal.md` §2.1.
 *
 * Implemented as a `ScreenLayer` for two practical reasons:
 *
 * 1. The pattern needs to cover the *viewport*, not the world bounds. A
 *    WorldLayer would require sizing an infinite rectangle.
 * 2. `TilingSprite` lets us mimic camera-following cheaply by adjusting
 *    `tileScale` + `tilePosition` on each pan/zoom — no per-frame geometry
 *    rebuild needed.
 *
 * When `followCamera` is `true` (default), the pattern shifts and scales with
 * the camera so the background feels like part of the world ("graph paper").
 * When `false`, the pattern is fixed to the screen.
 *
 * @example
 * ```ts
 * canvas.layers.add(new BackgroundLayer({
 *   id: 'bg',
 *   options: { type: 'pattern', patternType: 'dots', backgroundColor: 0x0f172a },
 * }));
 * ```
 */

/** Top-level background style. `'solid'` skips the pattern texture entirely. */
type BackgroundType = 'solid' | 'pattern';
/** Pattern texture kind. */
type BackgroundPatternType = 'dots' | 'grid' | 'lines';
/**
 * Mode selector for light/dark colour resolution. `'auto'` follows the active
 * theme published on `ctx.theme` (the canvas no longer reads
 * `prefers-color-scheme` itself — the domain `ThemeBehaviour` is the sole
 * publisher); `'light'` / `'dark'` pin explicitly regardless of the theme.
 */
type BackgroundMode = 'auto' | 'light' | 'dark';
/** The concrete kind currently being rendered after mode resolution. */
type BackgroundKind = 'light' | 'dark';
/**
 * A colour input. Pass a `number` / CSS string to **pin** a colour, `'inherit'`
 * to follow the active theme's palette role, or a `{ light, dark }` pair to
 * swap on the layer's `mode` — each half of which may itself be `'inherit'`.
 *
 * `'inherit'` is the default for both colour options, and it is what makes the
 * background themeable *and* overridable: an author-set colour wins over the
 * theme and keeps winning across every theme switch, while an untouched one
 * tracks the palette. See {@link INHERIT}.
 *
 * @example
 * ```ts
 * backgroundColor: 'inherit'                      // follows `surfaceRole`
 * backgroundColor: '#0f172a'                      // pinned; the theme never touches it
 * backgroundColor: { light: 'inherit', dark: '#000' }  // themed in light, pinned in dark
 * ```
 */
type BackgroundColor = Themed<number | string> | {
    light: Themed<number | string>;
    dark: Themed<number | string>;
};
/** Construction-time options for `BackgroundLayer`. */
interface BackgroundLayerOptions {
    /** `'solid'` paints a flat fill; `'pattern'` overlays a tiled texture. Default `'solid'`. */
    type?: BackgroundType;
    /** Tile texture kind when `type === 'pattern'`. Default `'dots'`. */
    patternType?: BackgroundPatternType;
    /**
     * Pattern foreground colour (dot / line / grid colour). Accepts `0xRRGGBB`,
     * a CSS string, `'inherit'`, or a `{ light, dark }` pair resolved against
     * `mode`. Default `'inherit'` — follows {@link patternRole}.
     */
    color?: BackgroundColor;
    /**
     * Solid-fill colour painted behind the pattern. Same accepted forms as
     * {@link color}. Default `'inherit'` — follows {@link surfaceRole}.
     */
    backgroundColor?: BackgroundColor;
    /** Dot radius / line thickness, in *texture pixels*. Default `1`. */
    size?: number;
    /** Tile cell spacing, in *texture pixels*. Default `12`. */
    spacing?: number;
    /** Pattern alpha 0–1. Default `0.6`. */
    alpha?: number;
    /**
     * `true` (default): pattern shifts + scales with the camera. `false`: pattern
     * stays fixed to the screen regardless of camera state.
     */
    followCamera?: boolean;
    /**
     * Hide the tiled pattern once the camera scale drops below this value — zoomed
     * far out the tiles collapse into visual noise, so the backdrop reads better
     * on its own. Set `0` to disable the cutoff and always show the pattern.
     *
     * Only affects `type: 'pattern'`; the solid backdrop always paints. Applies to
     * *any* camera change (wheel / pinch / keyboard / programmatic), since it's
     * evaluated from the cached camera scale rather than in a zoom behaviour.
     *
     * Default `0.5` (hidden below 50% zoom).
     */
    hidePatternBelowZoom?: number;
    /**
     * Which half of a `{ light, dark }` colour pair is used, and which built-in
     * fallback paints before any theme is published. `'auto'` (default) follows
     * the active theme on `ctx.theme`; `'light'` / `'dark'` pin explicitly.
     *
     * It does **not** select a palette variant: the published `ResolvedTheme`
     * carries one kind's palette, so an `'inherit'` colour always resolves to the
     * theme's own kind regardless of this setting. Has no effect on plain
     * scalars.
     */
    mode?: BackgroundMode;
    /**
     * Palette role the solid backdrop reads when {@link backgroundColor} is
     * `'inherit'` (the default). Default `'surface'`.
     *
     * The role is only consulted for an `'inherit'` value — a pinned colour is
     * never overridden, and no role name can reach past it.
     */
    surfaceRole?: string;
    /**
     * Palette role the pattern (dots / grid / lines) reads when {@link color} is
     * `'inherit'` (the default), falling back to `'stroke'` when the role is
     * absent from the palette. Default `'divider'`.
     */
    patternRole?: string;
}
interface BackgroundLayerState {
    readonly _placeholder?: never;
}
declare class BackgroundLayer extends ScreenLayer<BackgroundLayerOptions, BackgroundLayerState, Record<string, never>, never, ScreenLayerHit> {
    readonly kind = "background-layer";
    private opts;
    /**
     * The rasterised pattern tile, kept so a camera-following repaint reuses it —
     * the surface caches its texture on this object's identity.
     */
    private patternTile;
    /** DPR baked into the current pattern texture — used to compensate `tileScale`. */
    private textureDpr;
    private resizeObserver;
    private offCameraPan;
    private offCameraZoom;
    private offTheme;
    private camX;
    private camY;
    private camScale;
    constructor(opts: LayerOptions<BackgroundLayerOptions>);
    protected createState(): BackgroundLayerState;
    protected onMount(ctx: CanvasContext): void;
    protected onUnmount(): void;
    /**
     * Hit tests on the background always miss — clicks fall through to the
     * world layer beneath, which is what users expect for a bg.
     */
    hitTest(): ScreenLayerHit | null;
    /** Merge-update options + re-render. */
    setOptions(changes: Partial<BackgroundLayerOptions>): void;
    /** Snapshot of the resolved options. */
    getOptions(): Required<BackgroundLayerOptions>;
    /**
     * Set the colour-resolution mode. `'auto'` re-arms the system listener;
     * `'light'` / `'dark'` pin explicitly. No-op when mode is unchanged.
     */
    setMode(mode: BackgroundMode): void;
    /** Current mode setting. */
    getMode(): BackgroundMode;
    /**
     * Concrete kind currently being rendered. A pinned `mode` wins; otherwise
     * `'auto'` follows the active theme on `ctx.theme` (defaulting to `'light'`
     * when no theme has been published yet).
     */
    getResolvedKind(): BackgroundKind;
    /**
     * The resolved (mode-applied) solid colour currently painted behind the
     * pattern. Layers that want to match the canvas backdrop read this instead of
     * re-implementing `{ light, dark }` resolution — e.g. {@link MiniMapLayer}
     * pointed here via its `backgroundLayerId` mirrors the canvas background so
     * its chrome never drifts from the real one. Returns a `number` or CSS string
     * (whichever form the option carried), suitable for any pixi fill.
     */
    getResolvedBackgroundColor(): number | string;
    private viewportSize;
    private render;
    /**
     * Push the current backdrop to the surface. Cheap enough to call on every
     * camera move: the tile image is reused unless {@link render} dropped it, and
     * the surface rebuilds its texture only when that identity changes.
     */
    private paint;
    /**
     * Scale, offset and visibility for the pattern tile.
     *
     * Low-zoom cutoff: below the threshold the tiles are too dense to read, so we
     * hide the pattern and leave the solid backdrop. Evaluated here (rather than
     * in a zoom behaviour) so every camera source — wheel, pinch, keyboard,
     * programmatic — goes through the same check.
     */
    private tileTransform;
    private createPatternTile;
    /** The solid backdrop colour as painted — {@link INHERIT} resolved, pins honoured. */
    private resolvedBackgroundColor;
    /**
     * The pattern colour as painted. Falls back to the `'stroke'` role when the
     * configured {@link BackgroundLayerOptions.patternRole} is absent from the
     * palette — a theme may carry one without the other.
     */
    private resolvedPatternColor;
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
    private resolveColor;
}

/**
 * `LayersPanelLayer` — developer overlay that lists every layer currently
 * mounted on the canvas and exposes a checkbox per row to toggle that
 * layer's `visible` flag.
 *
 * Implemented as a `ScreenLayer` whose visible artifact is a plain
 * absolutely-positioned HTML `<div>` layered above the canvas — same pattern
 * as `DevInfoLayer`. Unlike `DevInfoLayer`, the overlay receives pointer
 * events (so the checkboxes are clickable); the layer itself still opts out
 * of engine hit-testing via `hittable: false`.
 *
 * The panel re-renders on `'scene:layer:add'` / `'scene:layer:remove'`. The panel's
 * own row is filtered out so the user can't hide it via itself.
 *
 * Headless / offscreen mode: when `ctx.canvasElement` is undefined (i.e.
 * `Canvas.initWithStage`), the layer mounts cleanly but renders nothing.
 *
 * @example
 * ```ts
 * import { LayersPanelLayer } from '@invana/canvas';
 *
 * const panel = new LayersPanelLayer({ corner: 'top-right' });
 * canvas.layers.add(panel);
 *
 * // Toggle the panel itself at runtime
 * panel.setEnabled(false);
 * ```
 */

type LayersPanelCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
interface LayersPanelLayerOptions {
    /** Which corner to anchor the overlay. Default: 'top-right' */
    corner?: LayersPanelCorner;
    /** Show the overlay. Toggle at runtime via setEnabled(). Default: true */
    enabled?: boolean;
    /** Font size in px. Default: 11 */
    fontSize?: number;
    /** Panel opacity 0–1. Default: 0.92 */
    opacity?: number;
    /** Overlay background CSS color. Default: 'rgba(10,10,10,0.82)' */
    backgroundColor?: string;
    /** Text color. Default: '#c8d3e0' */
    textColor?: string;
    /** Accent / header color. Default: '#4fc3f7' */
    accentColor?: string;
    /**
     * Layer ids to hide from the list. The panel's own id is always hidden
     * regardless of this option.
     */
    hideIds?: readonly string[];
}
interface LayersPanelLayerCtorOptions extends LayersPanelLayerOptions {
    /** Layer id. Default: 'layers-panel'. */
    id?: string;
    /** Pixi z-index inside the screen stage. Default: 9998 (just below DevInfoLayer). */
    zIndex?: number;
}
interface LayersPanelState {
    enabled: boolean;
}
declare class LayersPanelLayer extends ScreenLayer<LayersPanelLayerOptions, LayersPanelState> {
    private _opts;
    private _overlay;
    private _onChange;
    private _unsubs;
    constructor(opts?: LayersPanelLayerCtorOptions);
    protected createState(): LayersPanelState;
    /** Overlay is DOM — never participates in the engine's hit-testing. */
    hitTest(_screenX: number, _screenY: number): ScreenLayerHit | null;
    protected onMount(): void;
    protected onUnmount(): void;
    /** Show or hide the panel at runtime without removing the layer. */
    setEnabled(enabled: boolean): void;
    enable(): void;
    disable(): void;
    /** Update display options (corner, colors, font size, …) at runtime. */
    setOptions(partial: Partial<LayersPanelLayerOptions>): void;
    /**
     * Force a re-render of the panel. Call this if external code mutates
     * `layer.visible` on a registered layer and you want the checkboxes to
     * reflect the new state. (The engine does not emit an event for visibility
     * mutations.)
     */
    refresh(): void;
    private _mountOverlay;
    private _unmountOverlay;
    private _applyStyles;
    private _render;
}

/**
 * `DragPanBehaviour` — pointer-drag panning via the pixi-viewport `drag` plugin.
 *
 * An optional `modifier` key restricts the gesture so you can reserve plain
 * drag for other behaviours (e.g. lasso, rubber-band select):
 *
 *   - `'none'`  (default) — any left-button drag pans.
 *   - `'space'`            — Space + drag (Figma / Sketch style).
 *   - `'shift'`            — Shift + drag.
 *   - `'alt'`              — Alt/Option + drag.
 *
 * A decelerate plugin is added alongside by default, giving momentum after
 * the pointer lifts. Disable with `decelerate: false`.
 *
 * **Yielding.** Panning is the lowest-priority pointer gesture: while another
 * behaviour owns the gesture (`ctx.gestures.owner` — a node drag, a lasso, a
 * brush, a resize, an edge draw), this behaviour suspends its own pan and
 * restores it on release. Before P5 the inverse held — each of those behaviours
 * reached into `camera.viewport.plugins` to pause `'drag'` — which scattered a
 * `pixi-viewport` internal across six domain behaviours and left the camera
 * resumed by whichever gesture finished first.
 *
 * The pan itself is installed through `camera.configureInput({ drag })` rather
 * than the viewport plugin registry, so the `pixi-viewport` vocabulary stays
 * inside `Camera` and this behaviour survives the P6 renderer extraction
 * unchanged (`docs/renderer-split-design.md` §9, P5).
 *
 * The canvas cursor swaps to `dragCursor` (`'grabbing'` by default) the moment
 * a qualifying pointer is pressed — so it reads as "holding the canvas, ready
 * to drag" before any movement happens — and restores on release. The press is
 * matched against the configured `mouseButtons` and `modifier`; the `space`
 * modifier can't be read off a pointer event, so for that mode the swap falls
 * back to pixi-viewport's `drag-start` (fires once the gesture actually moves).
 * The idle cursor is left untouched, so this never fights the renderer's hover
 * cursor.
 */

type DragModifier = 'none' | 'space' | 'shift' | 'alt';
interface DragPanBehaviourOptions extends BehaviourOptions {
    /** Which modifier key must be held during drag. Default `'none'`. */
    modifier?: DragModifier;
    /** Allowed mouse buttons. Default `'left'`. Forwarded to the camera. */
    mouseButtons?: 'all' | 'left' | 'right' | 'middle';
    /** Add momentum deceleration after pointer lift. Default `true`. */
    decelerate?: boolean;
    /**
     * Cursor applied to the canvas while the pan pointer is held. Set on
     * pointer-press (matching `mouseButtons` / `modifier`), restored to the
     * previous value on release. Default `'grabbing'`.
     */
    dragCursor?: string;
}
declare class DragPanBehaviour extends Behaviour<DragPanBehaviourOptions> {
    readonly kind = "drag-pan";
    private get modifier();
    private get mouseButtons();
    private get withDecelerate();
    private get dragCursor();
    /** Canvas the cursor swap targets; `null` on headless / custom stages. */
    private canvasEl;
    /** Cursor saved when the pan pointer is pressed, restored on release. */
    private prevCursor;
    /** Unsubscribe from the gesture arbiter; set while enabled. */
    private offGestures?;
    /** Unsubscribe from the camera's `drag-start`; set while enabled. */
    private offDragStart?;
    /** Whether the pan plugin is currently suspended for another gesture owner. */
    private yielding;
    constructor(opts: DragPanBehaviourOptions);
    protected onRegister(ctx: CanvasContext): void;
    /** Re-arm the camera's drag input with the merged options. */
    protected onOptionsChanged(): void;
    protected onEnable(): void;
    protected onDisable(): void;
    /**
     * Suspend / restore panning to match gesture ownership. Momentum is left
     * running so an in-flight glide finishes as it always has — see
     * `Camera.setDragSuspended`.
     */
    private readonly applyYield;
    private readonly onPointerDown;
    /** Swap to the drag cursor, saving the prior value. No-op if already armed. */
    private readonly armCursor;
    /** Restore the saved cursor and detach the release listeners. */
    private readonly restoreCursor;
    /** Does this pointer button match the configured `mouseButtons`? */
    private buttonAllowed;
    /**
     * Is the configured modifier satisfied for this press? `shift` / `alt` read
     * off the event; `none` is always true; `space` returns `false` here (not
     * detectable on a pointer event) and is handled by the `drag-start` fallback.
     */
    private modifierHeld;
}

/**
 * `DragShapeBehaviour` — pointer-drag move for individual shapes managed by
 * a `PrimitivesRenderer`. Layer-scoped: constructed with a specific renderer
 * reference; the same canvas can host multiple layers, each with its own
 * drag behaviour.
 *
 * Default `enabled: false` — register, then explicitly enable. Matches the
 * project rule that no behaviour auto-activates.
 *
 * What happens on drag:
 *   1. `shape:pointerdown` from the renderer → drag start. Records the
 *      pointer's world position and the shape's current `(spec.x, spec.y)`.
 *   2. The pointer gesture is claimed (`ctx.gestures`) so the camera stops
 *      panning and no other gesture starts on top of the move. A refused claim
 *      means another behaviour already owns the pointer — the drag doesn't
 *      start.
 *   3. Window-level `pointermove` updates the shape via
 *      `renderer.updateShape(id, { x, y })` so the click point stays under
 *      the cursor. Window events are used (rather than pixi container events)
 *      so the drag continues smoothly even when the pointer slides off the
 *      original shape or off the canvas momentarily.
 *   4. When `reRouteConnectors` is `true` (default), every connector is
 *      re-routed after each move — useful when the moved shape is an
 *      obstacle for an obstacle-aware router. Set `false` if you're moving
 *      a node whose edges should re-route via a smarter graph-level signal
 *      (or if you have thousands of edges and the cost matters).
 *   5. `pointerup` / `pointercancel` → drag end. The gesture claim is released
 *      and camera panning resumes.
 *
 * The behaviour observes the renderer's public surface only: subscribes to
 * `shape:pointerdown`, calls `getShapePosition` / `updateShape` /
 * `reRouteAllConnectors`. No private access.
 */

interface DragShapeBehaviourOptions extends BehaviourOptions {
    /** The renderer whose shapes this behaviour can drag. */
    readonly renderer: IElementRenderer;
    /**
     * Optional predicate to restrict which shape ids are draggable. Returning
     * `false` ignores the pointerdown. Default = every shape is draggable.
     */
    readonly filter?: (id: string) => boolean;
    /**
     * Re-route every connector after each move. Default `true` — needed for
     * obstacle-aware routers (`manhattan` etc.) so they recompute when
     * obstacles move. Set `false` to avoid the per-move re-route cost.
     */
    readonly reRouteConnectors?: boolean;
    /**
     * Optional cursor while dragging. Applied on drag start and cleared on
     * drag end. Default `'grabbing'`.
     */
    readonly dragCursor?: string;
}
declare class DragShapeBehaviour extends Behaviour<DragShapeBehaviourOptions> {
    readonly kind = "drag-shape";
    private get renderer();
    private get filter();
    private get reRouteConnectors();
    private get dragCursor();
    private state;
    private offShapeDown?;
    private canvasEl;
    private prevCursor;
    constructor(opts: DragShapeBehaviourOptions);
    protected onRegister(ctx: CanvasContext): void;
    protected onDestroy(_ctx: CanvasContext): void;
    protected onDisable(): void;
    private startDrag;
    private endDrag;
    private readonly onWindowPointerMove;
    private readonly onWindowPointerUp;
    /** Convert a window-level `(clientX, clientY)` to canvas-relative screen coords. */
    private clientToScreen;
}

/**
 * `WheelZoomBehaviour` — scroll-wheel zooming via the pixi-viewport `wheel` plugin.
 *
 * By default, any scroll wheel event zooms. Set `requireCtrl: true` to
 * restrict to Ctrl+scroll (frees plain scroll for page scrolling — good
 * for accessibility contexts where the canvas is inline on a scrollable page).
 *
 * `trackpadPinch: true` is enabled so two-finger trackpad pinches zoom
 * instead of scroll. Pair with `PinchZoomBehaviour` for touch devices.
 */

interface WheelZoomBehaviourOptions extends BehaviourOptions {
    /**
     * If `true`, only Ctrl+scroll triggers zoom; plain scroll falls through
     * to the browser. Good for inline canvas embeds. Default `false`.
     */
    requireCtrl?: boolean;
    /** Zoom speed per wheel tick, as a fraction. Default `0.1` (10%). */
    percent?: number;
    /**
     * Smooth-scroll frame count. `false` = instant snap. Default `false`.
     * Set to e.g. `8` for an ease-out feel.
     */
    smooth?: false | number;
}
declare class WheelZoomBehaviour extends Behaviour<WheelZoomBehaviourOptions> {
    readonly kind = "wheel-zoom";
    constructor(opts: WheelZoomBehaviourOptions);
    protected onRegister(_ctx: CanvasContext): void;
    protected onEnable(): void;
    protected onDisable(): void;
    /**
     * The camera's wheel input reads its config only at install time, so a live
     * edit means remove-then-reinstall. Re-arm picks up the merged
     * `this._options`. (`setOptions` / `getOptions` come from the base.)
     */
    protected onOptionsChanged(): void;
    /** Include the wheel options (beyond the base `enabled`) in a state snapshot. */
    serializeDefinition(): Record<string, unknown>;
}

/**
 * `PinchZoomBehaviour` — two-finger pinch-to-zoom via the pixi-viewport `pinch` plugin.
 *
 * Designed for touch screens and trackpads. Works alongside
 * `WheelZoomBehaviour` (which handles trackpad pinch-as-scroll separately via
 * its `trackpadPinch` flag); this behaviour handles native touch pinch events.
 *
 * Set `noDrag: true` if you want pinch to only zoom, not also pan (useful
 * when you have a separate `DragPanBehaviour` and don't want conflicts).
 */

interface PinchZoomBehaviourOptions extends BehaviourOptions {
    /**
     * If `true`, suppress the implicit pan that accompanies a pinch gesture.
     * Default `false` — pinch both zooms and centres the viewport on the
     * midpoint between the two fingers.
     */
    noDrag?: boolean;
    /** Zoom speed multiplier. Default `0.1`. */
    percent?: number;
}
declare class PinchZoomBehaviour extends Behaviour<PinchZoomBehaviourOptions> {
    readonly kind = "pinch-zoom";
    private get noDrag();
    private get percent();
    constructor(opts: PinchZoomBehaviourOptions);
    protected onRegister(_ctx: CanvasContext): void;
    protected onEnable(): void;
    protected onDisable(): void;
    /** Re-arm the camera's pinch input with the merged options. */
    protected onOptionsChanged(): void;
}

/**
 * `KeyboardCameraInputBehaviour` — keyboard pan and zoom for accessibility.
 *
 * Default keymap (all configurable via `keymap` option):
 *
 *   Pan up/down/left/right  →  Arrow keys
 *   Zoom in                 →  `+` / `=` / `NumpadAdd`
 *   Zoom out                →  `-` / `NumpadSubtract`
 *   Reset zoom to 1:1       →  `0` / `Numpad0`
 *
 * Events attach to `document` so the canvas does not need to be
 * individually focused. Input fields, textareas, and selects are
 * excluded automatically — keyboard events whose `target` is an editable
 * element fall through unhandled.
 *
 * Arrow key direction follows the "scroll" metaphor: ArrowUp pans the
 * viewport so you see content *above* the current view.
 */

interface KeyboardCameraKeymap {
    panUp: string[];
    panDown: string[];
    panLeft: string[];
    panRight: string[];
    zoomIn: string[];
    zoomOut: string[];
    resetZoom: string[];
}
interface KeyboardCameraInputBehaviourOptions extends BehaviourOptions {
    /** Pan distance per key press in screen pixels. Default `40`. */
    panStep?: number;
    /**
     * Zoom multiplier per key press. `1.1` = 10% in/out per press.
     * Default `1.1`.
     */
    zoomFactor?: number;
    /** Override individual key groups. Merged with the defaults. */
    keymap?: Partial<KeyboardCameraKeymap>;
}
declare class KeyboardCameraInputBehaviour extends Behaviour<KeyboardCameraInputBehaviourOptions> {
    readonly kind = "keyboard-camera";
    private get panStep();
    private get zoomFactor();
    private get keymap();
    private _handler?;
    constructor(opts: KeyboardCameraInputBehaviourOptions);
    protected onRegister(_ctx: CanvasContext): void;
    protected onEnable(): void;
    protected onDisable(): void;
    private _onKeyDown;
    private _match;
}

/**
 * `KeyboardShortcutsBehaviour` — key bindings that run **commands**.
 *
 * Each binding names keys and a command (`{ keys: 'mod+z', command: 'history.undo' }`),
 * so a shortcut does exactly what the matching control-panel button does, and
 * the bindings are plain JSON: they save with the canvas in
 * `definition.behaviours` and edit in the Studio. A binding whose command is
 * missing or disabled is skipped — the key falls through to the browser (so
 * Ctrl+C still copies text when nothing on the canvas is selected).
 *
 * **Keys.** `+`-joined modifiers and one key, case-insensitive, with `,`
 * separating alternatives: `'mod+shift+z, mod+y'`. `mod` is ⌘ on macOS and Ctrl
 * elsewhere; `ctrl`, `alt` (`option`), `shift`, `meta` (`cmd`) are literal.
 * The key is `KeyboardEvent.key` lowercased (`z`, `delete`, `escape`,
 * `arrowup`, `space`, …) — see {@link normalizeShortcut}. Two rules make
 * modified keys match what you'd write:
 *
 * - **Letters and digits are the key pressed.** Under a modifier, when the typed
 *   character isn't a plain letter or digit (macOS ⌥Z types `Ω`, ⇧1 types `!`),
 *   the key comes from `KeyboardEvent.code` (`KeyZ` → `z`, `Digit1` → `1`) — so
 *   `alt+z` and `shift+1` work. A layout that types a letter keeps it (AZERTY's
 *   Ctrl+Z is still `mod+z`, though that key is `KeyW`).
 * - **Punctuation is the glyph typed.** Write the character, not the keys that
 *   produce it: `mod+plus` (not `mod+shift+=`), `?`. The Shift needed to type
 *   it may be held or not — `mod+plus` fires on Ctrl/⌘ + Shift + `=`.
 *
 * **Scope.** With `scope: 'canvas'` (default) a key is handled only when this
 * canvas is the one in use: focus is inside its scope root, or focus is on the
 * page body and the last pointer-down landed inside it. The scope root is the
 * canvas element's closest `[data-canvas-scope]` ancestor (`GraphCanvasApp`
 * marks its shell), else the canvas element's parent — so two canvases on one
 * page never both undo. `'document'` handles every key on the page. Keys typed
 * into inputs, textareas, selects and contenteditable elements are never taken.
 *
 * Opt-in like every behaviour (rule 7): register it and enable it. Nothing is
 * bound by default — pass {@link DEFAULT_SHORTCUTS} for the usual editor keys.
 */

/** One key binding — pure JSON. */
interface KeyboardShortcutBinding {
    /** Keys, e.g. `'mod+z'`; `,` separates alternatives (`'delete, backspace'`). */
    keys: string;
    /** The command to run, by name (`canvas.commands`). */
    command: string;
    /** Args passed to the command. Must be JSON. */
    args?: unknown;
}
interface KeyboardShortcutsBehaviourOptions extends BehaviourOptions {
    /** The bindings, first match wins. Default: none. */
    bindings?: readonly KeyboardShortcutBinding[];
    /** Where keys are heard — `'canvas'` (default) or the whole `'document'`. */
    scope?: 'canvas' | 'document';
}
/**
 * The usual editor keys: undo / redo, cut / copy / paste, delete the selection,
 * and Escape back to the select tool. Every command here is built into
 * `GraphCanvas`; on a plain `Canvas` the missing ones are skipped. Never applied
 * automatically — pass it as `bindings`.
 */
declare const DEFAULT_SHORTCUTS: readonly KeyboardShortcutBinding[];
/** The event fields a shortcut is matched on (a `KeyboardEvent` satisfies it). */
interface ShortcutKeyEvent {
    key: string;
    /**
     * The physical key (`KeyZ`, `Digit1`, …). Optional: without it, letters and
     * digits typed under a modifier match only as the character they produced.
     */
    code?: string;
    ctrlKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
    metaKey: boolean;
    target?: EventTarget | null;
}
/** Whether this is an Apple platform, where `mod` means ⌘. */
declare function isMacPlatform(): boolean;
/**
 * Normalise a binding's `keys` to canonical combos — one per `,`-separated
 * alternative — so `'Mod+Shift+Z'` on macOS is `['shift+meta+z']`. Unknown
 * modifier words are treated as the key. Empty alternatives are dropped.
 *
 * @param keys The binding's keys, e.g. `'mod+z, ctrl+y'`.
 * @param mac  Whether `mod` means ⌘ (else Ctrl). Default: {@link isMacPlatform}.
 */
declare function normalizeShortcut(keys: string, mac?: boolean): string[];
/**
 * A keyboard event as a canonical combo (see {@link normalizeShortcut}), or
 * `null` for a bare modifier press. Under a modifier, a typed character that
 * isn't a plain letter / digit (macOS ⌥Z → `Ω`, ⇧1 → `!`, a dead key) is
 * replaced by the physical letter / digit from `e.code` when there is one.
 */
declare function eventShortcut(e: ShortcutKeyEvent): string | null;
declare class KeyboardShortcutsBehaviour extends Behaviour<KeyboardShortcutsBehaviourOptions> {
    readonly kind = "keyboard-shortcuts";
    private readonly mac;
    private onKeyDown?;
    private onPointerDown?;
    /** Whether the last pointer-down on the page landed inside the scope root. */
    private lastPointerInside;
    constructor(opts: KeyboardShortcutsBehaviourOptions);
    private get bindings();
    protected onRegister(_ctx: CanvasContext): void;
    protected onEnable(): void;
    protected onDisable(): void;
    /**
     * Run the first binding matching `e` whose command is registered and enabled.
     * Returns whether one ran — and then calls `e.preventDefault()` when the event
     * has it. Keys typed into editable elements are ignored. Scope is checked by
     * the DOM listener, not here, so this is callable directly.
     */
    handleKey(e: ShortcutKeyEvent & {
        preventDefault?: () => void;
    }): boolean;
    /** The element keys must come from (or follow a click inside) — see the class doc. */
    private scopeRoot;
    private inScope;
}

/**
 * `ElementScaleLODBehaviour` — abstract base for zoom-driven "keep this
 * element at a fixed screen-pixel size" behaviours.
 *
 * Sits in the same family as `TextResolutionLODBehaviour`: both react
 * to `camera:zoom`, both adapt how some kind of entity renders as the
 * camera scale changes. This base owns the shared plumbing — event
 * subscription, RAF coalescing of bursts, enable/disable lifecycle —
 * and leaves the *what to rescale* to concrete subclasses.
 *
 * ## Why a base + subclass split
 *
 * The "screen-constant size" need shows up across domains: graph nodes
 * and edges today; swimlane lane headers, annotation pins, ER table
 * decorations tomorrow. Putting the camera-zoom plumbing in canvas (which
 * already owns the camera and the behaviour base) and the per-element
 * rescaling in domain packages means:
 *
 * - Each domain ships its own subclass next to its data model. No need
 *   to modify an upstream "knows about everything" class to add a new
 *   element kind.
 * - The browser RAF callback batches every behaviour's scheduled
 *   callback into the same frame, so registering multiple subclasses
 *   has effectively the same per-frame cost as one monolith doing N
 *   passes.
 *
 * ## Concrete subclass contract
 *
 * Override `onResolveTargets(ctx)` once at register to resolve layer
 * references. Override `apply(scale)` to walk those targets and write
 * the rescaled geometry through the renderer's fast paths
 * (`updateShape`, `setConnectorStroke`, etc.).
 *
 * `disable()` calls `apply(1)` — your apply function should be
 * idempotent at scale 1 (which is what "restore to world-unit sizing"
 * means).
 *
 * ## MapLibre note
 *
 * `MapLayer` writes the pixi-viewport transform directly to mirror
 * MapLibre's camera. It re-emits `camera:zoom` on the canvas event bus
 * after each move so subclasses of this behaviour react under MapLibre
 * gestures the same as under `WheelZoomBehaviour`. Without that bridge
 * these behaviours would silently no-op under MapLibre.
 */

/** A static value or a getter — getters are re-read on every `apply`. */
type NumberOrGetter = number | (() => number);
/** Coerce a {@link NumberOrGetter} to its current numeric value, or `undefined`. */
declare function resolveNumberOrGetter(v: NumberOrGetter | undefined): number | undefined;
interface ElementScaleLODBehaviourOptions extends BehaviourOptions {
    /**
     * Skip `apply` when the relative scale change since the last applied
     * frame is below this threshold (`|scale - lastScale| / lastScale`).
     * Set to `0` to disable the skip. Default `0.005` (0.5%) — sub-pixel
     * stroke / size deltas at typical screen DPIs, which the user can't
     * perceive but a wheel-zoom gesture fires 60×/sec of.
     */
    scaleEpsilon?: number;
    /**
     * When `> 0`, switch from per-frame RAF apply to a trailing-edge
     * debounce: skip work during a continuous gesture and run one final
     * `apply` after `settleMs` of zoom silence. Useful for expensive
     * passes (e.g. thousands of connector redraws) where mid-gesture
     * visual drift is preferable to a frame-rate collapse. Default `0`
     * (RAF mode).
     */
    settleMs?: number;
}
declare abstract class ElementScaleLODBehaviour<TOptions extends ElementScaleLODBehaviourOptions = ElementScaleLODBehaviourOptions> extends Behaviour<TOptions> {
    private readonly subs;
    /**
     * Pending `requestAnimationFrame` handle. Non-null while a reflow is
     * scheduled but hasn't fired yet — collapses bursts of `camera:zoom`
     * events (the wheel-zoom gesture fires 100+/sec) into one `apply`
     * call per animation frame. Critical for keeping fps above 60 during
     * a continuous zoom over thousands of entities.
     */
    private rafHandle;
    /**
     * Settle timer (debounce) handle. Used instead of `rafHandle` when
     * `settleMs > 0`. Re-armed on every `camera:zoom`; firing triggers a
     * single `apply` at the latest scale.
     */
    private settleTimer;
    /**
     * Scale at the last `apply` call. Drives the `scaleEpsilon` skip:
     * the next scheduled apply bails if the current scale is within
     * epsilon of this value. `null` means "no prior apply, never skip".
     */
    private lastAppliedScale;
    private get scaleEpsilon();
    private get settleMs();
    constructor(opts: TOptions);
    protected onRegister(ctx: CanvasContext): void;
    protected onDestroy(): void;
    protected onEnable(): void;
    protected onDisable(): void;
    /**
     * Force an immediate reflow at the current camera scale. Useful after
     * tuning a config knob (e.g. moving a GUI slider that a `NumberOrGetter`
     * reads from) — push the new sizes without waiting for the next zoom.
     *
     * Bypasses the epsilon skip and the settle debounce — explicit calls
     * are always treated as "apply now."
     */
    reflow(): void;
    /**
     * Called once on register. Resolve layer references from `ctx.layers`
     * and stash them on `this` for later `apply` calls. Throw a descriptive
     * error if a required layer isn't present — the canvas guarantees
     * `ctx.layers` is fully populated before behaviours register.
     */
    protected abstract onResolveTargets(ctx: CanvasContext): void;
    /** Optional teardown hook — drop layer refs / caches. Default no-op. */
    protected onReleaseTargets(): void;
    /**
     * Apply rescaling at the given camera scale. Called by `onEnable`,
     * each `camera:zoom` (RAF coalesced), and by `onDisable` with
     * `scale = 1` to restore world-unit sizing.
     *
     * Implementations should be idempotent — calling twice with the same
     * scale is a no-op visually.
     */
    protected abstract apply(scale: number): void;
    /**
     * Route a `camera:zoom` to either the RAF path (default) or the
     * trailing-edge debounce path (`settleMs > 0`). Both eventually call
     * {@link tryApply}, which honours the epsilon skip.
     */
    private scheduleReflow;
    /**
     * Apply at the current camera scale if (a) still enabled, (b) the
     * scale has moved by more than `scaleEpsilon` since the last apply.
     * Updates {@link lastAppliedScale} only on a real apply, so cumulative
     * sub-epsilon drift is eventually caught.
     */
    private tryApply;
    private applyAndRemember;
    private cancelScheduledReflow;
}

/**
 * Fixed-capacity ring buffer of {@link FrameTick} samples plus the per-frame FPS
 * math — the engine's frame-performance recorder. `Canvas.tickOnce` hands it raw
 * per-phase timings via {@link sample}; the meter derives `fps` / `cpuMs` /
 * `longFrame`, stores the result, and returns it so the caller can emit it on the
 * `render:loop:tick` bus event.
 *
 * Two read models sit on top of the same data:
 * - **push** — the `render:loop:tick` event (the OTel adapter taps this).
 * - **pull** — {@link stats} / {@link recent} / {@link last} for a HUD or status
 *   bar (e.g. `DevInfoLayer`) that wants "the last second" on demand.
 *
 * The buffer is a pre-sized array written round-robin, so steady-state recording
 * allocates only the small {@link FrameTick} it returns (no growth, no GC churn).
 */
declare class FrameMeter {
    /** Ring storage; `undefined` slots are unwritten (only before first wrap). */
    private readonly buf;
    /** Next write index (round-robin). */
    private head;
    /** Whether the ring has wrapped at least once (i.e. is full). */
    private wrapped;
    /** Capacity of the ring. */
    private readonly capacity;
    /** `dt` (ms) at or above which a frame counts as long / janky. */
    private readonly longFrameMs;
    /** FPS ceiling — guards against a ~0ms `dt` producing an absurd value. */
    private static readonly FPS_CEILING;
    /**
     * @param opts.capacity   Ring size in frames. Default `240` (~4s at 60fps).
     * @param opts.longFrameMs `dt` threshold for {@link FrameTick.longFrame}.
     *   Default `25` (below ~40fps).
     */
    constructor(opts?: {
        capacity?: number;
        longFrameMs?: number;
    });
    /**
     * Derive a {@link FrameTick} from one frame's raw measurements, store it, and
     * return it (for emission). `dt` is the inter-frame period; `phases` are the
     * measured CPU sub-costs — their sum becomes {@link FrameTick.cpuMs}.
     */
    sample(input: {
        ts: number;
        dt: number;
        phases: FramePhaseTimings;
        interaction: InteractionKind;
    }): FrameTick;
    /** The most recently recorded frame, or `undefined` before the first sample. */
    get last(): FrameTick | undefined;
    /** Number of samples currently held (≤ capacity). */
    get size(): number;
    /**
     * The last `n` samples in chronological (oldest → newest) order. Defaults to
     * every held sample. Returns a fresh array; the {@link FrameTick}s themselves
     * are shared (treat as read-only).
     */
    recent(n?: number): FrameTick[];
    /**
     * Summarise the most recent `windowMs` of frames (default 1000ms) into
     * percentile frame-times + median FPS + a dropped-frame count. Cheap enough to
     * call every HUD repaint. Returns a zeroed summary when no samples fall in the
     * window.
     */
    stats(windowMs?: number): FrameStats;
    /** Drop every recorded sample. */
    clear(): void;
}

/**
 * The engine's built-in {@link CanvasCommand}s — registered on every `Canvas`'s
 * `commands` registry at construction, so a serialised control panel can drive
 * the camera, lock the view and run layouts with zero app code.
 *
 * | Name | Args | Kind |
 * |---|---|---|
 * | `camera.zoomIn` / `camera.zoomOut` | `{ factor? }` (default `1.2`) | button |
 * | `camera.fit` | `{ padding?, layerId? }` (default `80`; `layerId` fits that layer's bounds instead of all content) | button |
 * | `camera.pan` | `{ dx?, dy? }` screen px — the **content** moves by `(dx, dy)` | button |
 * | `camera.zoomTo` | `{ value?, levels? }` (default `1`) | button (`value` fixed) or choice over `levels` (default 25–400 %, plus the current zoom when it's between levels) |
 * | `camera.reset` | — | button: zoom 1, world origin at the viewport centre |
 * | `behaviour.toggle` | `{ id }` | toggle, active while behaviour `id` is enabled |
 * | `view.lock` | `{ behaviourIds? }` (default `['pan', 'drag-node']`) | toggle |
 * | `layout.run` | `{ id? }` (default: the active layout) | button |
 * | `layout.stop` | — | button, enabled while a layout runs |
 * | `layout.toggle` | `{ id? }` | button: stops a running layout, else runs `id` / the active one; active while running (a Run ⇄ Stop face) |
 * | `layout.activate` | `{ value }` | choice over the registered layouts; value = `activeLayout` |
 * | `background.grid` | `{ layerId?, patternType? }` (default `'background'`) | toggle, active while the background is a pattern |
 * | `layer.visible` | `{ id }` | toggle, active while layer `id` is visible |
 * | `history.undo` / `history.redo` | — | button over `canvas.history` — every recorded change: definition edits and every data source's writes (one log) |
 *
 * Each command also describes its args as data (`CanvasCommand.args`), so the
 * Studio's control-panel editor draws a field per key.
 *
 * Names are public API (`namespace.verb`): renaming one breaks saved panels.
 */

/**
 * The engine's commands and their `args` — the command map (`CommandMap`) that types
 * `canvas.commands` (`canvas.commands.run('camera.fit', { padding: 40 })` is
 * checked; any other name still takes `unknown`). Keys match the table above;
 * the built-in registrations below are checked against it.
 */
interface EngineCommandMap {
    'camera.zoomIn': {
        factor?: number;
    } | undefined;
    'camera.zoomOut': {
        factor?: number;
    } | undefined;
    'camera.fit': {
        padding?: number;
        layerId?: string;
    } | undefined;
    'camera.pan': {
        dx?: number;
        dy?: number;
    } | undefined;
    /** A picker hands `value` back as a string; a fixed-level button passes a number. */
    'camera.zoomTo': {
        value?: number | string;
        levels?: number[];
    } | undefined;
    'camera.reset': undefined;
    'behaviour.toggle': {
        id: string;
    };
    'view.lock': {
        behaviourIds?: string[];
    } | undefined;
    'layout.run': {
        id?: string;
    } | undefined;
    'layout.stop': undefined;
    'layout.toggle': {
        id?: string;
    } | undefined;
    'layout.activate': {
        value?: string;
    } | undefined;
    'background.grid': {
        layerId?: string;
        patternType?: 'dots' | 'grid' | 'lines';
    } | undefined;
    'layer.visible': {
        id: string;
    };
    'history.undo': undefined;
    'history.redo': undefined;
}

/**
 * `CanvasConfig` — the canvas's visual configuration as **pure JSON**, keyed by
 * instance id. No class references, so it serialises cleanly: persist it, diff
 * it, or generate a settings UI from it.
 *
 * Classes are registered imperatively (`canvas.layers.add(new XLayer({ id }))`);
 * the config addresses those instances by the *same id* and is applied through
 * `Canvas.update()` — which fans each slice to the instance's `setOptions`.
 *
 * See `unified-canvas-options-plan.md`.
 */

/** Per-instance options keyed by id. Each value is the instance's own option bag. */
interface CanvasConfig {
    /** Layer options keyed by the layer's id. */
    layers?: Record<string, Record<string, unknown>>;
    /** Behaviour options keyed by the behaviour's id. */
    behaviours?: Record<string, Record<string, unknown>>;
    /** Layout options keyed by the layout's id. */
    layouts?: Record<string, Record<string, unknown>>;
    /**
     * Id of the active layout among {@link layouts}. A graph runs one at a time.
     * `Canvas.runLayout(id)` applies it; a domain facade (e.g. `GraphCanvas`)
     * auto-runs it when the target layer's data changes.
     */
    activeLayout?: string;
    /**
     * Floating control panels over the canvas, keyed by panel id. Each spec
     * **replaces** that panel whole (items don't merge); `null` removes it. Pure
     * JSON — items name commands / icons / widgets by string. See
     * `ControlPanelSpec` and `Canvas.commands`.
     */
    controlPanels?: Record<string, ControlPanelSpec | null>;
    /**
     * The interaction mode (`view.interaction.viewMode` — the modeller "tool") a
     * canvas **starts** in. Stored as `definition.canvas.defaultViewMode`, and
     * applied to the live mode only by the first config that carries it, so a
     * later `update` never yanks the user out of the tool they picked. Behaviours
     * with `modes` follow the live mode. Absent = `'select'`.
     */
    defaultViewMode?: string;
    /**
     * Fit the camera to content **once on load**, so the drawing is centred when it
     * first appears — independent of any layout. The engine fits the union of its
     * world layers' bounds once, after the viewport has its real size and (when an
     * {@link activeLayout} is set) that layout has settled. Default `false`
     * (opt-in). Init-only: read when the canvas initialises.
     */
    fitOnLoad?: boolean;
    /**
     * Ease the **first** auto-fit instead of snapping to it, so the view glides
     * into frame. Absent (the default) keeps today's instant fit.
     *
     * Only the first fit of a canvas's life is eased. The auto-fitter re-fits as
     * a layout runs, and easing each of those would turn a settling graph into a
     * chase; and once the user has touched the camera, any camera write of ours
     * is already on thin ice (see the rejected `fitOnResize`, `D7`). A user pan or
     * zoom mid-glide cancels it outright.
     *
     * Requires {@link fitOnLoad} — there is no first auto-fit without it.
     * Init-only, and pure JSON: the easing is a **name**, never a function.
     */
    fitAnimation?: {
        /** Glide length in ms. Default `400`. */
        durationMs?: number;
        /** Named easing curve. Default `'easeOutCubic'`. */
        easing?: EasingName;
    };
    /**
     * Fade the canvas's **world** content in once, the first time it is worth
     * showing, instead of cutting from blank to complete. Absent (the default) is
     * today's behaviour and costs nothing.
     *
     * This is one alpha tween on the world surfaces — not a per-item effect — so
     * it works for any content (graph, ER diagram, map) and its cost does not
     * grow with the number of items. Screen-fixed layers are excluded: overlay
     * chrome blinking in reads as a glitch, not as an arrival. For a *staggered*
     * per-item sweep, reach for `@invana/graph`'s `EntranceBehaviour` instead;
     * the two are independent and composable.
     *
     * ### When it plays
     *
     * Once per canvas, on the first frame worth showing — with {@link fitOnLoad},
     * the first fit (the moment the camera has framed real positions); otherwise
     * the first data flush. The world surfaces are held at alpha 0 from the moment
     * this config lands until then, so nothing paints at full opacity first. A
     * bounded grace period releases the fade regardless, so a canvas whose trigger
     * never arrives can never stay invisible.
     *
     * Init-only, and pure JSON.
     */
    entrance?: {
        /** The only entrance kind today: a straight opacity fade. */
        kind: 'fade';
        /** Fade length in ms. Default `320`. */
        durationMs?: number;
        /** Named easing curve. Default `'easeOutCubic'`. */
        easing?: EasingName;
    };
}
/**
 * Recursively merge `patch` into `base`. Plain objects merge field-by-field;
 * everything else (arrays, functions, class instances, primitives) replaces —
 * matching the shallow semantics of `GraphLayer.setNodeDefaults`.
 */
declare function deepMerge(base: unknown, patch: unknown): unknown;

/**
 * Shared helpers for the raster ({@link ./imageExport}) and vector
 * ({@link ./svgExport}) export paths — colour conversion, background
 * resolution, and the capture-region rectangle.
 */

/**
 * Background fill for an exported image / SVG:
 * - `'transparent'` — no fill (alpha PNG/WebP/SVG; JPEG falls back to white).
 * - `'canvas'` — match the on-screen canvas background (resolved from the
 *   background layer / active theme surface / `CanvasOptions.backgroundColor`).
 * - a hex `number` (`0xRRGGBB`) or any CSS colour `string`.
 */
type ExportBackground = 'transparent' | 'canvas' | number | string;
/** Which region of the diagram to capture. */
type ExportArea = 'viewport' | 'content';

/**
 * Raster export — turn the canvas viewport (or the whole diagram) into a
 * PNG / JPEG / WebP image.
 *
 * **How it works.** PixiJS is a GPU raster renderer, so there is no vector
 * scene to serialise — we ask the renderer's `extract` system to render a
 * chosen region of the {@link Canvas.world} container into an offscreen
 * `<canvas>`, then (optionally) composite it onto a background fill and hand
 * back a `Blob` / data URL.
 *
 * Both capture areas render the **world** container (never `stage`), so
 * screen-glued overlays (minimap, dev-info, the background layer) are excluded
 * — the background is reproduced by us via the {@link ExportImageOptions.background}
 * option, giving consistent, overlay-free output in both modes:
 *
 * - `area: 'viewport'` — the world region currently visible, rendered at the
 *   on-screen zoom (`resolution = camera.scale × scale`). WYSIWYG minus overlays.
 * - `area: 'content'` — the union bounds of all world content at 1:1 native
 *   scale (`resolution = scale`), independent of the current camera. Exports the
 *   whole diagram even when most of it is off-screen.
 *
 * SVG is intentionally *not* handled here — a true vector exporter is a separate
 * projection of the store (Phase 2), not something `extract` can produce.
 */

/** Raster formats `extract` + `HTMLCanvasElement.toBlob` can emit. */
type ExportRasterFormat = 'png' | 'jpeg' | 'webp';
/** Options for {@link Canvas.export} / {@link Canvas.exportDataURL}. */
interface ExportImageOptions {
    /** Output format. Default `'png'`. `'svg'` routes to the vector exporter. */
    format?: ExportRasterFormat | 'svg';
    /** Capture area. Default `'viewport'`. */
    area?: ExportArea;
    /** Background fill. Default `'canvas'`. See {@link ExportBackground}. */
    background?: ExportBackground;
    /**
     * Force a specific output aspect ratio (width ÷ height, e.g. `16/9`, `1`).
     * The capture region is letterboxed to it — grown + re-centred, never
     * cropped — with the background filling the added margin. Default: no
     * constraint (the region's natural ratio).
     */
    aspectRatio?: number;
    /**
     * Resolution multiplier applied on top of the mode's base resolution.
     * Default = `window.devicePixelRatio` (≥ 1). Bump it for a higher-DPI export;
     * the result is clamped by {@link maxSize}.
     */
    scale?: number;
    /** Encoder quality `0..1` for `'jpeg'` / `'webp'`. Ignored for `'png'`. */
    quality?: number;
    /** Extra world-space padding around the content bounds (`area: 'content'` only). Default `24`. */
    padding?: number;
    /**
     * Clamp for the longest output edge in pixels — guards against exceeding the
     * GPU's max texture size on huge/zoomed exports. When the request would
     * exceed it, the resolution is scaled down to fit. Default `8192`.
     */
    maxSize?: number;
}
/**
 * Export the canvas as an image `Blob`. See {@link ExportImageOptions}.
 * Rejects when no GPU renderer is available or the region is empty.
 */
declare function exportImage(canvas: Canvas, opts?: ExportImageOptions): Promise<Blob>;
/**
 * Export the canvas as a `data:` URL. Synchronous counterpart to
 * {@link exportImage} — handy for `<img src>` / quick previews. Prefer
 * {@link exportImage} for downloads (a `Blob` URL avoids a large base64 string).
 */
declare function exportImageDataURL(canvas: Canvas, opts?: ExportImageOptions): string;

/**
 * Vector SVG export — a **second projection** of the scene into scalable SVG
 * markup, independent of the GPU raster path.
 *
 * PixiJS renders to WebGPU/WebGL, so there is no vector output to read back;
 * instead we serialise the **live specs** the renderer already holds — each
 * shape's geometry spec and each connector's routed `Path` — into SVG
 * elements. Because those are the exact specs on screen, the SVG matches the
 * rendered diagram, while staying resolution independent.
 *
 * The per-spec serialisers (`shapeSpecToSvg` / `connectorToSvg` / `pathToSvgD`)
 * are **pure and domain-free** and live in `@invana/canvas-core`'s `svg/` —
 * `PrimitivesRenderer.toSVG` walks its instance maps and calls them without
 * touching the engine. This module keeps only {@link exportSVG}: the document
 * assembler that walks a live {@link Canvas} and stitches every layer's
 * fragment into one `<svg>` with the right `viewBox` + background.
 */

/** Options for {@link Canvas.exportSVG} (a subset of the raster options). */
interface ExportSvgOptions {
    /** Capture area. Default `'viewport'`. */
    area?: ExportArea;
    /** Background fill. Default `'canvas'`. `'transparent'` omits the backing rect. */
    background?: string | number | 'transparent' | 'canvas';
    /** World padding around the content bounds (`area: 'content'` only). Default `24`. */
    padding?: number;
    /**
     * Force a specific output aspect ratio (width ÷ height). The `viewBox` is
     * letterboxed to it — grown + re-centred, never cropped. Default: no constraint.
     */
    aspectRatio?: number;
    /** Multiplier for the SVG's pixel `width`/`height` attributes (the `viewBox` is unaffected). Default `1`. */
    scale?: number;
}
/** A layer that can contribute vector markup to an SVG export. */
interface SvgExportableLayer {
    /** Return an SVG fragment (elements, no `<svg>` wrapper) in world coordinates. */
    toSVG(): string;
}
/**
 * Build the full SVG document for a canvas. Walks visible layers in z-order,
 * collects each {@link SvgExportableLayer.toSVG} fragment, and wraps them in an
 * `<svg>` sized to the capture region with an optional background rect.
 *
 * Throws when the capture region is empty (nothing to export).
 */
declare function exportSVG(canvas: Canvas, opts?: ExportSvgOptions): string;

/**
 * Schema version stamped onto every {@link CanvasStateSnapshot}. Bump when the
 * envelope shape changes so importers can detect (and refuse / migrate)
 * incompatible files. Layer *data* payloads are versioned by their own layer.
 */
declare const CANVAS_STATE_VERSION: 1;
/**
 * The structural contract a {@link Canvas} layer implements to round-trip its
 * **bulk data** (nodes / edges / rows …) through the JSON state snapshot.
 *
 * Duck-typed on purpose — `@invana/canvas` can't depend on the domain packages
 * that own the data (e.g. `@invana/graph`'s `GraphLayer`), so the exporter only
 * asks: *does this layer expose `exportData` / `importData`?* A layer that holds
 * no serialisable data simply doesn't implement it and is skipped.
 */
interface DataSerializableLayer {
    /** Return a JSON-serialisable snapshot of this layer's data. */
    exportData(): unknown;
    /** Replace this layer's data from a snapshot previously produced by {@link exportData}. */
    importData(data: unknown): void;
}
/**
 * The structural contract a layer / behaviour / layout implements to contribute
 * its **serialisable configuration** (styling template, options, params) to the
 * snapshot's `definition`.
 *
 * Needed because a declarative (React) canvas passes options to **constructors**,
 * not through `canvas.update()`, so the reactive `store.view.definition` is
 * empty. Each instance can instead expose its own JSON-safe config slice here;
 * {@link exportCanvasState} overlays it onto `definition.{layers,behaviours,layouts}`
 * keyed by the instance id. Duck-typed like {@link DataSerializableLayer} so the
 * engine stays free of domain deps.
 *
 * The returned object must be JSON-safe — function-valued style resolvers (e.g.
 * `labelText: (n) => …`) cannot serialise and should be dropped (implementations
 * use {@link jsonSafe}). Import re-applies the slice through `setOptions`, whose
 * shallow merge preserves any live resolver a serialised template omitted.
 */
interface DefinitionSerializable {
    /** Return this instance's JSON-safe config slice, or `undefined` to contribute nothing. */
    serializeDefinition(): Record<string, unknown> | undefined;
}
/**
 * JSON-safe projection of {@link CanvasView.interaction} — every `Set` is
 * flattened to an array (and rehydrated on import). Camera is a plain
 * `{ x, y, zoom }` already.
 */
interface CanvasInteractionSnapshot {
    selection: string[];
    hover: string | null;
    states: Record<string, string[]>;
    camera: CameraTransform;
    focus: {
        ids: string[];
        dim: boolean;
    } | null;
    /** Whose properties are open. Absent in snapshots from before it existed. */
    inspect?: string | null;
    /**
     * The latest camera intent. Restored as state only — an import keeps the
     * snapshot's `camera` and does not re-frame. Absent in older snapshots.
     */
    cameraIntent?: {
        intent: CameraIntent;
        seq: number;
    } | null;
    transientPins: string[];
    viewMode: string;
    /** Parameters of {@link viewMode}. Absent in snapshots from before it existed. */
    viewModeArgs?: Record<string, string>;
}
/**
 * The full, self-contained JSON document describing a canvas — everything a
 * fresh (structurally identical) canvas needs to re-render the same scene:
 *
 * - **`view.definition`** — "what it IS": scene options, layer/behaviour/layout
 *   options, `activeLayout`, authored templates, theme config. (styling lives
 *   inside the per-layer options + templates.)
 * - **`view.interaction`** — "the live view": selection, hover, camera, focus,
 *   view states, view mode.
 * - **`data`** — each data-owning layer's bulk records (nodes/edges with
 *   positions), keyed by layer id.
 *
 * Serialise with {@link exportCanvasState}; restore with {@link importCanvasState}.
 * `runtime` (transient layout/message status) is intentionally omitted — it is
 * never persisted.
 */
interface CanvasStateSnapshot {
    /** Envelope schema version — see {@link CANVAS_STATE_VERSION}. */
    version: number;
    view: {
        definition: CanvasView['definition'];
        interaction: CanvasInteractionSnapshot;
    };
    /** Per-layer bulk data keyed by layer id (only layers that implement {@link DataSerializableLayer}). */
    data: Record<string, unknown>;
}
/** Options for {@link importCanvasState}. */
interface ImportCanvasStateOptions {
    /**
     * Skip restoring the ephemeral `interaction` slice (selection / hover /
     * camera / focus / view states). Default `false` — the full live view is
     * restored. Set `true` to load a document's definition + data while keeping
     * the viewer's current camera and selection.
     */
    skipInteraction?: boolean;
}
/**
 * JSON-safe deep copy: drops functions, `undefined`, and other non-serialisable
 * values (via `JSON.stringify`, which omits them). Returns `undefined` when the
 * whole value serialises away. Used by `serializeDefinition()` implementers so a
 * template carrying resolver functions still yields a clean, portable slice.
 */
declare function jsonSafe<T>(value: T): T | undefined;
/**
 * Serialise a canvas's **full render state** to a plain JSON object — the view
 * definition (scene / layers / behaviours / layouts / templates / theme), the
 * live interaction (selection / hover / camera / focus / states / view mode),
 * and every data-owning layer's records (nodes / edges with positions).
 *
 * The result is a pure POJO safe to `JSON.stringify`, persist, diff, or hand to
 * {@link importCanvasState}. It does **not** describe *which classes* to
 * register — import restores into a canvas whose layers/behaviours/layouts are
 * already registered under the same ids (see {@link importCanvasState}).
 *
 * @example
 * const snapshot = exportCanvasState(canvas);
 * localStorage.setItem('scene', JSON.stringify(snapshot));
 */
declare function exportCanvasState(canvas: Canvas): CanvasStateSnapshot;
/**
 * Restore a canvas from a {@link CanvasStateSnapshot} produced by
 * {@link exportCanvasState}.
 *
 * Because a snapshot carries options + data keyed by id but **not** class
 * references, the canvas must already have its layers/behaviours/layouts
 * registered under those same ids (e.g. the same `<Canvas>` JSX or imperative
 * `canvas.layers.add(...)` wiring). Import then:
 *
 * 1. loads each layer's bulk data (so positions/nodes exist before anything
 *    reads them),
 * 2. pushes the definition — layer/behaviour/layout option slices reach each
 *    instance's `setOptions`; scene / templates / theme / `activeLayout` are
 *    written to the store. The active layout is **not** re-run, so the restored
 *    node positions are preserved rather than recomputed,
 * 3. restores the interaction slice (camera via the camera action so the
 *    renderer's viewport follows) unless {@link ImportCanvasStateOptions.skipInteraction}.
 *
 * @throws if the snapshot's {@link CanvasStateSnapshot.version} is newer than
 * this engine understands.
 */
declare function importCanvasState(canvas: Canvas, snapshot: CanvasStateSnapshot, opts?: ImportCanvasStateOptions): void;
/** Anything the file-I/O helpers accept as a source of a {@link CanvasStateSnapshot}. */
type CanvasStateSource = CanvasStateSnapshot | string | File | Blob;
/**
 * The current canvas state as a JSON string (pretty-printed by default). Sugar
 * over `JSON.stringify(exportCanvasState(canvas), null, space)`.
 */
declare function canvasStateToJSON(canvas: Canvas, space?: string | number): string;
/**
 * Serialise the canvas's full state and trigger a browser download of the
 * `.json` file. Framework-agnostic (no React) — the file counterpart to
 * {@link exportCanvasState}. No-op outside a DOM environment.
 */
declare function downloadCanvasState(canvas: Canvas, filename?: string): void;
/**
 * Restore the canvas from a snapshot, a JSON string, or a picked `File` / `Blob`
 * (e.g. from an `<input type="file">`) — the file counterpart to
 * {@link importCanvasState}. Parses `source` then delegates to
 * {@link importCanvasState} (same registered-instances requirement).
 */
declare function importCanvasStateFromFile(canvas: Canvas, source: CanvasStateSource, opts?: ImportCanvasStateOptions): Promise<void>;

/**
 * `Canvas` — the engine root.
 *
 * Architecture: see `architecture-proposal.md` (whole document) and
 * `decorations-plan.md` §11.9 (RenderGroups + Ticker integration).
 *
 * **What it owns**
 *   - The pixi `Application` (created by `init`) and its `Ticker`.
 *   - The kernel `CanvasStore` (`view`/`data`/`events`/`theme`); `canvas.events`
 *     *is* the kernel's one canvas-wide `CanvasEventBus` (typed events + tap).
 *   - The `SurfaceManager` (world + screen RenderGroups).
 *   - The `Camera` (pan/zoom/projection).
 *   - The `LayerRegistry` and `BehaviourRegistry`.
 *   - The `CanvasContext` object handed to every Layer / Behaviour.
 *
 * **What it does per tick** (single RAF, delegated to pixi `Ticker`):
 *   1. Walk layers in z-order.
 *   2. Skip invisible layers.
 *   3. If a layer has pending dirty work, call `layer.flush()`.
 *   4. Pixi auto-renders the stage at end of tick.
 *
 * Animation runner (Tweens) and per-renderer animation ticks land in later
 * steps; this Canvas implementation has the hook points but doesn't yet
 * orchestrate them.
 *
 * **Two init paths**
 *   - `init(opts)` — the production path. Creates a pixi `Application`,
 *     mounts its canvas into the DOM container, hooks the ticker.
 *   - `initWithRenderer(renderer, sw, sh)` — the headless path. The caller
 *     supplies an already-mounted backend, so a test can drive the whole layer
 *     / behaviour / state pipeline against a renderer that draws nothing.
 */

interface CanvasOptions {
    /**
     * Stable identifier for this Canvas instance. Used as the source id on
     * envelopes published by the bus's own `emit()`. Default: `'canvas'`.
     * Override when running multiple Canvas instances in one document.
     */
    id?: string;
    /** DOM element pixi mounts its `<canvas>` into. Required by `init()`. */
    container?: HTMLElement;
    /**
     * Preferred backend ({@link RenderPreference}). Default `'webgpu'`
     * (WebGPU-first). Passed to the renderer verbatim — `'canvas'` mounts the 2D
     * backend rather than being folded into `'webgl'`.
     *
     * PixiJS's WebGPU renderer can crash at *render* time on some browser/driver
     * combinations (a null bind-group during pipeline setup), which no init-time
     * guard can catch. When that happens the engine halts its render loop and
     * emits `'canvas:renderer:fallback'` so the host can degrade to WebGL (the
     * `@invana/canvas-react` `<Canvas>` does this automatically). Pixi's own
     * auto-fallback still covers browsers with no WebGPU at all; pass `'webgl'`
     * explicitly to opt out of WebGPU entirely.
     */
    preference?: RenderPreference;
    /**
     * The drawing backend. Defaults to `@invana/renderer-pixijs` (the PixiJS
     * backend); supply one to override — a three.js backend, or
     * `HeadlessRenderer` for a test.
     *
     * When supplied, `Canvas` calls `mount` on it; you do not mount it yourself.
     */
    renderer?: IRenderer;
    /** Viewport width in CSS pixels. Default = `container.clientWidth`. */
    width?: number;
    /** Viewport height in CSS pixels. Default = `container.clientHeight`. */
    height?: number;
    /** Device pixel ratio. Default `window.devicePixelRatio`. */
    resolution?: number;
    /** GPU MSAA. Default `true`. Auto-disabled on the Canvas backend. */
    antialias?: boolean;
    /** `true` → opaque scene, `backgroundAlpha = 1` (skips per-frame blend). */
    opaque?: boolean;
    /** Background colour. Default `0` (black, but only visible when `opaque: true`). */
    backgroundColor?: number;
    /** GPU power preference. Default `'high-performance'`. */
    powerPreference?: 'high-performance' | 'low-power';
    /** Suppress pixi's "PixiJS X.X.X" startup log. Default `true`. */
    hello?: boolean;
    /**
     * Automatically resize the renderer and camera when the container element
     * changes size. Covers both window resize and programmatic expand/collapse.
     * Uses `ResizeObserver` internally. Default `false`.
     */
    autoResize?: boolean;
    /**
     * Suppress the browser's native right-click context menu on the canvas
     * element. Diagram apps typically want to show their own menu UI via the
     * `shape:contextmenu` / `connector:contextmenu` events. Default `true`.
     *
     * Set to `false` if the app wants the OS context menu (e.g. for
     * accessibility / dev tooling on right-click).
     */
    suppressBrowserContextMenu?: boolean;
    /**
     * Serialisable visual config applied at the end of `init()` to the
     * layers/behaviours already added (by id): each slice is pushed to the
     * instance's `setOptions`, and behaviours with `enabled: true` are turned on.
     * The single place to set all settings. Pure JSON — see {@link CanvasConfig}.
     */
    config?: CanvasConfig;
    /**
     * Telemetry to emit — independently toggle `traces` / `metrics` / `logging`
     * (see {@link CanvasTelemetryConfig}). Each stream `true` uses the dep-free
     * console adapter, so `telemetry: { traces: true, metrics: true }` works with
     * zero extra installs; inject a real port (or use the opt-in
     * `@invana/canvas-telemetry-otel` package) to export to OTLP / HyperDX. The
     * engine + kernel stay vendor-free — the exporter lives outside.
     *
     * `metrics` covers the per-frame FPS / phase stream the engine emits on
     * `render:loop:tick` (see {@link frames}); `traces` covers view-mutation,
     * event-bus, and per-gesture interaction spans.
     */
    telemetry?: CanvasTelemetryConfig;
    /**
     * The session actor — who `canvas.history` attributes a change to when the
     * write names nobody (`applyDelta(delta, { actor })` names one). Free text:
     * `'user'`, `'user:ravi'`, `'engine'`, `'assistant'`. Default `'user'`;
     * settable later through {@link Canvas.actor}.
     */
    actor?: string;
}
declare class Canvas {
    readonly id: string;
    readonly options: CanvasOptions;
    /**
     * The renderer-free kernel (`@invana/canvas-store`) — the observable truth this
     * engine projects. **`store.view.definition` is the single source of truth for
     * serialisable config**: {@link update} writes it and {@link get} reads it (no
     * parallel `this.config`). Readers subscribe to slices via `useStore`/`select`.
     *
     * The store owns `view`, `data`, `events` (the one canvas-wide bus — {@link events}
     * *is* `store.events`) and `theme`. Undo for the definition is {@link history}.
     */
    readonly store: CanvasStore;
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
    readonly history: HistoryView;
    /**
     * Who a recorded change is attributed to when its write names nobody. Free
     * text; set it per session (`canvas.actor = 'user:ravi'`). Initialised from
     * `CanvasOptions.actor`, default `'user'`.
     */
    actor: string;
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
    readonly playbook: Playbook<CanvasConfig>;
    /** The log behind {@link history}; handed to data layers through the context. */
    private readonly log;
    /**
     * Public surface — populated by `init()` / `initWithRenderer()`. Accessing
     * before init throws (definite-assignment via `!`). Use `isInitialised`
     * to guard if needed.
     */
    readonly events: CanvasEventBus;
    camera: Camera;
    /**
     * Pointer-gesture arbitration for this canvas — see `input/GestureArbiter.ts`.
     * Built in the constructor (no dependency on the scene graph) so it is live
     * before any behaviour registers, and handed to every participant as
     * `ctx.gestures`.
     */
    readonly gestures: GestureArbiter;
    readonly layers: LayerRegistry;
    readonly behaviours: BehaviourRegistry;
    readonly layouts: LayoutRegistry;
    /**
     * Named commands (`'camera.fit'`, `'view.lock'`, …) run against this canvas —
     * what serialised UI such as control panels dispatches through. Holds the
     * engine built-ins from construction (see `builtinCommands.ts`); domain
     * packages and apps register their own. Typed with {@link EngineCommandMap}:
     * those names' args are checked at compile time, any other name takes
     * `unknown`. A subclass that registers more redeclares it with a wider map
     * (`GraphCanvas`).
     */
    readonly commands: CommandRegistry<Canvas, EngineCommandMap>;
    context: CanvasContext;
    /**
     * The shared theme channel — a single publisher (the domain `ThemeBehaviour`)
     * sets the resolved theme here and every theme-aware layer recolours from it.
     * Lives for the whole `Canvas` lifetime (the bus already exists at construct).
     */
    private readonly themeState;
    /**
     * The drawing backend. `Canvas` drives it through {@link IRenderer} and owns
     * no pixi object of its own — the `Application`, the viewport, the surfaces
     * and the texture pool all live behind this.
     */
    private _renderer?;
    /** Handle for the engine's own rAF loop. Set while initialised (G3). */
    private _rafHandle;
    private _isInitialised;
    /** True once this canvas has acquired the shared TexturePool (real `init` only). */
    /** Last message pushed on the message channel; `null` when idle / cleared. */
    private _currentMessage;
    /**
     * Per-frame performance recorder — FPS + per-phase CPU breakdown for the last
     * N frames. Fed from {@link tickOnce}; read via {@link frames}. Always on (a
     * ring-buffer write per frame is near-free); an OTel adapter opts in by tapping
     * the `render:loop:tick` event this emits.
     */
    private readonly _frames;
    /** Attributes each frame to the active gesture so {@link _frames} can tag it. */
    private readonly _interactions;
    /** `performance.now()` at the previous frame — for the true (unclamped) frame time. */
    private _lastFrameTs;
    /** Guards {@link _armAutoFit} against attaching duplicate follow listeners
     *  when `config.fitOnLoad: true` is applied more than once. */
    private _autoFitArmed;
    /** Set once `config.defaultViewMode` has seeded the live mode — later configs
     *  only update the stored default. */
    private _viewModeSeeded;
    /** Pending grace timer from {@link _armAutoFit} — fires only if the declared
     *  `activeLayout` never reports a run. Cleared on the first run and on destroy. */
    private _autoFitGrace;
    /** Rounded visible-bounds key from the last cull — re-cull only when it changes. */
    private _lastCullKey;
    /**
     * Every **world** surface handed out by {@link _buildContext}'s factory, in
     * creation order. The entrance fades these and only these: screen-fixed
     * chrome blinking in reads as a glitch.
     *
     * Tracked here rather than walked off the layers because a surface is the
     * thing with an alpha, and a layer need not expose its own.
     */
    private readonly _worldSurfaces;
    /**
     * Entrance state machine, or `null` when `config.entrance` is absent (the
     * default — nothing is armed and no alpha is ever written).
     *
     * `armed` means the world is being held at alpha 0 waiting for the trigger;
     * `tween` is non-null only while the fade is actually running. Once `played`
     * is true the entrance never fires again for this canvas's life.
     */
    private _entrance;
    /** `config.fitAnimation`, applied to the first auto-fit only. */
    private _fitAnimation;
    /** False until the auto-fitter has issued its first fit — gates {@link _fitAnimation}. */
    private _firstFitDone;
    /** {@link runLayout} calls whose promise hasn't settled — read by {@link _whenSettled}. */
    private _runsInFlight;
    constructor(opts?: CanvasOptions);
    get isInitialised(): boolean;
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
    get renderer(): IRenderer | undefined;
    /**
     * Production init: create a pixi `Application`, mount its canvas into the
     * supplied DOM container, wire the ticker, and emit
     * `'canvas:renderer:ready'` on the bus.
     *
     * The selected backend (and capabilities) flows through the bus event so
     * consumers see which renderer pixi resolved.
     */
    init(opts: CanvasOptions): Promise<void>;
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
    initWithRenderer(renderer: IRenderer, screenWidth: number, screenHeight: number): void;
    /**
     * Run one tick manually with a fixed delta. Useful in tests; in production
     * pixi's ticker calls `tick` automatically.
     */
    tickOnce(deltaMs?: number): void;
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
    private _whenSettled;
    /**
     * Fit the camera to all content — zoom + centre so every world layer's content
     * fits the viewport (the "zoom to extent" action; the same
     * `camera.fitContent` the Fit toolbar button calls, over the union of layers).
     * No-op when there's nothing with real extent to fit.
     *
     * @param padding Screen-px margin around the content. Default `80`.
     */
    fitView(padding?: number): void;
    /**
     * {@link fitView}, eased — glide to the fitted transform instead of snapping.
     * Used for the first auto-fit when `config.fitAnimation` is set.
     *
     * Solves for the same transform `Camera.fitContent` would write, then hands it
     * to `Camera.animateTo` rather than applying it. Any user camera write during
     * the glide cancels it.
     */
    private _fitViewAnimated;
    /**
     * The camera transform `Camera.fitContent(rect, padding)` would write:
     * the zoom that fits `rect` inside the padded viewport, centred on it. Not
     * clamped — `Camera.setTransform` / `animateTo` clamp on write.
     */
    private _fitTransform;
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
    private _followRun;
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
    get autoFitArmed(): boolean;
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
    private _armAutoFit;
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
    private _armEntrance;
    /**
     * Start the fade. Idempotent and one-shot: re-layouts, data changes and
     * re-fits never replay it (G-5) — an entrance that fires twice is an
     * animation tax, not a welcome.
     */
    private _playEntrance;
    /**
     * Advance the entrance fade by one frame. Called from {@link tickOnce}; a
     * no-op on every canvas that did not opt in, which is the default.
     */
    private _tickEntrance;
    /** Cancel the pending {@link _armAutoFit} grace timer, if any. */
    private _clearAutoFitGrace;
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
    private _frameIntent;
    private _contentBounds;
    /**
     * Frame-performance recorder — instantaneous + windowed FPS and the per-phase
     * CPU breakdown for the last N frames. Read it for a HUD (`canvas.frames.stats()`)
     * or subscribe to the per-frame `render:loop:tick` event for streaming.
     */
    get frames(): FrameMeter;
    /**
     * Run at the end of `init()`: mount every layer added so far, wire every
     * behaviour (layers first so behaviour `onRegister` finds them mounted), then
     * apply the init `config` and enable the behaviours it flags.
     */
    private _activate;
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
    update(patch: CanvasConfig, action?: string): void;
    /**
     * Push the `layers` / `behaviours` / `layouts` slices of a config patch to the
     * live instances (no store write). Shared by {@link update} and the undo
     * reconciler.
     */
    private _applyToInstances;
    /**
     * Before an `edit:` write, copy the instance's **current** value of every key
     * the edit sets but the definition doesn't hold yet into the definition — an
     * unrecorded write. The recorded edit then *changes* those keys from their real
     * old value instead of adding them, so undo restores the old value rather than
     * removing the key (which would leave the instance on the new one). Values that
     * aren't JSON (resolver functions) are skipped.
     */
    private _writeBaseline;
    /**
     * After a {@link history} undo / redo: diff the definition's `layers` /
     * `behaviours` / `layouts` slices before and after, and push each changed key to
     * its instance — the new value, or `undefined` for a key the step removed (most
     * `setOptions` read that as "back to the default"). `fitAnimation` and
     * `activeLayout` follow too.
     */
    private _reconcileDefinition;
    /** The registered instance behind a definition slice, if any. */
    private _instance;
    /**
     * Current serialisable config snapshot — drive a settings UI / save-load from
     * this. Projected from `store.view.definition` (the source of truth).
     */
    get(): CanvasConfig;
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
    runLayout(id: string, run?: LayoutRunOptions): Promise<void>;
    /**
     * Re-run the **active** layout (`definition.activeLayout`) with per-run
     * options. The engine side of `CanvasContext.runActiveLayout`; resolves
     * immediately when no layout is active.
     */
    runActiveLayout(run?: LayoutRunOptions): Promise<void>;
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
    stopLayout(): void;
    /**
     * Repaint every layer from its current state — calls {@link Layer.redraw} on
     * each (a no-op for layers that don't override it). A pure render pass:
     * positions and data are untouched. Use after an external style/theme change
     * that bypassed the per-layer dirty path, or to recover from a suspected
     * render desync. For layout re-positioning use {@link runLayout}; for both at
     * once use {@link refresh}.
     */
    redraw(): void;
    /**
     * Full refresh: re-run the active layout (`config.activeLayout`) to
     * re-position items, then {@link redraw} every layer. The single call behind
     * a toolbar "re-render" button — re-layout + repaint in one. Resolves once
     * the layout settles; the layout step is skipped when no `activeLayout` is set.
     */
    refresh(): Promise<void>;
    /**
     * Show a transient message on the shared canvas message channel — emits a
     * `message` event for a status surface (e.g. canvas-react's `CanvasMessageBar`)
     * to display. Last-write-wins: a newer message replaces the current one. With
     * `timeout` (ms) the surface auto-clears it after that delay; without, it
     * stays until replaced or {@link clearMessage}-ed. Reachable from layers /
     * behaviours / layouts too, via `ctx.showMessage`.
     */
    showMessage(text: string, timeout?: number): void;
    /** Clear the current canvas message (emits `message` with `text: null`). */
    clearMessage(): void;
    /**
     * The message currently on the channel, or `null` when idle. Stored so a
     * status surface that subscribes *after* a message was pushed (e.g. a footer
     * `CanvasMessageBar` mounting once the engine is ready) can show the current
     * line instead of missing the one-shot `message` event. Note: a `timeout`ed
     * message is auto-cleared by the displaying surface, not the engine, so this
     * keeps reporting it until replaced or {@link clearMessage}-ed.
     */
    get currentMessage(): string | null;
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
    export(opts?: ExportImageOptions): Promise<Blob>;
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
    exportSVGString(opts?: ExportSvgOptions): string;
    /**
     * Export the canvas as a `data:` URL — the synchronous counterpart to
     * {@link export}, handy for `<img src>` / quick previews. Prefer {@link export}
     * for downloads (a `Blob` URL avoids a large base64 string). Same options and
     * throw conditions as {@link export}.
     */
    exportDataURL(opts?: ExportImageOptions): string;
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
    exportState(): CanvasStateSnapshot;
    /**
     * Restore the canvas from a {@link CanvasStateSnapshot} produced by
     * {@link exportState}. Loads each layer's data, pushes the definition to the
     * registered instances, and restores the live interaction (unless
     * `skipInteraction`). The canvas's layers/behaviours/layouts must already be
     * registered under the snapshot's ids — import addresses instances by id, it
     * does not create them. Delegates to {@link importCanvasState}.
     */
    importState(snapshot: CanvasStateSnapshot, opts?: ImportCanvasStateOptions): void;
    /**
     * The current full canvas state as a JSON string (pretty-printed by default).
     * Sugar over `JSON.stringify(this.exportState(), null, space)`; delegates to
     * {@link canvasStateToJSON}.
     */
    stateToJSON(space?: string | number): string;
    /**
     * Serialise the full canvas state and trigger a browser download of the
     * `.json` file. No-op outside a DOM environment. Delegates to
     * {@link downloadCanvasState}.
     */
    downloadState(filename?: string): void;
    /**
     * Restore the canvas from a {@link CanvasStateSnapshot}, a JSON string, or a
     * picked `File` / `Blob` (e.g. from an `<input type="file">`). Parses the
     * source then applies it like {@link importState}. Delegates to
     * {@link importCanvasStateFromFile}.
     */
    importStateFrom(source: CanvasStateSource, opts?: ImportCanvasStateOptions): Promise<void>;
    /**
     * Tear down everything: ticker callback, registries (which unmount their
     * Layers / destroy their Behaviours and any ScreenLayer roots they own),
     * the world subtree, bus subscriptions, pixi Application. Idempotent.
     */
    destroy(): void;
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
    private _startFrameLoop;
    private _stopFrameLoop;
    /**
     * Build the camera and the `CanvasContext` on top of the mounted renderer.
     * No pixi object is constructed here: the scene root came from
     * `renderer.mount`, the camera rides a renderer-supplied binding, and every
     * surface / overlay is a renderer factory call.
     */
    private _wireScene;
}

/**
 * Attributes each rendered frame to the user gesture in flight, so the frame
 * meter can tag its samples with an {@link InteractionKind}. This is the piece
 * that turns a flat FPS trace into "which action caused the dip".
 *
 * It listens to the bus's interaction lifecycle and derives a single current
 * label. Two shapes of gesture are handled differently:
 *
 * - **Bracketed** (`drag`, `layout`) — have explicit start/end events, so they
 *   are sticky: active from start until end.
 * - **Momentary** (`zoom`, `pan`) — fire a burst of events during the gesture
 *   but have no "end", so they decay to `'idle'` after {@link IDLE_MS} of
 *   silence, capturing the inertia tail without sticking forever.
 * - **Hover** sits between: `input:node:hover` carries an id (enter) or `null`
 *   (leave), so it is tracked as an explicit boolean.
 *
 * Priority when several are live: `layout` > `drag` > `hover` > momentary
 * (`zoom`/`pan`) > `idle`. Bracketed, higher-intent gestures win over the
 * momentary camera tail.
 */
declare class InteractionTracker {
    private readonly now;
    /** Revert to `'idle'` this many ms after the last momentary (zoom/pan) event. */
    private static readonly IDLE_MS;
    private layoutActive;
    private dragActive;
    private hoverActive;
    /** Most recent momentary gesture (`zoom` / `pan`) and when it last fired. */
    private momentary;
    private momentaryAt;
    private readonly offs;
    constructor(bus: CanvasEventBus, now?: () => number);
    /** Record a momentary gesture and stamp its time so it decays to idle. */
    private markMomentary;
    /**
     * The interaction the frame at `now` (a `performance.now()`-scale timestamp)
     * should be attributed to. Pass the frame's own start time so the idle-decay
     * is measured against the frame, not wall-clock drift.
     */
    current(now?: number): InteractionKind;
    /** Detach every bus subscription. */
    dispose(): void;
}

/**
 * The view lock — "Lock" is app policy, not an engine concept: it disables a
 * configurable set of behaviours (pan + node drag by default) and leaves zoom
 * live. Plain functions over a `Canvas`, shared by the `view.lock` command and
 * `@invana/canvas-react`'s `useLock`, so a panel toggle and a hook can't
 * disagree about whether the view is locked.
 */

/**
 * Whether the view is locked: at least one targeted behaviour is registered
 * and every registered one is disabled.
 *
 * @param behaviourIds Behaviours the lock covers. Default `['pan', 'drag-node']`.
 */
declare function isViewLocked(canvas: Canvas, behaviourIds?: readonly string[]): boolean;
/**
 * Lock (disable) or unlock (enable) the targeted behaviours that are
 * registered. Goes through the registry, so `scene:behaviour:enable` /
 * `disable` fire and bound controls re-read. Unregistered ids are skipped.
 *
 * @param behaviourIds Behaviours the lock covers. Default `['pan', 'drag-node']`.
 */
declare function setViewLocked(canvas: Canvas, locked: boolean, behaviourIds?: readonly string[]): void;

export { type BackgroundColor, type BackgroundKind, BackgroundLayer, type BackgroundLayerOptions, type BackgroundMode, type BackgroundPatternType, type BackgroundType, CANVAS_STATE_VERSION, Canvas, type CanvasConfig, type CanvasInteractionSnapshot, type CanvasOptions, type CanvasStateSnapshot, type CanvasStateSource, DEFAULT_SHORTCUTS, type DataSerializableLayer, type DefinitionSerializable, type DevInfoCorner, DevInfoLayer, type DevInfoLayerCtorOptions, type DevInfoLayerOptions, type DragModifier, DragPanBehaviour, type DragPanBehaviourOptions, DragShapeBehaviour, type DragShapeBehaviourOptions, ElementScaleLODBehaviour, type ElementScaleLODBehaviourOptions, type EngineCommandMap, type ExportArea, type ExportBackground, type ExportImageOptions, type ExportRasterFormat, type ExportSvgOptions, FrameMeter, type ImportCanvasStateOptions, InteractionTracker, KeyboardCameraInputBehaviour, type KeyboardCameraInputBehaviourOptions, type KeyboardCameraKeymap, type KeyboardShortcutBinding, KeyboardShortcutsBehaviour, type KeyboardShortcutsBehaviourOptions, type LayersPanelCorner, LayersPanelLayer, type LayersPanelLayerCtorOptions, type LayersPanelLayerOptions, type NumberOrGetter, PinchZoomBehaviour, type PinchZoomBehaviourOptions, ScreenLayer, type ScreenLayerHit, type ShortcutKeyEvent, type SvgExportableLayer, WheelZoomBehaviour, type WheelZoomBehaviourOptions, WorldLayer, type WorldLayerHit, assertSerialisableInDev, canvasStateToJSON, deepMerge, downloadCanvasState, eventShortcut, exportCanvasState, exportImage, exportImageDataURL, exportSVG, findSerialisationViolations, importCanvasState, importCanvasStateFromFile, isMacPlatform, isViewLocked, jsonSafe, normalizeShortcut, resolveNumberOrGetter, setViewLocked };
