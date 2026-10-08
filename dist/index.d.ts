import { Container, Application, Texture, Graphics, IHitArea, Text } from 'pixi.js';
import { IRenderer, RendererMountOptions, SurfaceSpace, SurfaceOptions, ISurface, OverlaySpace, IOverlayDevice, ICameraBinding, Camera, Rect, RendererCapabilities, BaseShapeSpec, ShapePaintStyle, Point, ShapeLabelPlacement, EffectTarget, TransformDelta, StyleOverride, BaseConnectorSpec, Path, ConnectorPaintStyle, IElementRenderer, ElementEventMap, IRouter, IPathStyle, IAnchor, RegisterDecorationOptions, RegisterEffectOptions, ShapeDisplayOverride, DecorationSpec, EffectSpec, BadgeOptions, LabelSizeTarget, LabelSizePolicy, HitResult, RenderStats, LabelContent, LabelWrap, SurfaceBackdrop, OverlayFillLike, OverlayStroke, CameraTransformValue, CameraInputConfig, CameraChangeKind, CircleSpec, EllipseSpec, RectSpec, TabbedRectSpec, PathSpec, PolygonSpec, RegularPolygonSpec, StarSpec, ArcSpec, CompositeSpec, GlowDecorationStyle, PulseRingDecorationStyle, LiquidFillDecorationStyle, MarchingAntsDecorationStyle, RingDecorationStyle, MarchingAntsConnectorDecorationStyle, RingConnectorDecorationStyle, FlyMarkerConnectorDecorationStyle, FlowParticlesConnectorDecorationStyle, GlowConnectorDecorationStyle, RippleConnectorDecorationStyle, RevealConnectorDecorationStyle, ShapeLabelStyle, ConnectorLabelStyle, ToggleDecorationStyle, ToggleHitGeometry, ResizeHandleDecorationStyle, ResizeHandlePlacement, SelectionFrameDecorationStyle, SelectionFrameHandleHit, EasingName, RenderPreference } from '@invana/canvas-core';
export { AnchorCtx, AnchorShapeRef, AnchorSpec, ArcSpec, BaseConnectorSpec, BaseShapeSpec, CircleSpec, CompositePart, CompositeRootSpec, CompositeSpec, ConnectorEndpointSpec, ConnectorLabelPlacement, ConnectorLabelStyle, ConnectorPaintStyle, DecorationSpec, DecorationTarget, EffectSpec, EffectTarget, EffectTargetKind, EllipseSpec, Endpoint, FlowParticlesConnectorDecorationStyle, FlyMarkerConnectorDecorationStyle, GlowConnectorDecorationStyle, GlowDecorationStyle, HitResult, HtmlTagStyle, IAnchor, IPathStyle, IRouter, InsetAnchor, LabelBackground, LabelContent, LabelStyleCommon, LabelVisibility, LabelWrap, LiquidFillDecorationStyle, MarchingAntsConnectorDecorationStyle, MarchingAntsDecorationStyle, MarkerShapeSpec, Obstacle, Path, PathCommand, PathStyleEndpoints, Point, PolygonSpec, Polyline, ElementEventMap as PrimitivesRendererEventMap, PulseRingDecorationStyle, Rect, RectSpec, RegisterDecorationOptions, RegisterEffectOptions, RegularPolygonSpec, RenderPreference, RenderStats, ResizeHandleDecorationStyle, ResizeHandlePlacement, RevealConnectorDecorationStyle, RevealDirection, RevealEasingName, RevealHostStroke, RevealRepeat, RingConnectorDecorationStyle, RingDecorationStyle, RippleConnectorDecorationStyle, RouterCtx, SelectionFrameBorderStyle, SelectionFrameDecorationStyle, SelectionFrameHandleHit, SelectionFrameHandleShape, SelectionFramePlacement, ShapeFill, ShapeFillLayer, ShapeLabelPlacement, ShapeLabelStyle, ShapePaintStyle, ShapeStroke, StarSpec, StyleOverride, TabAlign, TabbedRectSpec, ToggleDecorationStyle, ToggleHitGeometry, TogglePlacement, TransformDelta, Vec2 } from '@invana/canvas-core';
import { CanvasEventBus, RendererBackend, HitGeometrySource, EventEmitter, ShapeHitRecord, ConnectorHitRecord } from '@invana/canvas-store';
import { Viewport } from 'pixi-viewport';

/**
 * `PixiRenderer` — the PixiJS implementation of {@link IRenderer}, and the first
 * real one. Everything about standing a pixi backend up lives here: the
 * `Application` and its WebGPU→WebGL fallback, the shared texture-pool
 * ref-count, the render-time crash guard, the drawing surface and its resize
 * plumbing, the scene root (`stage` > `world` viewport), and the factories for
 * surfaces, overlays and the camera binding.
 *
 * `Canvas` above it is lifecycle and orchestration: it asks for devices and
 * never touches an `Application`, a `Viewport` or a `Container` of its own.
 *
 * This is the class P6 moves into `@invana/renderer-pixijs` — at which point
 * `@invana/canvas` keeps {@link IRenderer} and imports no pixi. Nothing here is
 * engine policy: picking (D5), the visible set (G4), layouts, behaviours and SVG
 * export all stay above this line.
 */

interface PixiRendererOptions {
    /**
     * The canvas-wide bus. A renderer publishes lifecycle and input onto it
     * (`canvas:renderer:fallback` when a WebGPU render crash forces a downgrade);
     * it never reads engine state from it.
     */
    events: CanvasEventBus;
    /**
     * Per-shape hit floor forwarded to each surface's primitives renderer. Engine
     * policy that surfaces need at construction; see `PrimitivesRendererOptions`.
     */
    hitFloorPx?: number;
}
declare class PixiRenderer implements IRenderer {
    private readonly events;
    private readonly hitFloorPx?;
    private app?;
    private _stage?;
    private _world?;
    private _camera?;
    /**
     * The canvas's single pointer dispatcher. Built with the camera (so it is
     * available from the same moment a surface can be), it owns the stage
     * listeners and decides which surface wins each press — see
     * {@link PixiPointerRouter} for why that is not each surface's own job.
     */
    private _pointerRouter?;
    private _holdsSharedTexturePool;
    private _resizeObserver?;
    private _onRendererResize?;
    /**
     * Set once the WebGPU renderer has crashed at render time and we've halted the
     * loop + emitted `'canvas:renderer:fallback'`. Guards against repeating it.
     */
    private _fellBack;
    constructor(opts: PixiRendererOptions);
    mount(host: HTMLElement, opts?: RendererMountOptions): Promise<void>;
    /**
     * Headless entry: adopt a caller-supplied stage instead of creating an
     * `Application`. **Adapter-specific, deliberately not on {@link IRenderer}** —
     * it exists for unit tests of the layer / behaviour / state pipeline that
     * don't need a GPU, and a second backend has no obligation to offer it.
     */
    mountStage(stage: Container, screenWidth: number, screenHeight: number): void;
    destroy(): void;
    createSurface(space: SurfaceSpace, id: string, opts?: SurfaceOptions): ISurface;
    createOverlay(label: string, space?: OverlaySpace): IOverlayDevice;
    createCameraBinding(): ICameraBinding;
    /**
     * Hand back the engine's `Camera` once it has been built on this renderer's
     * binding.
     *
     * The ordering is unavoidable and worth stating: the binding must exist before
     * a `Camera` can wrap it, and a surface needs the `Camera` (its primitives
     * renderer scales the hit floor and prioritises label rasterisation by what is
     * in view). So the sequence is `createCameraBinding` → `new Camera` →
     * `attachCamera` → `createSurface`. {@link createSurface} throws rather than
     * silently drawing without one.
     */
    attachCamera(camera: Camera): void;
    /** The pointer router, or a thrown error if `attachCamera` hasn't run yet. */
    private requirePointerRouter;
    /**
     * Advance backend animation and **present the frame** (G3).
     *
     * Pixi's `Application.ticker` is stopped at mount, so this call is the only
     * thing that renders. The engine owns the sole `requestAnimationFrame` and
     * calls here once per frame, *after* it has advanced the camera, flushed data
     * and updated layers — which is what makes frame order deterministic and lets
     * a test drive time by hand.
     *
     * No-op after a render-time fallback: `_fellBack` means the host is swapping
     * backend and another frame would just re-hit the crash.
     */
    tick(_dtMs: number): void;
    resize(width: number, height: number): void;
    worldContentBounds(): Rect | null;
    /**
     * Raster capture (G1). Extracts onto a **fully transparent clear** so the
     * caller composites its own background — which is what keeps a
     * `'transparent'` request honest.
     *
     * `region` is world-local (the world container's own space, before the camera
     * transform), matching what `captureRect` computes.
     */
    extract(opts: {
        region: Rect;
        resolution: number;
    }): HTMLCanvasElement;
    get canvasElement(): HTMLCanvasElement | null;
    /** The pixi `Application`, when one exists. `undefined` on the headless path. */
    get application(): Application | undefined;
    /** The scene root. Screen-space surfaces attach here, above `world`. */
    get stage(): Container;
    /** The camera-transformed world root. World-space surfaces attach here. */
    get world(): Container;
    get backend(): RendererBackend;
    get capabilities(): RendererCapabilities;
    /** Device facts for the `canvas:renderer:ready` event. */
    deviceInfo(): Record<string, unknown>;
    /**
     * Build the scene root: a `Viewport` as `world` under the stage. World is
     * added first (bottom); screen-space surfaces attach to the stage afterwards
     * and therefore draw above it — pixi child order *is* draw order.
     */
    private buildScene;
    /**
     * Wrap the renderer's `render` in place so a WebGPU render-time crash
     * (uncatchable at init) routes to {@link handleRenderError} instead of
     * throwing uncaught out of pixi's ticker. Non-invasive: same render path,
     * same timing, only a guard added.
     */
    private installRenderGuard;
    /**
     * Recover from a render-time crash. On WebGPU: halt the render loop and emit
     * `'canvas:renderer:fallback'` **once** so the host re-inits on WebGL (the
     * `@invana/canvas-react` `<Canvas>` does this automatically). Any other
     * backend has nowhere to fall back to, so the error is re-thrown.
     */
    private handleRenderError;
    private requireStage;
    private requireWorld;
    private requireCamera;
}

/**
 * `TextureRegistry` — user-facing texture preload and cache.
 *
 * Designed to be created once (e.g. in `GraphLayer.onMount`) and passed to
 * one or more `PrimitivesRenderer` instances via `ShapeHostInfo.textureRegistry`.
 * The renderer uses the registry internally when resolving image-fill specs —
 * callers never need to reference texture keys directly.
 *
 * If no registry is provided to `PrimitivesRenderer`, the renderer creates an
 * internal one so that URL-based loading still works (lazy, per shape).
 *
 * Lifecycle:
 *   - Textures loaded via `load` / `preload` / `loadAtlas` are owned by
 *     this registry and destroyed in `destroy()`.
 *   - Textures registered via `register(url, texture)` are external — the
 *     caller owns the lifecycle; `destroy()` does not touch them.
 */

declare class TextureRegistry {
    /** Textures we loaded — we own the lifecycle. */
    private readonly owned;
    /** Textures registered externally — caller owns the lifecycle. */
    private readonly external;
    /** Look up a cached texture by URL or atlas frame name. */
    get(url: string): Texture | undefined;
    has(url: string): boolean;
    /**
     * Register a pre-built texture. Useful for programmatically generated or
     * SVG-constructed textures. The caller retains ownership — `destroy()` will
     * not unload this texture.
     */
    register(url: string, texture: Texture): void;
    /**
     * Load a single URL and cache it. Returns the cached texture on subsequent
     * calls (synchronous fast path). Uses pixi's `Assets` pipeline so the
     * result integrates with the global asset manager.
     *
     * For URLs without a recognised image extension (e.g. picsum.photos,
     * signed CDN URLs, API endpoints) the `loadTextures` parser is explicitly
     * requested so PixiJS doesn't skip loading due to an unknown file type.
     */
    load(url: string): Promise<Texture>;
    /** Batch-preload a list of URLs in parallel. Await before first render to avoid mid-frame async loads. */
    preload(urls: string[]): Promise<void>;
    /**
     * Load a PixiJS spritesheet atlas JSON. After this resolves, individual
     * frame textures are accessible via `get(frameName)` where `frameName`
     * matches the keys declared in the atlas JSON.
     *
     * All 1k-icon atlases packed into a single PNG → one GPU upload, one
     * draw call for every sprite sharing that atlas page.
     */
    loadAtlas(jsonUrl: string): Promise<void>;
    /**
     * Unload and destroy all textures owned by this registry. External textures
     * (registered via `register`) are not touched. Call when the host Layer
     * unmounts.
     */
    destroy(): void;
}

/**
 * Public type surface for `primitives/`.
 *
 * Contracts for every shape, connector, decoration, marker, and router. This
 * module is the dependency root of the primitives package — implementation
 * files import from here, but this file imports nothing from sibling
 * `primitives/*` files (only from outside primitives: pixi, events,
 * `TextureRegistry`).
 *
 * Architecture: see `primitives-redesign-plan.md` (macro) and
 * `primitives-v0-plan.md` (this v0 slice) at the repo root.
 */

interface ShapeHostInfo {
    readonly surface: Container;
    readonly textureRegistry: TextureRegistry;
    /**
     * Re-invoke the shape's `draw(currentSpec)`. Used by async fill loaders
     * (any `image` layer) to repaint once a texture resolves.
     */
    readonly requestRedraw: () => void;
}
/**
 * Information a `Connector` instance receives at construction. The connector
 * resolves marker shapes via the read-only shape registry, then invokes each
 * marker class's static `paintInto` to render the marker into the
 * connector's `Graphics`.
 */
interface ConnectorHostInfo {
    readonly surface: Container;
    readonly shapeRegistry: ReadonlyMap<string, ShapeCtor>;
}
/**
 * Information a shape decoration receives in `mount` / `update`. Decorations
 * call `host.shape.paintInto(g, ...)` to repaint the host silhouette into
 * their own `Graphics` with style overrides — the entire shape ↔ decoration
 * contract.
 */
interface ShapeDecorationHostInfo {
    readonly hostId: string;
    readonly slot: string;
    readonly slotZIndex: number;
    /** Local-space axis-aligned bounding box of the host shape. */
    readonly bounds: Rect;
    /** Surface to attach the decoration's `gfx` to. Set to the host shape's `gfx`. */
    readonly surface: Container;
    /** The host shape itself — decorations call `shape.paintInto(...)`. */
    readonly shape: IShape;
    /**
     * Max resting outer extent across every decoration attached to this host
     * (including this one — but most decorations contribute `0`, so it acts
     * like a sibling max in practice). Aggregated from each decoration's
     * `getOuterExtent()` by the renderer. The `LabelDecoration` reads this
     * to push outside-placement labels past the outermost ring / halo so
     * they don't collide.
     *
     * Animated transients (pulse-ring, ripple) contribute `0` by design —
     * labels stay anchored to the resting silhouette rather than tracking
     * the peak of an animation.
     */
    readonly outerDecorationExtent: number;
}
/**
 * Information a connector decoration receives. Decorations call
 * `host.connector.paintInto(g, spec, path, style)` for silhouette repaint,
 * or read `path` directly for parametric walking (e.g. label-along-path).
 */
interface ConnectorDecorationHostInfo {
    readonly hostId: string;
    readonly slot: string;
    readonly slotZIndex: number;
    readonly path: Path;
    readonly surface: Container;
    readonly connector: IConnector;
    readonly connectorSpec: BaseConnectorSpec;
}
/**
 * A 2D primitive with a closed silhouette (circle, rect, polygon, path).
 * Implementations typically extend `ShapeBase` (which provides `paintInto`,
 * fill/stroke resolution, and icon-layer plumbing for free); shapes whose
 * `draw` and `paintInto` differ (text, images-as-sprites) implement this
 * interface directly.
 */
interface IShape<TSpec extends BaseShapeSpec = BaseShapeSpec> {
    /** Root display object — renderer adds/removes this on the host surface. */
    readonly gfx: Container;
    /** (Re)paint the shape from the current spec. Called on add and on update. */
    draw(spec: TSpec): void;
    /** Local-space axis-aligned bounding box for hit-testing & decorations. */
    bounds(): Rect;
    /**
     * Decoration entry point — repaint the silhouette into someone else's
     * `Graphics` with a style override. The shape uses its own current spec;
     * decorations don't pass one. (Distinct from `ShapeCtor.paintInto` —
     * the static method markers use, which takes an explicit spec + anchor.)
     *
     * Optional for back-compat: `TextShape` (and similar non-silhouette shapes)
     * may omit it. Decorations check for presence before calling and silently
     * skip when absent (text labels just won't have glow / halo applied).
     * Every shape that extends `ShapeBase` has it for free.
     */
    paintInto?(g: Graphics, style?: ShapePaintStyle): void;
    /**
     * Hit-test region for this shape in shape-local coordinates. Used by
     * `ShapeBase` to wire `gfx.hitArea` at construct time, and by
     * `PrimitivesRenderer.hitTest` as the **fallback** narrow phase for shape
     * kinds the pure spec geometry doesn't cover — i.e. kinds a consumer added
     * via `registerShape`. Built-in kinds are picked from the spec instead
     * (`containsSpec`), so picking works with no display object at all.
     *
     * The default `ShapeBase` implementation derives the region from
     * `drawGeometry` via `bodyGfx.containsPoint`, so the hit area always
     * matches the rendered silhouette + stroke. Custom shapes that want
     * spec-driven picking should register their geometry rather than override
     * this.
     */
    getHitArea(): IHitArea;
    /**
     * Optional precise containment in shape-local coordinates. Built-ins
     * delegate to the pure per-kind function in `specs/shapeGeometry/`, so a
     * caller holding an instance and a caller holding only a spec get the same
     * answer.
     */
    contains?(localX: number, localY: number): boolean;
    /**
     * Optional **sub-part** hit test in shape-local coordinates: returns the
     * `hitId` of the topmost interactive sub-part containing the point, or
     * `undefined`. Shapes composed of many addressable regions (e.g. a
     * {@link CompositeShape} card with `hitId`-tagged parts) implement this so
     * the renderer can emit `shape:partover` / `shape:partout`. Omit for atomic
     * shapes — the renderer simply won't emit part events for them.
     */
    hitTestPart?(localX: number, localY: number): string | undefined;
    /**
     * Optional — re-rasterise any **internal text** this shape mounts (e.g. a
     * {@link CompositeShape}'s `label` parts) at the given device resolution, so
     * it stays crisp when the camera zooms in. The renderer forwards its tracked
     * label resolution here on mount and whenever the label-resolution LOD
     * behaviour pushes a new value — the shape counterpart to a `LabelDecoration`'s
     * `setResolution`. Atomic shapes with no mounted text omit it.
     */
    setLabelResolution?(resolution: number): void;
    /**
     * Optional shape-local "visual centre" — the point inset-content layers
     * with `anchor: 'center'` snap to. Defaults to the AABB midpoint when
     * omitted, which is correct for `CircleShape` and `RectShape` (their
     * silhouette fills the AABB). Non-rectangular shapes — triangle, hexagon,
     * star, free-form polygon — override to return the geometric centroid
     * (typically the shape's local origin), so a glyph drawn on a triangle
     * sits on the visual centroid instead of floating above it.
     */
    visualCenter?(): Point;
    /**
     * Optional shape-local box a `label` decoration should anchor against for
     * the given `placement`, overriding the shape's AABB. Return `undefined`
     * to keep the default (the full AABB).
     *
     * This lets a shape with internal structure direct labels at the *region*
     * that placement names, rather than at the silhouette's outer box —
     * `TabbedRectShape` sends every `inside-*` placement into its tab, since
     * its body interior belongs to the content it frames. Because the
     * inside-placement inset is proportional to the anchor box, routing the
     * label to a small fixed region also decouples its position from how
     * large the rest of the shape grows.
     *
     * Applies to both the anchor math and the `inside-*` fit cascade, so a
     * label targeted at a sub-region is also budgeted against it.
     */
    labelAnchorBox?(placement: ShapeLabelPlacement): Rect | undefined;
    /**
     * Optional analytical boundary-intersection in shape-local coordinates,
     * **relative to the shape's geometric centre** (NOT its `(0, 0)` origin).
     * Returns the point on the silhouette where the ray from the centre to
     * `localFromCenter` exits — or `null` to defer to the AABB fallback.
     *
     * The centre-relative convention decouples anchor placement from each
     * shape's local-origin choice (`CircleShape` is centred at origin;
     * `RectShape` is anchored top-left). Shapes with non-rectangular
     * silhouettes (circle, ellipse, polygon) override; rect-like shapes fall
     * back to the centred-AABB ray-exit provided by `ShapeBase`.
     */
    boundaryIntersect?(localFromCenter: Point): Point | null;
    /**
     * Optional silhouette obstacle-test factory. Returns a world-space test
     * `(worldX, worldY, inflate) → boolean` that says whether a point lies
     * inside (or within `inflate` units of) the shape's silhouette. Called
     * by the renderer once per route to populate `Obstacle.containsInflated`.
     *
     * Shapes with non-rectangular silhouettes implement this for pixel-tight
     * routing (`CircleShape`: distance from centre ≤ radius + inflate;
     * `PolygonShape`: signed-distance to outline; etc.). Rect-like shapes
     * with an exact AABB silhouette can omit it — the inflated AABB is
     * already tight.
     *
     * The returned callable captures the shape's current spec; the renderer
     * re-invokes `obstacleTest()` on every route so movement is reflected.
     */
    obstacleTest?(): (worldX: number, worldY: number, inflate: number) => boolean;
    /** Optional LOD hook. Renderer forwards via `setLODLevel(id, level)`. */
    setLODLevel?(level: number): void;
    /** Optional label-rasterization hook. Only meaningful for text-bearing shapes. */
    setLabelResolution?(resolution: number): void;
    /**
     * Optional content-visibility hooks used by zoom-visibility LOD; the renderer
     * feature-detects each.
     * - `setInsetContentVisible` — flip inset icons (`glyph` / `svg` / `svg-url`)
     *   on/off (`ShapeBase`).
     * - `setImageFillVisible` — show/hide the silhouette `image` fill, repainting
     *   the body (`ShapeBase`).
     * - `setTextVisible` — show/hide the shape's **internal** text (e.g. a
     *   `CompositeShape`'s `label` parts). Simple shapes carry no internal text —
     *   their label is a `'label'` decoration handled by the renderer — so they
     *   omit this.
     */
    setInsetContentVisible?(visible: boolean): void;
    setImageFillVisible?(visible: boolean): void;
    setTextVisible?(visible: boolean): void;
    destroy(): void;
}
/**
 * A line-like primitive joining two endpoints, optionally passing through
 * waypoints. v0 has a single concrete `Connector` class; visual variation
 * comes from the router (which produces the `Path`).
 */
interface IConnector<TSpec extends BaseConnectorSpec = BaseConnectorSpec> {
    readonly gfx: Container;
    /** (Re)paint the connector with a router-resolved `Path`. */
    draw(spec: TSpec, path: Path): void;
    /**
     * Repaint the connector's full silhouette (path + markers) into a
     * caller-supplied `Graphics` with style overrides. Connector decorations
     * use this to draw with pixel-identical silhouette coverage.
     */
    paintInto(g: Graphics, spec: TSpec, path: Path, style?: ConnectorPaintStyle): void;
    /**
     * Path trimmed by the source / target marker insets — i.e. the *visible*
     * body of the connector, with the segments that the markers cover removed.
     * Decorations that parameterise along arc length (ripple, fly-marker,
     * flow-particles, label-along-path, …) call this so `t = 1` lands at the
     * marker base rather than the marker tip (which sits inside the target
     * shape and hides the ripple's inner rings under the silhouette).
     * Returns the input path unchanged when no markers are configured.
     */
    getVisiblePath(spec: TSpec, path: Path): Path;
    /**
     * Toggle the body stroke without affecting markers or decoration children.
     * Body, source marker, and target marker live in three sibling Graphics
     * under `gfx`, so each can be hidden independently — used by a reveal
     * animation that owns the visible line and pops the ending marker in
     * when the reveal reaches it. The next `draw()` re-strokes the body but
     * preserves the hidden state.
     */
    setBodyVisible(visible: boolean): void;
    /** Toggle just the source-endpoint marker. See `setBodyVisible`. */
    setSourceMarkerVisible(visible: boolean): void;
    /** Toggle just the target-endpoint marker. See `setBodyVisible`. */
    setTargetMarkerVisible(visible: boolean): void;
    destroy(): void;
}
/**
 * Common base for shape and connector decorations. Presence of `tick` makes
 * the decoration animated — the renderer registers it into the per-frame
 * animation set; `tick` returns `true` to keep ticking, `false` to retire.
 * Static decorations omit `tick` and cost zero per frame after `mount`.
 */
interface IDecorationBase<THostInfo, TStyle = unknown> {
    readonly style: TStyle;
    mount(host: THostInfo): void;
    update?(host: THostInfo): void;
    tick?(deltaMs: number): boolean;
    destroy?(): void;
    /**
     * Connector-only: declare how many pixels of extra "outer extent" this
     * decoration needs past each endpoint of the routed path. The renderer
     * aggregates the max across all attached decorations and trims the path
     * by that amount before drawing — so the body + markers sit back from
     * the anchor, and the decoration's outer edge (halo radius, ripple peak)
     * lands at the anchor instead of overshooting into the host shape.
     * Omit (or return 0) when the decoration doesn't extend past endpoints
     * (e.g. marching-ants strokes the line at the host's width).
     */
    getEndPadding?(): {
        readonly source: number;
        readonly target: number;
    };
    /**
     * Shape-only: declare how many pixels past the host silhouette this
     * decoration paints **at rest**. The renderer aggregates the max across
     * sibling decorations and threads it through `ShapeDecorationHostInfo`
     * so the `LabelDecoration` can push outside-placement labels past the
     * outermost ring / halo instead of overlapping them.
     *
     * Return the resting (non-animated) outer edge — a `pulse-ring` whose
     * radius oscillates 0 → 24 → 0 should still report `0`, otherwise the
     * label would yo-yo with the pulse. Static decorations that overlay
     * the host silhouette directly (`marching-ants`, the label itself)
     * also return `0`. Omit entirely when irrelevant.
     */
    getOuterExtent?(): number;
}
type IShapeDecoration<TStyle = unknown> = IDecorationBase<ShapeDecorationHostInfo, TStyle>;
type IConnectorDecoration<TStyle = unknown> = IDecorationBase<ConnectorDecorationHostInfo, TStyle>;
/**
 * What an effect modulates. Distinguishes effects that wiggle the host's
 * transform (shake, breathing, jiggle) from effects that override the host's
 * style channels (shimmer, fade-pulse, color-flash).
 *
 * Effects are NOT decorations. A decoration adds geometry alongside the host;
 * an effect modulates the host itself. Spec is untouched in either case — the
 * renderer applies the effect's contribution to the host's gfx each frame.
 */
interface ShapeEffectHostInfo {
    readonly hostId: string;
    readonly slot: string;
    /** Local-space axis-aligned bounding box of the host shape. */
    readonly bounds: Rect;
    /** The host shape itself — effects may read shape state but never paint. */
    readonly shape: IShape;
}
/**
 * Common interface for shape and connector effects. Mirrors `IDecorationBase`
 * but reads modulations instead of drawing geometry. Animated effects expose
 * `tick(deltaMs)` (renderer advances them each frame); static effects omit it
 * and only contribute via `readTransform` / `readStyle`.
 *
 * An effect declares exactly one of:
 *  - `readTransform()` when `target === 'transform'`.
 *  - `readStyle()` when `target === 'style'`.
 * The renderer ignores whichever isn't relevant for the declared target.
 */
interface IEffectBase<THostInfo, TStyle = unknown> {
    readonly target: EffectTarget;
    readonly style: TStyle;
    mount(host: THostInfo): void;
    update?(host: THostInfo): void;
    tick?(deltaMs: number): boolean;
    readTransform?(): TransformDelta;
    readStyle?(): StyleOverride;
    destroy?(): void;
}
type IShapeEffect<TStyle = unknown> = IEffectBase<ShapeEffectHostInfo, TStyle>;
type ShapeEffectCtor<TStyle = unknown> = new (style: TStyle) => IShapeEffect<TStyle>;
/**
 * Information a connector effect receives. Mirrors `ShapeEffectHostInfo` —
 * effects don't draw, so no `surface` field. The renderer reads the
 * effect's contribution every frame and applies the aggregate to the
 * connector's `gfx`. Connector effects only modulate style channels
 * (tint + alpha) — transform deltas on a 1D path-resolved primitive don't
 * have a coherent meaning, so they're ignored for connector hosts.
 */
interface ConnectorEffectHostInfo {
    readonly hostId: string;
    readonly slot: string;
    /** The host connector itself — effects may read state but never paint. */
    readonly connector: IConnector;
}
type IConnectorEffect<TStyle = unknown> = IEffectBase<ConnectorEffectHostInfo, TStyle>;
/** Same target taxonomy as decorations — effects may be shape-only, connector-only, or both. */
interface ShapeCtor<TSpec extends BaseShapeSpec = BaseShapeSpec> {
    new (spec: TSpec, host: ShapeHostInfo): IShape<TSpec>;
    /**
     * Optional static paint surface for marker rendering. Connectors call
     * this to paint a marker at a polyline endpoint without instantiating
     * the shape. The spec's `x` / `y` are ignored — the caller supplies
     * position via `anchor`. When `style` is supplied, the shape's spec
     * colors are overridden (used by glow/halo to tint markers).
     *
     * `strokeWidth` is the host connector's resolved stroke width in pixels.
     * Marker shapes that scale with the line (e.g. `ArrowMarker` derives its
     * length and base width from multipliers × strokeWidth) read this. When
     * the shape is rendered standalone (not as a connector marker), pass `1`
     * or omit; the marker shape should fall back to a sensible default.
     */
    readonly paintInto?: (g: Graphics, spec: Omit<TSpec, 'x' | 'y'>, anchor: Point, angleRad: number, style?: ShapePaintStyle, strokeWidth?: number) => void;
    /**
     * Optional marker-inset reporter. When this shape is used as a connector
     * marker, returns how far back from the anchor (along the negative tangent)
     * the marker's "back edge" sits — i.e. how much the connector body must
     * be trimmed so it stops where the marker visually begins.
     *
     * For an arrow this is the tip-to-base length; for a circle / diamond /
     * square it would be the half-extent along the tangent. Shapes without a
     * meaningful back edge (or that should not affect line trimming) omit this
     * and the connector treats the inset as `0`.
     *
     * `strokeWidth` mirrors `paintInto` — markers that derive size from the
     * connector's stroke width (e.g. arrows with `lengthScale`) read it here
     * so the trim and the painted marker agree on geometry.
     */
    readonly markerInset?: (spec: Omit<TSpec, 'x' | 'y'>, strokeWidth?: number) => number;
    /**
     * Optional static AABB reporter. Returns the shape's bounding box in
     * *local* (centre-relative) coordinates — `spec.x` / `spec.y` are
     * ignored, so the same value can be reused for any positioned instance.
     *
     * Lets consumers (minimap footprint estimation, layouts that need node
     * sizes, label-collision pre-pass) query a registered shape's size from
     * the spec alone without instantiating the shape or its Pixi `Graphics`.
     * Shapes that don't implement this expose `undefined` from
     * {@link PrimitivesRenderer.boundsOfSpec}; consumers fall back to a
     * default size.
     *
     * Built-in shapes' instance `bounds()` delegates to this static so the
     * geometry isn't duplicated.
     */
    readonly boundsOf?: (spec: Omit<TSpec, 'x' | 'y'>) => Rect;
    /**
     * Optional uniform-scale operator. Returns a partial spec that resizes
     * the shape's geometry by `factor` while preserving its aspect ratio,
     * angular range, and any other shape-specific invariants. Paint
     * channels (`fill` / `stroke` / `alpha`) and position (`x` / `y`) are
     * not the shape's concern — callers compose them onto the result.
     *
     * The contract: `boundsOf(scaleSpec(spec, k)).width ==
     * boundsOf(spec).width * k` (likewise for height). I.e. uniform
     * scaling is exact for the AABB. Internal layout (a star's
     * inner/outer ratio, an arc's angular sweep, a polygon's vertex
     * topology) is preserved.
     *
     * Used by `NodeScaleLODBehaviour` to rewrite shape size as the camera
     * zooms, without switching over a closed kind enum. Shapes that don't
     * implement this expose `undefined` from
     * {@link PrimitivesRenderer.scaleShapeSpec}; the LOD behaviour skips
     * those nodes.
     */
    readonly scaleSpec?: (spec: Omit<TSpec, 'x' | 'y'>, factor: number) => Partial<TSpec>;
    /**
     * Optional **minimal form** operator — the smallest version of this
     * silhouette that still identifies it, as a partial spec to merge over the
     * original. `TabbedRectShape` returns a bodyless folder (its tab alone);
     * a shape with no meaningful reduced form omits this and callers keep the
     * spec as-is.
     *
     * Purely geometric, like {@link scaleSpec} — the shape decides what "as
     * small as this still reads" means for its own geometry, and knows nothing
     * about *why* a caller wants it. Container frames (`@invana/graph`'s group
     * nodes) use it to render a collapsed frame without switching over a closed
     * kind enum, so a shape registered at runtime via `registerShape` defines
     * its own collapsed look for free.
     *
     * Exposed to callers as {@link PrimitivesRenderer.collapsedShapeSpec}.
     */
    readonly collapsedOf?: (spec: Omit<TSpec, 'x' | 'y'>) => Partial<TSpec>;
    /**
     * Optional **fit-to-content** operator. Given the size of the content the
     * shape is carrying (a measured label, an image, …), returns the geometry
     * partial that accommodates it — `TabbedRectShape` widens its tab to the
     * title it holds.
     *
     * The split is deliberate: the **caller measures** (it owns the label and
     * the font resolution), the **shape decides** what that measurement does to
     * its geometry. So no caller needs to know that a folder has a tab, or how
     * padding and taper factor into its width.
     *
     * Exposed to callers as {@link PrimitivesRenderer.fitShapeSpecToContent}.
     */
    readonly fitToContent?: (spec: Omit<TSpec, 'x' | 'y'>, content: {
        readonly width: number;
        readonly height: number;
    }) => Partial<TSpec>;
}
type ShapeDecorationCtor<TStyle = unknown> = new (style: TStyle) => IShapeDecoration<TStyle>;
type ConnectorDecorationCtor<TStyle = unknown> = new (style: TStyle) => IConnectorDecoration<TStyle>;

/**
 * `PrimitivesRenderer` — domain-free drawing API for shapes, connectors,
 * markers, routers, and decorations.
 *
 * A Layer composes a `PrimitivesRenderer` internally and projects its state
 * into `addShape` / `addConnector` / `setDecoration` / ... calls. The
 * renderer is not a Layer and is never registered on `canvas.layers`. It
 * knows about pixels, hit-testing, and a camera; it knows nothing about
 * data, semantics, interactions, LOD policy, or label policy.
 *
 * **Five extensible registries**
 * - shapes      — `ShapeCtor`             (built-ins: circle, rect, arrow)
 * - routers     — `IRouter`               (built-ins: straight, orth, orthogonal,
 *                                          manhattan, metro, er, oneSide)
 * - pathStyles  — `IPathStyle`            (built-ins: normal, rounded, bezier, bump-radial, bump-horizontal, step-radial, smooth, bundle, loop-curve, loop-polyline)
 * - anchors     — `IAnchor`               (built-ins: center, boundary, perpendicular)
 * - decorations — shape / connector       (built-ins: glow)
 *
 * **No connector registry** — there is one concrete `Connector` class.
 * Visual variation comes from the (anchor → router → pathStyle) pipeline:
 * anchors resolve shape-id endpoints to concrete points (center / boundary),
 * routers produce a `Polyline` (topology — where bends sit), pathStyles
 * produce the final `Path` (visual style — how segments between bends are
 * drawn).
 *
 * **Lifecycle**
 *
 * Constructed by the host Layer in `onMount(ctx)`. The Layer passes
 * `this.container` (its own root pixi Container) and the canvas `Camera`.
 * On Layer unmount call `destroy()` first to clear internal bookkeeping
 * before the Layer's container is destroyed.
 */

interface PrimitivesRendererOptions {
    readonly container: Container;
    readonly camera: Camera;
    /**
     * Optional shared texture registry. When omitted, the renderer creates an
     * internal one — image fills still work (lazy-loaded), but textures are
     * not shared across renderer instances.
     */
    readonly textureRegistry?: TextureRegistry;
    /**
     * Minimum hover/click target in screen pixels — used as a *fallback*
     * by {@link hitTest}: exact geometric hits always win; only when no
     * shape contains the cursor does the dispatcher pick the closest
     * candidate within this many screen pixels of its origin. Exact
     * hits are never widened, so dense graphs don't suffer false
     * positives.
     *
     * Default `6` (cursor-friendly). Raise (`8`–`12`) for touch-friendly
     * stories; drop to `0` to forbid the fallback entirely.
     */
    readonly hitFloorPx?: number;
    /**
     * Hover **hysteresis** margin in screen pixels (edge-pick correctness I).
     * On the hover path only, the currently-hovered element of the same kind
     * is kept until a new candidate is closer by *more* than this many pixels
     * — so a sub-pixel jitter between two near-equidistant edges doesn't
     * flicker the highlight. Click / drag picking ignores this entirely.
     * Default `5`; `0` disables the stickiness.
     */
    readonly hoverHysteresisPx?: number;
    /**
     * Hover **node-incidence** radius in screen pixels (edge-pick correctness
     * J). When the hover winner is a connector and the cursor also sits within
     * this many pixels of a shape's centre, an edge *incident to that shape*
     * (an endpoint at the node) is preferred over an unrelated edge merely
     * passing through — incident edges separate near their shared endpoint,
     * where you aim. Purely geometric (endpoint-at-node), so the renderer stays
     * domain-free. Default `20`; `0` disables the bias.
     */
    readonly hoverNodeIncidencePx?: number;
}
declare class PrimitivesRenderer implements HitGeometrySource, IElementRenderer {
    private readonly shapeRegistry;
    private readonly routerRegistry;
    private readonly pathStyleRegistry;
    private readonly anchorRegistry;
    private readonly decorationRegistry;
    private readonly effectRegistry;
    private readonly shapeInstances;
    private readonly connectorInstances;
    private readonly animated;
    private readonly animatedEffects;
    /**
     * Shape instances that currently have at least one effect attached. The
     * per-frame aggregation walks this set rather than every shape instance.
     */
    private readonly hostsWithEffects;
    /**
     * Connector instances that currently have at least one effect attached.
     * Walked per frame to aggregate style modulations (tint + alpha) onto
     * `connector.gfx`. Transform deltas are ignored for connector hosts.
     */
    private readonly connectorHostsWithEffects;
    /**
     * Host → (slot → BadgeOptions). Each entry corresponds to a shape registered
     * under id `${hostId}:${slot}` and re-anchored on host updates.
     */
    private readonly badges;
    /**
     * The engine's picking engine (`hit/PickingIndex`) — spatial index, hit boxes
     * and narrow-phase geometry, all derived from **specs**. Picking is
     * interaction rather than drawing (design D5), so it lives in
     * `@invana/canvas` and stays behind when the pixi backend is extracted; this
     * renderer is only its {@link HitGeometrySource}, answering the three things a
     * spec can't carry (visual scale, routed polyline, custom-kind silhouette).
     */
    private readonly picking;
    /**
     * Most recently-pushed label rasterisation resolution. `null` until a
     * zoom-LOD behaviour (or the host app) calls `setLabelsResolution`. When
     * non-null, every newly-mounted label decoration inherits this value so
     * the user never sees a freshly-drawn label start at base fidelity and
     * snap up on the next zoom event.
     */
    private trackedLabelResolution;
    /**
     * Every decoration exposing the `setResolution` / `getResolution` hooks
     * (i.e. `LabelDecoration` / `LabelConnectorDecoration`). Maintained on
     * `setDecoration` / `disposeDecoration` so `tickAnimations` can sweep it
     * cheaply without re-scanning every shape and connector instance.
     *
     * The sweep applies the tracked resolution only to labels currently
     * inside the camera viewport — re-rastering an off-screen label burns a
     * GPU texture upload with no visible benefit. Off-screen labels catch
     * up the moment they pan in, since the sweep re-checks every frame.
     */
    private readonly labelBearingDecorations;
    /**
     * Per-frame budget on how many on-screen labels get re-rastered. Each
     * `setResolution(r)` write triggers one glyph-texture regen in Pixi's
     * next render pass. 64 keeps the regen cost inside frame budget for a
     * typical few-hundred-visible-label scene while finishing the transition
     * in under 5 frames; widen if your scenes have larger visible label
     * sets and tolerate a longer transition.
     */
    private static readonly LABEL_RASTER_PER_TICK;
    /**
     * The label-size policy per target (`setLabelSizePolicy`), or `null` when the
     * target's labels keep their natural size.
     */
    private readonly labelSizePolicies;
    /**
     * Targets whose policy changed since the last sweep — swept once even when the
     * new policy is `null`, so clearing a policy restores every label it scaled.
     */
    private readonly labelSizeDirty;
    /** Camera scale the label sizes were last swept at; `null` = never swept. */
    private labelSizeZoom;
    /**
     * Labels not yet sized at {@link labelSizeZoom}. A zoom frame sizes only what is
     * on screen and leaves the rest here; frames where the zoom holds still drain
     * it {@link LABEL_SIZE_PER_TICK} at a time. `null` = nothing pending.
     */
    private readonly labelSizeBacklog;
    /**
     * Off-screen labels sized per frame while catching up after a zoom. At
     * ~0.3 µs a label this keeps the catch-up well under 1 ms a frame.
     */
    private static readonly LABEL_SIZE_PER_TICK;
    readonly events: EventEmitter<ElementEventMap>;
    private readonly _container;
    /**
     * Connector sub-layer — added to `_container` first so it renders *below*
     * the shape layer. Connector decorations live inside `connector.gfx`
     * (children of this layer), so any decoration geometry that extends past
     * the path endpoints (e.g. a glow halo's radius, a ripple wave's
     * `maxRadius`) is naturally hidden by overlapping shapes on top —
     * matching the standard graph-viz "nodes above edges" convention.
     */
    private readonly connectorLayer;
    /** Shape sub-layer — rendered above `connectorLayer`. */
    private readonly shapeLayer;
    /**
     * Overlay sub-layer — rendered **above both** the connector and shape layers.
     * A raised element is reparented here by {@link setRaised} so the lifted set
     * floats over *all* unrelated content — crucially, a lifted **edge** paints
     * over non-lifted nodes, impossible while it stays in `connectorLayer` (which
     * is always under `shapeLayer`). Within the overlay, lifted shapes still sort
     * above lifted connectors, so a lifted node stays on top of its own edges.
     */
    private readonly overlayLayer;
    /**
     * The `'backdrop'` paint stripe — the one plane that renders **below**
     * `connectorLayer`.
     *
     * A `RenderLayer` changes *render order only*: an attached shape keeps its
     * logical parent (`shapeLayer`), so its transform, culling, decorations and
     * destruction paths are untouched — nothing is reparented. That is the whole
     * reason this is a `RenderLayer` and not a fourth `Container`, which would
     * have needed home-band restore, decoration-lifetime and destroy-ordering
     * care (`docs/group-frame-paint-band-plan.md`, rejected).
     *
     * `sortableChildren` so nested frames still order among themselves by
     * `zIndex` — a child frame paints above its parent inside the stripe.
     *
     * @see `docs/render-planes-and-emphasis-plan.md` §4.1
     */
    private readonly backdropPlane;
    /**
     * The set {@link setRaised} currently has lifted — the renderer's mirror of
     * its own overlay, so the next call knows what to drop back.
     */
    private raisedIds;
    readonly camera: Camera;
    private readonly textureRegistry;
    /** Currently-hovered target. Tracks pointerover/out diffs. */
    private currentHover;
    /** Currently-hovered sub-part (shape id + `hitId`). Tracks partover/partout diffs. */
    private currentPart;
    /** Target captured by a pointerdown — used to gate click emission. */
    private downHit;
    /** Last left-click time + target — drives double-click detection. */
    private lastLeftClick;
    constructor(opts: PrimitivesRendererOptions);
    private registerBuiltins;
    registerShape<TSpec extends BaseShapeSpec>(kind: string, ctor: ShapeCtor<TSpec>): void;
    /**
     * The shape kinds this renderer can draw, including any registered at runtime.
     *
     * Exists so a caller projecting specs from the store can tell a shape spec from
     * a connector spec by asking which registry owns its `kind` — no discriminator
     * has to be baked into the spec vocabulary. Read-only view; register through
     * {@link registerShape}.
     */
    get shapeKinds(): ReadonlySet<string>;
    registerRouter(kind: string, fn: IRouter): void;
    registerPathStyle(kind: string, fn: IPathStyle): void;
    registerAnchor(kind: string, fn: IAnchor): void;
    registerDecoration<TStyle>(kind: string, ctor: new (style: TStyle) => IShapeDecoration<TStyle> | IConnectorDecoration<TStyle>, opts: RegisterDecorationOptions): void;
    /**
     * Register an effect under a string kind. Effects are domain-free primitives
     * that modulate the host shape's transform or style channels each frame
     * (shake, breathing, shimmer, …). The effect's constructor receives the
     * caller's `style` payload; `opts.target` constrains which host kinds the
     * effect may attach to (shape-only for v0).
     *
     * Throws on `setEffect` if the registered `target` doesn't include the
     * host kind being targeted.
     */
    registerEffect<TStyle>(kind: string, ctor: new (style: TStyle) => IShapeEffect<TStyle> | IConnectorEffect<TStyle>, opts: RegisterEffectOptions): void;
    addShape<TSpec extends BaseShapeSpec>(id: string, spec: TSpec): void;
    /**
     * Attach / detach one shape's gfx to the paint stripe its spec declares.
     *
     * Two rules, both load-bearing:
     *
     * 1. **A raised shape is never in the backdrop.** `setRaised` exists to float
     *    an element above everything; leaving it attached to the stripe *below the
     *    connectors* would silently defeat that, since the stripe wins over the
     *    overlay parent. So a lifted shape detaches, and re-attaches when dropped
     *    ({@link setLifted} calls back here).
     * 2. **`detach` is unconditional.** Pixi's `RenderLayer` ignores a detach for
     *    an object it doesn't hold, so this is safe to call on every update — no
     *    "was it attached?" bookkeeping to drift out of sync.
     */
    private applyShapePlane;
    updateShape<TSpec extends BaseShapeSpec>(id: string, partial: Partial<TSpec>): void;
    /**
     * Fast-path uniform rescale for a shape — writes the gfx transform
     * directly without touching the spec or rebuilding geometry.
     *
     * `updateShape` rebuilds the underlying Pixi geometry (Graphics.clear()
     * + retrace) on every call, which dominates the cost when something
     * like `NodeScaleLODBehaviour` rewrites thousands of node sizes per
     * camera-zoom frame. `scaleShape` skips all of that: the geometry on
     * the GPU is unchanged, only its transform changes.
     *
     * **Hit-test bounds are NOT updated here.** rbush's `remove(entry)` is
     * an O(N) tree walk, so per-id `hit.update` × N shapes is O(N²) per
     * zoom frame — pathological at a few thousand shapes. Call
     * {@link reindexScaledShapeHits} once *after* a batch (typically on
     * gesture settle) to bulk-reindex in O(N log N). The hit-bounds are
     * stale until you do — acceptable when the caller knows pointer
     * interaction is unlikely mid-gesture.
     *
     * **Other limitations** — decorations and badges attached to the host
     * are **not** re-anchored against the new visible bounds; if you have
     * either on a size-LOD'd node, prefer `updateShape` or accept the
     * stale anchor. Stroke width inside the geometry scales with the
     * transform (Pixi's stroke is in local units), which is usually the
     * intent for pixel-constant sizing but means you can't independently
     * target body size and stroke width via `scaleShape` alone.
     */
    scaleShape(id: string, scale: number): void;
    /**
     * Set or clear a shape's display-only override — see
     * {@link IElementRenderer.setShapeDisplayOverride}. The gfx transform and the
     * text visibility are rewritten at once; the hit index is marked moved
     * (re-indexed lazily, like {@link moveShape}) and badges re-anchor.
     * Connectors are left to the caller.
     */
    setShapeDisplayOverride(id: string, override: ShapeDisplayOverride | null): void;
    /** Clear every display override — see {@link IElementRenderer.clearShapeDisplayOverrides}. */
    clearShapeDisplayOverrides(): void;
    /**
     * Write a shape's gfx transform from its spec origin, {@link ShapeInstance.gfxScale}
     * and its display override, and cache the drawn offset on the instance.
     *
     * The override scale is applied about the shape's visual centre `c` (local
     * bounds midpoint): with the LOD scale `g` and drawn scale `S = g·s`, the
     * centre stays where `g` alone put it (`spec + g·c + d`), so the gfx origin is
     * `spec + d + (g − S)·c`. A circle (`c = 0`) just translates; a top-left
     * rect or card grows in place instead of toward its bottom-right.
     *
     * A host with effects is handed to {@link applyEffectsToHost}, which composes
     * the override with the effect deltas (and runs every frame anyway).
     */
    private applyDisplayTransform;
    /**
     * Reconcile a shape's text visibility from its two channels: the `'label'`
     * decoration is drawn when the display override forces `showText`, or when
     * both text LOD ({@link ShapeInstance.textWanted}) and label collision
     * ({@link ShapeInstance.labelWanted}) allow it. The shape's internal text
     * (composite parts) follows the LOD channel alone — collision never sees it.
     */
    private applyTextVisibility;
    /** The `'label'` half of {@link applyTextVisibility}. No-op without a label. */
    private applyShapeLabelVisibility;
    /** Connector analogue of {@link applyShapeLabelVisibility} (no display override). */
    private applyConnectorLabelVisibility;
    /**
     * Show / hide a shape's **text** — both the external `'label'` decoration
     * (simple nodes) *and* any internal text the shape mounts (e.g. a
     * `CompositeShape`'s `label` parts, via the optional `setTextVisible` hook).
     * Gives text zoom-LOD a single entry point that covers atomic and composite
     * nodes alike; the companion trio is {@link setShapeIconVisible} /
     * {@link setShapeImageVisible}. No-op for the pieces a shape doesn't have.
     *
     * Writes the **LOD channel only** ({@link ShapeInstance.textWanted}); label
     * collision's channel is untouched, so neither undoes the other.
     */
    setShapeTextVisible(id: string, visible: boolean): void;
    /**
     * Text-LOD visibility of a connector's `'label'` decoration — the connector
     * twin of {@link setShapeTextVisible}. Writes the LOD channel only; label
     * collision keeps its own. No-op for unknown ids.
     */
    setConnectorTextVisible(id: string, visible: boolean): void;
    /**
     * What the text-LOD channel last asked for `id` — forced `true` by a display
     * override's `showText`; `false` for an unknown id. See
     * {@link IElementRenderer.isTextVisible}.
     */
    isTextVisible(id: string): boolean;
    /**
     * Show / hide a shape's **inset icon** content (`glyph` / `svg` / `svg-url`).
     * Pure `.visible` flip — no repaint. Persists across redraws. No-op for
     * shapes that don't carry inset content.
     */
    setShapeIconVisible(id: string, visible: boolean): void;
    /**
     * Show / hide a shape's silhouette **image** fill. Repaints the body with the
     * `image` layer stripped / restored. Persists across redraws. No-op for
     * shapes without an image fill.
     */
    setShapeImageVisible(id: string, visible: boolean): void;
    /**
     * **Viewport culling.** Toggle `renderable` on every *indexed* shape /
     * connector by whether its bbox intersects `visibleBounds` (grown by
     * `padWorld` so elements don't pop at the screen edge during a pan). Off-screen
     * elements are then skipped by Pixi's render pass — the working set drops
     * sharply when zoomed in, which is where it matters. Reuses the same rbush that
     * backs hit-testing (`searchRect`), so it's conservative for loose connector
     * bboxes: it may keep an off-screen edge, but never culls an on-screen one.
     *
     * Elements not in the hit index (hidden / non-hittable) are left untouched.
     * Cheap enough to run once per camera-move frame; it buys nothing for the
     * fully zoomed-out hairball (everything's on screen — that needs batching).
     */
    cull(visibleBounds: Rect, padWorld?: number): void;
    /**
     * Declare which elements should be drawn this frame — the per-frame visible
     * set (design G4). **Policy is the engine's**: it decides what is on screen
     * from its own index, and the renderer only applies the answer, which is what
     * keeps culling identical across backends.
     *
     * `null` restores everything (the old `uncull`). Elements outside the picking
     * index — hidden or non-hittable — are left untouched either way, so an
     * explicitly-hidden shape is never revived by a cull pass.
     */
    setVisibleSet(ids: ReadonlySet<string> | null): void;
    /** Undo culling — restore `renderable` on every shape / connector. */
    uncull(): void;
    /**
     * Fast-path position-only move — writes the host `gfx` transform directly,
     * skipping BOTH the geometry redraw and the decoration re-anchor that
     * {@link updateShape} performs. This is what `GraphLayer` routes every
     * layout / drag position write through.
     *
     * **Why it's correct to skip both.** A shape's silhouette is traced in
     * shape-local space and `(spec.x, spec.y)` is applied as the host `gfx`
     * translation (`ShapeBase.draw`). Decorations (labels, halos, rings, …) are
     * children of that same `gfx` and anchor to the shape's *local*,
     * position-independent bounds (`refreshShapeDecorations` reads
     * `inst.shape.bounds()`, not world position). So a pure translation needs
     * only `gfx.position.set(x, y)` — it carries the body and every decoration
     * with it for free, reproducing identical geometry. `updateShape` instead
     * re-tessellates and re-anchors on every move; profiling a ~500-node force
     * settle showed the decoration re-anchor alone was ~2.2 ms/tick (~90 % of
     * the per-move cost) while the translation itself is ~0.05 ms.
     *
     * **Hit-bounds are deferred** — like {@link scaleShape}, the per-call rbush
     * update is skipped (O(N) remove+insert → O(N²) over a full sweep). Moved
     * ids accumulate in `movedShapeHits` and are bulk-reindexed lazily on the
     * next {@link hitTest} (or eagerly via {@link reindexScaledShapeHits}).
     *
     * Badges are separate shape instances (NOT children of the host `gfx`), so
     * the transform can't carry them — they're re-anchored here when present.
     */
    moveShape(id: string, x: number, y: number): void;
    /**
     * Declare the **complete set** of elements that should be lifted above their
     * peers — shapes and connectors alike. The renderer diffs against what it
     * already has lifted, reparenting newcomers into the overlay and dropping
     * everything absent from `ids` back to its home layer.
     *
     * This is the whole raise API: one call, whole-set semantics. It is
     * deliberately *not* a pair of `raise(id)` / `lower(id)` primitives, because
     * those make every caller keep a private ledger of what it touched — and two
     * callers lifting overlapping sets then lower each other's elements, or
     * strand elements in the overlay when one of them stops running. Handing over
     * the full set makes lifting a projection the renderer reconciles, so the
     * only thing a caller has to get right is *what should be up right now*.
     *
     * Purely visual: geometry, transforms and the hit index are untouched
     * (closest-wins hit resolution reads the spec `zIndex` recorded at insert).
     * Reparenting survives redraws — updates mutate the existing `gfx` in place
     * and never re-add it to a layer.
     */
    setRaised(ids: Iterable<string>): void;
    /**
     * Move one element between its home layer and {@link overlayLayer}.
     *
     * The two z values are the only ordering the overlay needs: a lifted shape
     * (`1`) sorts above a lifted connector (`0`), so a raised node still covers
     * its own raised edges. Everything else about paint order is decided by the
     * layers themselves.
     */
    private setLifted;
    /**
     * Bulk re-index hit-test bboxes for shapes — pairs with
     * {@link scaleShape} (which intentionally skips per-call hit updates).
     *
     * Passing `ids` confines the reindex to those shapes. Omitting it
     * touches every shape instance. Either way the rbush tree is rebuilt
     * once via `clear + load` rather than N × `remove + insert`.
     *
     * Call on gesture settle (e.g. inside `NodeScaleLODBehaviour`'s
     * trailing-edge `flushReanchor`) so mid-gesture frames stay cheap and
     * hit-test accuracy snaps back the moment the user stops zooming.
     */
    reindexScaledShapeHits(ids?: Iterable<string>): void;
    /**
     * Recompute the path of every connector. Use after a batch of
     * `scaleShape` calls (e.g. one `NodeScaleLODBehaviour` zoom tick) so
     * connectors re-anchor against the freshly-scaled silhouettes — without
     * this, edges remain anchored to the pre-scale bounds and visibly fall
     * short of the smaller shape.
     *
     * Cheap when paired with the lazy `obstacles` getter in `routePath`:
     * routers that don't read obstacles (e.g. `straight`) skip the
     * `O(shapes)` collection per connector. Routers that *do* read
     * obstacles (`manhattan`, `metro`, `er`) still pay it — pair them with
     * a debounce when re-anchoring on a continuous gesture.
     */
    reanchorAllConnectors(): void;
    /**
     * Serialise every live shape + connector this renderer holds to an SVG
     * fragment (no `<svg>` wrapper) in world coordinates — the vector projection
     * behind {@link Canvas.exportSVG}. Connectors are emitted first (drawn under
     * shapes), then shapes; each shape/connector's attached `label` decoration is
     * rendered as `<text>`.
     *
     * Coverage caveats (raster export is exact for these) are documented in
     * `export/svgExport.ts`: `image` / `glyph` / `svg` fills, non-label
     * decorations, and effects are not represented in the vector output.
     */
    toSVG(): string;
    removeShape(id: string): void;
    addConnector<TSpec extends BaseConnectorSpec>(id: string, spec: TSpec): void;
    updateConnector<TSpec extends BaseConnectorSpec>(id: string, partial: Partial<TSpec>): void;
    /**
     * Fast-path render update for connectors — patches the `stroke` spec
     * and redraws on the **existing cached path** without re-running the
     * router / pathStyle / obstacle calculation.
     *
     * `updateConnector` always calls `recomputeConnectorPath`, which builds
     * an obstacle list by iterating every shape in the renderer (line 1271).
     * For a `straight` router with thousands of connectors that's
     * `O(connectors × shapes)` per update — fine for one-off restyles, but
     * lethal during continuous camera-driven reflows (e.g. `ScreenSizeBehaviour`
     * keeping stroke widths pixel-constant across zoom).
     *
     * This skips all of that: the path is unchanged (scale doesn't move
     * any endpoint in world coords), so we just redraw the body on the
     * cached `inst.path` with the new stroke. Use when you know **only**
     * the stroke is changing.
     */
    setConnectorStroke(id: string, stroke: {
        color: number;
        width: number;
    }): void;
    /**
     * True iff re-rendering connector `id` with `next` would leave its **geometry**
     * unchanged — everything but the `stroke` matches the current spec. Lets a
     * state-only re-render (hover / select highlight) take the `setConnectorStroke`
     * fast path and skip the re-route + hit-reindex a full `updateConnector` does.
     *
     * Conservative: it compares the whole spec **minus `stroke`**, so any real
     * geometry / marker / router change (or an unknown edge, or a key-order
     * mismatch) returns `false` and the caller does the full update — it can never
     * green-light a stale-geometry fast path.
     */
    connectorGeometryUnchanged(id: string, next: BaseConnectorSpec): boolean;
    /**
     * Re-route the path for `inst`, trim by aggregated decoration end-padding,
     * redraw the connector body + markers on the trimmed path, and refresh
     * any attached decorations against the new path. Called whenever the
     * spec, decorations, or padding requirements change.
     */
    private recomputeConnectorPath;
    /**
     * Fast-path render-time stroke multiplier for a connector — writes
     * `inst.strokeWidthScale` and redraws on the cached path.
     *
     * `EdgeScaleLODBehaviour` uses this each `camera:zoom` frame to keep
     * spec stroke widths pixel-constant across zoom. Critically, it does
     * **not** touch `spec.stroke.width`: the canonical spec stays as the
     * caller authored it, so a downstream `setConnectorStroke` (or a state-
     * config-driven `updateConnector` rebuild via `GraphLayer.rerenderEdge`)
     * supplies the new "base" width and the LOD multiplier applies on top
     * — no clobber, no inversion of caller intent.
     *
     * Path / obstacles / decorations are unchanged by a stroke-only
     * rescale, so this is the same shape as `setConnectorStroke`: skip
     * `recomputeConnectorPath`, just redraw on the cached path.
     */
    scaleConnectorStroke(id: string, scale: number): void;
    /**
     * Draw a connector with `inst.strokeWidthScale` baked into the spec's
     * stroke width. The original `inst.spec` is unchanged — only the spec
     * handed to `inst.connector.draw` carries the scaled width.
     *
     * The multiplication also flows through markers (sized off the stroke
     * width via `*Scale` multipliers) and the trimmed body path (computed
     * from stroke width), so the whole connector visual scales coherently.
     */
    private drawConnectorInstance;
    /**
     * Max end-padding across every decoration attached to `inst`. Decorations
     * declare their outer extent via `getEndPadding()`; we take the max per
     * endpoint so a glow with radius 16 and a ripple with maxRadius 24 on the
     * same edge result in a 24-px inset at each end (both reach the anchor;
     * the glow stops 8 px short, which is the intended "smaller halo" look).
     */
    private aggregateConnectorPadding;
    /**
     * Max resting outer extent across every shape decoration attached to
     * `inst`. Read by `LabelDecoration` (via `ShapeDecorationHostInfo`) so
     * outside-placement labels offset past the outermost ring / halo on the
     * host. Decorations that don't paint past the silhouette (label,
     * marching-ants) omit `getOuterExtent` and contribute `0`; animated
     * transients (pulse-ring) deliberately report `0` so the label doesn't
     * yo-yo with the pulse.
     */
    private aggregateShapeOuterExtent;
    removeConnector(id: string): void;
    setDecoration<TStyle = unknown>(targetId: string, slot: string, decoration: DecorationSpec<TStyle> | null): void;
    /**
     * Attach (or detach with `null`) an effect to a shape at the given slot.
     * Effects don't draw — they modulate the host shape's transform and/or
     * style. Multiple effects per host stack: transform deltas compose
     * additively (translations + rotation) and multiplicatively (scale);
     * style channels are last-writer-wins per channel by insertion order.
     *
     * Connector effects are supported and modulate the host connector's
     * style channels (tint + alpha). Transform deltas on a path-resolved
     * primitive have no coherent meaning, so transform effects on connector
     * hosts are ignored at aggregation time.
     */
    setEffect<TStyle = unknown>(targetId: string, slot: string, effect: EffectSpec<TStyle> | null): void;
    private setShapeEffect;
    private setConnectorEffect;
    /**
     * Attach a badge to a host shape. The badge is registered as a real shape
     * under id `` `${hostId}:${slot}` `` so it inherits every shape capability —
     * any registered shape kind as the plate, any `ShapeFillLayer` as content
     * (solid / image / glyph / svg / svg-url), and any registered decoration
     * via the `decorations` field.
     *
     * On `updateShape(hostId, …)` every attached badge re-anchors automatically.
     * On `removeShape(hostId)` every attached badge is removed first.
     *
     * Calling `setBadge` with the same `(hostId, slot)` replaces the previous
     * badge (the old badge shape and any of its decorations are destroyed).
     */
    setBadge(hostId: string, slot: string, options: BadgeOptions): void;
    removeBadge(hostId: string, slot: string): void;
    hasBadge(hostId: string, slot: string): boolean;
    /**
     * Recompute every attached badge's `(x, y)` from the host's new bounds.
     * Called from `updateShape` when the host has badges; safe to no-op when
     * the badge map for `hostId` is empty. Shape-host flavour only; see
     * {@link reanchorConnectorBadges} for the connector-path flavour.
     */
    private reanchorBadges;
    /**
     * Recompute every attached badge's `(x, y, rotation)` from the connector
     * host's new path. Called from {@link recomputeConnectorPath} whenever
     * the routed path changes (source / target shape moved, anchor / router /
     * waypoints reconfigured, marker insets adjusted).
     */
    private reanchorConnectorBadges;
    /**
     * Per-endpoint clearance to apply when an endpoint-anchored badge sits
     * on a connector — marker length (so the arrowhead isn't tucked under
     * the badge) plus {@link DEFAULT_ENDPOINT_BADGE_GAP_PX} of visual gap.
     *
     * Independent of decoration `getEndPadding()` (which feeds path-trim
     * for the body stroke); markers paint at the *untrimmed* endpoints, so
     * we have to look at the marker spec directly.
     */
    private connectorBadgeEndpointClearance;
    setLODLevel(id: string, level: number): void;
    rasteriseLabel(id: string, resolution: number): void;
    /**
     * Push a rasterisation resolution to every label decoration (shape + edge)
     * currently attached, and remember it so labels mounted later inherit the
     * same fidelity. Driven by zoom-aware behaviours
     * (see `@invana/graph` / `TextResolutionLODBehaviour`): when the camera
     * zooms past a threshold, push `dpr * zoom` to re-rasterise glyphs sharp.
     *
     * Idempotent: Pixi internally short-circuits `Text.resolution` writes when
     * the value matches, so calling this with the unchanged value every frame
     * is safe and cheap.
     */
    setLabelsResolution(resolution: number): void;
    /**
     * Forward the tracked label resolution to `deco` when it exposes a
     * `setResolution` method. Called on every label mount (so a newly-added
     * label inherits the current resolution immediately, no waiting for the
     * next tier-change to populate it).
     */
    private applyTrackedLabelResolution;
    /**
     * Set (or clear) how the `'label'` decorations of every shape / connector are
     * sized across camera zoom — see {@link IElementRenderer.setLabelSizePolicy}.
     * Applied on the next frame tick, then again whenever the camera scale moves;
     * labels mounted later and hosts re-scaled by `scaleShape` are sized as they
     * change. Badge text and a shape's internal text are never touched.
     */
    setLabelSizePolicy(target: LabelSizeTarget, policy: LabelSizePolicy | null): void;
    /**
     * Re-size labels when a policy changed or the camera scale moved under an
     * active policy. A zoom frame sizes only the labels **on screen** (one
     * transform write each, like a node-size LOD's `scaleShape`) and queues the
     * rest; frames where the zoom holds still keep the on-screen set current and
     * size a chunk of the queue, so off-screen labels converge within a few frames
     * and the per-frame cost tracks what is visible, not the graph size. Labels a
     * label LOD hides are skipped and sized when shown again.
     */
    private tickLabelSizes;
    /**
     * Size one shape's `'label'` decoration under the shape policy. The host scale
     * is the shape's LOD scale ({@link ShapeInstance.gfxScale}) — cancelled by the
     * policy — and **not** its display override's, so a fisheye lens still
     * magnifies the label. Skips badge plates (their text is the badge) and, under
     * a policy, labels the text LOD hides — {@link setShapeTextVisible} sizes those
     * when they come back. Collision-hidden labels are still sized: collision
     * measures them to decide whether to show them again.
     */
    private sizeShapeLabel;
    /** Connector analogue of {@link sizeShapeLabel}; a connector's gfx is unscaled and never contains its label. */
    private sizeConnectorLabel;
    tickAnimations(deltaMs: number): void;
    /**
     * Re-raster labels whose current resolution differs from the tracked
     * target, prioritising those currently inside the camera viewport so the
     * tier crossing reads as a fade-into-crispness on what the user is
     * looking at. Off-screen labels are deferred to subsequent ticks but
     * *not* skipped forever — once the in-view set converges, remaining
     * budget rolls over to off-screen labels so panning later lands on
     * already-crisp text. Bounds that come back degenerate (Infinity AABB
     * from a container that hasn't laid out yet) fall through to the second
     * pass and are treated as off-screen for this tick.
     *
     * Convergence: once every label matches the target, the loop is O(N)
     * `getResolution` checks per frame with zero texture work — negligible.
     */
    private tickLabelRasterise;
    /**
     * Aggregate every effect attached to `inst` and write the result onto the
     * host gfx. Resets to the spec baseline first so removing effects (or a
     * scale dropping to identity) cleanly reverts. Called every frame for
     * hosts with at least one effect, and synchronously on `setEffect` so
     * non-animated effects take effect immediately.
     */
    private applyEffectsToHost;
    /**
     * Aggregate every effect attached to a connector and write the result onto
     * `connector.gfx`. Resets to the spec baseline first so removing effects
     * cleanly reverts. Only style channels are honoured for connector hosts
     * (transform deltas on a path-resolved primitive have no coherent
     * meaning); transform effects on connectors contribute nothing.
     */
    private applyEffectsToConnector;
    private resetConnectorToBaseline;
    /** Restore the host gfx to its spec-derived baseline (used after the last effect is removed). */
    private resetHostToBaseline;
    /**
     * Resolve the hit at a world point under render-order rules. Two
     * priority bands:
     *
     *   1. **Exact geometric hits** — any candidate whose
     *      `IHitArea.contains` (shapes) or stroke-tolerance polyline
     *      distance (connectors) covers the cursor. Ranked to match what
     *      is drawn on top:
     *        a. higher `zIndex` wins (mirrors visual stacking);
     *        b. on equal `zIndex`, a shape (node) beats a connector (edge)
     *           — shapes render above connectors;
     *        c. on equal `zIndex` *and* same kind, the closest one to its
     *           origin / polyline wins.
     *      So a node sitting over an edge takes the hit even when the edge's
     *      polyline passes nearer the cursor than the node's centre — and an
     *      edge with an explicitly higher `zIndex` still wins.
     *   2. **Floor fallback** — if NO exact hit, return the closest
     *      candidate whose origin sits within `hitFloorPx` screen pixels
     *      of the cursor. Lets tiny pinpoints stay hoverable in sparse
     *      regions without widening hit areas in dense ones.
     *
     * Returns `null` when nothing is hit.
     */
    /**
     * Enable / disable all picking for this renderer. When disabled, {@link hitTest}
     * returns `null` regardless of what's under the cursor — the owning layer flips
     * this from `onVisibleChange` so a hidden layer's elements aren't clickable.
     */
    setHitTestEnabled(enabled: boolean): void;
    hitTest(worldX: number, worldY: number, exclude?: ReadonlySet<string>): HitResult | null;
    /**
     * The facts about a shape that a spec can't carry: the visual scale a LOD
     * behaviour wrote onto `gfx` without rebuilding geometry, and — for a
     * `registerShape` custom kind the spec vocabulary has never heard of — the
     * instance's own silhouette and local bounds.
     *
     * `gfxScale` matters because `NodeScaleLODBehaviour` (and
     * `HoverActivateBehaviour.zoomedOutScale`) inflate a shape visually without
     * touching its spec; the index divides world deltas by it before the narrow
     * phase, so a 5×-scaled shape whose silhouette covers the cursor still picks.
     */
    shapeRecord(id: string): ShapeHitRecord | null;
    /**
     * A connector's spec plus its **routed, sampled** polyline. Routing happens
     * here (the router registry is renderer-side), and the sample is memoised on
     * the instance, so this is a cheap read per query.
     */
    connectorRecord(id: string): ConnectorHitRecord | null;
    shapeIds(): Iterable<string>;
    /**
     * Hover-specific pick — {@link hitTest}'s winner refined by the index's two
     * hover heuristics (node-incidence bias and hysteresis; see
     * `PickingIndex.pickHover`). **Click / drag picking deliberately stays on the
     * raw {@link hitTest}** — a press must resolve exactly what is under the
     * cursor, with no memory of the last hover — so this is called only from
     * {@link routePointerMove}.
     *
     * `currentHover` is passed in rather than read by the index: hover is
     * interaction bookkeeping this renderer owns, and the index stays a pure
     * query surface.
     */
    private pickHover;
    /**
     * Hover-path pick at a point already expressed in **this surface's own
     * space** (world coordinates for a `world` surface, screen pixels for a
     * `screen` one). Exposed for {@link PixiPointerRouter}, which owns the
     * single canvas-wide hit walk and asks each surface in turn.
     *
     * Uses the hysteresis-aware {@link pickHover}; press picking uses the raw
     * {@link hitTest} instead, for the reason documented on {@link pickHover}.
     */
    pickHoverAt(x: number, y: number): HitResult | null;
    /**
     * Apply a resolved hover for this surface: diff it against the currently
     * hovered target and emit `pointerover` / `pointerout`, plus the sub-part
     * `partover` / `partout` stream.
     *
     * The router calls this on **every** registered surface each move frame —
     * with the resolved hit on the one that won the pick and `null` on all the
     * others — so a surface that loses the pick correctly un-hovers whatever it
     * was holding. Cursor styling is the router's, not ours: only it knows which
     * surface won.
     */
    dispatchMove(hit: HitResult | null, x: number, y: number): void;
    /**
     * This surface won the press: emit `shape:pointerdown` / `connector:pointerdown`
     * and remember the target so {@link dispatchUp} can gate the click.
     */
    dispatchDown(hit: HitResult, x: number, y: number, button: number, pointerId: number): void;
    /**
     * This surface won the release: emit `pointerup`, then — when the press
     * landed on the same target with the same button — `click` / `doubleclick`
     * (left) or the context-menu pair (right).
     */
    dispatchUp(hit: HitResult, x: number, y: number, button: number, pointerId: number): void;
    /**
     * The press or release resolved somewhere else (another surface, or empty
     * canvas). Drop the captured press so a later release on *this* surface
     * can't synthesise a click out of two unrelated halves of a gesture.
     */
    clearDown(): void;
    /**
     * Nothing anywhere was hit on a right-button release. The router fans this
     * to every surface so per-layer subscribers (`ContextMenuBehaviour` listens
     * on its own layer's renderer) keep receiving it as they did when each
     * surface routed its own input.
     */
    emitBackgroundContextMenu(x: number, y: number): void;
    /** Is a press currently captured on this surface? Read by the router for cursor gating. */
    get hasCapturedPress(): boolean;
    /**
     * Resolve the `hitId` of the sub-part under a point, or `undefined` (not a
     * shape / no `hitTestPart` / no part there). Local coordinates mirror
     * {@link geometricHit}: `(point − spec.origin) / gfxScale`. Shared by hover
     * ({@link updatePartHover}) and right-click routing.
     */
    private partIdAt;
    /**
     * Diff the sub-part under the cursor against {@link currentPart} to emit
     * `shape:partout` (leaving a part) / `shape:partover` (entering one). Atomic
     * shapes (no `hitTestPart`) never produce part events.
     */
    private updatePartHover;
    getRenderStats(): RenderStats;
    get shapeCount(): number;
    get connectorCount(): number;
    hasShape(id: string): boolean;
    /**
     * Kind of the currently-installed shape with id `id`, or `undefined`
     * if no shape with that id exists.
     *
     * `GraphLayer.rerenderNode` / `updateNodeShape` use this to decide
     * between an instance-preserving `updateShape` (when the rebuilt spec
     * has the same kind — the common case) and a `removeShape + addShape`
     * fallback (when the kind changed, e.g. `circle` → `rect`, which
     * `updateShape` can't handle since the underlying `IShape` class is
     * fixed at construction time).
     */
    getShapeKind(id: string): string | undefined;
    /**
     * Local AABB for the registered shape `kind`, derived from `spec` alone
     * without instantiating the shape's Pixi `Graphics`. Returns `undefined`
     * when the kind isn't registered, or when the registered ctor doesn't
     * implement `static boundsOf`.
     *
     * `spec.x` / `spec.y` are ignored — the returned rect is in the shape's
     * local (centre-relative) frame, so callers can reuse the same width /
     * height for every positioned instance of the kind. To get world-space
     * bounds for a mounted instance, use {@link getShapeWorldBounds}
     * instead.
     *
     * The argument's only required field is `kind`; pass either a full
     * positioned spec (with `x` / `y` / paint) or a bare shape-options
     * record (geometry only — `NodeStyle.shape` from `@invana/graph`).
     * Either way the shape's static `boundsOf` reads only its own
     * geometry params.
     *
     * Consumers (minimap footprint estimation, layouts that need node
     * sizes, label-collision pre-pass, the LOD behaviours) call this so
     * they don't have to switch over a closed kind enum — built-in shapes
     * and shapes registered at runtime via {@link registerShape} both
     * flow through the same hook.
     */
    boundsOfSpec(spec: {
        readonly kind: string;
    }): Rect | undefined;
    /**
     * Uniformly-scaled partial of the registered shape `kind`, with
     * geometry params multiplied by `factor`. Aspect ratio, angular
     * range, and vertex topology are preserved. Returns `undefined`
     * when the kind isn't registered or its ctor doesn't implement
     * `static scaleSpec`.
     *
     * The contract pairs with {@link boundsOfSpec}: scaling by `k`
     * scales the AABB exactly by `k`. Callers compose the returned
     * partial with paint channels (`fill` / `stroke`) and position
     * (`x` / `y`) themselves.
     *
     * Used by `NodeScaleLODBehaviour` to rewrite shape size as the
     * camera zooms, without switching over a closed kind enum. Shapes
     * that don't implement `scaleSpec` are simply skipped by the
     * LOD writer.
     */
    scaleShapeSpec(spec: {
        readonly kind: string;
    }, factor: number): Record<string, unknown> | undefined;
    /**
     * The registered shape's **minimal form** — the smallest version of the
     * silhouette that still identifies it — as a partial spec to merge over
     * `spec`. `undefined` when the kind isn't registered or its ctor doesn't
     * implement `collapsedOf`; callers then keep the spec unchanged.
     *
     * Container frames (`@invana/graph` group nodes) render a collapsed frame
     * through this instead of switching over a closed kind enum, so a runtime-
     * registered shape brings its own collapsed look. See
     * `ShapeCtor.collapsedOf` for the contract.
     */
    collapsedShapeSpec(spec: {
        readonly kind: string;
    }): Record<string, unknown> | undefined;
    /**
     * Geometry partial that fits the registered shape around `content` — the
     * measured size of what it carries (typically its label). `undefined` when
     * the kind isn't registered or its ctor doesn't implement `fitToContent`.
     *
     * The caller measures and the shape decides: pair this with
     * {@link measureLabel} so no caller needs to know how a given silhouette
     * turns a text size into geometry. See `ShapeCtor.fitToContent`.
     */
    fitShapeSpecToContent(spec: {
        readonly kind: string;
    }, content: {
        readonly width: number;
        readonly height: number;
    }): Record<string, unknown> | undefined;
    hasConnector(id: string): boolean;
    /**
     * Currently-mounted decoration instance for shape (or connector) `id` at
     * `slot`, or `undefined` when no decoration is attached at that slot.
     *
     * Domain behaviours read this when they need to introspect a decoration's
     * exposed state — e.g. `CollapseExpandBehaviour` calls
     * `getDecoration(nodeId, 'collapse-toggle')` and reads the toggle's
     * cached hit geometry to test a pointer click against the button's
     * shape-local centre + radius.
     *
     * The returned object is the live `IDecorationBase` — callers should
     * treat it as read-only and not mutate the decoration's `style` directly
     * (use `setDecoration` to swap the style atomically).
     */
    getDecoration(id: string, slot: string): IDecorationBase<unknown> | undefined;
    /**
     * Densified polyline of the routed connector's path, in world coordinates,
     * or `null` when no connector with that id exists. Returns the same point
     * set used internally for hit-testing — so curved / orthogonal / bezier
     * connectors hand back their true visible silhouette, not the straight
     * source-to-target line.
     *
     * Domain-free read accessor for overview layers (e.g. `MiniMapLayer`) that
     * need to render the actual routed shape without re-running the router.
     * Cheap: only samples the cached `inst.path`; no router invocation.
     */
    getConnectorPolyline(id: string): readonly Point[] | null;
    /**
     * Densified polyline of a connector's routed path, memoised on the instance
     * ({@link ConnectorInstance.sampledPolyline}) and cleared on re-route. Hover
     * hit-testing runs this per candidate on every `pointermove`; caching turns a
     * dense-graph resample storm into one sample per edge per re-route.
     */
    private sampledConnectorPolyline;
    /**
     * World-space AABB of a decoration **as drawn**. Returns `null` when no host
     * or slot exists.
     *
     * The decoration's gfx is a child of the host's gfx, so its drawn box is its
     * local bounds through its own scale (a label-size policy), then through the
     * host's drawn transform: a shape's origin is `spec + drawn offset` and its
     * scale the drawn scale (node-size LOD × a display override); a connector's
     * gfx sits at the world origin, unscaled. Rotation is ignored (an AABB of the
     * unrotated box), and so are transient effect deltas.
     *
     * Cheaper than `getGlobalBounds` — no scene traversal. Used by
     * `LabelCollisionBehaviour` and any behaviour needing decoration geometry.
     */
    getDecorationWorldBounds(targetId: string, slot: string): Rect | null;
    /**
     * Show / hide a decoration's gfx without destroying it. Used by
     * collision-style behaviours that want to suppress overlapping labels for a
     * frame without paying the cost of re-mounting on the next reveal.
     *
     * For the `'label'` slot this is the **label-collision channel**: it is stored
     * on the host and combined with the text-LOD channel
     * ({@link setShapeTextVisible} / {@link setConnectorTextVisible}), so the
     * label is drawn only when both allow it. Other slots flip `visible` directly.
     *
     * No-op when `targetId` / `slot` doesn't resolve.
     */
    setDecorationVisible(targetId: string, slot: string, visible: boolean): void;
    /**
     * World-space AABB of the registered shape, or `null` when no shape with
     * that id exists. Domain-free read accessor for layer code that needs to
     * query shape geometry without poking at private state — e.g. a graph
     * layer building an obstacle list for an edge's router, a behaviour that
     * wants to fit content to a selection, or a debug overlay.
     */
    getShapeWorldBounds(id: string): Rect | null;
    /**
     * World-space origin `(spec.x, spec.y)` of the registered shape, or `null`
     * when no shape with that id exists. Counterpart to `getShapeWorldBounds`;
     * use this when a behaviour needs the shape's translation point (drag
     * offset baseline, anchor for an external overlay, etc.).
     */
    getShapePosition(id: string): Point | null;
    /**
     * World-space geometric **centre** of the registered shape's bounding box,
     * or `null` when no shape with that id exists. Differs from
     * `getShapePosition` for shapes whose local origin isn't the centre
     * (`RectShape` is anchored top-left; `CircleShape` is already centred).
     *
     * This is the canonical "anchor reference point" for layer code that wants
     * a uniform centre regardless of shape kind — connector routing, badge
     * placement, fit-to-content, etc.
     */
    getShapeCenter(id: string): Point | null;
    /**
     * Text extent `content` would occupy if mounted as a `label` decoration,
     * or `null` for content this can't measure statically (`html-text`).
     *
     * Nothing is mounted, drawn or cached — this is a pure query against the
     * same font resolution the renderer uses, so a domain layer can size
     * geometry **around** a label (a tab, a header band, a chip) before that
     * label exists, without importing a drawing library to do it.
     */
    measureLabel(content: LabelContent, wrap?: LabelWrap): {
        width: number;
        height: number;
    } | null;
    /**
     * Re-route every registered connector. Useful after a non-endpoint shape
     * moves (e.g. an obstacle) and you want connectors that auto-collect
     * obstacles to update their path.
     *
     * Each call re-runs `routePath` per connector and refreshes the hit index
     * and any connector decorations. Linear in `connectorInstances`; safe to
     * call from drag handlers in typical layouts. Heavy graphs with thousands
     * of edges should prefer a targeted re-route (future).
     */
    reRouteAllConnectors(): void;
    destroy(): void;
    /**
     * World-space AABB of a shape, via the picking index so bounds and hit boxes
     * can never disagree. The `null` branch is unreachable for a live instance
     * (the index falls back to `shape.bounds()` for custom kinds); it exists
     * because the index is keyed by id and an id can always be unknown.
     */
    private shapeWorldBounds;
    private routePath;
    /**
     * Build the obstacle list passed to the router. By default every shape in
     * the renderer except the source / target shapes (when those endpoints are
     * `kind: 'shape'`) is included. Each obstacle carries its AABB plus an
     * optional `containsInflated` silhouette test (when the shape exposes
     * `obstacleTest`) so routers can hug non-rect silhouettes tightly.
     *
     * Callers can override via `routerOpts.obstacles`:
     * - `'auto'` (default) — auto-collected as above.
     * - `'none'` — empty list; router runs as if no obstacles exist.
     * - `Obstacle[]` / `Rect[]` — verbatim list (used for testing or
     *   layer-specific filtering). Plain `Rect` entries are valid because
     *   `Obstacle extends Rect`; they fall back to AABB-only marking.
     */
    private resolveObstacles;
    /**
     * Pass-1 endpoint resolution — stable, anchor-independent reference point.
     * Returns the shape's geometric bounding-box centre in world space (NOT
     * the raw `(spec.x, spec.y)` origin) so the anchor's pass-2 ray cast is
     * uniform across shape kinds.
     */
    private endpointCenter;
    /** Pass-2 endpoint resolution — applies the declared anchor for shape endpoints. */
    private resolveEndpoint;
    private anchorShapeRef;
    private indexConnector;
    private refreshShapeDecorations;
    private refreshConnectorDecorations;
    private disposeDecoration;
    private disposeEffect;
}

/**
 * Pixi implementation of {@link ISurface}.
 *
 * Owns the root `Container` a layer used to create for itself, plus the
 * `PrimitivesRenderer` that draws into it. Moves to `@invana/renderer-pixijs`
 * with the rest of the drawing code; the interface it satisfies stays in the
 * orchestrator.
 *
 * World surfaces are RenderGroups — a GPU batch boundary, not an ordering
 * concept — because world content is the heavy, camera-transformed half.
 * Screen surfaces are plain containers: HUD-style content is light and rarely
 * benefits from its own batch.
 */

interface PixiSurfaceOptions {
    readonly id: string;
    readonly space: SurfaceSpace;
    /** `ctx.world` for world space, `ctx.stage` for screen space. */
    readonly parent: Container;
    readonly camera: Camera;
    readonly textureRegistry?: TextureRegistry;
    readonly hitFloorPx?: number;
    /**
     * Called from {@link PixiSurface.destroy}, so the renderer can drop this
     * surface from the canvas-wide `PixiPointerRouter`. A surface that stays
     * registered after teardown would be picked against a destroyed index.
     */
    readonly onDestroy?: (surface: PixiSurface) => void;
}
declare class PixiSurface implements ISurface {
    readonly id: string;
    readonly space: SurfaceSpace;
    readonly primitives: PrimitivesRenderer;
    /**
     * The pixi root. Renderer-side only; nothing outside this package reaches for
     * it, and it moves to `@invana/renderer-pixijs` whole.
     */
    readonly root: Container;
    private readonly overlays;
    /** Renderer-side teardown hook — see {@link PixiSurfaceOptions.onDestroy}. */
    private readonly onDestroy?;
    /** Backdrop objects, kept so a per-frame transform update costs no rebuild. */
    private backdropSolid;
    private backdropTile;
    private backdropTexture;
    /** The image the current tile texture was built from — the cache key. */
    private backdropSource;
    constructor(opts: PixiSurfaceOptions);
    overlay(label: string): IOverlayDevice;
    setBackdrop(backdrop: SurfaceBackdrop | null): void;
    private disposeBackdropTile;
    private clearBackdrop;
    setVisible(visible: boolean): void;
    setAlpha(alpha: number): void;
    setZIndex(z: number): void;
    destroy(): void;
}

/**
 * Pixi implementation of {@link IOverlayDevice}.
 *
 * Owns one `Graphics` inside a labelled `Container` so the overlay shows up in
 * the devtools scene tree under its own name (the naming contract from
 * `rfc:feat-2026-08-05-render-tree-not-inspectable`). Moves to
 * `@invana/renderer-pixijs` with the rest of the drawing code in P6.
 */

declare class PixiOverlayDevice implements IOverlayDevice {
    private readonly root;
    private readonly gfx;
    /** Points of the current sub-path, kept for dashed strokes (pixi has no dash). */
    private current;
    private closed;
    constructor(parent: Container, label: string, zIndex?: number);
    clear(): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    quadraticCurveTo(cx: number, cy: number, x: number, y: number): this;
    closePath(): this;
    rect(x: number, y: number, width: number, height: number): this;
    roundRect(x: number, y: number, width: number, height: number, radius: number): this;
    ellipse(cx: number, cy: number, radiusX: number, radiusY: number): this;
    poly(points: readonly number[] | ReadonlyArray<{
        x: number;
        y: number;
    }>, close?: boolean): this;
    fill(style: OverlayFillLike): this;
    stroke(style: OverlayStroke): this;
    setVisible(visible: boolean): this;
    setZIndex(z: number): this;
    setPosition(x: number, y: number): this;
    destroy(): void;
}

/**
 * `PixiViewportBinding` — the `pixi-viewport` realisation of {@link ICameraBinding}.
 *
 * Every `Viewport` call the engine ever needed now lives in this one file:
 * transform reads/writes, projection, the plugin registry (`drag` / `decelerate`
 * / `wheel` / `pinch`), plugin pause/resume, and the `moved` / `zoomed` /
 * `drag-start` events. `Camera` above it holds no pixi type at all.
 *
 * This is the file P6 moves into `@invana/renderer-pixijs`; a three.js binding
 * would implement the same interface over an orthographic camera
 * (`docs/renderer-split-design.md` §5).
 */

declare class PixiViewportBinding implements ICameraBinding {
    private readonly viewport;
    /**
     * Suppresses the `moved` / `zoomed` echo while this binding is the one
     * writing. Direct `position.set` / `scale.set` don't fire those events, but
     * {@link zoomToCentre} goes through `viewport.setZoom`, which does — and
     * `Camera` has already emitted for that change.
     */
    private _writing;
    constructor(viewport: Viewport);
    getTransform(): CameraTransformValue;
    setTransform(t: CameraTransformValue): void;
    zoomToCentre(zoom: number): void;
    resize(screenWidth: number, screenHeight: number): void;
    toWorld(screenX: number, screenY: number): Point;
    toScreen(worldX: number, worldY: number): Point;
    getVisibleBounds(): Rect;
    configureInput(config: CameraInputConfig): void;
    setDragSuspended(suspended: boolean): void;
    onTransformChange(fn: (kind: CameraChangeKind) => void): () => void;
    onDragStart(fn: () => void): () => void;
    tick(dtMs: number): void;
}

/**
 * The entry point `Canvas.init` reaches for when no `renderer` was supplied.
 *
 * Kept as a tiny named export of its own so the engine's dynamic
 * `import('@invana/renderer-pixijs')` has a stable, side-effect-light target —
 * and so that resolving the default backend never depends on the shape of this
 * package's barrel (design D1, §4.6).
 */

/** Build the default pixi backend. `events` is the canvas-wide bus. */
declare function createDefaultRenderer(opts: {
    events: CanvasEventBus;
} & Partial<PixiRendererOptions>): PixiRenderer;

/**
 * Common base for every rendered primitive — shapes, connectors, decorations.
 * Owns the root `gfx` Container and a default `destroy` that tears it down
 * along with all children (Pixi removes the destroyed container from its
 * parent automatically).
 *
 * Subclasses add Graphics or other display objects as children of `gfx`.
 */
declare abstract class PrimitiveBase {
    readonly gfx: Container;
    constructor();
    destroy(): void;
}

/**
 * Inset-content mount / update / destroy for `glyph`, `svg`, and `svg-url`
 * fill layers. Each inset layer becomes a sibling Container parented to the
 * shape's `gfx`, sized as a fraction of the shape's bounds (`sizeRatio`)
 * and positioned by the layer's `anchor`.
 *
 * Image fills are NOT handled here — they paint into the silhouette via
 * `applyFillStroke.ts` with CSS-`cover` semantics. The engine does not
 * expose an inset-Sprite mode for raster images; reach for a `glyph` /
 * `svg` / `svg-url` layer when a small vector inset is what's wanted.
 *
 * Text labels are NOT handled here either. Multi-character labels
 * (centred-inside, outside-side, or along-path) are rendered by
 * `LabelDecoration` / `LabelConnectorDecoration` via
 * `setDecoration(id, 'label', ...)` — they support backgrounds, wrap /
 * ellipsis, rich (HTML) text, and 13 placements including the
 * inside-centre case the legacy `kind: 'text'` fill layer used to cover.
 *
 * Decorations operate on the silhouette only (via `paintInto`) — they never
 * see inset content. Animated decorations like glow / pulse paint a halo
 * around the silhouette; the inset content sits unaffected on top.
 *
 * `svg-url` layers fetch their SVG asynchronously. The Graphics child is
 * created empty and added to the scene immediately; once the fetch resolves,
 * the path is populated and `positionAndScale` is re-run so the now-non-empty
 * bounds drive the correct scale. Results are cached globally per URL.
 */

interface InsetContentView {
    readonly gfx: Container;
    child: Text | Graphics;
    key: string;
}

/**
 * Base for shapes whose `draw` and `paintInto` share a single silhouette
 * trace. Subclasses implement `drawGeometry` (trace path + apply fill +
 * apply stroke) and `bounds`. They get `draw` and `paintInto` for free.
 *
 * The shape's root `gfx` Container holds:
 *   - `bodyGfx`     — Graphics drawing the silhouette + silhouette-filler
 *                     fill layers (`solid` / `image`) + border.
 *   - inset views   — sibling Containers, one per inset-content fill layer
 *                     (`glyph` / `svg` / `svg-url`), keyed by layer index
 *                     in `spec.fill`.
 *
 * Decorations operate against `paintInto` — a callback into the silhouette
 * only, never into inset content. This means a glow on a shape with an icon
 * halos the silhouette but leaves the glyph alone.
 */
declare abstract class ShapeBase<TSpec extends BaseShapeSpec> extends PrimitiveBase implements IShape<TSpec> {
    protected readonly host: ShapeHostInfo;
    protected readonly bodyGfx: Graphics;
    protected readonly insetViews: Map<number, InsetContentView>;
    protected spec: TSpec;
    /**
     * When true, inset-content (`glyph` / `svg` / `svg-url` icon) views are
     * hidden. Persists across {@link draw} so a zoom-visibility toggle survives
     * later repaints. Driven by {@link setInsetContentVisible}.
     */
    private iconHidden;
    /**
     * When true, `image` silhouette-fill layers are skipped when painting the
     * body. Persists across {@link draw}. Driven by {@link setImageFillVisible}.
     */
    private imageHidden;
    constructor(host: ShapeHostInfo);
    /**
     * Hit-test region for this shape, derived from {@link drawGeometry}.
     *
     * **No longer the picking path for built-in kinds** — `hitTest`'s narrow
     * phase answers from the spec (`containsSpec` in `specs/shapeGeometry/`), so
     * picking needs no display object and both backends agree. This stays as the
     * pixi `gfx.hitArea` wiring, and as the fallback for `registerShape` kinds
     * the spec geometry has never heard of.
     *
     * Default behaviour: the returned `IHitArea`'s `contains(x, y)` delegates
     * to `bodyGfx.containsPoint({ x, y })`. Because `drawGeometry` is the
     * single function that paints the silhouette into `bodyGfx` (see
     * {@link draw}), the hit region tracks the rendered silhouette exactly —
     * including any stroke (Pixi's `containsPoint` uses `strokeContains` for
     * stroke instructions, with a half-stroke-width tolerance).
     *
     * The returned object is stable across `draw()` calls: the closure reads
     * `bodyGfx` by reference, so subsequent `drawGeometry` repaints
     * automatically update the hit region. No re-wiring of `gfx.hitArea`.
     *
     * Subclasses with cheap analytical hit tests — `CircleShape`
     * (`x² + y² ≤ r²`), `RectShape` (AABB) — may override to skip Pixi's
     * path-walk on hot paths. Keep the contract: input is shape-local
     * coordinates; `true` iff the point is inside the silhouette.
     */
    getHitArea(): IHitArea;
    /**
     * Update the spec used by {@link paintInto} / {@link bounds} / {@link contains}
     * **without** drawing this shape's own `gfx`. For *container* shapes (e.g.
     * {@link CompositeShape}) that compose another shape purely as a silhouette
     * provider — they trace the borrowed shape into their *own* graphics via
     * `paintInto`, so the borrowed instance's `gfx` must stay untouched. Regular
     * rendering goes through {@link draw}, not this.
     */
    setGeometrySpec(spec: TSpec): void;
    /**
     * Trace the silhouette into `g`, then apply fill + stroke. When `style`
     * is supplied, it overrides the spec's fill/stroke (decoration use).
     */
    protected abstract drawGeometry(g: Graphics, spec: TSpec, style?: ShapePaintStyle): void;
    abstract bounds(): Rect;
    draw(spec: TSpec): void;
    paintInto(g: Graphics, style?: ShapePaintStyle): void;
    /**
     * Toggle inset-content (`glyph` / `svg` / `svg-url` icon) visibility. A pure
     * `.visible` flip on the inset containers — no repaint. The flag persists, so
     * a later {@link draw} keeps icons hidden until re-shown. Zoom-visibility LOD
     * uses this to drop icons at low zoom without touching the body.
     */
    setInsetContentVisible(visible: boolean): void;
    /**
     * Toggle the silhouette `image` fill. Unlike icons, an image is painted
     * *into* the body, so hiding it repaints the body with `image` layers
     * stripped (solid fills / borders / other layers untouched). The flag
     * persists across {@link draw}. No-op when the state is unchanged.
     */
    setImageFillVisible(visible: boolean): void;
    /** Spec used to paint the body — strips `image` fill layers while hidden. */
    private bodyPaintSpec;
    /**
     * Default boundary intersection: ray from the shape's geometric centre
     * `(0, 0)` toward `localFromCenter`, intersected with a centred AABB
     * derived from `this.bounds()`. Correct for `RectShape` (anchored
     * top-left) and any shape whose silhouette can be approximated by its
     * bounding box.
     *
     * Geometric shapes with non-rectangular silhouettes (`CircleShape`,
     * `EllipseShape`, `PolygonShape`) should override this for pixel-accurate
     * perimeter snapping. Input and output are both centre-relative.
     */
    boundaryIntersect(localFromCenter: Point): Point | null;
    destroy(): void;
    /**
     * Visual centre — the point inset content with `anchor: 'center'` snaps
     * to. Default is the AABB midpoint of `bounds()`, which is correct for
     * `CircleShape` (bounds is centred on origin) and `RectShape` (bounds is
     * the rect itself). Shapes whose silhouette doesn't fill its AABB —
     * triangle, hexagon, star, free-form polygon — override to return the
     * geometric centroid so a glyph drawn on a triangle sits on the visual
     * centroid instead of floating above it.
     */
    visualCenter(): Point;
    /**
     * Diff the spec's inset-content fill layers (`glyph` / `svg` / `svg-url`)
     * against the current `insetViews` map, keyed by layer index. Mounts new
     * layers, updates existing ones, destroys removed ones.
     */
    private syncInsetLayers;
}

/**
 * Base for the single concrete `Connector` class (and any future custom
 * subclasses). Subclasses implement `drawGeometry` to render a `Path` onto a
 * `Graphics`. Marker placement is handled by `paintMarkers` — wired in step 9
 * once `pathSampling.tangentAt` and the shape registry resolution land.
 *
 * v0 ships only one concrete subclass (`Connector`); custom rendering styles
 * (double-line strokes, gradient strokes, "noodle" wiggles) are introduced
 * later by extending `ConnectorBase` directly. See the v0 plan's "What's NOT
 * in v0" section.
 */
declare abstract class ConnectorBase<TSpec extends BaseConnectorSpec> extends PrimitiveBase implements IConnector<TSpec> {
    protected readonly host: ConnectorHostInfo;
    protected readonly bodyGfx: Graphics;
    protected readonly sourceMarkerGfx: Graphics;
    protected readonly targetMarkerGfx: Graphics;
    protected spec: TSpec;
    protected path: Path;
    constructor(host: ConnectorHostInfo);
    /**
     * Render the path natively via Pixi commands (`moveTo` / `lineTo` /
     * `quadraticCurveTo` / `bezierCurveTo`) plus the spec's stroke (or `style`
     * override). Subclasses focus only on stroke style — markers are handled
     * by the base via `paintMarkers`.
     */
    protected abstract drawGeometry(g: Graphics, spec: TSpec, path: Path, style?: ConnectorPaintStyle): void;
    draw(spec: TSpec, path: Path): void;
    paintInto(g: Graphics, spec: TSpec, path: Path, style?: ConnectorPaintStyle): void;
    /**
     * Path trimmed by the source / target marker insets at the *spec* stroke
     * width — i.e. the visible body of the connector. Decorations call this
     * when they need to parameterise along the segment markers actually
     * cover. Identity when no markers are configured.
     */
    getVisiblePath(spec: TSpec, path: Path): Path;
    /**
     * Toggle the body stroke without affecting markers or decoration children.
     * Body, source marker, and target marker live in three sibling Graphics
     * under `gfx`, so each can be hidden independently. The next `draw()`
     * re-strokes the body but preserves the hidden state.
     */
    setBodyVisible(visible: boolean): void;
    /** Toggle just the source-endpoint marker. See `setBodyVisible`. */
    setSourceMarkerVisible(visible: boolean): void;
    /** Toggle just the target-endpoint marker. See `setBodyVisible`. */
    setTargetMarkerVisible(visible: boolean): void;
    /**
     * Resolve source/target marker insets via each marker's
     * `ShapeCtor.markerInset` and shorten the path's start / end so the body
     * stops at the marker's back edge. Markers themselves still paint at the
     * untrimmed endpoints, so the marker tip lands exactly on the path
     * endpoint (e.g. the arrow's tip touches the target).
     */
    private trimPathForMarkers;
    /**
     * Paint source/target markers anchored at the path endpoints, oriented
     * along the local tangent. Looks up each marker's class via
     * `host.shapeRegistry` and dispatches to its `static paintInto`.
     *
     * Source angle is the **reversed** tangent so an arrow placed at the
     * source faces back toward it. Target angle is the forward tangent so an
     * arrow placed at the target points into it.
     *
     * When the connector style sets `tintMarkers`, markers paint with the
     * connector's color/alpha (used by glow / halo for unified silhouette
     * coverage). Otherwise markers use their own spec colors.
     */
    protected paintMarkers(g: Graphics, spec: TSpec, path: Path, style?: ConnectorPaintStyle, strokeWidth?: number, 
    /**
     * Halo stroke thickness used when `style.markerHalo` is set. Decoupled
     * from `strokeWidth` (which sizes marker geometry) so a glow can outline
     * the marker at its halo width without scaling the marker itself.
     */
    haloStrokeWidth?: number): void;
    protected paintSourceMarker(g: Graphics, spec: TSpec, path: Path, style?: ConnectorPaintStyle, strokeWidth?: number, haloStrokeWidth?: number): void;
    protected paintTargetMarker(g: Graphics, spec: TSpec, path: Path, style?: ConnectorPaintStyle, strokeWidth?: number, haloStrokeWidth?: number): void;
}

/**
 * Base for decorations that target shape primitives. Subclass implements
 * `repaint`; this base handles the `mount` / `update` lifecycle (attach gfx
 * to the host's surface, set the slot z-index, cache the host, repaint).
 *
 * Animation: subclass adds `tick(deltaMs)` if it wants to be advanced per
 * frame. The renderer registers any decoration with a `tick` method into
 * its animation set; a falsy return retires the decoration.
 */
declare abstract class ShapeDecorationBase<TStyle> extends PrimitiveBase implements IShapeDecoration<TStyle> {
    readonly style: TStyle;
    protected host: ShapeDecorationHostInfo | null;
    constructor(style: TStyle);
    mount(host: ShapeDecorationHostInfo): void;
    update(host: ShapeDecorationHostInfo): void;
    /** Render the decoration based on the current `host`. */
    protected abstract repaint(): void;
}

/**
 * Base for decorations that target connector primitives. Mirrors
 * `ShapeDecorationBase` — subclass implements `repaint`, the base handles
 * `mount` / `update` lifecycle.
 *
 * Connector decorations receive the routed `Path` (not a polyline). When a
 * decoration needs uniform-arc-length sampling (rare — most decorations
 * call `connector.paintInto` for native dashed/styled strokes), it pulls
 * `samplePath(path, n)` from `primitives/connectors/pathSampling.ts`.
 */
declare abstract class ConnectorDecorationBase<TStyle> extends PrimitiveBase implements IConnectorDecoration<TStyle> {
    readonly style: TStyle;
    protected host: ConnectorDecorationHostInfo | null;
    constructor(style: TStyle);
    mount(host: ConnectorDecorationHostInfo): void;
    update(host: ConnectorDecorationHostInfo): void;
    protected abstract repaint(): void;
}

/**
 * Base for effects that target shape primitives. An effect *modulates* the
 * host — wiggle its transform, override its tint/alpha — rather than adding
 * geometry alongside it (that's a decoration). The renderer reads each
 * effect's contribution every frame via `readTransform()` (transform effects)
 * or `readStyle()` (style effects), aggregates across all effects attached to
 * the same host, and applies the aggregate to the host's gfx.
 *
 * Subclasses:
 *  - Declare `readonly target` as `'transform'` or `'style'`.
 *  - Implement `readTransform()` (target='transform') OR `readStyle()`
 *    (target='style'). The renderer calls only the one matching `target`.
 *  - Optionally implement `tick(deltaMs)` for animated effects. Returning
 *    `false` retires the effect from the renderer's per-frame set.
 *
 * Effects do not own a Pixi container — they have no gfx. That's the
 * structural difference from `PrimitiveBase` children: shapes / connectors /
 * decorations draw, effects modulate.
 */
declare abstract class EffectBase<TStyle> implements IShapeEffect<TStyle> {
    abstract readonly target: EffectTarget;
    readonly style: TStyle;
    protected host: ShapeEffectHostInfo | null;
    constructor(style: TStyle);
    mount(host: ShapeEffectHostInfo): void;
    update(host: ShapeEffectHostInfo): void;
    destroy(): void;
    /**
     * Optional per-frame advance. Subclasses override; the base no-ops. Return
     * `false` to retire the effect from the renderer's animation set.
     */
    tick?(deltaMs: number): boolean;
    /**
     * Required by transform-effects; the renderer ignores it for style-effects.
     * Subclasses with `target='transform'` must override.
     */
    readTransform?(): TransformDelta;
    /**
     * Required by style-effects; the renderer ignores it for transform-effects.
     * Subclasses with `target='style'` must override.
     */
    readStyle?(): StyleOverride;
}

/**
 * Base for effects that target connector primitives. Mirror of `EffectBase`
 * for shape effects — the effect modulates the host connector's style
 * (tint / alpha) rather than adding geometry alongside it.
 *
 * Subclasses:
 *  - Declare `readonly target` as `'style'` (typical) or `'transform'`.
 *    Note: the renderer ignores `'transform'` for connector hosts because
 *    translating / rotating / scaling a path-resolved primitive has no
 *    coherent meaning — effects that need to perturb endpoints should
 *    mutate the input polyline upstream of routing, not modulate gfx.
 *  - Implement `readStyle()`. The renderer aggregates contributions
 *    across every effect attached to the same connector (`tint` is
 *    last-writer-wins per channel; `alpha` multipliers compose).
 *  - Optionally implement `tick(deltaMs)` for animated effects. Returning
 *    `false` retires the effect from the renderer's per-frame set.
 *
 * Effects do not own a Pixi container — they have no gfx. The structural
 * difference from `ConnectorDecorationBase` is the same as for shapes:
 * decorations draw, effects modulate.
 */
declare abstract class ConnectorEffectBase<TStyle> implements IConnectorEffect<TStyle> {
    abstract readonly target: EffectTarget;
    readonly style: TStyle;
    protected host: ConnectorEffectHostInfo | null;
    constructor(style: TStyle);
    mount(host: ConnectorEffectHostInfo): void;
    update(host: ConnectorEffectHostInfo): void;
    destroy(): void;
    tick?(deltaMs: number): boolean;
    readTransform?(): TransformDelta;
    readStyle?(): StyleOverride;
}

/**
 * Filled / stroked circle. Centered at `(spec.x, spec.y)`; the silhouette
 * is traced in shape-local space (origin at the center). Inset-content fill
 * layers (glyph / svg / svg-url) are mounted as sibling Containers by
 * `ShapeBase` — they appear centred (or anchored) inside the circle.
 */
declare class CircleShape extends ShapeBase<CircleSpec> {
    static readonly kind = "circle";
    constructor(spec: CircleSpec, host: ShapeHostInfo);
    protected drawGeometry(g: Graphics, spec: CircleSpec, style?: ShapePaintStyle): void;
    bounds(): Rect;
    static boundsOf(spec: Omit<CircleSpec, 'x' | 'y'>): Rect;
    static scaleSpec(spec: Omit<CircleSpec, 'x' | 'y'>, factor: number): Partial<CircleSpec>;
    contains(localX: number, localY: number): boolean;
    /**
     * Analytical perimeter intersection. `CircleShape` is centred at its
     * origin, so "centre-relative" and "origin-relative" local coords are the
     * same here. The boundary point along the ray from `(0, 0)` toward
     * `localFromCenter` is just the unit vector scaled by the radius.
     * When `localFromCenter` coincides with the centre the ray is degenerate;
     * we return `(r, 0)` as a stable sentinel.
     */
    boundaryIntersect(localFromCenter: Point): Point;
    /**
     * Silhouette obstacle-test for routers. Returns a closure over the
     * circle's current `(centre, radius)` that tests world points against
     * the inflated disc — pixel-tight, not the AABB-square. Routes hug the
     * circle's tangent instead of avoiding its bounding box corners.
     */
    obstacleTest(): (worldX: number, worldY: number, inflate: number) => boolean;
    /**
     * Static paint surface for marker rendering. Connectors call this when
     * a circle is used as a source/target marker (no instantiation, just a
     * paint into someone else's Graphics). Only the first solid layer of
     * `spec.fill` is honoured here — markers don't support image fills or
     * inset content.
     */
    static paintInto(g: Graphics, spec: Omit<CircleSpec, 'x' | 'y'>, anchor: Point, _angleRad: number, style?: ShapePaintStyle): void;
}

/**
 * Filled / stroked ellipse. Centred at `(spec.x, spec.y)`; the silhouette is
 * traced in shape-local space (origin at the centre) with independent
 * `radiusX` / `radiusY`. The circle's two-radius sibling — used directly, or
 * borrowed by {@link CompositeShape} for an elliptical card body. Inset-content
 * fill layers (glyph / svg) are mounted centred by `ShapeBase`.
 */
declare class EllipseShape extends ShapeBase<EllipseSpec> {
    static readonly kind = "ellipse";
    constructor(spec: EllipseSpec, host: ShapeHostInfo);
    protected drawGeometry(g: Graphics, spec: EllipseSpec, style?: ShapePaintStyle): void;
    bounds(): Rect;
    static boundsOf(spec: Omit<EllipseSpec, 'x' | 'y'>): Rect;
    static scaleSpec(spec: Omit<EllipseSpec, 'x' | 'y'>, factor: number): Partial<EllipseSpec>;
    contains(localX: number, localY: number): boolean;
    /**
     * Analytical perimeter intersection. The ellipse is centred at its origin,
     * so the boundary point along the ray from `(0, 0)` toward `localFromCenter`
     * scales the direction so it lands on the ellipse: solve
     * `((t·dx)/rx)² + ((t·dy)/ry)² = 1` for `t`. Degenerate ray → `(rx, 0)`.
     */
    boundaryIntersect(localFromCenter: Point): Point;
    /**
     * Static paint surface for marker rendering — paints into a connector's
     * Graphics at `anchor` with no instantiation. Only the first solid layer of
     * `spec.fill` applies (markers don't support image fills / inset content).
     */
    static paintInto(g: Graphics, spec: Omit<EllipseSpec, 'x' | 'y'>, anchor: Point, _angleRad: number, style?: ShapePaintStyle): void;
}

/**
 * Axis-aligned rectangle with optional `cornerRadius`. Anchored at its
 * top-left corner in shape-local space; `(spec.x, spec.y)` is the world
 * position of that corner. A "square" is just `RectShape` with
 * `width === height` and no `cornerRadius`.
 */
declare class RectShape extends ShapeBase<RectSpec> {
    static readonly kind = "rect";
    constructor(spec: RectSpec, host: ShapeHostInfo);
    protected drawGeometry(g: Graphics, spec: RectSpec, style?: ShapePaintStyle): void;
    bounds(): Rect;
    static boundsOf(spec: Omit<RectSpec, 'x' | 'y'>): Rect;
    static scaleSpec(spec: Omit<RectSpec, 'x' | 'y'>, factor: number): Partial<RectSpec>;
    /** Rounded corners are honoured — the fillet is cut out of the box, not ignored. */
    contains(localX: number, localY: number): boolean;
    /**
     * Silhouette-aware ray exit. For `cornerRadius > 0` the AABB face isn't
     * the actual outline — the rendered rect rounds inward at each corner.
     * Take the AABB exit first; if it falls in one of the four corner zones
     * (within `R` of a corner in both axes), re-cast the ray against that
     * corner's quarter-circle so the returned point sits on the visible
     * silhouette. For sharp rects this is unchanged from the AABB fallback.
     */
    boundaryIntersect(localFromCenter: Point): Point | null;
    static paintInto(g: Graphics, spec: Omit<RectSpec, 'x' | 'y'>, anchor: Point, _angleRad: number, style?: ShapePaintStyle): void;
}

/**
 * Rectangle with a raised tab on its top edge — the manila-folder silhouette —
 * traced as one continuous outline so fill and stroke wrap body and tab
 * together.
 *
 * Anchored at the top-left of the **full AABB** (the tab's top-left corner
 * when the tab is flush left), matching `RectShape`'s top-left convention.
 * `spec.height` is the body alone, so `bounds().height` is
 * `tabHeight + height` — callers positioning this shape place its topmost
 * point, not the body's.
 *
 * Two details give it the folder read rather than "a rect with a box stuck on
 * top": the tab's inward-facing side is **angled** (`tabSkew`), and its base
 * is closed by a **fold line** (`tabDivider`) drawn across the body's top
 * edge. The fold line is interior geometry, so it is drawn only on the shape's
 * own paint pass — a glow or halo tracing this silhouette gets the outline
 * alone and doesn't sprout a stray line across the middle.
 *
 * Two behaviours make it usable as a container frame:
 *
 * - **`boundaryIntersect` snaps to the body, never the tab.** A connector
 *   drawn to this shape lands on the rectangle a reader perceives as the
 *   object; a line terminating on the little tab reads as a mistake.
 * - **`labelAnchorBox` routes inside labels into the tab.** So
 *   `placement: 'inside-center'` puts the title on the tab, independent of
 *   how large the body grows — which is what makes an auto-sized frame's
 *   title stay put.
 *
 * `height: 0` draws the **tab by itself** — the closed folder. The tab's base
 * becomes the outline's bottom edge (filleted, no fold line), the taper still
 * applies, and bounds / label box / edge anchors all collapse onto the tab.
 * That's the silhouette a collapsed container frame renders as.
 */
declare class TabbedRectShape extends ShapeBase<TabbedRectSpec> {
    static readonly kind = "tabbed-rect";
    constructor(spec: TabbedRectSpec, host: ShapeHostInfo);
    protected drawGeometry(g: Graphics, spec: TabbedRectSpec, style?: ShapePaintStyle): void;
    bounds(): Rect;
    static boundsOf(spec: Omit<TabbedRectSpec, 'x' | 'y'>): Rect;
    /** The folder, closed: body gone, tab kept. */
    static collapsedOf(spec: Omit<TabbedRectSpec, 'x' | 'y'>): Partial<TabbedRectSpec>;
    /** Size the tab to the title it carries. */
    static fitToContent(spec: Omit<TabbedRectSpec, 'x' | 'y'>, content: {
        readonly width: number;
        readonly height: number;
    }): Partial<TabbedRectSpec>;
    static scaleSpec(spec: Omit<TabbedRectSpec, 'x' | 'y'>, factor: number): Partial<TabbedRectSpec>;
    /**
     * The body's midpoint, not the AABB's — the tab band shifts the AABB
     * centre upward by `tabHeight / 2`, which would float a centred glyph or
     * label off the rectangle the eye reads as the object.
     *
     * With no body (`height <= 0`) the tab *is* the object, so its own midpoint
     * is the answer.
     */
    visualCenter(): Point;
    contains(localX: number, localY: number): boolean;
    /**
     * Ray exit against the **body** rectangle only. Input and output are
     * relative to the AABB centre per the `IShape` contract, so the body is
     * expressed as an off-centre box: the tab band sits entirely above the
     * AABB centre line, shifting the body's top edge down by `tabHeight / 2`.
     *
     * Excluding the tab is deliberate — a connector should terminate on the
     * container's body, not on the little title flag above it. The one exception
     * is a bodyless spec (`height <= 0`, the closed folder): with no body to aim
     * at, the tab band becomes the target.
     */
    boundaryIntersect(localFromCenter: Point): Point | null;
    /**
     * Route every `inside-*` placement into the **tab**.
     *
     * The rule is one-line on purpose: this silhouette exists to be a frame
     * around *other* content, so its body interior belongs to whatever it
     * contains — the only place the shape's own label belongs is the tab.
     * `inside-center` therefore centres the title on the tab, `inside-left`
     * left-aligns it there, and so on: the placement still means what it says,
     * just against the tab's box rather than the body's.
     *
     * The box returned is the tab's **upright** portion — the slant is excluded
     * on whichever side is angled, so a centred title reads centred against the
     * part of the tab that's actually full height rather than drifting into the
     * taper. Because that box is small and fixed, the inside-placement inset
     * (proportional to the box) stays visually identical no matter how large the
     * body grows underneath.
     *
     * Two deliberate escapes: bare `'center'` resolves through
     * {@link visualCenter} to the **body** centre, and the outside placements
     * fall through to the full AABB so they clear the whole silhouette.
     */
    labelAnchorBox(placement: ShapeLabelPlacement): Rect | undefined;
    static paintInto(g: Graphics, spec: Omit<TabbedRectSpec, 'x' | 'y'>, anchor: Point, angleRad: number, style?: ShapePaintStyle): void;
}

/**
 * Free-form polyline / outline. Points are centre-relative — traced around the
 * origin in shape-local space, with the `gfx` Container translating the result
 * to `(spec.x, spec.y)`, exactly like {@link PolygonShape}.
 *
 * The difference from `polygon` is the **open** default: a path is a run of
 * points that only closes when `spec.closed` says so. That is what computed
 * geometry needs — density-contour bands, bubble-set hulls, region outlines —
 * where the producer emits a point list rather than a parameterised silhouette.
 *
 * Hit-testing follows what is painted: a closed run has an interior to hit, an
 * open one answers only along its stroke — a fill is emitted only when closed,
 * so the two agree by construction.
 */
declare class PathShape extends ShapeBase<PathSpec> {
    static readonly kind = "path";
    constructor(spec: PathSpec, host: ShapeHostInfo);
    protected drawGeometry(g: Graphics, spec: PathSpec, style?: ShapePaintStyle): void;
    bounds(): Rect;
    static boundsOf(spec: Omit<PathSpec, 'x' | 'y'>): Rect;
    static scaleSpec(spec: Omit<PathSpec, 'x' | 'y'>, factor: number): Partial<PathSpec>;
    /** Points are authored centre-relative, so the local origin is the centre. */
    visualCenter(): Point;
    contains(localX: number, localY: number): boolean;
}

/**
 * Free-form polygon. Vertices are centre-relative — the silhouette is traced
 * around the origin in shape-local space and the `gfx` Container translates
 * the result to `(spec.x, spec.y)`. The polygon is treated as closed: the
 * trace returns to the first vertex automatically.
 */
declare class PolygonShape extends ShapeBase<PolygonSpec> {
    static readonly kind = "polygon";
    constructor(spec: PolygonSpec, host: ShapeHostInfo);
    protected drawGeometry(g: Graphics, spec: PolygonSpec, style?: ShapePaintStyle): void;
    bounds(): Rect;
    static boundsOf(spec: Omit<PolygonSpec, 'x' | 'y'>): Rect;
    static scaleSpec(spec: Omit<PolygonSpec, 'x' | 'y'>, factor: number): Partial<PolygonSpec>;
    /**
     * Vertices are authored centre-relative, so the local origin is the
     * natural visual centre. Returning `(0, 0)` instead of the AABB midpoint
     * keeps inset glyphs / icons sitting where the user expects when the
     * polygon's silhouette doesn't fill its AABB (e.g. the chevron's notch
     * leaves empty space on the left of the box).
     */
    visualCenter(): Point;
    contains(localX: number, localY: number): boolean;
    /**
     * Analytical ray-to-edge intersection. Polygon vertices are already
     * centre-relative, so `localFromCenter` shares the same frame as the
     * stored vertices.
     */
    boundaryIntersect(localFromCenter: Point): Point | null;
    /**
     * Silhouette obstacle-test for routers. Translates the world point into
     * shape-local space and runs an even-odd point-in-polygon test against the
     * polygon expanded by `inflate`. Tight against the actual silhouette
     * instead of the AABB, so routes hug concave / angular outlines.
     */
    obstacleTest(): (worldX: number, worldY: number, inflate: number) => boolean;
    /**
     * Marker paint surface. Rotates the vertex list by `angleRad`, translates
     * to `anchor`, then traces + fills. Only the first solid layer of
     * `spec.fill` is honoured (markers don't support image / inset fills).
     */
    static paintInto(g: Graphics, spec: Omit<PolygonSpec, 'x' | 'y'>, anchor: Point, angleRad: number, style?: ShapePaintStyle): void;
}

/**
 * Regular n-gon centred at `(spec.x, spec.y)` with circum-radius
 * `spec.radius`. With `rotation = 0` the first vertex points straight up, so
 * a triangle / pentagon / heptagon points up by default and a hexagon is
 * pointy-top. Pass `rotation: Math.PI / 6` for a flat-top hexagon.
 *
 * Vertices are recomputed on every `draw`. For hot paths consider caching at
 * the spec level — but a regular polygon's vertex count is small so the cost
 * is dominated by Pixi's path emission, not the trig.
 */
declare class RegularPolygonShape extends ShapeBase<RegularPolygonSpec> {
    static readonly kind = "regular-polygon";
    constructor(spec: RegularPolygonSpec, host: ShapeHostInfo);
    protected drawGeometry(g: Graphics, spec: RegularPolygonSpec, style?: ShapePaintStyle): void;
    bounds(): Rect;
    static boundsOf(spec: Omit<RegularPolygonSpec, 'x' | 'y'>): Rect;
    static scaleSpec(spec: Omit<RegularPolygonSpec, 'x' | 'y'>, factor: number): Partial<RegularPolygonSpec>;
    /**
     * Vertices are placed symmetrically around the origin by
     * `regularPolygonVertices`, so the local origin is the centroid. The AABB
     * midpoint is offset for odd-sided polygons (triangle / pentagon /
     * heptagon) — using the origin instead keeps an inset glyph centred on
     * the visual mass rather than floating toward the apex.
     */
    visualCenter(): Point;
    contains(localX: number, localY: number): boolean;
    boundaryIntersect(localFromCenter: Point): Point | null;
    obstacleTest(): (worldX: number, worldY: number, inflate: number) => boolean;
    static paintInto(g: Graphics, spec: Omit<RegularPolygonSpec, 'x' | 'y'>, anchor: Point, angleRad: number, style?: ShapePaintStyle): void;
}

/**
 * N-pointed star centred at `(spec.x, spec.y)`. `points` controls the number
 * of outer tips; vertices alternate between `outerRadius` and `innerRadius`.
 * With `rotation = 0` the first outer tip points straight up. The silhouette
 * is concave by construction — the bisector-based `offsetPolygon` inset is
 * an approximation for thin / decorative insets only; deep insets may
 * self-intersect.
 */
declare class StarShape extends ShapeBase<StarSpec> {
    static readonly kind = "star";
    constructor(spec: StarSpec, host: ShapeHostInfo);
    protected drawGeometry(g: Graphics, spec: StarSpec, style?: ShapePaintStyle): void;
    bounds(): Rect;
    static boundsOf(spec: Omit<StarSpec, 'x' | 'y'>): Rect;
    static scaleSpec(spec: Omit<StarSpec, 'x' | 'y'>, factor: number): Partial<StarSpec>;
    /**
     * Star vertices are placed symmetrically around the origin by
     * `starVertices`, so the local origin is the centroid. For odd-pointed
     * stars (5-point being the canonical case) the AABB midpoint is offset
     * from the visual mass — using the origin instead keeps an inset glyph
     * sitting where the eye reads as "centre".
     */
    visualCenter(): Point;
    contains(localX: number, localY: number): boolean;
    boundaryIntersect(localFromCenter: Point): Point | null;
    obstacleTest(): (worldX: number, worldY: number, inflate: number) => boolean;
    static paintInto(g: Graphics, spec: Omit<StarSpec, 'x' | 'y'>, anchor: Point, angleRad: number, style?: ShapePaintStyle): void;
}

/**
 * Annular sector centred at `(spec.x, spec.y)` between two radii
 * (`innerR`, `outerR`) and two angles (`startAngle`, `endAngle`). Angles are
 * in radians with the standard screen convention — `0` points along `+x`
 * (3 o'clock) and increasing values sweep clockwise on screen (because the
 * canvas y-axis grows downward). For a d3-style sunburst projection, subtract
 * `π/2` from d3's `x0`/`x1` to align "0 = 12 o'clock" with this convention.
 *
 * Degenerate shapes:
 * - `innerR === 0` → pie slice (no inner cut-out).
 * - `endAngle - startAngle >= 2π` and `innerR > 0` → full annulus (ring).
 * - `endAngle - startAngle >= 2π` and `innerR === 0` → full disk; prefer
 *   `CircleShape` for that case unless you need the arc spec for animation.
 *
 * The silhouette is traced with Pixi's native `arc()` for smoothness; bounds,
 * containment, and dashed-stroke fall back to a discretised polyline sampled
 * at `ARC_SAMPLE_STEP`.
 */
declare class ArcShape extends ShapeBase<ArcSpec> {
    static readonly kind = "arc";
    constructor(spec: ArcSpec, host: ShapeHostInfo);
    protected drawGeometry(g: Graphics, spec: ArcSpec, style?: ShapePaintStyle): void;
    bounds(): Rect;
    static boundsOf(spec: Omit<ArcSpec, 'x' | 'y'>): Rect;
    static scaleSpec(spec: Omit<ArcSpec, 'x' | 'y'>, factor: number): Partial<ArcSpec>;
    /**
     * Visual centre of an annular sector — half-angle direction, midradius
     * distance. Used by inset-content labels (`placement: 'center'`); good
     * enough for visual centring without the (more expensive) area-weighted
     * centroid integral.
     */
    visualCenter(): Point;
    contains(localX: number, localY: number): boolean;
}

/**
 * A container shape: a **root** background shape plus an ordered list of child
 * {@link CompositePart}s — `rect` / `circle` / `line` geometry traced into the
 * shared body `Graphics`, and `label` text blocks mounted as Pixi text children
 * — each positioned relative to the composite's top-left origin (so
 * `(spec.x, spec.y)` places the whole composite, like {@link RectShape}).
 *
 * The composite owns **no** silhouette geometry of its own: it borrows a real
 * shape instance ({@link CompositeRootSpec}) and traces it via `paintInto`, so
 * fill, stroke, hit-testing and every decoration (ring / glow / halo) follow the
 * root shape automatically — a circular card gets a circular halo for free.
 *
 * Mounting text children mirrors how {@link ShapeBase} mounts glyph / svg /
 * image insets onto the shape's root container; labels here are diffed by
 * their index in `parts` (mount / update-in-place / destroy).
 */
declare class CompositeShape extends ShapeBase<CompositeSpec> {
    static readonly kind = "composite";
    /** Mounted label displays keyed by their index in `spec.parts`. */
    private readonly labelViews;
    /** Mounted `icon` inset views keyed by their index in `spec.parts`. */
    private readonly iconViews;
    /**
     * Device resolution for the mounted `label` parts, pushed by the renderer's
     * label-resolution LOD path ({@link setLabelResolution}). Re-applied to every
     * label on each {@link syncLabels} so redraws don't reset crisp text to base.
     */
    private labelResolution;
    /**
     * Whether the mounted `label` parts are hidden. Persists across
     * {@link syncLabels} (re-applied per redraw, like {@link labelResolution}) so a
     * text zoom-LOD toggle survives updates. Driven by {@link setTextVisible}.
     */
    private textHidden;
    /** Borrowed background shape — provides the silhouette geometry. */
    private rootShape;
    private rootKind;
    /** Silhouette mask used when {@link CompositeSpec.clip} is set (else undefined). */
    private clipMask?;
    constructor(spec: CompositeSpec, host: ShapeHostInfo);
    /**
     * The effective root spec: explicit {@link CompositeSpec.root} or a default
     * rect. Resolved by the pure spec maths so the hit test (which has no
     * instance to ask) resolves the same silhouette this draws.
     */
    private rootSpecOf;
    /**
     * Ensure {@link rootShape} matches the current root spec. Rebuilds the
     * instance only when the kind changes; otherwise refreshes its geometry spec
     * in place (no redraw of the borrowed instance's own — unused — gfx).
     */
    private ensureRoot;
    protected drawGeometry(g: Graphics, spec: CompositeSpec, style?: ShapePaintStyle): void;
    /** Refresh the root shape, geometry via the base `draw`, then labels + icons. */
    draw(spec: CompositeSpec): void;
    /**
     * Maintain the silhouette clip mask per {@link CompositeSpec.clip}. The mask is
     * the root shape traced (filled) at the same centred offset {@link drawGeometry}
     * uses, added as a child of `gfx` and set as `gfx.mask` — so every part /
     * label / icon is clipped to the card outline while the borrowed silhouette
     * (and its decorations, which live outside `gfx`) are untouched.
     */
    private ensureClip;
    /**
     * Diff the `label` parts against the mounted `labelViews` map, keyed by part
     * index: mount new labels, update existing ones in place, destroy removed
     * ones. Each label is positioned at its relative `(x, y)` with the requested
     * horizontal anchor (measured against the rendered block width).
     */
    private syncLabels;
    /**
     * Diff the `icon` parts against the mounted `iconViews`, keyed by part index.
     * Each glyph/svg is mounted as an inset centred in its own `size × size` box
     * at the part's `(x, y)` — reusing the same {@link mountInsetContent} pipeline
     * ShapeBase uses for shape insets (anchor / sizeRatio / async svg-url all
     * carry over). The chip background, if any, is traced in `drawGeometry`.
     */
    private syncIcons;
    bounds(): Rect;
    /**
     * Static AABB from the spec's `width × height` box — the composite's silhouette
     * fills its box (like {@link RectShape}). Exposed so `PrimitivesRenderer.boundsOfSpec`
     * can size a composite **without** an instance, which is how layouts (ELK et al.)
     * read node dimensions. Missing this made every card fall back to the layout's
     * default size and overlap.
     */
    static boundsOf(spec: Pick<CompositeSpec, 'width' | 'height'>): Rect;
    /**
     * Re-rasterise every mounted `label` part at `resolution` (device pixels per
     * CSS pixel) and remember it, so subsequent redraws keep the text crisp. The
     * renderer calls this from its label-resolution LOD path — the composite
     * counterpart to a `LabelDecoration.setResolution`.
     */
    setLabelResolution(resolution: number): void;
    /**
     * Show / hide every mounted `label` part — the composite's internal text.
     * A pure `.visible` flip; the flag persists so a later redraw keeps text
     * hidden ({@link syncLabels} re-asserts it). This is the `IShape.setTextVisible`
     * hook the renderer's text zoom-LOD path drives, so a `NodeLabelLODBehaviour` gates
     * composite text the same way it gates a simple node's `'label'` decoration.
     */
    setTextVisible(visible: boolean): void;
    /**
     * Sub-part hit test — returns the `hitId` of the topmost `hitId`-tagged part
     * (`rect` / `circle` / `icon`) containing the local point, or `undefined`.
     * Parts are traced back-to-front, so the search runs in reverse (last drawn =
     * on top). The renderer calls this to emit `shape:partover` / `shape:partout`.
     */
    hitTestPart(localX: number, localY: number): string | undefined;
    destroy(): void;
}

/**
 * The single concrete connector class. Renders any `Path` natively via
 * Pixi commands (`moveTo` / `lineTo` / `quadraticCurveTo` / `bezierCurveTo`),
 * then strokes once with the spec's stroke or the decoration `style` override.
 *
 * Visual variation comes from the `router` (which produces the path), not
 * from connector subclasses. Custom rendering styles (double-line, gradient,
 * wiggle) are added later by extending `ConnectorBase` directly.
 */
declare class Connector extends ConnectorBase<BaseConnectorSpec> {
    protected drawGeometry(g: Graphics, spec: BaseConnectorSpec, path: Path, style?: ConnectorPaintStyle): void;
}

/**
 * Arrowhead marker. Drawn as a triangle whose tip lies at the anchor; the
 * base extends `lengthScale × strokeWidth` pixels back along the negative
 * tangent direction with a perpendicular spread of `widthScale × strokeWidth`
 * (clamped so the base is never narrower than the line).
 *
 * Sizing is **always proportional to the host connector's stroke width** —
 * a 1px line gets a 4×3 arrow (with the default scales), a 7px line gets a
 * 28×21 arrow. The base width is additionally clamped to ≥ strokeWidth so a
 * thick line never feeds into a narrower arrow base.
 *
 * Two paint surfaces:
 *   - **instance**: used as a regular shape via `addShape` — the arrow tip
 *     anchors at `(spec.x, spec.y)` and points along +X (angle = 0). Useful
 *     for stand-alone arrowheads or directional badges. With no host
 *     connector, sizing assumes `strokeWidth = 1`.
 *   - **static**: used as a connector marker via `connectorSpec.sourceMarker
 *     = arrowMarkerSpec(...)` — the connector calls `ArrowMarker.paintInto`
 *     with the polyline endpoint, tangent angle, and resolved strokeWidth.
 */
interface ArrowMarkerSpec extends BaseShapeSpec {
    readonly kind: 'arrow';
    /**
     * Multiplier on the connector's stroke width that yields the tip-to-base
     * distance. Default `4` (so a 2px stroke produces an 8px-long arrow).
     */
    readonly lengthScale?: number;
    /**
     * Multiplier on the connector's stroke width that yields the perpendicular
     * base width. Final width is clamped to `≥ strokeWidth` so the arrow base
     * is never narrower than the line. Default `3`.
     */
    readonly widthScale?: number;
}
/**
 * Convenience builder for connector marker specs (no `x` / `y`).
 * Usage: `connectorSpec.targetMarker = arrowMarkerSpec({ fill: 0x000000 })`.
 */
declare function arrowMarkerSpec(spec?: Omit<ArrowMarkerSpec, 'kind' | 'x' | 'y'>): Omit<ArrowMarkerSpec, 'x' | 'y'>;
declare class ArrowMarker extends ShapeBase<ArrowMarkerSpec> {
    static readonly kind = "arrow";
    constructor(spec: ArrowMarkerSpec, host: ShapeHostInfo);
    protected drawGeometry(g: Graphics, spec: ArrowMarkerSpec, style?: ShapePaintStyle): void;
    bounds(): Rect;
    /**
     * Distance from the arrow tip back to the base along the negative tangent.
     * The connector trims its body by this amount so the line stops at the
     * marker's base — the marker triangle then visually starts where the line
     * ends and its tip reaches the original anchor (target endpoint).
     */
    static markerInset(spec: Omit<ArrowMarkerSpec, 'x' | 'y'>, strokeWidth?: number): number;
    static paintInto(g: Graphics, spec: Omit<ArrowMarkerSpec, 'x' | 'y'>, anchor: Point, angleRad: number, style?: ShapePaintStyle, strokeWidth?: number): void;
}

/**
 * Diamond (rhombus) marker. Drawn with its forward vertex at the anchor,
 * extending `lengthScale × strokeWidth` back along the negative tangent, and
 * widest at its midpoint with a perpendicular span of
 * `widthScale × strokeWidth`.
 *
 * Sizing is proportional to the host connector's stroke width, exactly as
 * {@link ArrowMarker} — `@invana/graph` converts a pixel `arrow*Size` into
 * these scales so both markers answer the same units.
 *
 * The classic use is UML-flavoured composition / aggregation, and the "exactly
 * one" end of an ER relationship where a solid terminal is wanted instead of a
 * directional arrowhead.
 *
 * Two paint surfaces, mirroring {@link ArrowMarker}:
 *   - **instance**: via `addShape`, forward vertex at `(spec.x, spec.y)`
 *     pointing along +X, sized as if `strokeWidth = 1`.
 *   - **static**: via `connectorSpec.targetMarker`, where the connector calls
 *     `DiamondMarker.paintInto` with the endpoint, tangent and stroke width.
 */
interface DiamondMarkerSpec extends BaseShapeSpec {
    readonly kind: 'diamond';
    /**
     * Multiplier on the connector's stroke width giving the tip-to-tail
     * distance. Default `4`.
     */
    readonly lengthScale?: number;
    /**
     * Multiplier on the connector's stroke width giving the perpendicular span
     * at the midpoint. Clamped to `≥ strokeWidth`. Default `2.6`.
     */
    readonly widthScale?: number;
}
/**
 * Convenience builder for connector marker specs (no `x` / `y`).
 * Usage: `connectorSpec.targetMarker = diamondMarkerSpec({ fill: 0x000000 })`.
 */
declare function diamondMarkerSpec(spec?: Omit<DiamondMarkerSpec, 'kind' | 'x' | 'y'>): Omit<DiamondMarkerSpec, 'x' | 'y'>;
declare class DiamondMarker extends ShapeBase<DiamondMarkerSpec> {
    static readonly kind = "diamond";
    constructor(spec: DiamondMarkerSpec, host: ShapeHostInfo);
    protected drawGeometry(g: Graphics, spec: DiamondMarkerSpec, style?: ShapePaintStyle): void;
    bounds(): Rect;
    /**
     * Distance from the forward vertex back to the tail along the negative
     * tangent. The connector trims its body by this much so the line meets the
     * diamond's tail rather than running under it.
     */
    static markerInset(spec: Omit<DiamondMarkerSpec, 'x' | 'y'>, strokeWidth?: number): number;
    static paintInto(g: Graphics, spec: Omit<DiamondMarkerSpec, 'x' | 'y'>, anchor: Point, angleRad: number, style?: ShapePaintStyle, strokeWidth?: number): void;
}

/**
 * Circular (dot) marker. Drawn tangent to the endpoint: the circle's forward
 * edge touches the anchor and its body extends `lengthScale × strokeWidth`
 * back along the negative tangent, so the diameter *is* the marker's
 * tangent-extent and the line meets the circle rather than running through it.
 *
 * Sizing is proportional to the host connector's stroke width, exactly as
 * {@link ArrowMarker} — `@invana/graph` converts a pixel `arrow*Size` into
 * these scales so every marker answers the same units.
 *
 * The classic use is the "zero or one" end of an ER relationship, and any
 * non-directional terminal where an arrowhead would wrongly imply flow.
 *
 * Two paint surfaces, mirroring {@link ArrowMarker}:
 *   - **instance**: via `addShape`, forward edge at `(spec.x, spec.y)` with the
 *     body extending along −X, sized as if `strokeWidth = 1`.
 *   - **static**: via `connectorSpec.targetMarker`, where the connector calls
 *     `DotMarker.paintInto` with the endpoint, tangent and stroke width.
 */
interface DotMarkerSpec extends BaseShapeSpec {
    readonly kind: 'dot';
    /**
     * Multiplier on the connector's stroke width giving the circle's
     * **diameter** — which is also its tangent-extent. Default `3.2`.
     */
    readonly lengthScale?: number;
}
/**
 * Convenience builder for connector marker specs (no `x` / `y`).
 * Usage: `connectorSpec.targetMarker = dotMarkerSpec({ fill: 0x000000 })`.
 */
declare function dotMarkerSpec(spec?: Omit<DotMarkerSpec, 'kind' | 'x' | 'y'>): Omit<DotMarkerSpec, 'x' | 'y'>;
declare class DotMarker extends ShapeBase<DotMarkerSpec> {
    static readonly kind = "dot";
    constructor(spec: DotMarkerSpec, host: ShapeHostInfo);
    protected drawGeometry(g: Graphics, spec: DotMarkerSpec, style?: ShapePaintStyle): void;
    bounds(): Rect;
    /**
     * The circle's diameter — the connector trims its body by this much so the
     * line stops at the dot's trailing edge instead of crossing it.
     */
    static markerInset(spec: Omit<DotMarkerSpec, 'x' | 'y'>, strokeWidth?: number): number;
    static paintInto(g: Graphics, spec: Omit<DotMarkerSpec, 'x' | 'y'>, anchor: Point, angleRad: number, style?: ShapePaintStyle, strokeWidth?: number): void;
}

declare class GlowDecoration extends ShapeDecorationBase<GlowDecorationStyle> {
    private layerGfx;
    private pulseElapsed;
    protected repaint(): void;
    /**
     * Advance the optional pulse phase. Geometry is repainted once at mount
     * (cheap) and never again — only `this.gfx.alpha` is touched per frame,
     * so animated pulse is essentially free.
     */
    tick(deltaMs: number): boolean;
    /**
     * Outer edge of the halo — the widest stroke layer paints at roughly
     * `strokeWidth` past the silhouette (`paintInto` defaults to `'outside'`
     * alignment, so the full stroke sits outward). Reported so
     * `LabelDecoration` can push outside-placement labels past the glow.
     * The optional `pulse` only modulates alpha, not geometry, so the
     * resting extent is the only one worth reporting.
     */
    getOuterExtent(): number;
    private syncLayerCount;
}

declare class PulseRingDecoration extends ShapeDecorationBase<PulseRingDecorationStyle> {
    private ringGfx;
    private elapsed;
    protected repaint(): void;
    tick(deltaMs: number): boolean;
    private syncRingCount;
}

declare class LiquidFillDecoration extends ShapeDecorationBase<LiquidFillDecorationStyle> {
    private maskGfx;
    private fluidContainer;
    private fluidGfx;
    private highlightGfx;
    private gradient;
    private wavePhase;
    protected repaint(): void;
    tick(deltaMs: number): boolean;
    destroy(): void;
    private drawFluid;
}

declare class MarchingAntsDecoration extends ShapeDecorationBase<MarchingAntsDecorationStyle> {
    private antsGfx;
    private elapsedMs;
    constructor(style: MarchingAntsDecorationStyle);
    protected repaint(): void;
    tick(deltaMs: number): boolean;
}

declare class RingDecoration extends ShapeDecorationBase<RingDecorationStyle> {
    private readonly band;
    constructor(style: RingDecorationStyle);
    protected repaint(): void;
    /**
     * Outer edge of the band: `gap` pushes the silhouette outward, then the
     * full stroke width sits past that. Reported so `LabelDecoration` can
     * offset outside-placement labels past the ring.
     */
    getOuterExtent(): number;
}

declare class MarchingAntsConnectorDecoration extends ConnectorDecorationBase<MarchingAntsConnectorDecorationStyle> {
    private antsGfx;
    private elapsedMs;
    constructor(style: MarchingAntsConnectorDecorationStyle);
    protected repaint(): void;
    tick(deltaMs: number): boolean;
}

declare class RingConnectorDecoration extends ConnectorDecorationBase<RingConnectorDecorationStyle> {
    private readonly band;
    constructor(style: RingConnectorDecorationStyle);
    /**
     * The band extends `width / 2` past each path endpoint (a centered stroke
     * widens equally on both sides). Asking the renderer to inset both ends
     * by that amount keeps the halo's outer edge sitting at the anchor
     * instead of poking past it.
     */
    getEndPadding(): {
        source: number;
        target: number;
    };
    protected repaint(): void;
}

declare class FlyMarkerConnectorDecoration extends ConnectorDecorationBase<FlyMarkerConnectorDecorationStyle> {
    private markerGfx;
    private elapsedMs;
    constructor(style: FlyMarkerConnectorDecorationStyle);
    /** Densified polyline of the current host path. */
    private samples;
    /** Cumulative arc-length at each sample. `cumLen[i]` = distance from samples[0] to samples[i]. */
    private cumLen;
    /** Total arc length of the sampled polyline. */
    private totalLen;
    protected repaint(): void;
    tick(deltaMs: number): boolean;
    private rebuildArcTable;
    /** Position + unit tangent at arc-length `dist` along the sampled polyline. */
    private sampleAt;
    private drawMarkerSilhouette;
}

declare class FlowParticlesConnectorDecoration extends ConnectorDecorationBase<FlowParticlesConnectorDecorationStyle> {
    private particles;
    private elapsedMs;
    private samples;
    private cumLen;
    private totalLen;
    protected repaint(): void;
    tick(deltaMs: number): boolean;
    private syncParticleCount;
    private drawSilhouetteIntoEach;
    private rebuildArcTable;
    private sampleAt;
}

declare class GlowConnectorDecoration extends ConnectorDecorationBase<GlowConnectorDecorationStyle> {
    private layerGfx;
    private pulseElapsed;
    /**
     * Halo extends `radius` px past each path endpoint (the outermost layer's
     * stroke is centered on the path and `radius` wide). Returning that as
     * end-padding asks the renderer to inset both ends by `radius` — so the
     * halo's outer edge lands at the anchor instead of overshooting.
     */
    getEndPadding(): {
        source: number;
        target: number;
    };
    protected repaint(): void;
    tick(deltaMs: number): boolean;
    private syncLayerCount;
}

declare class RippleConnectorDecoration extends ConnectorDecorationBase<RippleConnectorDecorationStyle> {
    private ringGfx;
    private elapsed;
    /**
     * The peak wave extends `maxRadius` px past each path endpoint (the
     * widest ring's stroke is `2 × maxRadius` centered on the path). Asking
     * the renderer to inset both ends by `maxRadius` makes the peak wave's
     * outer edge land at the anchor — the body / markers sit back from the
     * anchor by `maxRadius` so they're enveloped as each wave grows.
     */
    getEndPadding(): {
        source: number;
        target: number;
    };
    protected repaint(): void;
    tick(deltaMs: number): boolean;
    private syncRingCount;
}

declare class RevealConnectorDecoration extends ConnectorDecorationBase<RevealConnectorDecorationStyle> {
    private revealGfx;
    private tween;
    private remainingDelayMs;
    private finished;
    private hostHiddenByUs;
    /** Densified polyline of the host path, oriented per `direction`. */
    private samples;
    /** Cumulative arc length at each sample. */
    private cumLen;
    /** Total arc length. */
    private totalLen;
    constructor(style: RevealConnectorDecorationStyle);
    protected repaint(): void;
    /**
     * Show / hide the "ending" marker (the endpoint the reveal sweeps toward)
     * based on whether the line has reached it. The "starting" marker stays
     * visible at all times because the reveal originates from its endpoint.
     */
    private applyEndingMarkerVisibility;
    tick(deltaMs: number): boolean;
    destroy(): void;
    private restoreHostVisibility;
    private rebuildArcTable;
    /**
     * Paint the polyline from `samples[0]` up to arc-length `progress × totalLen`.
     * Interpolates within the last partial segment so the head doesn't snap
     * between sample indices.
     */
    private paintAt;
}

/**
 * Shape-anchored `LabelDecoration` — positions a text (or HTML text) block
 * relative to the host shape's bounding box, with optional background pill
 * and per-zoom LOD.
 *
 * Placement covers the 13 standard slots: `center` (inside the silhouette),
 * 8 outside sides (`top` / `top-right` / `right` / ... / `top-left`), and 4
 * inside corners (`inside-top-left` / ...). For `center` this decoration
 * subsumes the legacy `kind: 'text'` fill layer.
 *
 * Performance: text and background are mutated in place on update; no
 * allocation per frame. LOD removes the decoration's gfx from the scene
 * (not just `visible = false`) when outside the zoom band so Pixi skips the
 * transform pass entirely.
 */

declare class LabelDecoration extends ShapeDecorationBase<ShapeLabelStyle> {
    private contentView;
    private contentLayer;
    private bgGfx;
    /** Whether `gfx` is currently parented to host surface (false when LOD-hidden). */
    private attached;
    /** Cached host surface for re-attach on LOD show. */
    private hostSurface;
    /**
     * Cached rasterisation resolution applied to the inner text. Survives
     * `repaint()` so a renderer-level zoom-LOD push isn't lost when style
     * changes trigger a fresh `updateLabelContent`.
     */
    private resolution;
    /**
     * Scale the renderer's label-size policy last asked for (`1` = natural).
     * Survives `repaint()` like {@link resolution}.
     */
    private textScale;
    /**
     * Where `repaint()` last anchored the label: the anchor point on the host and
     * the label-relative delta from it (placement alignment + style offset). The
     * delta is in label units, so {@link applyPlacement} scales it with the text
     * — that keeps an outside label's near edge on the host as it shrinks/grows.
     */
    private anchorX;
    private anchorY;
    private deltaX;
    private deltaY;
    /**
     * Pixi rasterises `Text` to a glyph texture once and re-uses it across
     * frames. The default resolution is the renderer's DPR, so when the
     * camera zooms in the texture is sampled up and labels get fuzzy.
     * Bumping `resolution` re-rasterises at higher fidelity. Idempotent
     * with the same value (Pixi short-circuits internally).
     */
    setResolution(resolution: number): void;
    /**
     * Last-applied rasterisation resolution, or `null` if `setResolution`
     * has never been called. The renderer's viewport sweep uses this to
     * skip labels already at the target so a converged scene costs nothing
     * past one bounds check per label per frame.
     */
    getResolution(): number | null;
    /** Authored font size of the label's content — see `contentFontSize`. */
    textFontSize(): number;
    /**
     * `true` for `inside-*` placements, whose fit-to-box contract a label-size
     * policy may only shrink within, never grow past.
     */
    isContained(): boolean;
    /**
     * Draw the label at `scale` × its natural size (the renderer's label-size
     * policy), re-anchored so it stays attached to its host. Idempotent.
     */
    setTextScale(scale: number): void;
    /** Write the anchored position and the text scale onto `gfx`. */
    private applyPlacement;
    protected repaint(): void;
    /**
     * Per-frame check for LOD — when the camera-zoom (effective world scale)
     * leaves the `visibility` range, detach `gfx` from the surface so Pixi
     * skips it entirely. Re-attach when zoom re-enters the range.
     *
     * Without `visibility` set this hook is a no-op and the renderer never
     * registers it as animated (we return `false`).
     */
    tick(_deltaMs: number): boolean;
}

/**
 * Connector-anchored `LabelDecoration` — positions a text (or HTML text)
 * block at a `t` along the host path, with optional `pathOffset` shift along
 * the local tangent, screen-space `offset` applied post-rotation, and
 * `autoRotate` to align the label's baseline with the path direction.
 *
 * Tangent sampling: uses `samplePathAt(path, t)` which densifies the path
 * to a polyline and arc-length-walks to the requested `t`. Works uniformly
 * for every router / pathStyle the engine produces — straight, bezier,
 * smooth, rounded, orth, manhattan, bump-radial — because they all reduce
 * to the same `Path` (M/L/Q/C) command set.
 *
 * Per-frame cost: `tick` only runs when `autoRotate: true` or `visibility`
 * is configured. Static labels (`autoRotate: false`, no `visibility`) mount
 * once and never re-evaluate.
 */

declare class LabelConnectorDecoration extends ConnectorDecorationBase<ConnectorLabelStyle> {
    private contentView;
    private contentLayer;
    private bgGfx;
    private attached;
    private hostSurface;
    /** See `LabelDecoration.resolution`. */
    private resolution;
    /** See `LabelDecoration.textScale`. */
    private textScale;
    /** See `LabelDecoration.setResolution`. */
    setResolution(resolution: number): void;
    /** See `LabelDecoration.getResolution`. */
    getResolution(): number | null;
    /** See `LabelDecoration.textFontSize`. */
    textFontSize(): number;
    /**
     * Draw the label at `scale` × its natural size (the renderer's label-size
     * policy). The label stays centred on its path point; its style `offset`
     * scales with it, so the gap to the path keeps its proportion. Idempotent.
     */
    setTextScale(scale: number): void;
    protected repaint(): void;
    /**
     * Re-position + re-rotate the label on the current host path. Called
     * during repaint and on every tick (cheap — one path sample + one
     * trigonometric op). Without `autoRotate` and `visibility` configured the
     * renderer never registers `tick` and this stays static.
     */
    private positionOnPath;
    tick(_deltaMs: number): boolean;
}

/**
 * Small circular `+` / `−` button drawn at a configurable anchor on the
 * host shape. Pure visual; emits no events.
 *
 * Geometry: one filled + stroked circle, plus one or two glyph strokes
 * (`+` draws a horizontal and vertical stroke; `−` draws only the
 * horizontal). Repainted on every `update()` so a `setDecoration` that
 * flips `state` from `'plus'` to `'minus'` redraws in place without
 * remounting.
 */
declare class ToggleDecoration extends ShapeDecorationBase<ToggleDecorationStyle> {
    private readonly button;
    private readonly glyph;
    /**
     * Cached hit geometry, refreshed on every `repaint()`. Stale read between
     * a host bounds change and the next `update()` is acceptable — the
     * renderer always calls `update` after bounds change, and the resulting
     * "missed by a pixel" hit just means the user clicked an extra time.
     */
    private hit;
    constructor(style: ToggleDecorationStyle);
    /**
     * Most-recently-computed shape-local hit geometry. Returns `{0, 0, 0}`
     * before the first `mount` / `update` — callers should still defend
     * against a zero radius as a "not laid out yet" signal.
     */
    getLocalHitGeometry(): ToggleHitGeometry;
    protected repaint(): void;
    /**
     * Outer-extent contribution — outside-placed toggles bulge slightly
     * past the silhouette, but the bulge is small (one radius) and only on
     * one side. Reporting it would push `LabelDecoration` outward on all
     * four sides, which looks worse than letting an outside-bottom label
     * overlap the toggle. Returning `0` keeps the label flow stable; the
     * developer can offset the label manually if both fight for the same
     * slot.
     */
    getOuterExtent(): number;
}

/**
 * Shape-local hit geometry for a `ResizeHandleDecoration`. Same coordinate
 * convention as the toggle's: add the host shape's spec `x` / `y` to convert
 * to world. The geometry is a square — a behaviour testing a pointer hit
 * compares against the AABB `[cx-half, cx+half] × [cy-half, cy+half]`.
 */
interface ResizeHandleHitGeometry {
    readonly cx: number;
    readonly cy: number;
    /** Half side-length in shape-local px. */
    readonly half: number;
    readonly placement: ResizeHandlePlacement;
}
/**
 * Small square handle drawn at a configurable anchor on the host shape's
 * AABB. Pure visual; emits no events. `GroupResizeBehaviour` (in
 * `@invana/graph`) reads `getLocalHitGeometry()` and resolves drags itself.
 *
 * Multiple handles per host are expected — register one decoration per
 * corner / side with distinct slot ids (`'resize-tl'`, `'resize-br'`, …)
 * and the renderer will mount each into its own slot.
 */
declare class ResizeHandleDecoration extends ShapeDecorationBase<ResizeHandleDecorationStyle> {
    private readonly handle;
    private hit;
    constructor(style: ResizeHandleDecorationStyle);
    /** See {@link ToggleDecoration.getLocalHitGeometry}. */
    getLocalHitGeometry(): ResizeHandleHitGeometry;
    protected repaint(): void;
    getOuterExtent(): number;
}

/**
 * Selection / transform frame — dashed AABB outline plus round drag
 * handles at the four corners and four edge midpoints. Pure visual; the
 * resize behaviour reads `getLocalHandleHits()` and runs its own
 * pointer hit math against the returned per-handle disks.
 *
 * Repaints in place on style change so a behaviour can flip the
 * `visible` field, change the dash colour, or hide / show specific
 * handles via `handles` without remounting.
 */
declare class SelectionFrameDecoration extends ShapeDecorationBase<SelectionFrameDecorationStyle> {
    private readonly border;
    private readonly handlesGfx;
    private hits;
    constructor(style: SelectionFrameDecorationStyle);
    /**
     * Most-recently-computed per-handle hit geometry, in shape-local
     * coordinates. Behaviours iterate this array on pointerdown and test
     * each disk against the world-space click.
     */
    getLocalHandleHits(): ReadonlyArray<SelectionFrameHandleHit>;
    protected repaint(): void;
    getOuterExtent(): number;
}

/**
 * Style options for `ShakeEffect`.
 *
 * - `amplitude` — peak jitter magnitude in world pixels, applied as a random
 *   offset to both axes every frame. Default `4`.
 * - `axis` — `'both' | 'x' | 'y'`. Default `'both'`.
 * - `decayMs` — when set, amplitude tweens from full to zero over this many
 *   milliseconds and the effect retires when complete. Use this for "shake
 *   on click" gestures. Omit for a continuous shake.
 * - `seed` — optional starting offset into the PRNG. Effects are independent
 *   by default (each constructs its own RNG state).
 */
interface ShakeEffectStyle {
    readonly amplitude?: number;
    readonly axis?: 'both' | 'x' | 'y';
    readonly decayMs?: number;
    readonly seed?: number;
}
/**
 * Per-frame random jitter applied to the host's position. Pure transform
 * modulation — the host's spec is untouched; removing the effect (or letting
 * `decayMs` retire it) reverts the host to its baseline position on the next
 * frame.
 *
 * Uses `Tween` for the optional decay envelope so easing stays consistent
 * with other animated primitives.
 */
declare class ShakeEffect extends EffectBase<ShakeEffectStyle> {
    readonly target: EffectTarget;
    private readonly amplitude;
    private readonly axis;
    private readonly decay;
    private seed;
    private currentDx;
    private currentDy;
    constructor(style: ShakeEffectStyle);
    tick(deltaMs: number): boolean;
    readTransform(): TransformDelta;
    /** xorshift32 — deterministic per-effect PRNG, no global state. */
    private rand;
}

/**
 * Style options for `BreathingEffect`.
 *
 * - `amplitude` — fractional scale swing. `0.05` means the host scales
 *   between `0.95` and `1.05`. Default `0.05`.
 * - `periodMs` — duration of one full breath cycle. Default `1800`.
 * - `axis` — `'both' | 'x' | 'y'`. Default `'both'`.
 * - `phaseOffsetMs` — start time offset; lets multiple breathing hosts
 *   desync visually. Default `0`.
 */
interface BreathingEffectStyle {
    readonly amplitude?: number;
    readonly periodMs?: number;
    readonly axis?: 'both' | 'x' | 'y';
    readonly phaseOffsetMs?: number;
}
/**
 * Sinusoidal scale modulation around 1.0. Cycles forever — never retires on
 * its own; remove explicitly via `setEffect(id, slot, null)`. Uses a raw
 * sine accumulator rather than `Tween` because the motion is naturally
 * cyclical (no start / end / easing curve to compose).
 */
declare class BreathingEffect extends EffectBase<BreathingEffectStyle> {
    readonly target: EffectTarget;
    private readonly amplitude;
    private readonly periodMs;
    private readonly axis;
    private elapsed;
    private currentSx;
    private currentSy;
    constructor(style: BreathingEffectStyle);
    tick(deltaMs: number): boolean;
    readTransform(): TransformDelta;
}

/**
 * Sinusoidal alpha modulation on the host connector. Cycles forever — never
 * retires on its own; remove explicitly via `setEffect(id, slot, null)`.
 *
 * Style channel only — connector effects don't have a coherent meaning
 * for transform deltas (translating / scaling a path-resolved primitive
 * would just shift its position offscreen relative to the endpoints),
 * so this effect modulates the host's gfx alpha instead. Pairs naturally
 * with a thin static `glow-connector` for "active edge" cues, or stands
 * alone for "blinking" / "pulsing" / "in-flight" visualisations.
 */
interface BreathingConnectorEffectStyle {
    /**
     * How far below full brightness the dim phase reaches, `[0, 1]`.
     * `0.5` swings alpha between `0.5` and `1`. Default `0.5`.
     */
    readonly amplitude?: number;
    /** Duration of one full breath cycle in ms. Default `1800`. */
    readonly periodMs?: number;
    /** Start-time offset so multiple breathing hosts can desync. Default `0`. */
    readonly phaseOffsetMs?: number;
}
declare class BreathingConnectorEffect extends ConnectorEffectBase<BreathingConnectorEffectStyle> {
    readonly target: EffectTarget;
    private readonly amplitude;
    private readonly periodMs;
    private elapsed;
    private currentAlpha;
    constructor(style: BreathingConnectorEffectStyle);
    tick(deltaMs: number): boolean;
    readStyle(): StyleOverride;
}

/**
 * Style options for `FadeInEffect` — the shape twin of
 * `FadeInConnectorEffect`, field for field.
 *
 * - `durationMs` — length of the fade. Default `600`.
 * - `fromAlpha` / `toAlpha` — the endpoints. Default `0` → `1`.
 * - `easing` — named curve, so the payload stays serialisable. Default
 *   `'easeOutCubic'`.
 * - `delayMs` — hold at `fromAlpha` this long before fading. This is the field
 *   that turns a set of fades into an *entrance*: give each host a different
 *   delay and the scene arrives in an order you chose rather than all at once.
 */
interface FadeInEffectStyle {
    readonly durationMs?: number;
    readonly fromAlpha?: number;
    readonly toAlpha?: number;
    readonly easing?: EasingName;
    readonly delayMs?: number;
}
/**
 * One-shot opacity fade-in on the host shape. Drives alpha from `fromAlpha`
 * (default `0`) to `toAlpha` (default `1`) over `durationMs`, then retires from
 * the per-frame tick set while continuing to contribute `toAlpha` — so the host
 * stays visible without costing a tick for the rest of its life.
 *
 * The connector side of this has existed since the effects vocabulary landed
 * (`FadeInConnectorEffect`); shapes had `shake` and `breathing` and no way to
 * arrive. Pairs with the appearance of a new node, and with
 * `EntranceBehaviour`, which is just this effect applied across a graph with a
 * staggered `delayMs`.
 *
 * For a continuous pulse use `BreathingEffect` instead — this one is
 * deliberately one-shot.
 */
declare class FadeInEffect extends EffectBase<FadeInEffectStyle> {
    readonly target: EffectTarget;
    private readonly tween;
    private readonly fromAlpha;
    private readonly toAlpha;
    private remainingDelayMs;
    private currentAlpha;
    constructor(style: FadeInEffectStyle);
    tick(deltaMs: number): boolean;
    readStyle(): StyleOverride;
}

/** Named easings accepted by the fade-in style payload. */
type FadeInEasingName = 'linear' | 'easeOutCubic' | 'easeInOutCubic' | 'easeInOutSine';
/**
 * One-shot opacity fade-in on the host connector. Drives the connector's
 * alpha from `fromAlpha` (default `0`) to `toAlpha` (default `1`) over
 * `durationMs` with the configured easing, then retires from the per-frame
 * tick set while continuing to contribute `toAlpha` to the effect aggregation
 * so the connector stays visible after the fade.
 *
 * Pairs naturally with the appearance of a "new edge" in a graph. For a
 * continuous pulse use `BreathingConnectorEffect` instead — this one is
 * deliberately one-shot.
 */
interface FadeInConnectorEffectStyle {
    /** Duration of the fade in milliseconds. Default `600`. */
    readonly durationMs?: number;
    /** Start alpha. Default `0`. */
    readonly fromAlpha?: number;
    /** End alpha. Default `1`. */
    readonly toAlpha?: number;
    /** Easing curve. Default `'easeOutCubic'`. */
    readonly easing?: FadeInEasingName;
    /** Hold the effect at `fromAlpha` for this many ms before the fade starts. Default `0`. */
    readonly delayMs?: number;
}
declare class FadeInConnectorEffect extends ConnectorEffectBase<FadeInConnectorEffectStyle> {
    readonly target: EffectTarget;
    private readonly tween;
    private readonly fromAlpha;
    private readonly toAlpha;
    private remainingDelayMs;
    private currentAlpha;
    constructor(style: FadeInConnectorEffectStyle);
    tick(deltaMs: number): boolean;
    readStyle(): StyleOverride;
}

/**
 * `loadIconFont` — inject an icon-font stylesheet at runtime, then await
 * font readiness so the very first paint rasterises against the real
 * webfont (not a fallback with the wrong metrics).
 *
 * The mechanic:
 *
 *   1. Attaching `<link rel="stylesheet" href=…>` kicks off:
 *      stylesheet download → CSS parse → `@font-face` registration → WOFF
 *      fetch.
 *   2. The browser's `FontFaceSet` only knows about the family **after**
 *      the `@font-face` declaration is parsed — calling
 *      `document.fonts.load(…)` before that returns an empty result.
 *   3. So we wait for the link's `load` event first, then ask the
 *      `FontFaceSet` to actually load the face.
 *
 * Vendor-agnostic: takes any stylesheet URL and any font-family name. The
 * canvas library does not know about Font Awesome / Material Symbols /
 * Phosphor / Heroicons / etc. — consumers point this at whichever icon
 * font (or regular webfont) they want.
 *
 * @example
 * ```ts
 * await loadIconFont(
 *   'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
 *   'Font Awesome 6 Free',
 * );
 * // now safe to render `{ kind: 'glyph', char: '', fontFamily: 'Font Awesome 6 Free', fontWeight: 900 }`.
 * ```
 *
 * Idempotent: subsequent calls with the same `stylesheetUrl` reuse the
 * existing `<link>` element. Safe to call from N stories that all use the
 * same icon font.
 *
 * SSR-safe: a no-op when `document` is undefined.
 */
declare function loadIconFont(stylesheetUrl: string, fontFamilyToProbe?: string, fontWeightToProbe?: number | string, fontStyleToProbe?: 'normal' | 'italic'): Promise<void>;

/**
 * Whether the WebGPU API surface is present (`navigator.gpu`). Cheap and
 * synchronous. This is the signal {@link canUseWebGPU} gates on.
 */
declare function hasWebGPUApi(): boolean;
/**
 * Whether a WebGL (`webgl2`/`webgl`) context can be created — the floor for
 * rendering. If this is false and WebGPU is unusable too, the canvas can't
 * initialise on this browser at all.
 *
 * **Probed once, and the probe's context is released.** Answering means creating
 * a real context, and browsers cap live contexts (~16 in Chrome) by evicting the
 * oldest — a live canvas's own among them. A consumer calling this from a React
 * render (a capability notice) used to create one per render. The answer cannot
 * change within a page, so it is memoised.
 */
declare function hasWebGL(): boolean;
/**
 * Whether WebGPU can actually be used for rendering here: the API is present
 * *and* the browser isn't WebKit (see {@link isWebKit}). This is what consumers
 * should gate a "use WebGPU" toggle on, not raw `navigator.gpu` presence.
 */
declare function canUseWebGPU(): boolean;
/**
 * Resolve the backend the engine will actually request from PixiJS. Downgrades a
 * `'webgpu'` preference to `'webgl'` when WebGPU isn't usable ({@link canUseWebGPU}),
 * so we never hand PixiJS a backend that will crash at render time. `'webgl'` and
 * `'canvas'` pass through unchanged. Applied by `Canvas.init()`; the resolved
 * backend is reported on the `renderer:initialised` event.
 */
declare function resolveRenderPreference(pref: RenderPreference): RenderPreference;
/**
 * The most performant backend this browser can actually render with: WebGPU when
 * usable ({@link canUseWebGPU}), else WebGL when a context is available
 * ({@link hasWebGL}), else `'canvas'` as a last resort. Use it to default a
 * canvas / a backend picker to the fastest option the device supports, rather
 * than hard-coding `'webgpu'` and relying on downgrade.
 */
declare function bestRenderPreference(): RenderPreference;

export { ArcShape, ArrowMarker, type ArrowMarkerSpec, BreathingConnectorEffect, type BreathingConnectorEffectStyle, BreathingEffect, type BreathingEffectStyle, CircleShape, CompositeShape, Connector, ConnectorBase, ConnectorDecorationBase, type ConnectorDecorationCtor, type ConnectorDecorationHostInfo, ConnectorEffectBase, type ConnectorHostInfo, DiamondMarker, type DiamondMarkerSpec, DotMarker, type DotMarkerSpec, EffectBase, EllipseShape, FadeInConnectorEffect, type FadeInConnectorEffectStyle, type FadeInEasingName, FadeInEffect, type FadeInEffectStyle, FlowParticlesConnectorDecoration, FlyMarkerConnectorDecoration, GlowConnectorDecoration, GlowDecoration, type IConnector, type IConnectorDecoration, type IDecorationBase, type IEffectBase, type IShape, type IShapeDecoration, type IShapeEffect, LabelConnectorDecoration, LabelDecoration, LiquidFillDecoration, MarchingAntsConnectorDecoration, MarchingAntsDecoration, PathShape, PixiOverlayDevice, PixiRenderer, type PixiRendererOptions, PixiSurface, type PixiSurfaceOptions, PixiViewportBinding, PolygonShape, PrimitiveBase, PrimitivesRenderer, type PrimitivesRendererOptions, PulseRingDecoration, RectShape, RegularPolygonShape, ResizeHandleDecoration, type ResizeHandleHitGeometry, RevealConnectorDecoration, RingConnectorDecoration, RingDecoration, RippleConnectorDecoration, SelectionFrameDecoration, ShakeEffect, type ShakeEffectStyle, ShapeBase, type ShapeCtor, ShapeDecorationBase, type ShapeDecorationCtor, type ShapeDecorationHostInfo, type ShapeEffectCtor, type ShapeEffectHostInfo, type ShapeHostInfo, StarShape, TabbedRectShape, TextureRegistry, ToggleDecoration, arrowMarkerSpec, bestRenderPreference, canUseWebGPU, createDefaultRenderer, diamondMarkerSpec, dotMarkerSpec, hasWebGL, hasWebGPUApi, loadIconFont, resolveRenderPreference };
