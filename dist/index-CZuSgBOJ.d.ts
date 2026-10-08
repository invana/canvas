/**
 * Flush scheduling for the **non-reactive** data stores ({@link DataStore} /
 * {@link LayerData}). A write marks a dirty delta and *arms* a deferred flush; the
 * mode decides **when** that flush fires. The store never notifies per write — it
 * coalesces a whole batch into **one** flush (see `docs/canvas-store-data-event-flow.md` §2).
 */
/** When a coalesced data flush fires. */
type FlushMode = 
/** Next animation frame (browser). Falls back to `microtask` where no rAF exists (node/tests). */
'frame'
/** End of the current JS task — the kernel default (no DOM assumption, deterministic). */
 | 'microtask'
/** Never auto-fires; the owner (e.g. the engine's single rAF loop) calls `flush()`. */
 | 'manual';
/**
 * Arm a deferred flush per `mode`, returning a **cancel** function (a no-op once the
 * callback has run or for modes that can't be cancelled). `'manual'` arms nothing.
 */
declare function scheduleFlush(mode: FlushMode, cb: () => void): () => void;

/**
 * `SpecStore` — the durable **visual description** of one layer's elements.
 *
 * A spec says *what to draw* (`{ kind: 'circle', radius, fill, plane }`) and
 * contains no drawing code. Layers resolve style + templates into specs and
 * publish them here; renderers subscribe and project. That inversion is the
 * point: two backends reading one description cannot disagree about intent, and
 * the description is serialisable, diffable and testable without a GPU.
 *
 * **Generic over `T`, though it no longer has to be.** The vocabulary now sits
 * beside this file (`./index`), so this store *could* name its own element types.
 * It stays generic deliberately: nothing needs the narrowing, and a concrete
 * signature would ripple through `SpecProjector` and `GraphLayer` for no new
 * capability. The engine instantiates it as
 * `SpecStore<BaseShapeSpec | BaseConnectorSpec>`.
 *
 * **What does *not* live here:** positions. Those stay in {@link LayerData}'s
 * typed arrays on the machine-rate path — a drag frame moves nodes without
 * touching a single spec. And transient visuals (lasso, brush, drag ghosts) never
 * enter the store at all; they are drawn through the renderer's overlay device,
 * so gesture noise stays out of history, undo and saved files.
 *
 * Writes mark a dirty delta and arm a coalesced flush — the same contract as
 * {@link LayerData}, so both channels settle in the same frame.
 *
 * See `docs/renderer-split-design.md` §2 (specs as state) and §4.2b (the channel).
 */

/**
 * One coalesced batch of spec changes. Ids only — the receiver reads the specs
 * it cares about, so a flush stays O(dirty) regardless of collection size.
 */
interface SpecFlush {
    readonly added: readonly string[];
    readonly changed: readonly string[];
    readonly removed: readonly string[];
    /** Monotonic, per store. Lets a consumer detect a missed batch. */
    readonly version: number;
}
declare class SpecStore<T extends object = object> {
    private readonly specs;
    private readonly added;
    private readonly changed;
    private readonly removed;
    private readonly listeners;
    private version;
    private scheduled;
    private flushMode;
    private cancel;
    get(id: string): T | undefined;
    has(id: string): boolean;
    get size(): number;
    ids(): IterableIterator<string>;
    entries(): IterableIterator<[string, T]>;
    /** Publish (or replace) the spec for `id`. */
    set(id: string, spec: T): void;
    /**
     * Shallow-merge `partial` over the stored spec. Returns `false` when `id` is
     * unknown, so a caller can fall back to {@link set} with a full spec.
     */
    patch(id: string, partial: Partial<T>): boolean;
    delete(id: string): void;
    /** Drop every spec. Emits one flush listing all ids as removed. */
    clear(): void;
    onFlush(listener: (e: SpecFlush) => void): () => void;
    /**
     * Choose **when** a coalesced flush fires. `'manual'` disarms auto-flush so the
     * engine's single rAF drives it — which is how the renderer stays on one clock.
     */
    setFlushMode(mode: FlushMode): void;
    /** Emit the pending delta, if any. Safe to call when nothing is dirty. */
    flush(): void;
    private schedule;
}

/** A typed listener for one event payload. */
type Listener<P> = (payload: P) => void;
/**
 * A string-keyed event map (`{ eventType: payload }`) — the conventional generic
 * bound for scoped {@link EventEmitter}s (layer / behaviour / domain-store event
 * channels). `EventEmitter`/`SourceEmitter` accept any `object`; this is the
 * portable shape most maps use.
 */
type EventMap = Record<string, unknown>;
/**
 * A small typed event emitter over an event map `M` (`{ eventType: payload }`).
 * Renderer-free; the base for {@link SourceEmitter} and the building block under
 * {@link CanvasEventBus}.
 */
declare class EventEmitter<M extends object> {
    private readonly map;
    /** Subscribe; returns an unsubscribe. */
    on<K extends keyof M>(type: K, listener: Listener<M[K]>): () => void;
    /** Subscribe for a single emission. */
    once<K extends keyof M>(type: K, listener: Listener<M[K]>): () => void;
    /** Unsubscribe a listener. */
    off<K extends keyof M>(type: K, listener: Listener<M[K]>): void;
    /** Emit to all listeners of `type` (snapshot, so handlers may unsubscribe). */
    emit<K extends keyof M>(type: K, payload: M[K]): void;
    removeAllListeners(): void;
    listenerCount<K extends keyof M>(type: K): number;
}

/**
 * Shared **geometry vocabulary** for the kernel — `Point` / `Vec2` / `Size` /
 * `Rect` / `CameraTransform`. Relocated from the engine so the renderer-free
 * kernel (node positions, the abstract camera, bounds, derived group geometry)
 * and every adapter speak the same coordinate types **without importing a drawing
 * library**. The pixi renderer (`@invana/canvas`) maps these onto its own
 * `Container`/`Viewport` transforms.
 */
/**
 * These four are the **single** definition in the repo. The spec vocabulary
 * (`../specs/geometry`) re-exports them rather than declaring its own — before
 * `specs/` moved into the kernel there were two `Rect`s with different mutability,
 * which is exactly the confusion this consolidation removes. Fields are `readonly`:
 * coordinates are computed and replaced wholesale, never patched in place.
 */
/** A 2-D point in world space. */
interface Point {
    readonly x: number;
    readonly y: number;
}
/** A 2-D vector (direction / delta). Structurally identical to {@link Point}. */
interface Vec2 {
    readonly x: number;
    readonly y: number;
}
/** Width × height extent. */
interface Size {
    readonly width: number;
    readonly height: number;
}
/** Axis-aligned bounding box. */
interface Rect {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}
/**
 * The **abstract camera transform** (C2) — renderer-agnostic: where world `(0,0)`
 * sits in the view (`x`/`y`) plus a uniform `zoom`. Never a `pixi-viewport`
 * handle; the renderer projects this onto its own viewport.
 */
interface CameraTransform {
    x: number;
    y: number;
    zoom: number;
}

/**
 * Pure geometry — points, rectangles, polylines, paths, and the router / pathStyle
 * function contracts that operate on them. No drawing library appears here.
 *
 * Part of the pixi-free spec vocabulary — see `docs/renderer-split-design.md`.
 */

/** Endpoint anchor a router consumes — point + optional outgoing tangent. */
interface Endpoint {
    readonly x: number;
    readonly y: number;
    readonly tangent?: Vec2;
}
/**
 * Flat ordered list of points. Output of a `Router`; input to a `PathStyle`.
 * Also used as the densified form of a `Path` for hit-testing
 * (`samplePath(path)`).
 */
type Polyline = ReadonlyArray<Point>;
/**
 * One step of a `Path`. Mirrors SVG path commands one-for-one:
 * - `M` move to absolute (x, y) — must be the first command of any Path.
 * - `L` line to (x, y) from the current point.
 * - `Q` quadratic Bézier with one control point.
 * - `C` cubic Bézier with two control points.
 *
 * No relative variants, no arcs, no shorthand — pathStyles emit one of these
 * four. Connector renders by walking the path and dispatching to Pixi's
 * `moveTo` / `lineTo` / `quadraticCurveTo` / `bezierCurveTo`.
 */
type PathCommand = {
    readonly kind: 'M';
    readonly x: number;
    readonly y: number;
} | {
    readonly kind: 'L';
    readonly x: number;
    readonly y: number;
} | {
    readonly kind: 'Q';
    readonly cx: number;
    readonly cy: number;
    readonly x: number;
    readonly y: number;
} | {
    readonly kind: 'C';
    readonly c1x: number;
    readonly c1y: number;
    readonly c2x: number;
    readonly c2y: number;
    readonly x: number;
    readonly y: number;
};
type Path = ReadonlyArray<PathCommand>;
/**
 * Read-only scene context handed to routers that need awareness of other
 * shapes — primarily for obstacle-avoidance routing (`manhattan` and
 * friends). Simple geometric routers (`straight`, `orth`) ignore it.
 *
 * `obstacles` are world-space `Rect`s the router should not cross. Each
 * obstacle may also expose `containsInflated` for pixel-accurate silhouette
 * testing (e.g. circles route around their tangent, not their AABB).
 * The renderer auto-collects these from `shapeInstances` (excluding the
 * source/target shapes); callers can override or opt out via
 * `routerOpts.obstacles`.
 */
interface RouterCtx {
    readonly obstacles: ReadonlyArray<Obstacle>;
}
/**
 * Obstacle handed to obstacle-aware routers. `Obstacle extends Rect` so any
 * `Rect[]` is assignable; the optional `containsInflated` callback unlocks
 * silhouette-tight routing for non-rect shapes (circles, polygons, paths).
 */
interface Obstacle extends Rect {
    /**
     * Optional silhouette obstacle-test in world coordinates. Returns `true`
     * when `(worldX, worldY)` lies inside the obstacle's silhouette OR within
     * `inflate` world units of it.
     *
     * Routers use this for pixel-accurate marking — when present, the grid
     * blocks only cells that pass this test (in addition to the cheap AABB
     * pre-filter). When absent, the inflated AABB is the source of truth.
     *
     * Shapes opt in by overriding `IShape.obstacleTest`.
     */
    readonly containsInflated?: (worldX: number, worldY: number, inflate: number) => boolean;
}
/**
 * Router: a pure function `(source, target, waypoints?, opts?, ctx?) → Polyline`.
 *
 * Routers decide path **topology** — where bends sit. They emit a flat
 * polyline (Point[]); the visual style of segments between bend points is
 * decided by the downstream `PathStyle`. Routers never touch pixi.
 *
 * `waypoints` are intermediate user-supplied points the router should respect.
 * Built-in `straight` passes them through verbatim; topological routers
 * (orth, manhattan, …) anchor stair / corner segments to them.
 *
 * `ctx` is optional — only obstacle-aware routers consume it. The renderer
 * always passes a `RouterCtx`; routers that ignore it lose nothing.
 */
type IRouter = (source: Endpoint, target: Endpoint, waypoints?: ReadonlyArray<Point>, opts?: Record<string, unknown>, ctx?: RouterCtx) => Polyline;
/**
 * Anchor-resolved endpoints handed to a pathStyle alongside the polyline.
 *
 * Tangent-aware pathStyles (`bump-horizontal`, …) read `source.tangent` /
 * `target.tangent` to place their Bézier handles along each shape's outward
 * surface normal, so the curve leaves and arrives flush with the silhouette
 * instead of in a hard-coded direction. Tangent-agnostic pathStyles (`normal`,
 * `rounded`, …) simply ignore the argument — it's optional and additive.
 */
interface PathStyleEndpoints {
    readonly source: Endpoint;
    readonly target: Endpoint;
}
/**
 * PathStyle: a pure function `(polyline, opts?, endpoints?) → Path`.
 *
 * PathStyles decide visual **style** — how segments between polyline points
 * are drawn (sharp, rounded fillets, bezier-smoothed, single bezier A→B).
 * They never see the connector spec or shape context; pure geometric
 * transform.
 *
 * `endpoints` carries the anchor-resolved source/target (with `tangent`) so
 * tangent-aware styles can align Bézier handles with each shape's outward
 * normal. Optional — styles that don't need it ignore the argument and a
 * direct unit-test invocation (`bumpHorizontal(polyline)`) keeps working.
 *
 * Built-ins: `normal` (sharp), `rounded` (quadratic fillets at corners),
 * `smooth` (Catmull-Rom → cubic), `bezier` (single cubic with auto controls).
 */
type IPathStyle = (polyline: Polyline, opts?: Record<string, unknown>, endpoints?: PathStyleEndpoints) => Path;
/**
 * Anchor positions for inset content layers (`glyph`, `svg`, `svg-url`).
 * Defaults to `'center'`. Use `'top-right'` etc. for corner-badge
 * composition.
 */
/**
 * Stable key of a connector spec with paint removed — geometry only.
 *
 * Two specs with the same key route to the same path, so a caller can skip a
 * re-route when only `stroke` changed. Pure: it reads the spec and nothing
 * else, which is why it lives here rather than on a renderer.
 */
declare function connectorGeometryKey(spec: object): string;

/**
 * Fill, stroke and paint-override vocabulary. Values are plain numbers and enums —
 * a colour is `0xRRGGBB`, never a backend colour object.
 *
 * Part of the pixi-free spec vocabulary — see `docs/renderer-split-design.md`.
 */
type InsetAnchor = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
/**
 * One layer of a shape's fill. Layers split by role:
 *
 * - **Silhouette fillers** (`solid`, `image`) — paint into the silhouette
 *   via Pixi's `g.fill()`. Multiple silhouette layers stack via alpha;
 *   each is re-traced before painting. Image fills always render the
 *   texture cover-fitted to the silhouette (uniform scale, may crop) —
 *   the engine intentionally does not expose CSS-style `background-size`
 *   / `background-repeat` knobs on raster fills.
 * - **Inset content** (`glyph`, `svg`, `svg-url`) — mounted as Container
 *   children of the shape's `gfx`. Sized by `sizeRatio` (fraction of the
 *   smaller bounds dimension) and positioned by `anchor` (default
 *   `'center'`).
 *
 * The engine has no dedicated "icon" kind — icon-library specifics (Font
 * Awesome glyphs, Lucide SVGs, Fluent icons, …) are produced by developer
 * code and dropped into a `glyph` or `svg` layer directly.
 */
type ShapeFillLayer = {
    readonly kind: 'solid';
    readonly color: number;
    readonly alpha?: number;
} | {
    /**
     * Raster image painted into the host silhouette.
     *
     * Two orthogonal knobs control sizing:
     *
     * - `fit` (default `'cover'`) — how the texture's aspect maps to
     *   the silhouette's AABB. `'cover'` scales by `max(...)`, fully
     *   covers, may crop on the cross-axis. `'contain'` scales by
     *   `min(...)`, fully fits, leaves the cross-axis margin
     *   transparent (the underlying fill layer reads through; the
     *   engine pins the texture sampler to `clamp-to-edge` so the
     *   margin doesn't tile).
     *
     * - `padding` (default `0`) — pixel inset on the silhouette
     *   *before* fit math runs. The silhouette itself is re-traced at
     *   that inset for this layer only, so the gap between the
     *   full-size silhouette and the inset silhouette is painted by
     *   layers underneath (typically a `solid` `bgFill`). Use this
     *   when the host silhouette is more restrictive than its AABB
     *   (circle, polygon, star, arc) and the texture corners would
     *   otherwise clip against the curve.
     *
     * Tile patterns, repeat modes, and inset-Sprite badge placement
     * aren't on the engine surface — stack a `glyph` / `svg` /
     * `svg-url` layer for icon-shaped content.
     */
    readonly kind: 'image';
    readonly url: string;
    readonly alpha?: number;
    readonly fit?: 'cover' | 'contain';
    readonly padding?: number;
} | {
    /** Font-rendered character (icon-font codepoint, Unicode symbol, emoji). */
    readonly kind: 'glyph';
    readonly char: string;
    /** Required for icon-font glyphs; optional for system-font Unicode. */
    readonly fontFamily?: string;
    /**
     * Font weight (CSS value, e.g. `400`, `900`, `'bold'`). Required for
     * icon fonts that pack different glyph sets per weight.
     */
    readonly fontWeight?: number | string;
    readonly fontStyle?: 'normal' | 'italic';
    /** Glyph color. Default `0xffffff`. */
    readonly color?: number;
    readonly alpha?: number;
    /** Size as fraction of the shape's smaller bounds dimension. Default `0.6`. */
    readonly sizeRatio?: number;
    /** Anchor relative to the shape's bounds. Default `'center'`. */
    readonly anchor?: InsetAnchor;
} | {
    /** SVG path-d. Multiple subpaths (`M...M...`) are supported. */
    readonly kind: 'svg';
    readonly pathD: string;
    /** Viewport the path was authored in. Default `{ width: 24, height: 24 }`. */
    readonly viewBox?: {
        readonly width: number;
        readonly height: number;
    };
    /** Stroke width when rendering. Default `2`. */
    readonly strokeWidth?: number;
    readonly color?: number;
    readonly alpha?: number;
    readonly sizeRatio?: number;
    readonly anchor?: InsetAnchor;
} | {
    /**
     * Vector SVG icon fetched from a URL. The engine fetches the SVG,
     * extracts every drawing primitive (`path` / `ellipse` / `circle` /
     * `rect` / `line` / `polyline` / `polygon`) into a single concatenated
     * `pathD`, and renders it as a Pixi Graphics path. Fetched lazily on
     * first use; the resulting `pathD` is cached globally per URL.
     *
     * Use this when a consumer wants to point at their own remote SVG
     * (logo, custom diagram, sample artwork). For curated icon-library
     * usage, prefer an icon-font glyph via `kind: 'glyph'` — the
     * library is icon-vendor-agnostic and intentionally has no
     * vendor-specific fetch glue.
     */
    readonly kind: 'svg-url';
    readonly url: string;
    readonly viewBox?: {
        readonly width: number;
        readonly height: number;
    };
    readonly strokeWidth?: number;
    readonly color?: number;
    readonly alpha?: number;
    readonly sizeRatio?: number;
    readonly anchor?: InsetAnchor;
};
/**
 * A shape's fill. Either a single layer, an array of layers (painted
 * bottom-up — first array entry sits underneath), or the `number` shorthand
 * for a solid color.
 */
type ShapeFill = number | ShapeFillLayer | ReadonlyArray<ShapeFillLayer>;
/**
 * The **inset-content** half of {@link ShapeFillLayer} — the layer kinds a
 * backend mounts *inside* the silhouette as a child rather than painting
 * *into* it. Named here (not only where it is mounted) because it is part of
 * the vocabulary: a `CompositePart` of kind `'icon'` carries one, so the spec
 * types must be able to reference it without reaching into a renderer.
 */
type InsetFillLayer = Extract<ShapeFillLayer, {
    kind: 'glyph' | 'svg' | 'svg-url';
}>;
/**
 * Does this fill paint the **silhouette** — i.e. would a backend emit a fill
 * for it? True for the `number` shorthand and for any `solid` / `image` layer;
 * false for `undefined` and for a fill made only of inset content
 * ({@link InsetFillLayer}), which mounts a child instead of filling.
 *
 * Load-bearing for hit-testing: a shape with no silhouette fill is **hollow**
 * — only its stroke band answers a containment test, exactly as pixi's
 * `Graphics.containsPoint` behaves (it consults a `fill` instruction that was
 * never emitted). See `containsSpec` in `specs/shapeGeometry/`.
 */
declare function hasSilhouetteFill(fill: ShapeFill | undefined): boolean;
interface ShapeStroke {
    readonly color: number;
    readonly alpha?: number;
    readonly width?: number;
    /** Default `'center'`. */
    readonly alignment?: 'inside' | 'center' | 'outside';
    readonly dashArray?: readonly [number, number];
    readonly dashOffset?: number;
    readonly cap?: 'butt' | 'round' | 'square';
    readonly join?: 'miter' | 'round' | 'bevel';
}
/**
 * Decoration entry-point override on `IShape.paintInto`. When supplied, the
 * shape ignores `spec.fill` / `spec.stroke` and paints with these values
 * instead. Decorations like glow widen `strokeWidth` and reduce `alpha` to
 * paint a halo; decorations like marching-ants supply `dashArray` /
 * `dashOffset` to render a dashed silhouette; decorations like ring/halo
 * with non-zero `inset` ask the shape to trace a parallel-offset version of
 * its own silhouette.
 */
interface ShapePaintStyle {
    readonly color?: number;
    readonly alpha?: number;
    readonly strokeWidth?: number;
    /**
     * Stroke alignment relative to the silhouette. Default `'outside'` —
     * decorations almost always want their geometry painted outside the
     * host body (halo, glow, ring), so the inner band doesn't eat into the
     * fill. Override per-call when a decoration genuinely wants to bleed
     * inward (e.g. an "inset border" effect).
     */
    readonly alignment?: 'inside' | 'center' | 'outside';
    /** Default `false` — decorations almost always stroke without filling. */
    readonly fill?: boolean;
    readonly dashArray?: readonly [number, number];
    readonly dashOffset?: number;
    /** Positive = inside the silhouette, negative = outside. Default `0`. */
    readonly inset?: number;
}
/** Mirror of `ShapePaintStyle` for connectors. No `inset` (connectors are 1D). */
interface ConnectorPaintStyle {
    readonly color?: number;
    readonly alpha?: number;
    readonly strokeWidth?: number;
    readonly dashArray?: readonly [number, number];
    readonly dashOffset?: number;
    readonly cap?: 'butt' | 'round' | 'square';
    readonly join?: 'miter' | 'round' | 'bevel';
    /**
     * When `true`, markers paint with `color` / `alpha` instead of their own
     * spec colors. Glow / halo decorations use this so the decoration covers
     * path + markers as a unified silhouette; marching-ants leaves it
     * undefined so markers stay normal-colored over the dashed line.
     */
    readonly tintMarkers?: boolean;
    /**
     * When `true`, `paintInto` paints only the body (no source / target
     * markers). Useful for decorations that handle markers separately or
     * want to leave them untouched. `markerHalo` is preferred for glow /
     * halo coverage; reach for `skipMarkers` only when even outlined
     * markers would be wrong.
     */
    readonly skipMarkers?: boolean;
    /**
     * When `true`, markers paint as **outlines** at `style.strokeWidth`
     * (using `style.color` / `style.alpha`) instead of as filled silhouettes.
     * Marker geometry continues to size off the host connector's spec
     * stroke width — the halo width affects only the outline stroke, never
     * the marker's tip-to-base / wing-spread dimensions. Combined with the
     * widening-stroke / decreasing-alpha pattern of a glow decoration,
     * this produces a halo around the marker that matches the body halo.
     */
    readonly markerHalo?: boolean;
}

/**
 * Paint stripes. `plane` picks the stripe, `zIndex` orders within it.
 *
 * Part of the pixi-free spec vocabulary — see `docs/renderer-split-design.md`.
 */
type PlaneName = 'backdrop' | 'content';

/**
 * Label content and styling. Describes text; renders none of it.
 *
 * Part of the pixi-free spec vocabulary — see `docs/renderer-split-design.md`.
 */
interface HtmlTagStyle {
    readonly fontFamily?: string;
    readonly fontSize?: number | string;
    readonly fontWeight?: number | string;
    readonly fontStyle?: 'normal' | 'italic' | 'oblique';
    readonly fill?: number | string;
    readonly letterSpacing?: number;
    readonly textDecoration?: string;
}
/**
 * The visible content of a `LabelDecoration`. Two variants:
 *
 * - `'text'` — plain Pixi `Text`. Single style, fast, comfortable up to a few
 *   thousand visible labels. Supports wrap / maxLines / ellipsis via Pixi's
 *   built-in word-wrap plus a truncation pass.
 * - `'html-text'` — Pixi `HTMLText`. Inline tags (`<b>`, `<i>`, custom tags
 *   via `tagStyles`) and CSS overrides. Each instance rasterises HTML to a
 *   canvas, so this kind is suitable for tens to a couple hundred visible
 *   labels — not for graph-wide use.
 *
 * `bitmap-text` (Pixi `BitmapText`) is planned as a third kind for very-high-
 * density graphs; not in v0.
 */
type LabelContent = {
    readonly kind: 'text';
    readonly text: string;
    readonly fontFamily?: string;
    readonly fontSize?: number;
    readonly fontWeight?: number | string;
    readonly fontStyle?: 'normal' | 'italic';
    readonly fontVariant?: 'normal' | 'small-caps';
    readonly letterSpacing?: number;
    readonly lineHeight?: number;
    /** Fill colour as hex. Default `0x111827` (near-black). */
    readonly fill?: number;
    readonly stroke?: {
        color: number;
        width: number;
    };
    /** Drop shadow on text glyphs (distinct from background pill shadow). */
    readonly shadow?: {
        color: number;
        blur?: number;
        offsetX?: number;
        offsetY?: number;
        alpha?: number;
    };
    readonly alpha?: number;
    /** Horizontal alignment when wrap produces multiple lines. */
    readonly align?: 'left' | 'center' | 'right';
} | {
    readonly kind: 'html-text';
    readonly html: string;
    /** Base style applied when no tag override matches. */
    readonly defaultFontFamily?: string;
    readonly defaultFontSize?: number;
    readonly defaultFill?: number | string;
    readonly defaultFontWeight?: number | string;
    /**
     * Fixed render width for `HTMLText`. Required for word-wrap; Pixi
     * `HTMLText` needs an explicit width to know when to break lines.
     */
    readonly width?: number;
    /**
     * Per-tag style overrides (e.g. `{ b: { fontWeight: 700 }, hl: { fill: '#facc15' } }`).
     * Custom tags are supported — Pixi forwards them to its tag stylesheet.
     */
    readonly tagStyles?: Readonly<Record<string, HtmlTagStyle>>;
    /**
     * Raw CSS rules injected as a `<style>` block before the HTML body —
     * useful for loading icon fonts or `@font-face` declarations referenced
     * by the inline HTML.
     */
    readonly cssOverrides?: ReadonlyArray<string>;
    readonly alpha?: number;
};
/** Background pill drawn behind a label's text. Optional. */
interface LabelBackground {
    readonly fill?: number;
    readonly fillAlpha?: number;
    readonly stroke?: number;
    readonly strokeAlpha?: number;
    readonly strokeWidth?: number;
    /** Uniform radius or per-corner [tl, tr, br, bl]. */
    readonly radius?: number | readonly [number, number, number, number];
    /** Uniform padding, [v,h], or [t,r,b,l]. */
    readonly padding?: number | readonly [number, number] | readonly [number, number, number, number];
    readonly shadow?: {
        color: number;
        blur?: number;
        offsetX?: number;
        offsetY?: number;
        alpha?: number;
    };
}
/** Wrap / overflow controls. Applies to both plain text and HTML text. */
interface LabelWrap {
    /** Pixel cap on render width. Triggers word-wrap when set. */
    readonly maxWidth?: number;
    /**
     * Pixel cap on render height. Combined with the text's `lineHeight` (read
     * from `LabelContent.lineHeight` or derived from `fontSize`) to derive an
     * effective `maxLines = floor(maxHeight / lineHeight)`. If both `maxHeight`
     * and `maxLines` are set, the smaller (more restrictive) wins.
     */
    readonly maxHeight?: number;
    /** Cap on rendered lines; lines past this are dropped (after `overflow`). */
    readonly maxLines?: number;
    /** Enable wrap explicitly; auto-true when `maxWidth` is set. */
    readonly wordWrap?: boolean;
    /** Truncation policy for content past `maxLines`. Default `'ellipsis'`. */
    readonly overflow?: 'clip' | 'ellipsis';
}
/** Per-label LOD — hides the label outside the zoom range. */
interface LabelVisibility {
    readonly minZoom?: number;
    readonly maxZoom?: number;
}
/**
 * Common style block shared by shape- and connector-anchored labels.
 * Placement / offset / rotation specifics live on the host-specific spec.
 */
interface LabelStyleCommon {
    readonly content: LabelContent;
    readonly background?: LabelBackground;
    readonly wrap?: LabelWrap;
    /** Screen-space offset in pixels applied *after* any auto-rotation. */
    readonly offset?: {
        readonly x?: number;
        readonly y?: number;
    };
    readonly alpha?: number;
    /** Per-label zoom-band LOD; the decoration mounts/unmounts on threshold. */
    readonly visibility?: LabelVisibility;
    /** Cursor on hover when the label container has hit-testing enabled. */
    readonly cursor?: string;
    /** Pointer events enabled on the label container. Default `false`. */
    readonly interactive?: boolean;
    /**
     * Read by `LabelCollisionBehaviour` only — the primitive ignores these.
     * `priority` higher wins ties when collision hides overlap. `collisionGroup`
     * partitions the collision graph (labels in different groups never compete).
     * `forceShow: true` bypasses collision entirely.
     */
    readonly priority?: number;
    readonly collisionGroup?: string;
    readonly forceShow?: boolean;
    /**
     * Floor used by the shrink → truncate → hide fit cascade when an
     * `inside-*` placement requires the label to stay inside the host shape.
     * Below this size, the cascade moves on to truncation (ellipsis) and
     * finally hide. Default `9` (px). Ignored for non-`inside-*` placements.
     */
    readonly minFontSize?: number;
}
/**
 * Placement options for a shape-anchored label.
 *
 * Two semantic groups distinguished by the `inside-` prefix:
 *
 * - **Anchor-only placements** — `'center'` plus the 8 outside sides /
 *   corners (`'top'`, `'top-right'`, ..., `'top-left'`). The label is
 *   positioned at the anchor and sized freely per `LabelWrap`; it may
 *   extend past the host shape's bounds.
 * - **Inside placements** (`'inside-*'`) — carry a *containment contract*:
 *   the label must stay inside the host shape's inner box. The decoration
 *   runs a shrink → truncate → hide fit cascade against the per-placement
 *   inner box to enforce this. Use these for sunburst wedges, treemap
 *   cells, pack circles — anywhere the label must not overflow.
 *
 * `'center'` and `'inside-center'` share the geometric anchor (shape
 * centre) but differ in containment: `'center'` may overflow, `'inside-center'`
 * may not. They are distinct values, not aliases.
 */
type ShapeLabelPlacement = 'center' | 'top' | 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left' | 'top-left' | 'inside-top' | 'inside-top-right' | 'inside-right' | 'inside-bottom-right' | 'inside-bottom' | 'inside-bottom-left' | 'inside-left' | 'inside-top-left' | 'inside-center';
/** Style payload passed to `setDecoration(id, 'label', { kind: 'label', style })`. */
interface ShapeLabelStyle extends LabelStyleCommon {
    /** Default `'bottom'`. */
    readonly placement?: ShapeLabelPlacement;
    /** Manual rotation in radians (rare — outside-side labels read upright). */
    readonly rotation?: number;
}
/**
 * Placement along a connector path. `'start' | 'center' | 'end'` map to t=0,
 * t=0.5, t=1; numeric `t` is treated literally and clamped to [0, 1].
 */
type ConnectorLabelPlacement = 'start' | 'center' | 'end' | number;
/** Style payload for connector labels. */
interface ConnectorLabelStyle extends LabelStyleCommon {
    /** Default `'center'`. */
    readonly placement?: ConnectorLabelPlacement;
    /**
     * Distance to shift along the path tangent, in pixels. Positive = toward
     * target; negative = toward source. Use this for "pad 24px from source".
     */
    readonly pathOffset?: number;
    /** Rotate the label so its baseline follows the path tangent. Default `true`. */
    readonly autoRotate?: boolean;
    /**
     * When `autoRotate` is on, flip the label by π if the tangent angle lies in
     * (π/2, 3π/2) — keeps reading direction upright. Default `true`.
     */
    readonly keepUpright?: boolean;
}

/**
 * Decoration and effect *descriptions* — what to attach and how it should look.
 * The classes that implement them are renderer-side.
 *
 * Part of the pixi-free spec vocabulary — see `docs/renderer-split-design.md`.
 */
type EffectTarget = 'transform' | 'style';
/**
 * Per-frame transform contribution from a `target: 'transform'` effect. Each
 * field is optional and contributes additively (translations + rotation) or
 * multiplicatively (scale) when the renderer aggregates across all transform
 * effects attached to the same host. Omitted fields contribute the identity
 * (0 for additive, 1 for multiplicative).
 *
 * Coordinates are in the host shape's parent space (the renderer's world
 * container) so deltas read like "wiggle the shape 3px right" regardless of
 * the host's internal local origin.
 */
interface TransformDelta {
    readonly dx?: number;
    readonly dy?: number;
    /** Rotation delta in radians. */
    readonly dRot?: number;
    /** Horizontal scale multiplier. Identity = 1. */
    readonly sx?: number;
    /** Vertical scale multiplier. Identity = 1. */
    readonly sy?: number;
}
/**
 * Per-frame style override from a `target: 'style'` effect. Channels are
 * merged across effects with last-writer-wins per channel (insertion order in
 * the host's effect map). Pixi's tint multiplies the underlying fill, so a
 * `tint` of `0xffffff` is the identity.
 */
interface StyleOverride {
    /** Pixi tint (multiplicative). Identity = `0xffffff`. */
    readonly tint?: number;
    /** Multiplier on the host's current alpha. Identity = 1. */
    readonly alpha?: number;
}
/**
 * Information a shape effect receives in `mount` / `update`. No `surface`
 * field — effects don't draw, they modulate. The renderer applies the
 * effect's `readTransform` / `readStyle` output onto the host gfx each frame.
 */
type EffectTargetKind = 'shape' | 'connector' | 'both';
interface RegisterEffectOptions {
    readonly target: EffectTargetKind;
}
/** Caller-side payload for `setEffect(id, slot, ...)`. */
interface EffectSpec<TStyle = unknown> {
    readonly kind: string;
    readonly style: TStyle;
}
/**
 * Constructor type for shapes registered via `registerShape`. Optionally
 * exposes a `static paintInto` so the shape can also serve as a connector
 * marker. Shapes without `paintInto` cannot be used as markers.
 */
type DecorationTarget = 'shape' | 'connector' | 'both';
interface RegisterDecorationOptions {
    readonly target: DecorationTarget;
}
/** Caller-side payload for `setDecoration(id, slot, ...)`. */
interface DecorationSpec<TStyle = unknown> {
    readonly kind: string;
    readonly style: TStyle;
}

/**
 * Decoration and effect **styles** — what a decoration should look like.
 *
 * A style is a description (`{ color, width, alpha }`); the class that renders
 * it is backend-bound and lives with the renderer. Splitting them is what lets
 * `@invana/graph` build decoration specs without depending on a drawing
 * backend — otherwise the type system would recreate the very layering
 * inversion the renderer split exists to remove.
 *
 * Part of the pixi-free spec vocabulary — see `docs/renderer-split-design.md`.
 */
/**
 * How the underlying host connector should be treated during reveal.
 *
 * - `'hide'` — the host's gfx is set invisible while the decoration is
 *   active; the decoration owns the only visible line. On one-shot
 *   completion (with `holdAtFull`) the host is restored to visible and the
 *   decoration clears its own gfx, so markers + native stroke take over.
 * - `'overlay'` — the host stays visible; the decoration paints a brighter
 *   "progress" segment on top. Best for laser-sweep / data-flow visuals on
 *   infinite loops.
 */
type RevealHostStroke = 'hide' | 'overlay';
/**
 * Visual style of a `SelectionFrameDecoration` — the dashed AABB outline
 * plus a configurable subset of round drag handles. One decoration
 * replaces the 4–8 separate `ResizeHandleDecoration` mounts the resize
 * behaviour used to issue, so callers only manage one slot per host.
 *
 * The decoration is pure-visual: it paints itself and exposes per-handle
 * hit geometry via {@link SelectionFrameDecoration.getLocalHandleHits}.
 * Hit-test math lives in the behaviour, matching the `ToggleDecoration`
 * / `ResizeHandleDecoration` contract.
 */
/**
 * Border line style. `'solid'` paints a continuous outline; `'dashed'` and
 * `'dotted'` paint a regular gap pattern via Pixi's dashed stroke. Both
 * dash variants pick sensible default dash/gap lengths — supply
 * {@link SelectionFrameDecorationStyle.dashArray} to override them
 * verbatim.
 */
type SelectionFrameBorderStyle = 'solid' | 'dashed' | 'dotted';
/**
 * Visual kind of a drag handle. Circles read as "round nub"; squares are
 * the classic CAD/Figma look. Both kinds use the same hit geometry (a
 * disk of radius `handleRadius + HIT_PADDING_PX`) so the resize behaviour
 * doesn't need to branch on shape.
 */
type SelectionFrameHandleShape = 'circle' | 'square';
/** Named easings accepted by the reveal style payload. */
type RevealEasingName = 'linear' | 'easeOutCubic' | 'easeInOutCubic' | 'easeInOutSine';
/**
 * Direction the reveal grows along the connector path.
 *
 * - `'source-to-target'` — segment grows from the source endpoint toward the
 *   target endpoint.
 * - `'target-to-source'` — segment grows from the target endpoint toward the
 *   source endpoint.
 */
type RevealDirection = 'source-to-target' | 'target-to-source';
/**
 * Repeat semantics for the reveal animation.
 *
 * - `false` — one-shot. Reveal runs once, then either settles fully drawn
 *   (`holdAtFull: true`) or clears.
 * - `true` — infinite loop. Reveal restarts from 0 each cycle.
 * - `number` — finite cycle count (must be `>= 1`).
 */
type RevealRepeat = boolean | number;
/**
 * Static ring that traces the host silhouette at a fixed outward offset.
 *
 * Geometry: one `paintInto` call with a negative inset, so the ring sits
 * cleanly *outside* the body — independent from the host's own stroke.
 * Multiple rings (e.g. inner + outer) compose by attaching multiple Ring
 * decorations with different `gap` values; this class itself paints one
 * band per instance.
 *
 * Works on every shape that implements `paintInto` (everything extending
 * `ShapeBase`). On shape kinds without `paintInto` (e.g. plain text) the
 * decoration silently clears — same fallback as `GlowDecoration`.
 */
interface RingDecorationStyle {
    readonly color: number;
    /** Ring stroke thickness, px. Default `2`. */
    readonly width?: number;
    /**
     * Gap between the host silhouette and the ring's inner edge, px.
     * Default `4`. Zero hugs the body; larger values produce a detached ring.
     */
    readonly gap?: number;
    /** Ring alpha, `[0, 1]`. Default `1`. */
    readonly alpha?: number;
    /** Dashed ring — `[dashLength, gapLength]` in px. Default solid. */
    readonly dashArray?: readonly [number, number];
}
/**
 * Halo / outer glow. Repaints the host's silhouette N times with widening
 * stroke and quadratic alpha falloff, producing a soft glow that hugs
 * whatever silhouette the host paints. Works on every shape that
 * implements `paintInto` (everything extending `ShapeBase`).
 *
 * Static by default. Supply `pulse` to animate brightness sinusoidally —
 * the renderer will register `tick` and advance the phase each frame.
 */
interface GlowDecorationStyle {
    readonly color: number;
    /**
     * Outermost feather layer's stroke width, px. The outermost stroke
     * extends this many pixels past the host silhouette (`paintInto`'s
     * default alignment is `'outside'`), so the visual outer reach of the
     * glow matches this value. Inner layers taper linearly to `1` px.
     * Default `12`.
     *
     * Not a circle radius — the glow traces whatever silhouette the host
     * draws (rect / polygon / star / ...). The name reflects the underlying
     * stroke geometry, not the shape kind.
     */
    readonly strokeWidth?: number;
    /** Number of feather layers (more = smoother + more expensive). Default `6`. */
    readonly layers?: number;
    /** Innermost (brightest) layer alpha. Default `0.55`. */
    readonly innerAlpha?: number;
    /**
     * Optional brightness pulse. When omitted, the glow is static. When set,
     * the decoration alpha-multiplies between `1` and `1 - amplitude` on a
     * sinusoidal cycle of `periodMs` milliseconds.
     */
    readonly pulse?: {
        /** Cycle length in ms. Default `1200`. */
        readonly periodMs?: number;
        /** How far below full brightness the dim phase reaches, `[0, 1]`. Default `0.5`. */
        readonly amplitude?: number;
    };
}
/**
 * Concentric rings that expand outward from the host's silhouette and fade
 * as they grow. A canonical "attention" decoration — pings, notifications,
 * "new arrival" indicators, sonar effects.
 *
 * Each ring traces the host silhouette via `paintInto` with a growing
 * `inset` (negative = outside) and shrinking alpha. Multiple concurrent
 * rings are scheduled by phase-offset across one period — so a `rings: 3`
 * decoration always shows three rings at different stages of expansion,
 * giving a steady visual rhythm.
 */
interface PulseRingDecorationStyle {
    readonly color: number;
    /** Peak expansion distance from the host silhouette, px. Default `24`. */
    readonly maxRadius?: number;
    /** Cycle length in ms. Default `1400`. */
    readonly periodMs?: number;
    /** Number of concurrent rings (phase-distributed). Default `2`. */
    readonly rings?: number;
    /** Stroke width of each ring, px. Default `2`. */
    readonly strokeWidth?: number;
    /** Initial (full-brightness) alpha at radius 0. Default `0.7`. */
    readonly innerAlpha?: number;
}
/**
 * Classic "marching ants" selection outline. Strokes the host silhouette
 * with a dashed border whose `dashOffset` advances each frame, producing
 * the characteristic crawling-along-the-edge animation seen in selection
 * marquees (Photoshop, Figma, etc.).
 *
 * Geometry is delegated to `host.shape.paintInto` with `dashArray` /
 * `dashOffset` overrides — the shape primitive itself does the
 * silhouette tessellation. Works on every shape that implements
 * `paintInto` (anything extending `ShapeBase`).
 */
interface MarchingAntsDecorationStyle {
    readonly color: number;
    /** Stroke width in px. Default `1.5`. */
    readonly strokeWidth?: number;
    /** Dash length in px. Default `6`. */
    readonly dashLength?: number;
    /** Gap length in px. Default `4`. */
    readonly gapLength?: number;
    /**
     * March speed in px/sec along the perimeter. Default `24`.
     * Negative values reverse the march direction.
     */
    readonly speedPxPerSec?: number;
    /**
     * Distance from the host silhouette. Positive = inside, negative =
     * outside. Default `0` (on the silhouette itself).
     */
    readonly inset?: number;
    /** Overall decoration alpha. Default `1`. */
    readonly alpha?: number;
}
/**
 * Liquid fill — paints a fluid level inside the host's silhouette, with a
 * vertical gradient and an optional wavy surface. Achieved without a "fill
 * provider" hook on shapes: the decoration paints a fluid polygon into its
 * own Graphics and masks the whole thing with the host silhouette via
 * `host.shape.paintInto({ fill: true })`.
 *
 * **Stroke compatibility.** When the host shape's stroke alignment is
 * `'outside'`, the stroke sits outside the silhouette and the mask leaves it
 * fully visible. For `'center'` / `'inside'`, the liquid covers the inside
 * portion of the stroke. Prefer `'outside'` for tank / pill diagrams.
 *
 * **Animation.** When `wave` is omitted the surface is a flat horizontal
 * line and `tick` returns `false` — the renderer retires the decoration
 * from its animation set, so still-water mode costs zero per frame after
 * `mount`. Supply `wave` to animate the meniscus.
 */
interface LiquidFillDecorationStyle {
    /** Surface height as a fraction of host bounds height. `0` empty, `1` full. Default `0.6`. */
    readonly fillLevel?: number;
    /** Gradient colour at the surface. Default light blue (`0x9bbedb`). */
    readonly colorTop?: number;
    /** Gradient colour at the bottom. Default dark blue (`0x2d4d6e`). */
    readonly colorBottom?: number;
    /** Overall opacity of the fluid. Default `1`. */
    readonly alpha?: number;
    /**
     * Wave configuration. Omit (or pass `undefined`) for a flat still surface.
     * Provide for an animated meniscus — phase advances every frame.
     */
    readonly wave?: {
        /** Peak vertical displacement of the surface, px. Default `3`. */
        readonly amplitude?: number;
        /** Distance between wave crests, px. Default `80`. */
        readonly wavelength?: number;
        /** Time for one full phase cycle, ms. Default `1800`. */
        readonly periodMs?: number;
        /** Sample points per wavelength. Higher = smoother + more expensive. Default `12`. */
        readonly resolution?: number;
    };
    /**
     * Optional thin highlight band stroked along the surface (gloss / meniscus
     * effect). Opt-in: omit the field to skip drawing the highlight entirely.
     */
    readonly surfaceHighlight?: {
        /** Default `0xffffff`. */
        readonly color?: number;
        /** Default `0.35`. */
        readonly alpha?: number;
        /** Stroke width in px. Default `3`. */
        readonly thickness?: number;
    };
}
/**
 * Visual style of a `ToggleDecoration` — the small `+` / `−` button used to
 * collapse / expand compound groups, and by extension any "open this" /
 * "close this" affordance a domain layer wants to put on a shape.
 *
 * The decoration is pure-visual: it paints itself, exposes a shape-local
 * hit-geometry (`getLocalHitGeometry`), and emits no events. Domain
 * behaviours (e.g. `CollapseExpandBehaviour` in `@invana/graph`) read the
 * geometry and do the click-distance math against the host's
 * `shape:pointerdown` payload — keeps the decoration domain-free and
 * sidesteps Pixi event-bubbling through the shape gfx.
 */
interface ToggleDecorationStyle {
    /**
     * Which glyph the button shows. Domain layers flip this through
     * `setDecoration` whenever the underlying collapsed-state changes.
     * Default `'plus'`.
     */
    readonly state?: 'plus' | 'minus';
    /** Where on the host AABB the toggle sits. Default `'bottom'`. */
    readonly placement?: TogglePlacement;
    /** Button outer radius, px. Default `10`. */
    readonly radius?: number;
    /** Button fill colour. Default `0xffffff` (white). */
    readonly bgFill?: number;
    /** Button fill alpha. Default `1`. */
    readonly bgAlpha?: number;
    /** Button outline colour. Default `0x6b7fff` (theme blue). */
    readonly strokeColor?: number;
    /** Button outline width, px. Default `1.5`. */
    readonly strokeWidth?: number;
    /** Glyph stroke colour. Default = `strokeColor`. */
    readonly glyphColor?: number;
    /** Glyph stroke width, px. Default `1.5`. */
    readonly glyphWidth?: number;
    /**
     * Extra offset applied after placement resolution, in shape-local px.
     * Use to nudge the toggle off a default placement without writing a
     * custom placement (e.g. push a `bottom-right` toggle further out
     * past a thick stroke).
     */
    readonly offsetX?: number;
    readonly offsetY?: number;
    /**
     * Override the keyword-based `placement` resolution with raw shape-local
     * coordinates. When set, `placement`, `offsetX`, and `offsetY` are all
     * ignored — the toggle's centre is placed at exactly `(x, y)` in the
     * host shape's local frame (centre-relative for centred shapes like
     * `CircleShape`, top-left-relative for `RectShape`).
     *
     * Use when none of the 12 named placements lands where you want it
     * (e.g. floating the toggle along a diagonal, or matching a specific
     * UI mock that doesn't snap to AABB anchors).
     */
    readonly position?: {
        readonly x: number;
        readonly y: number;
    };
}
/**
 * Placement of a `ToggleDecoration` relative to the host shape's AABB.
 *
 * - Cardinal sides (`top` / `right` / `bottom` / `left`) sit centred on the
 *   midpoint of that side.
 * - Corners (`top-left` / ... / `bottom-right`) sit on the corner itself.
 * - `inside-*` variants mirror the cardinal sides but pull inward by
 *   `radius + 4 px` so the toggle nests inside the silhouette (useful for
 *   circle groups where an outside toggle would float well past the rim).
 *
 * The toggle's gfx is positioned by its centre, so it half-overlaps the
 * silhouette edge in the outside variants — a touch-friendly hit target
 * that visually reads as "attached to the host".
 */
type TogglePlacement = 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'inside-top' | 'inside-right' | 'inside-bottom' | 'inside-left';
/**
 * Shape-local hit geometry exposed by a `ToggleDecoration` instance. The
 * `cx` / `cy` coordinates are in the host shape's local frame (i.e. add
 * the host's spec `x` / `y` to convert to world). `radius` is the touch
 * radius — typically a touch larger than the visual radius so the button
 * stays easy to hit on coarse pointers.
 *
 * Domain behaviours read this and check `Math.hypot(worldX − host.x − cx,
 * worldY − host.y − cy) ≤ radius` in their `shape:pointerdown` handler.
 */
interface ToggleHitGeometry {
    readonly cx: number;
    readonly cy: number;
    readonly radius: number;
}
interface ResizeHandleDecorationStyle {
    /** Which AABB position the handle sits on. Default `'bottom-right'`. */
    readonly placement?: ResizeHandlePlacement;
    /** Side length of the square handle, px. Default `8`. */
    readonly size?: number;
    /** Handle fill colour. Default `0xffffff`. */
    readonly bgFill?: number;
    readonly bgAlpha?: number;
    /** Handle outline colour. Default `0x6b7fff`. */
    readonly strokeColor?: number;
    /** Handle outline width. Default `1.5`. */
    readonly strokeWidth?: number;
    /** Optional CSS-style cursor hint for the host renderer's hit pipeline. */
    readonly cursor?: string;
    /** Visible only when truthy. Domain behaviours flip this on hover/select. Default `true`. */
    readonly visible?: boolean;
    /**
     * Override the keyword-based `placement` resolution with raw shape-local
     * coordinates. When set, `placement` is ignored — the handle's centre is
     * placed at exactly `(x, y)` in the host shape's local frame. The
     * reported hit geometry's `placement` field still reflects the
     * configured `placement` (or `'bottom-right'` if omitted) so consumers
     * that switch on it for resize-direction math still work.
     */
    readonly position?: {
        readonly x: number;
        readonly y: number;
    };
}
/**
 * Where on the host AABB a `ResizeHandleDecoration` sits. The eight cardinal
 * + corner positions cover every rectangular drag axis (horizontal / vertical
 * sides, diagonal corners). For radially-symmetric hosts (circle groups) use
 * any side — domain behaviours typically map all four sides to the same
 * radius-scaling drag.
 */
type ResizeHandlePlacement = 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
interface SelectionFrameDecorationStyle {
    /** Border line colour. Default `0x6b7fff` (theme blue). */
    readonly borderColor?: number;
    /** Border line width, px. Default `1.5`. */
    readonly borderWidth?: number;
    /**
     * `'solid'` | `'dashed'` | `'dotted'`. Default `'dotted'` — reads as a
     * helper / annotation rather than the host's actual outline. When
     * {@link dashArray} is supplied it wins over this preset.
     */
    readonly borderStyle?: SelectionFrameBorderStyle;
    /**
     * Custom dash pattern `[dashLength, gapLength]` in px. Overrides
     * {@link borderStyle} entirely when set — use when the presets don't
     * land where you want them.
     */
    readonly dashArray?: readonly [number, number];
    /** Border alpha. Default `0.6` — ghosts the frame so the host silhouette reads as the real thing. */
    readonly borderAlpha?: number;
    /**
     * Outward inset between the host AABB and the dashed frame. Lets the
     * frame visually "wrap" the host without touching the silhouette.
     * Default `4`.
     */
    readonly padding?: number;
    /** `'circle'` (default) paints round nubs; `'square'` paints squares. */
    readonly handleShape?: SelectionFrameHandleShape;
    /**
     * Half-extent of the handle in px. For circle handles this is the
     * outer radius; for square handles it's half the side length, so the
     * visible size matches a circle of the same value. Default `5`.
     */
    readonly handleRadius?: number;
    /**
     * Corner radius for square handles only. Default `1.5` for a subtly
     * rounded look; pass `0` for hard corners. Ignored when
     * `handleShape: 'circle'`.
     */
    readonly handleCornerRadius?: number;
    /** Handle fill colour. Default `0xffffff`. */
    readonly handleFill?: number;
    /** Handle fill alpha. Default `1`. */
    readonly handleFillAlpha?: number;
    /** Handle outline colour. Default = `borderColor`. */
    readonly handleStrokeColor?: number;
    /** Handle outline width in px. Default `1.5`. Pass `0` for no outline. */
    readonly handleStrokeWidth?: number;
    /** Handle outline alpha. Default `1`. */
    readonly handleStrokeAlpha?: number;
    /**
     * Which handles to render. Default = all eight. Pass a smaller array to
     * suppress edge midpoints (`['top-left', 'top-right', 'bottom-left',
     * 'bottom-right']`) or limit to a single axis (`['right']` for the
     * radial circle case).
     */
    readonly handles?: ReadonlyArray<SelectionFramePlacement>;
    /** Visible only when truthy. Default `true`. */
    readonly visible?: boolean;
}
/**
 * One of the eight standard transform-frame anchors: corner (`top-left`,
 * `top-right`, `bottom-left`, `bottom-right`) or edge-midpoint (`top`,
 * `right`, `bottom`, `left`).
 *
 * Re-using `ResizeHandlePlacement`'s vocabulary so any behaviour that
 * already does direction-aware drag math (corner → diagonal resize,
 * `top` / `bottom` → vertical, `left` / `right` → horizontal) keeps
 * working without translation.
 */
type SelectionFramePlacement = 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
/**
 * Per-handle hit geometry returned by {@link SelectionFrameDecoration.getLocalHandleHits}.
 * `cx` / `cy` are in the host shape's local frame (add the host's spec
 * `x` / `y` to convert to world). `radius` is the touch radius (visual
 * radius + a small floor for coarse pointers).
 */
interface SelectionFrameHandleHit {
    readonly placement: SelectionFramePlacement;
    readonly cx: number;
    readonly cy: number;
    readonly radius: number;
}
/**
 * Static halo-style ring painted underneath a connector's path — a single
 * thick stroke tracing the host's routed geometry, behind the host stroke.
 *
 * Connectors are 1-D (no `inset`), so a true detached parallel-offset ring
 * would need separately routed geometry. This decoration takes the simpler
 * "single wider stroke" route: paint one band of `width` px behind the
 * host, optionally dashed, with `markerHalo` so the host's end markers
 * land inside the same band. Composes with `width` < host stroke for a
 * subtle outline or `width` > host stroke for a "highlighted edge" feel.
 *
 * For a thicker / softer feathered halo, use `GlowConnectorDecoration`
 * instead — it stacks multiple layers with alpha falloff.
 */
interface RingConnectorDecorationStyle {
    readonly color: number;
    /** Halo band thickness in px. Default `6`. */
    readonly width?: number;
    /** Halo alpha, `[0, 1]`. Default `0.6`. */
    readonly alpha?: number;
    /** Dashed band — `[dashLength, gapLength]` in px. Default solid. */
    readonly dashArray?: readonly [number, number];
}
/**
 * Soft halo around the routed path of a connector. Repaints the path N
 * times with widening stroke and quadratic alpha falloff, producing a
 * glow that hugs whatever curve the path resolves to. Works on every
 * router / pathStyle because geometry is delegated to
 * `host.connector.paintInto`.
 *
 * Static by default. Supply `pulse` to animate brightness sinusoidally —
 * geometry is only repainted on `repaint`; per-frame work touches
 * `this.gfx.alpha` and nothing else, so the pulse is essentially free.
 */
interface GlowConnectorDecorationStyle {
    readonly color: number;
    /** Outermost glow extent in px (widest stroke). Default `12`. */
    readonly radius?: number;
    /** Number of feather layers (more = smoother + more expensive). Default `6`. */
    readonly layers?: number;
    /** Innermost (brightest) layer alpha. Default `0.55`. */
    readonly innerAlpha?: number;
    /**
     * Optional brightness pulse. When omitted, the glow is static. When set,
     * the decoration alpha-multiplies between `1` and `1 - amplitude` on a
     * sinusoidal cycle of `periodMs` milliseconds.
     */
    readonly pulse?: {
        /** Cycle length in ms. Default `1200`. */
        readonly periodMs?: number;
        /** How far below full brightness the dim phase reaches, `[0, 1]`. Default `0.5`. */
        readonly amplitude?: number;
    };
}
/**
 * Connector variant of marching-ants. Strokes the connector's routed path
 * with a dashed line whose `dashOffset` advances each frame, producing
 * a flowing/marching pattern along the line — useful for highlighting an
 * active edge, a route under consideration, a data flow, etc.
 *
 * Geometry is delegated to `host.connector.paintInto` with `dashArray` /
 * `dashOffset` overrides; the connector primitive samples the routed
 * path and emits dashes via the shared `dashedStroke` helper. Works on
 * every router / pathStyle (straight, orth, bezier, smooth — all produce
 * a `Path`).
 */
interface MarchingAntsConnectorDecorationStyle {
    readonly color: number;
    /** Stroke width in px. Default `1.5`. */
    readonly strokeWidth?: number;
    /** Dash length in px. Default `6`. */
    readonly dashLength?: number;
    /** Gap length in px. Default `4`. */
    readonly gapLength?: number;
    /**
     * March speed in px/sec along the path. Default `24`.
     * Negative values reverse the march direction.
     */
    readonly speedPxPerSec?: number;
    /** Overall decoration alpha. Default `1`. */
    readonly alpha?: number;
    readonly cap?: 'butt' | 'round' | 'square';
    readonly join?: 'miter' | 'round' | 'bevel';
}
/**
 * Connector analogue of `PulseRingDecoration`. Each frame, every ring
 * strokes the host's body + markers at a width that grows outward over
 * one period and fades as it grows — so the wave inherits the connector's
 * silhouette (line shape, bends, arrowhead) instead of being a circular
 * pulse at a single point. Multiple concurrent rings are phase-
 * distributed across one period for a steady rhythm.
 *
 * Geometry is delegated to `connector.paintInto` with a widening
 * `strokeWidth` and `tintMarkers + markerHalo` (so the markers outline at
 * the ring's width, not scale up). The host's normal paint sits on top
 * (zIndex = 0; this decoration's slot z is typically < 0 for "behind"
 * rings, ≥ 0 for "above" rings — pick a slot name accordingly).
 */
interface RippleConnectorDecorationStyle {
    readonly color: number;
    /**
     * Peak halo extent in px (half-width). Each ring's stroke widens from
     * `0` to `2 × maxRadius` over one period, so the silhouette appears to
     * push outward by up to `maxRadius` on each side. Default `16`.
     */
    readonly maxRadius?: number;
    /** Cycle length in ms. Default `1400`. */
    readonly periodMs?: number;
    /** Number of concurrent rings (phase-distributed). Default `2`. */
    readonly rings?: number;
    /** Initial (full-brightness) alpha at radius 0. Default `0.7`. */
    readonly innerAlpha?: number;
}
/**
 * Connector decoration that animates a single marker travelling along the
 * routed path of its host. Useful for visualising direction, data flow, or
 * an active "in-flight" state on an edge. Works on every router / pathStyle
 * because it consumes the resolved `Path` via `samplePath`.
 *
 * The marker's silhouette is drawn once into `markerGfx`; only its position
 * and rotation are updated each frame. Position is derived from a
 * cumulative arc-length table rebuilt on `repaint` (host or style change),
 * so per-frame work is a binary search + interpolation.
 */
interface FlyMarkerConnectorDecorationStyle {
    readonly color: number;
    /** Marker silhouette. Default `'circle'`. */
    readonly markerKind?: 'circle' | 'arrow' | 'square';
    /** Marker size in px (diameter / arrow length / square side). Default `8`. */
    readonly size?: number;
    /**
     * Travel speed along the path in px/sec. Negative values reverse direction.
     * Default `80`.
     */
    readonly speedPxPerSec?: number;
    /**
     * When `true` (default) the marker wraps back to the start after reaching
     * the end (or vice versa for negative speed). When `false` the marker
     * stops at the end of the path until the decoration is removed.
     */
    readonly loop?: boolean;
    /** Initial position along the path in `[0, 1]`. Default `0`. */
    readonly phase?: number;
    /**
     * Rotate the marker so its local +x axis points along the local tangent.
     * Default `true` for `'arrow'`, `false` for `'circle'` and `'square'`.
     */
    readonly orientToPath?: boolean;
    /** Overall decoration alpha. Default `1`. */
    readonly alpha?: number;
}
/**
 * Connector decoration that animates `count` markers travelling along the
 * routed path at the same speed, evenly spread in phase. Useful for
 * visualising sustained flow / throughput on an edge (e.g. data streaming,
 * traffic).
 *
 * Same engine as `FlyMarkerConnectorDecoration` extended to N markers; one
 * arc-length table is built per repaint and shared across all particles.
 */
interface FlowParticlesConnectorDecorationStyle {
    readonly color: number;
    /** Marker silhouette. Default `'circle'`. */
    readonly markerKind?: 'circle' | 'arrow' | 'square';
    /** Number of particles. Clamped to `>= 1`. Default `5`. */
    readonly count?: number;
    /** Marker size in px. Default `6`. */
    readonly size?: number;
    /**
     * Travel speed along the path in px/sec. Negative values reverse direction.
     * Default `60`.
     */
    readonly speedPxPerSec?: number;
    /**
     * When `true` (default) particles wrap back to the start after reaching
     * the end. Setting this to `false` makes all particles stall at the end
     * once they arrive — usually only useful with `count: 1`.
     */
    readonly loop?: boolean;
    /** Phase offset applied to every particle in `[0, 1]`. Default `0`. */
    readonly phase?: number;
    /**
     * Rotate each marker so its local +x axis points along the local tangent.
     * Default `true` for `'arrow'`, `false` for `'circle'` and `'square'`.
     */
    readonly orientToPath?: boolean;
    /** Overall decoration alpha. Default `1`. */
    readonly alpha?: number;
}
/**
 * Connector decoration that progressively reveals the routed path from one
 * endpoint to the other — as if the line were being drawn in real time.
 * Useful as an entrance animation for new edges, a directional "data-flow"
 * pulse, or a laser-sweep effect for active routes.
 *
 * Implementation: the host `Path` is densified into a polyline on mount
 * (via `samplePath`); per-frame the decoration computes a cumulative-arc-
 * length cutoff from the driving `Tween` and emits a `lineTo` walk plus a
 * single `stroke()` for the revealed segment. Curves stay smooth because
 * the polyline already uses the engine-wide sampling step counts.
 *
 * Markers are intentionally not painted by this decoration. When
 * `hostStroke: 'hide'` and the animation completes with `holdAtFull: true`,
 * the host connector's gfx is re-shown so its native stroke + markers
 * take over the final display. For infinite loops the host stays hidden
 * for the lifetime of the decoration.
 */
interface RevealConnectorDecorationStyle {
    /** Duration of one full source→target sweep in ms. Default `2000`. */
    readonly durationMs?: number;
    /** `false` = one-shot (default), `true` = infinite, or a positive integer cycle count. */
    readonly repeat?: RevealRepeat;
    /** Easing curve. Default `'linear'` — constant "pen speed" feels most natural for a drawing reveal. */
    readonly easing?: RevealEasingName;
    /** Sweep direction. Default `'source-to-target'`. */
    readonly direction?: RevealDirection;
    /** Treatment of the underlying host connector stroke. Default `'hide'`. */
    readonly hostStroke?: RevealHostStroke;
    /**
     * When `repeat` is `false`, hold the fully-drawn state after the cycle
     * completes (handing off to the host stroke when `hostStroke: 'hide'`).
     * Ignored for infinite / finite-repeat modes. Default `true`.
     */
    readonly holdAtFull?: boolean;
    /** Wait this many ms after mount before starting the reveal. Default `0`. */
    readonly delayMs?: number;
}

/**
 * Shape specs — the description of a thing to draw, per shape kind.
 *
 * Part of the pixi-free spec vocabulary — see `docs/renderer-split-design.md`.
 */

interface BaseShapeSpec {
    readonly kind: string;
    readonly x: number;
    readonly y: number;
    readonly fill?: ShapeFill;
    readonly stroke?: ShapeStroke;
    /**
     * Which paint stripe this shape renders into. Default `'content'` — with
     * every shape above every connector, the renderer's long-standing
     * "nodes above edges" convention.
     *
     * `'backdrop'` moves the shape **below the connectors**, for scenery rather
     * than content: a group frame, a swimlane band, a region wash. Purely visual —
     * hit resolution still reads {@link zIndex} recorded at insert, so a backdrop
     * shape is picked exactly as it was before.
     */
    readonly plane?: PlaneName;
    /** Default `0`. Higher = on top. Used for hit-test resolution. */
    readonly zIndex?: number;
    readonly alpha?: number;
    readonly visible?: boolean;
    /**
     * Container-level rotation in radians, applied around the shape's
     * top-left local origin. Composes with effect-driven transform deltas
     * — the effect aggregator writes `(spec.rotation ?? 0) + dRot` per frame
     * so connector-hosted badges with `autoRotate: true` keep rotating
     * smoothly even while a `shake` / `breathing` effect runs on top.
     *
     * For per-shape geometric rotation (the visible rotation of a regular
     * polygon's vertices, a star's points, etc.), use the kind-specific
     * `rotation` field on those shape specs — that one rotates the *geometry*
     * before it's drawn; this one rotates the *container* after.
     */
    readonly rotation?: number;
}
interface CircleSpec extends BaseShapeSpec {
    readonly kind: 'circle';
    readonly radius: number;
}
/**
 * Filled / stroked ellipse, centred at `(x, y)` with independent horizontal /
 * vertical radii. A circle is the `radiusX === radiusY` special case; prefer
 * {@link CircleSpec} there (cheaper, uniform).
 */
interface EllipseSpec extends BaseShapeSpec {
    readonly kind: 'ellipse';
    readonly radiusX: number;
    readonly radiusY: number;
}
interface RectSpec extends BaseShapeSpec {
    readonly kind: 'rect';
    readonly width: number;
    readonly height: number;
    readonly cornerRadius?: number;
}
/**
 * Where a {@link TabbedRectSpec}'s tab sits along the body's top edge.
 * `'left'` / `'right'` measure {@link TabbedRectSpec.tabOffset} in from that
 * side; `'center'` ignores the offset and splits the remainder evenly.
 */
type TabAlign = 'left' | 'center' | 'right';
/**
 * Rectangle carrying a smaller raised **tab** on its top edge, traced as one
 * continuous silhouette — the "folder" outline. Fill and stroke run around
 * body and tab together, so it reads as a single object rather than a rect
 * with a badge stuck on it.
 *
 * Anchored at the **top-left of the full AABB**, i.e. the top-left of the
 * tab band — so `(spec.x, spec.y)` is the topmost point of the silhouette,
 * `height` describes the *body* only, and `bounds().height` is
 * `tabHeight + height`. The body spans `y ∈ [tabHeight, tabHeight + height]`
 * across the full `width`; the tab spans `tabHeight` above it, inset
 * horizontally per {@link tabAlign} / {@link tabOffset}.
 *
 * A tab as wide as the body degenerates to a plain rect of the combined
 * height; that's a valid (if pointless) spec, not an error. `height: 0` is
 * the other degenerate end and a useful one — see {@link TabbedRectSpec.height}.
 */
interface TabbedRectSpec extends BaseShapeSpec {
    readonly kind: 'tabbed-rect';
    /** Width of the body — also the AABB width; the tab never exceeds it. */
    readonly width: number;
    /**
     * Height of the **body alone**, excluding {@link tabHeight}.
     *
     * `0` (or less) draws the **tab by itself** — a closed folder. The tab's
     * base becomes an exterior edge (so it takes a fillet and loses the fold
     * line), the tab is free to lean even when flush with the body's former
     * edges, and `bounds().height` is just `tabHeight`. Anything anchored to
     * the silhouette (labels, edges, decorations) follows the tab.
     */
    readonly height: number;
    /**
     * Width of the raised tab, measured at its base. Clamped to {@link width}
     * while a body is present; on a bodyless folder (`height <= 0`) the tab is
     * the whole silhouette, so it sizes freely and *becomes* the AABB width.
     *
     * Omit to leave it unresolved — it then falls back to `width` (a full-width
     * tab), and `ShapeCtor.fitToContent` sizes it to the title the caller
     * measures. Set it to pin the tab and opt out of that fitting.
     */
    readonly tabWidth?: number;
    /**
     * Horizontal breathing room between the tab's content and each of its ends,
     * used when `ShapeCtor.fitToContent` sizes the tab. Default `10`. Ignored
     * when {@link tabWidth} is pinned.
     */
    readonly tabPadding?: number;
    /** Height of the raised tab, added above the body. */
    readonly tabHeight: number;
    /** Fillet applied to the body's outer corners. Default `0` (sharp). */
    readonly cornerRadius?: number;
    /**
     * Fillet applied to the tab's two top corners. Defaults to
     * {@link cornerRadius} so a uniformly-rounded folder needs one field.
     * The two re-entrant "shoulder" corners where the tab meets the body
     * always stay sharp — rounding them reads as a dent, not a fold.
     */
    readonly tabCornerRadius?: number;
    /** Which side the tab hugs. Default `'left'`. */
    readonly tabAlign?: TabAlign;
    /**
     * Distance from the {@link tabAlign} edge to the tab. Default `0` — the
     * tab is flush with that side, which merges its outer edge into the
     * body's and produces the classic folder profile. Ignored when
     * `tabAlign: 'center'`.
     */
    readonly tabOffset?: number;
    /**
     * Horizontal run of the tab's **angled** side, in px. Default `0` (a
     * square tab). A non-zero value tapers the tab inward toward its top,
     * which is what separates a folder tab from a box parked on a rectangle.
     *
     * The lean is always on the side facing the rest of the frame — the right
     * edge for `tabAlign: 'left'`, the left edge for `'right'`, and both for
     * `'center'`. A side flush with the body's own edge can't lean, since the
     * two edges have merged.
     *
     * {@link tabWidth} measures the tab at its **base**, so the skew eats into
     * the top edge rather than widening the footprint. Clamped so the slants
     * can never consume more than half the tab.
     */
    readonly tabSkew?: number;
    /**
     * Draw the tab's bottom border — the fold line across the tab's base where
     * it meets the body. Default `true`; set `false` for an open profile where
     * the tab flows into the body with no seam.
     *
     * It's interior geometry, painted only on the shape's own pass: a
     * decoration borrowing this silhouette (glow, halo, marching ants) traces
     * the outline alone. It's also skipped when the spec carries no stroke —
     * it's a border, with no colour of its own to fall back on.
     */
    readonly tabDivider?: boolean;
}
/**
 * Free-form polygon. `vertices` are centre-relative — the silhouette is
 * traced around the origin, then translated to `(x, y)`. Closed implicitly:
 * the last vertex connects back to the first. Use this for arbitrary
 * outlines (arrows, blobs, callouts). For regular n-gons or stars prefer
 * `RegularPolygonSpec` / `StarSpec` — they're cheaper to author.
 */
interface PolygonSpec extends BaseShapeSpec {
    readonly kind: 'polygon';
    readonly vertices: ReadonlyArray<Point>;
}
/**
 * Regular n-gon centred at `(x, y)` with circum-radius `radius`. Covers
 * triangle (`sides: 3`), pentagon, hexagon (pointy-top by default — pass
 * `rotation: Math.PI / 6` for flat-top), octagon, etc. `rotation` is in
 * radians; positive rotates counter-clockwise in screen space.
 */
interface RegularPolygonSpec extends BaseShapeSpec {
    readonly kind: 'regular-polygon';
    readonly sides: number;
    readonly radius: number;
    readonly rotation?: number;
}
/**
 * Annular sector centred at `(x, y)` between radii `innerR`/`outerR` and
 * angles `startAngle`/`endAngle` (radians). Angle convention: `0` is along
 * `+x` (3 o'clock); increasing values sweep clockwise on screen.
 *
 * Special cases:
 * - `innerR === 0` → pie slice.
 * - `endAngle - startAngle >= 2π` and `innerR > 0` → full annulus (ring).
 * - `endAngle - startAngle >= 2π` and `innerR === 0` → full disc (prefer
 *   `CircleSpec` for that case).
 *
 * The natural fit for sunburst / partition layouts where each node is an
 * arc-shaped region rather than a positioned dot. Pair with
 * `D3HierarchyLayout({ mode: 'sunburst' })`, which writes the four arc
 * parameters per node.
 */
interface ArcSpec extends BaseShapeSpec {
    readonly kind: 'arc';
    readonly innerR: number;
    readonly outerR: number;
    readonly startAngle: number;
    readonly endAngle: number;
}
/**
 * Star centred at `(x, y)`, with `points` outer points alternating between
 * `outerRadius` and `innerRadius`. Classic 5-point star uses
 * `points: 5, outerRadius: r, innerRadius: r * 0.4`. `rotation` is in
 * radians; positive rotates counter-clockwise.
 */
interface StarSpec extends BaseShapeSpec {
    readonly kind: 'star';
    readonly points: number;
    readonly innerRadius: number;
    readonly outerRadius: number;
    readonly rotation?: number;
}
/**
 * A marker spec is any registered shape spec **without** `x` / `y` — the
 * connector positions and orients the marker at the polyline endpoint.
 * Reuses the shape registry: there is no separate marker registry. The
 * shape's class must expose a static `paintInto` (see `ShapeCtor`).
 */
type MarkerShapeSpec = Omit<BaseShapeSpec, 'x' | 'y'> & {
    readonly kind: string;
};
/**
 * Anchor selection for a `kind: 'shape'` connector endpoint. Resolves the
 * shape id to a concrete world-space `(x, y)` point on the shape — center of
 * the bounding box (`'center'`, default), perimeter intersection toward the
 * other endpoint (`'boundary'`), or any registered custom anchor.
 *
 * String shorthand picks an anchor by name with default opts; the object
 * form passes opts to the anchor function.
 */
/**
 * Free-form polyline or filled outline. Points are centre-relative, like
 * {@link PolygonSpec}, but the run is **open by default** — set `closed` to
 * join the last point back to the first.
 *
 * This is the vocabulary for shapes whose geometry is *computed* rather than
 * parameterised: density-contour bands, bubble-set hulls, region outlines. It
 * exists so those features can be described as data instead of drawn with a
 * backend drawing API — see `docs/renderer-split-design.md` §3.
 */
interface PathSpec extends BaseShapeSpec {
    readonly kind: 'path';
    /** Centre-relative points, in order. Fewer than 2 renders nothing. */
    readonly points: readonly Point[];
    /** Join the last point back to the first. Default `false`. */
    readonly closed?: boolean;
    /**
     * Treat `points` as **off-curve control points** of a closed quadratic spline
     * through segment midpoints, rather than as straight segments. The result is
     * C¹ continuous, so marching-squares stair-stepping renders as a smooth
     * contour without pre-smoothing the data.
     *
     * Implies `closed`. Default `false`.
     */
    readonly smooth?: boolean;
}
/** Solid stroke for a {@link CompositePart}. */
interface CompositePartStroke {
    readonly color: number;
    readonly width?: number;
    readonly alpha?: number;
}
/** Solid fill + optional stroke shared by the geometric part kinds. */
interface CompositePartFill {
    readonly fill?: number;
    readonly fillAlpha?: number;
    readonly stroke?: CompositePartStroke;
}
/**
 * A child element of a composite shape, positioned at a coordinate relative to
 * the composite's top-left origin.
 *
 * - `'rect'` / `'circle'` / `'line'` — geometry traced into the shared body.
 *   Fill/stroke are solid colours (the simple sugar fields here); for gradient /
 *   image / dashed paint, compose dedicated shapes instead.
 * - `'label'` — a text block. `anchor` picks which horizontal edge of the
 *   measured block lands at `x` (default left); `maxWidth` enables word-wrap,
 *   `maxLines` + `overflow` drive ellipsis.
 * - `'icon'` — a small vector inset (icon-font `glyph` / `svg` / `svg-url`)
 *   mounted into a `size × size` box at `(x, y)`, reusing the engine's
 *   {@link InsetFillLayer} vocabulary. An optional `background` traces a chip
 *   (e.g. a coloured rounded square) behind the glyph — the type-tag look.
 *
 * `rect` / `circle` / `icon` parts may carry a `hitId` to become an addressable
 * **sub-part**: the renderer reports the topmost `hitId` under a point and turns
 * it into `shape:partover` / `shape:partout` events (e.g. per-row hover on a
 * table card). A transparent full-row `rect` with a `hitId` is the idiomatic way
 * to make a whole row hoverable.
 */
type CompositePart = ({
    readonly part: 'rect';
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly cornerRadius?: number;
    /** Marks this rect as an addressable sub-part for sub-part hit-testing. */
    readonly hitId?: string;
} & CompositePartFill) | ({
    readonly part: 'circle';
    readonly x: number;
    readonly y: number;
    readonly radius: number;
    /** Marks this circle as an addressable sub-part for sub-part hit-testing. */
    readonly hitId?: string;
} & CompositePartFill) | {
    readonly part: 'line';
    readonly x: number;
    readonly y: number;
    readonly x2: number;
    readonly y2: number;
    readonly stroke: CompositePartStroke;
} | {
    readonly part: 'label';
    readonly x: number;
    readonly y: number;
    readonly text: string;
    /** Horizontal anchor of the text block at `(x, y)`. Default `'left'`. */
    readonly anchor?: 'left' | 'center' | 'right';
    /**
     * Vertical anchor of the text block at `(x, y)` — the partner of
     * {@link anchor}, measured against the **rendered line box** rather than
     * `fontSize` (a line box is ascent + descent + line gap, typically
     * 1.2–1.4 × `fontSize`).
     *
     * Default `'top'`, which places `y` at the top of the block — the
     * historical behaviour, so an existing label never moves.
     *
     * Use `'middle'` to centre text in a box (a pill, a table row, an avatar
     * disc): give `y` the box's centre line and let the renderer do the
     * measuring. Don't pre-offset `y` by `(boxHeight - fontSize) / 2` — that
     * underestimates the line box and lands the text low.
     */
    readonly vAnchor?: 'top' | 'middle' | 'bottom';
    readonly fontSize?: number;
    readonly fontWeight?: number | string;
    readonly fontStyle?: 'normal' | 'italic';
    readonly fontVariant?: 'normal' | 'small-caps';
    readonly fill?: number;
    readonly lineHeight?: number;
    readonly align?: 'left' | 'center' | 'right';
    readonly maxWidth?: number;
    readonly maxLines?: number;
    readonly overflow?: 'clip' | 'ellipsis';
} | {
    readonly part: 'icon';
    readonly x: number;
    readonly y: number;
    /** Side of the square box the icon is mounted into; the glyph scales to fit. */
    readonly size: number;
    /** Icon content — the engine's inset vocabulary (glyph / svg / svg-url). */
    readonly icon: InsetFillLayer;
    /** Optional chip traced behind the glyph (the coloured type-tag square). */
    readonly background?: {
        readonly fill: number;
        readonly fillAlpha?: number;
        readonly cornerRadius?: number;
    };
    /** Marks this icon's box as an addressable sub-part for sub-part hit-testing. */
    readonly hitId?: string;
};
/**
 * The composite's **root** (background) shape — an ordinary shape spec the
 * composite borrows for its silhouette. The composite declares no geometry of
 * its own: a card can be a rect, circle, polygon, etc. just by changing this.
 * `x`/`y` are ignored — the composite centres the root in its `width × height`
 * box.
 */
type CompositeRootSpec = RectSpec | CircleSpec | EllipseSpec | PolygonSpec | RegularPolygonSpec | StarSpec | ArcSpec;
/**
 * Spec for a composite shape. The body is a {@link CompositeSpec.root} shape
 * sized to the `width × height` box (default: a rounded rect from
 * `cornerRadius` / the inherited `fill` / `stroke`). `parts` declares ordered
 * child geometry + labels at coordinates relative to the composite's top-left
 * origin.
 */
interface CompositeSpec extends BaseShapeSpec {
    readonly kind: 'composite';
    readonly width: number;
    readonly height: number;
    /** Corner radius for the *default* rounded-rect root. Ignored when {@link root} is set. */
    readonly cornerRadius?: number;
    /**
     * Background silhouette of the card — any ordinary shape spec (rect / circle /
     * polygon / regular-polygon / star / arc). Omit for a rounded rectangle built
     * from `cornerRadius` + the inherited `fill` / `stroke`. The composite centres
     * it in the box and delegates fill, stroke, hit-testing and decorations to it.
     */
    readonly root?: CompositeRootSpec;
    /** Ordered child parts; geometry traced into the body, labels mounted as text. */
    readonly parts: readonly CompositePart[];
    /**
     * Clip the child `parts` (and labels / icons) to the root silhouette. When
     * `true`, a part that runs to the card edge — a left accent bar, a full-width
     * header — **follows the rounded corners** instead of poking past them (a
     * `rect` is square geometry and can't round a corner on its own). Off by
     * default; decorations (hover ring / halo) are never clipped.
     */
    readonly clip?: boolean;
}
/**
 * Every built-in shape spec. A discriminated union on `kind`, so the pure
 * geometry functions in `specs/shapeGeometry/` can narrow without a cast.
 *
 * Not closed: `registerShape` admits third-party kinds the engine has never
 * heard of, which is why the geometry dispatchers accept a `BaseShapeSpec` and
 * answer `undefined` for a kind they don't know.
 */
type ShapeSpec = CircleSpec | EllipseSpec | RectSpec | TabbedRectSpec | PolygonSpec | RegularPolygonSpec | StarSpec | ArcSpec | PathSpec | CompositeSpec;

/**
 * Badge descriptions — small shapes pinned to a host element.
 *
 * Pixi-free by construction: a badge says *what* to pin and *where*, never how
 * it is drawn. Lives in the spec vocabulary so domain packages can describe
 * badges without depending on a drawing backend.
 *
 */

/**
 * Anchor point on a host shape's axis-aligned bounding box.
 *
 * - The eight named values address the corners (`top-left`, …,
 *   `bottom-right`) and edge midpoints (`top` / `bottom` / `left` /
 *   `right`).
 * - The `{ x, y }` variant is a **raw world-space point** that bypasses the
 *   host AABB entirely. Use it when the badge needs to anchor at a position
 *   that has no relation to the host's bounds (e.g. an interaction-driven
 *   custom anchor); the badge re-anchors against this point the same way
 *   named placements re-anchor against the host bounds.
 */
type BadgePlacement = NamedBadgePlacement | {
    readonly x: number;
    readonly y: number;
};
/**
 * The eight named anchor points on a host AABB — corners and edge midpoints.
 * The named-only subset of {@link BadgePlacement}; used by
 * {@link BadgeOptions.origin} (which never accepts a raw point) and by
 * internal mirror-math that only makes sense for the named cases.
 */
type NamedBadgePlacement = 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
/**
 * Anchor point along a connector host's routed path.
 *
 * - `'start'` / `'end'` — anchored *near* the source / target endpoint with
 *   automatic clearance: the badge is shifted tangentially by its own
 *   half-extent so it kisses the endpoint shape's silhouette from outside
 *   rather than half-overlapping it. Use these when you want a badge
 *   visually associated with an endpoint (count chip, status icon).
 * - `'middle'` — exact arc-length midpoint (`t = 0.5`).
 * - A `number` in `[0, 1]` — raw arc-length `t`. **No clearance is
 *   applied** — `placement: 1` literally anchors at the silhouette point,
 *   the "raw" counterpart to `'end'`. Values outside `[0, 1]` are clamped.
 *
 * `'middle'` (not `'center'`) avoids the term clash with
 * {@link BadgeOptions.origin} where `'center'` means "centre the badge on
 * its own AABB". For loop edges (`pathType: 'loop-*'`), `'middle'`
 * naturally lands on the loop apex because the path passes through it at
 * `t ≈ 0.5`.
 */
type ConnectorBadgePlacement = 'start' | 'middle' | 'end' | number;
/**
 * Shape spec accepted by `BadgeOptions.shape` — every `BaseShapeSpec` field
 * except `x` / `y` (placement supplies those), plus an open index for the
 * kind-specific fields each shape adds (`radius` on `CircleSpec`, `width` /
 * `height` / `cornerRadius` on `RectSpec`, future shape extras).
 *
 * The renderer doesn't validate kind-specific fields here — that happens
 * inside the registered shape's constructor. Keeping this type open avoids
 * enumerating every shape kind in the badge type surface.
 */
type BadgeShapeSpec = Omit<BaseShapeSpec, 'x' | 'y'> & {
    readonly [extraField: string]: unknown;
};
/**
 * Options for `PrimitivesRenderer.setBadge`. The `shape` field carries the
 * full shape spec (any kind + fill + stroke + kind-specific fields);
 * placement is interpreted differently depending on the host kind (shape
 * AABB vs. connector path) — see {@link placement}.
 *
 * The path-only fields ({@link pathOffset}, {@link autoRotate},
 * {@link keepUpright}) are ignored when the host is a shape.
 */
interface BadgeOptions {
    /** The badge plate as a shape spec, sans `x` / `y` (placement provides position). */
    readonly shape: BadgeShapeSpec;
    /**
     * Where the badge attaches to its host.
     *
     * - **Shape host** — one of {@link BadgePlacement}: a named AABB anchor
     *   (corner / edge midpoint) or a raw `{x, y}` world point.
     * - **Connector host** — one of {@link ConnectorBadgePlacement}: `'start'`,
     *   `'middle'`, `'end'`, or an arc-length `t ∈ [0, 1]`.
     *
     * The host kind is resolved at `setBadge` time from the `hostId`; mismatches
     * (a named-AABB placement on a connector host, or `'middle'` on a shape
     * host) throw with a clear error.
     */
    readonly placement: BadgePlacement | ConnectorBadgePlacement;
    /** Pixel offset applied after origin resolution. Default `0` for both. */
    readonly offsetX?: number;
    readonly offsetY?: number;
    /**
     * **Connector hosts only.** Shift the path-anchor along the local tangent
     * direction (positive = forward toward `'end'`, negative = backward toward
     * `'start'`). Useful for nudging a `'middle'`-anchored badge sideways
     * along the line without changing its `t`. Ignored on shape hosts.
     */
    readonly pathOffset?: number;
    /**
     * **Connector hosts only.** When `true`, the badge's `rotation` follows
     * the path tangent at the anchor point — i.e. the badge tilts to read
     * along the line. Default `false`. Ignored on shape hosts.
     */
    readonly autoRotate?: boolean;
    /**
     * **Connector hosts only.** When {@link autoRotate} is `true`, flip the
     * badge by 180° if the tangent points "downwards" so its top edge always
     * faces the viewer (text remains readable on every edge orientation).
     * Default `true`. Ignored on shape hosts.
     */
    readonly keepUpright?: boolean;
    /**
     * Which point of the badge's own AABB lands at the host anchor.
     *
     * - **`undefined`** (default): mirror of `placement`. The badge sits fully
     *   outside the host edge — e.g. `placement: 'top-right'` puts the badge's
     *   bottom-left corner at the host's top-right corner. (When `placement`
     *   is a raw `{x, y}` point with no inherent mirror, the default falls
     *   back to `'center'`.)
     * - **`'center'`**: the badge centres on the anchor and half-overhangs
     *   the host edge (the gray "A" pattern in the reference design).
     * - **A named `BadgePlacement`**: any of the eight points on the badge.
     *   The raw `{x, y}` variant of `BadgePlacement` is not valid here —
     *   origin is always a named point on the badge.
     */
    readonly origin?: NamedBadgePlacement | 'center';
    /**
     * Decorations applied to the badge shape, keyed by slot. Internally each
     * entry becomes a `setDecoration(badgeId, slot, spec)` call, so any
     * registered decoration kind (glow, ring, marching-ants, …) works.
     */
    readonly decorations?: Readonly<Record<string, DecorationSpec>>;
    /**
     * Effects applied to the badge shape, keyed by slot. Internally each entry
     * becomes a `setEffect(badgeId, slot, spec)` call, so any registered shape
     * effect (`shake`, `breathing`, …) modulates the badge's transform / style
     * the same way it would a free-standing shape.
     *
     * Lifecycle parity with `decorations`: replacing the badge via `setBadge`
     * disposes prior effects; removing the host disposes the badge and all its
     * effects.
     */
    readonly effects?: Readonly<Record<string, EffectSpec>>;
}

/**
 * Connector specs, endpoints and the anchor contract.
 *
 * Part of the pixi-free spec vocabulary — see `docs/renderer-split-design.md`.
 */

type AnchorSpec = string | {
    readonly name: string;
    readonly opts?: Readonly<Record<string, unknown>>;
};
type ConnectorEndpointSpec = {
    readonly kind: 'point';
    readonly x: number;
    readonly y: number;
    readonly tangent?: Vec2;
} | {
    readonly kind: 'shape';
    readonly shapeId: string;
    readonly anchor?: AnchorSpec;
    /**
     * Outward offset applied AFTER the anchor resolves. The anchor's
     * returned `tangent` is treated as the outward direction; the endpoint
     * moves by `tangent * padding` world units before reaching the router.
     *
     * Use cases:
     * - Halo / glow decoration extends beyond the silhouette → set
     *   `padding` to the halo's outer radius so the connector visibly
     *   starts at the halo's edge, not at the shape's tight boundary.
     * - Visual breathing room around tightly packed shapes.
     *
     * No-op when the chosen anchor returns no tangent (e.g. `center`).
     * Negative values pull the endpoint INWARD; default `0`.
     */
    readonly padding?: number;
};
/**
 * Read-only view of a shape that an anchor function consumes. The renderer
 * builds one of these for the referenced shape id and hands it to the
 * registered anchor. Anchors operate against this — they never see the live
 * `ShapeInstance` or `Pixi` objects.
 *
 * **Origin vs centre.** `origin` is the shape's spec position `(spec.x,
 * spec.y)` — this is the top-left for `RectShape`, the centre for
 * `CircleShape`, and shape-dependent for others. `center` is the geometric
 * centre of the bounding box in world space, computed by the renderer from
 * `origin` + `bounds`. Anchors should reference `center` (not `origin`) so
 * their behaviour is uniform across shape kinds.
 */
interface AnchorShapeRef {
    /** World-space origin of the shape (`(spec.x, spec.y)`). */
    readonly origin: Point;
    /** Local-space axis-aligned bounding box (relative to `origin`). */
    readonly bounds: Rect;
    /** World-space geometric centre of the shape's bounding box. */
    readonly center: Point;
    /**
     * Optional analytical boundary-intersection in shape-local coordinates,
     * relative to the shape's geometric **centre** (not its `origin`).
     * Anchors fall back to a default centred-AABB ray-exit when this is
     * absent. `localFromCenter` is the other endpoint's offset from the
     * shape's centre.
     */
    boundaryIntersect?(localFromCenter: Point): Point | null;
}
interface AnchorCtx {
    getShape(id: string): AnchorShapeRef | undefined;
}
/**
 * Anchor: a pure function that resolves a `kind: 'shape'` endpoint to a
 * concrete world-space point on the referenced shape.
 *
 * - `endpoint` carries the shape id and any per-call opts.
 * - `fromPoint` is the OTHER endpoint's first-pass world point — used by
 *   `boundary` to project a ray toward it. Anchors that don't need it
 *   (`center`) ignore it.
 * - The returned `Endpoint` may include an outward `tangent` hint; routers
 *   that respect it (`orthogonal`, `er`, …) prefer it over heuristics.
 */
type IAnchor = (endpoint: {
    readonly shapeId: string;
    readonly opts?: Readonly<Record<string, unknown>>;
}, fromPoint: Point, ctx: AnchorCtx) => Endpoint;
interface BaseConnectorSpec {
    readonly kind: string;
    readonly source: ConnectorEndpointSpec;
    readonly target: ConnectorEndpointSpec;
    /** Intermediate user-supplied points the router must respect. Optional. */
    readonly waypoints?: ReadonlyArray<Point>;
    /** Registered router kind. Default `'straight'`. */
    readonly router?: string;
    /** Per-router options forwarded to the router fn's `opts` parameter. */
    readonly routerOpts?: Readonly<Record<string, unknown>>;
    /** Registered pathStyle kind. Default `'normal'`. */
    readonly pathStyle?: string;
    /** Per-pathStyle options forwarded to the pathStyle fn's `opts` parameter. */
    readonly pathStyleOpts?: Readonly<Record<string, unknown>>;
    /** Optional shape spec painted at the source endpoint, oriented along the path tangent. */
    readonly sourceMarker?: MarkerShapeSpec;
    /** Optional shape spec painted at the target endpoint, oriented along the path tangent. */
    readonly targetMarker?: MarkerShapeSpec;
    readonly stroke?: ShapeStroke;
    readonly zIndex?: number;
    readonly alpha?: number;
    readonly visible?: boolean;
}

/**
 * Hit-test result shape.
 *
 * Part of the pixi-free spec vocabulary — see `docs/renderer-split-design.md`.
 */
interface HitResult {
    readonly kind: 'shape' | 'connector';
    readonly id: string;
    /** Optional sub-region (e.g. a connector handle, a shape sub-part). */
    readonly subId?: string;
}

/**
 * Renderer-reported statistics. Fields are advisory and backend-specific.
 *
 * Part of the pixi-free spec vocabulary — see `docs/renderer-split-design.md`.
 */
interface RenderStats {
    readonly shapes: number;
    readonly connectors: number;
    readonly animatedDecorations: number;
}

/**
 * Polygon maths shared by every spec kind whose silhouette is (or densifies
 * to) a closed vertex ring — `polygon`, `regular-polygon`, `star`,
 * `tabbed-rect`, `path`, and the sampled `arc` fallback.
 *
 * Pure functions over plain `{x, y}` arrays in shape-local space. No drawing
 * library, and nothing from `primitives/` — this file is what lets picking and
 * bounds be answered with no GPU (see `docs/renderer-split-design.md` §4.5,
 * "what stays engine-side").
 *
 * Convention: all vertex arrays here are **centre-relative** — the silhouette
 * is traced around the origin so that `boundaryIntersect` (which receives
 * centre-relative input) works without an extra translation step. The one
 * exception is `tabbed-rect`, whose outline is AABB-origin-relative; it says so
 * at its own call sites.
 */

/** Tight axis-aligned bounding box around the vertex list. */
declare function polygonBounds(vertices: ReadonlyArray<Point>): Rect;
/**
 * Even-odd ray-cast point-in-polygon test. Handles convex and concave
 * silhouettes. Treats the polygon as closed (last vertex implicitly
 * connects to first).
 */
declare function pointInPolygon(localX: number, localY: number, vertices: ReadonlyArray<Point>): boolean;
/** Squared distance from `(px, py)` to the segment `(x1, y1) → (x2, y2)`. */
declare function distanceToSegmentSq(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number;
/**
 * Squared distance from `(x, y)` to the nearest **edge** of a vertex ring.
 * `closed` includes the wrap-around edge (last → first); an open run omits it,
 * which is what a `path` spec with `closed: false` draws.
 */
declare function distanceToOutlineSq(x: number, y: number, vertices: ReadonlyArray<Point>, closed?: boolean): number;
/**
 * Containment against a vertex ring **grown (or shrunk) by `pad`**.
 *
 * - `pad > 0` — inside the ring *or* within `pad` of its outline. This is the
 *   region a centred stroke of half-width `pad` covers, and it is exactly the
 *   union pixi's `Graphics.containsPoint` reports for a filled + stroked
 *   polygon (`Polygon.contains` ∪ `Polygon.strokeContains`).
 * - `pad < 0` — inside the ring *and* further than `|pad|` from its outline:
 *   the silhouette eroded inward, used to punch the hole out of a
 *   fill-less shape so only its stroke band answers `true`.
 *
 * The offset is a true distance offset (round joins at convex corners), not a
 * miter offset, so a spike's tip grows by `pad` rather than by `pad / sin(θ/2)`
 * — the same approximation pixi makes.
 */
declare function polygonContainsInflated(x: number, y: number, vertices: ReadonlyArray<Point>, pad?: number, closed?: boolean): boolean;
/**
 * Parallel-offset a closed polygon by `distance` along each edge's inward
 * normal. Positive `distance` shrinks (inset); negative grows (outset).
 *
 * Each vertex is moved along the **bisector** of its two adjacent edge
 * normals, scaled so the perpendicular offset along the edges equals
 * `distance`. Sufficient for convex and mildly concave silhouettes — the
 * regular-polygon and star convenience kinds always produce well-behaved
 * shapes, free-form polygon insets are best-effort and may self-intersect at
 * extreme concavities.
 */
declare function offsetPolygon(vertices: ReadonlyArray<Point>, distance: number): Point[];
/**
 * Vertices of a regular polygon with `sides` sides and circum-radius
 * `radius`, centred at the origin. `rotationRad` is added to the base angle.
 *
 * Base placement: first vertex at angle `-π/2 + rotationRad` (straight up).
 * So with `rotation = 0`: triangle (sides=3) points up, pentagon points up,
 * hexagon has a vertex at the top (pointy-top). For a flat-top hexagon, pass
 * `rotation = Math.PI / 6`.
 */
declare function regularPolygonVertices(sides: number, radius: number, rotationRad: number): Point[];
/**
 * Vertices of a star with `points` outer points, alternating outer
 * (`outerRadius`) and inner (`innerRadius`) vertices around the origin.
 * `rotationRad` is added to the base angle.
 *
 * Base placement: first outer vertex at angle `-π/2 + rotationRad` (up).
 */
declare function starVertices(points: number, innerRadius: number, outerRadius: number, rotationRad: number): Point[];
/**
 * Ray from the origin toward `localFromCenter`, intersected with the polygon
 * silhouette. Returns the farthest hit (i.e. where the ray exits the
 * polygon) as a centre-relative point, or `null` if the ray doesn't cross
 * any edge.
 *
 * Used by `boundaryIntersect` to snap connector anchors to the exact
 * perimeter of polygonal shapes.
 */
declare function rayPolygonIntersection(localFromCenter: Point, vertices: ReadonlyArray<Point>): Point | null;
/**
 * One vertex of a {@link roundedPolygonOutline} input ring: a corner point
 * plus the fillet radius to apply there. `r <= 0` keeps the corner sharp.
 */
interface RoundedCorner extends Point {
    readonly r: number;
}
/**
 * Densify a closed corner ring into a polyline, replacing each corner that
 * carries `r > 0` with a tangent circular fillet.
 *
 * Works for **convex and concave** corners alike — the fillet centre is
 * placed along the corner's interior bisector, which flips side with the
 * corner's turn direction automatically. That's what lets a silhouette with
 * re-entrant corners (a folder's tab shoulder, a callout's notch) round its
 * outer corners while leaving the re-entrant ones sharp.
 *
 * The requested radius is clamped so a fillet can never consume more than
 * half of either adjacent edge, so authored radii larger than the geometry
 * degrade gracefully instead of self-intersecting. Arcs are sampled at
 * roughly one vertex per 2 px of arc length (min 2 segments), matching the
 * density the rounded-rect outline sampler uses.
 *
 * Output winds in the same direction as the input ring, starting at the
 * first corner (or the start of its fillet when it has one).
 */
declare function roundedPolygonOutline(corners: ReadonlyArray<RoundedCorner>): Point[];

/**
 * The `tabbed-rect` (manila folder) silhouette, as pure maths.
 *
 * Every edge coordinate the outline, fold line, label box, bounds and hit test
 * are built from is resolved here, from the spec alone. It lives in `specs/`
 * rather than beside the renderer because the folder's footprint is a genuine
 * property of the *description* — a layout asking how big a container frame is,
 * an SVG export tracing it, and a headless hit-test all need the same answer
 * without a GPU (`docs/renderer-split-design.md` §4.5).
 *
 * Coordinates are **AABB-origin-relative**: `(0, 0)` is the top-left of the
 * full silhouette, which is the tab band's top-left when the tab is flush left.
 */

/** A tabbed-rect spec with its world position removed — geometry only. */
type TabbedRectGeometrySpec = Omit<TabbedRectSpec, 'x' | 'y'>;
/**
 * Every edge coordinate the silhouette, fold line and label box are built
 * from, resolved once against `inset`. `null` when the inset has collapsed the
 * geometry to nothing.
 *
 * The inset is applied analytically per edge rather than via a polygon offset:
 * the re-entrant shoulder corners make a bisector offset unstable, and all but
 * the slanted edges are axis-aligned, so the exact answer is one addition.
 */
interface TabbedRectGeometry {
    left: number;
    right: number;
    bottom: number;
    /** Top of the tab — the silhouette's topmost edge. */
    tabTop: number;
    /** Where the tab meets the body; the fold line's y. */
    shoulder: number;
    /** Tab extent at its **base**, where it meets the body. */
    tabLeft: number;
    tabRight: number;
    /** Tab extent at its **top**, narrowed by the slant on whichever side leans. */
    tabTopLeft: number;
    tabTopRight: number;
    flushLeft: boolean;
    flushRight: boolean;
    /**
     * `true` when `spec.height <= 0` and the silhouette is the tab alone — the
     * closed folder. `left` / `right` / `bottom` describe the tab, and there is
     * no fold line. See {@link bodylessGeometryOf}.
     */
    bodyless: boolean;
}
/**
 * Resolved tab width: the declared {@link TabbedRectSpec.tabWidth}, falling
 * back to the body's width when it's left unset (a full-width tab).
 *
 * Clamped to the body while there is one — a tab can't outgrow the rectangle
 * it sits on. A bodyless folder's tab *is* the silhouette, so it sizes freely.
 */
declare function tabbedRectTabWidth(spec: TabbedRectGeometrySpec): number;
/**
 * AABB of the folder.
 *
 * Bodyless (`height <= 0`): the tab *is* the silhouette, so it's also the
 * footprint — the declared body width describes a rectangle that isn't being
 * drawn. Everything positioned against the AABB (the label box, decorations,
 * edge anchors) therefore lands on the tab.
 */
declare function tabbedRectBounds(spec: TabbedRectGeometrySpec): Rect;
/**
 * The folder, closed: body gone, tab kept. `width` is deliberately left alone —
 * {@link tabbedRectBounds} already reports the tab as the footprint once the
 * body is gone, so rewriting it would double-apply.
 */
declare function collapsedTabbedRect(_spec: TabbedRectGeometrySpec): Partial<TabbedRectSpec>;
/**
 * Size the tab to the content it carries — the title.
 *
 * The taper eats into the tab's top edge, so the slant's run is added on top of
 * the text budget; otherwise leaning the tab would push the title into the
 * taper. A centred tab leans on both sides.
 *
 * The clamp to `width` applies **only while there's a body**: a tab can't
 * outgrow the rectangle it sits on, but a closed folder is nothing *but* its
 * tab, so it sizes to the whole title rather than ellipsising it. Returns
 * nothing when {@link TabbedRectSpec.tabWidth} is pinned.
 */
declare function fitTabbedRectToContent(spec: TabbedRectGeometrySpec, content: {
    readonly width: number;
    readonly height: number;
}): Partial<TabbedRectSpec>;
/** Uniform scale of every length the folder carries. */
declare function scaleTabbedRect(spec: TabbedRectGeometrySpec, factor: number): Partial<TabbedRectSpec>;
/**
 * Trace the folder silhouette into a polyline, inset by `inset` on every side.
 * Winds clockwise from the tab's top-left corner.
 *
 * The two re-entrant shoulders stay sharp; the convex corners take a fillet.
 * Rounding a shoulder reads as a dent rather than a fold.
 */
declare function tabbedRectOutline(spec: TabbedRectGeometrySpec, inset?: number): Point[];
/**
 * The tab's bottom border — the fold where the tab meets the body — as a
 * two-point segment, or `undefined` when `tabDivider` is off or the geometry
 * has collapsed. Spans the tab's **base**, so with a flush tab it starts on the
 * body's own edge and the two borders meet cleanly.
 */
declare function tabbedRectFoldLine(spec: TabbedRectGeometrySpec, inset?: number): [Point, Point] | undefined;
/**
 * The tab's **upright** box — its full-height portion, with the slant excluded
 * on whichever side is angled. This is where the folder's own label belongs:
 * the body interior belongs to whatever the frame contains, so a title centred
 * against this box stays put no matter how large the body grows.
 */
declare function tabbedRectTabBox(spec: TabbedRectGeometrySpec, inset?: number): Rect | undefined;
/** Resolve every edge coordinate of the folder against `inset`. */
declare function tabbedRectGeometry(spec: TabbedRectGeometrySpec, inset: number): TabbedRectGeometry | null;

/**
 * Per-kind spec measurement: **bounds**, **uniform scale**, **collapse** and
 * **fit-to-content**, as pure functions of the spec.
 *
 * These four used to live as `static` methods on the renderer-side shape
 * classes. They are not drawing — they are properties of the description, and
 * a layout, an exporter or a headless test needs them with no GPU in the
 * process. The shape classes now delegate here, so there is one implementation
 * per kind (`docs/renderer-split-design.md` §9, P4).
 *
 * Every function takes the spec **without** `x` / `y`: bounds are local, so the
 * world position is the caller's business.
 */

/** A spec of kind `K` with its world position removed — geometry only. */
type LocalSpec<T> = Omit<T, 'x' | 'y'>;
declare function boundsOfCircle(spec: LocalSpec<CircleSpec>): Rect;
declare function scaleCircle(spec: LocalSpec<CircleSpec>, factor: number): Partial<CircleSpec>;
declare function boundsOfEllipse(spec: LocalSpec<EllipseSpec>): Rect;
declare function scaleEllipse(spec: LocalSpec<EllipseSpec>, factor: number): Partial<EllipseSpec>;
/** Anchored top-left, so the local box starts at the origin. */
declare function boundsOfRect(spec: LocalSpec<RectSpec>): Rect;
declare function scaleRect(spec: LocalSpec<RectSpec>, factor: number): Partial<RectSpec>;
declare function boundsOfPolygon(spec: LocalSpec<PolygonSpec>): Rect;
declare function scalePolygon(spec: LocalSpec<PolygonSpec>, factor: number): Partial<PolygonSpec>;
/** The n-gon's vertices at its authored size, centred on the origin. */
declare function verticesOfRegularPolygon(spec: LocalSpec<RegularPolygonSpec>): Point[];
declare function boundsOfRegularPolygon(spec: LocalSpec<RegularPolygonSpec>): Rect;
declare function scaleRegularPolygon(spec: LocalSpec<RegularPolygonSpec>, factor: number): Partial<RegularPolygonSpec>;
/** The star's alternating outer / inner vertices, centred on the origin. */
declare function verticesOfStar(spec: LocalSpec<StarSpec>): Point[];
declare function boundsOfStar(spec: LocalSpec<StarSpec>): Rect;
declare function scaleStar(spec: LocalSpec<StarSpec>, factor: number): Partial<StarSpec>;
/**
 * Axis-aligned bounding box for an annular sector. The extreme points are
 * either on the four sector corners (a0/inner, a0/outer, a1/inner, a1/outer)
 * or at the cardinal angles (0, π/2, π, 3π/2) on the outer radius if those
 * angles fall inside the sweep — those produce the (±outerR, 0) / (0, ±outerR)
 * extents.
 */
declare function boundsOfArc(spec: LocalSpec<ArcSpec>): Rect;
declare function scaleArc(spec: LocalSpec<ArcSpec>, factor: number): Partial<ArcSpec>;
declare function boundsOfPath(spec: LocalSpec<PathSpec>): Rect;
declare function scalePath(spec: LocalSpec<PathSpec>, factor: number): Partial<PathSpec>;
/**
 * The composite's silhouette fills its declared box (like a rect), whatever
 * root shape it borrows — the root is centred and sized to that box. Layouts
 * (ELK et al.) read node dimensions through this; without it every card falls
 * back to the layout's default size and they overlap.
 */
declare function boundsOfComposite(spec: Pick<CompositeSpec, 'width' | 'height'>): Rect;
/**
 * The composite's effective root spec: the explicit
 * {@link CompositeSpec.root}, or the default rounded rect built from
 * `cornerRadius` + the inherited `fill` / `stroke`.
 */
declare function resolveCompositeRoot(spec: CompositeSpec): CompositeRootSpec;
/** Local bounds of whichever shape a composite borrows for its silhouette. */
declare function boundsOfCompositeRoot(root: CompositeRootSpec): Rect;
/**
 * Translation from the composite's top-left origin to the borrowed root's own
 * local origin — the offset that centres the root in the `width × height` box.
 *
 * Origin-agnostic by construction: it works off the root's *bounding-box*
 * centre, so a rect (top-left origin) and a circle (centred origin) both land
 * in the middle of the card. The renderer applies exactly this before tracing
 * the root, which is why hit-testing has to apply it too.
 */
declare function compositeRootOffset(spec: CompositeSpec): Point;

/**
 * Pure geometric containment, per spec kind — the engine's hit-test narrow
 * phase with no GPU in it.
 *
 * ## Why this exists
 *
 * Picking used to ask the backend: `bodyGfx.containsPoint(...)`, i.e. pixi
 * walked the instructions it had recorded while painting. That made the answer
 * depend on a display object existing, so picking could not be tested headlessly
 * and would have left the engine with the renderer under the P6 extraction
 * (`docs/renderer-split-design.md` §5 — "geometry answers must not require the
 * backend"). Here the answer comes from the spec alone, so every backend agrees
 * by construction.
 *
 * ## Matching pixi
 *
 * `Graphics.containsPoint` is a **union over painted instructions**: a `fill`
 * instruction answers `shape.contains`, a `stroke` instruction answers
 * `shape.strokeContains`. Two consequences are reproduced here deliberately:
 *
 * 1. **A shape with no silhouette fill is hollow.** No fill was painted, so only
 *    the stroke band answers `true` — clicking the middle of an outline-only
 *    contour misses it, exactly as it does today.
 * 2. **The stroke widens the region by its alignment split**: `'center'`
 *    (default) puts half the width outside and half inside, `'outside'` puts all
 *    of it outside, `'inside'` all of it inside. That mirrors pixi's
 *    `outerWidth = (1 - alignment) * width`.
 *
 * Coordinates are **shape-local** — `(0, 0)` is the shape's own origin (centre
 * for circle / ellipse / polygon / star / arc, top-left for rect / tabbed-rect /
 * composite), i.e. the caller has already subtracted `spec.x` / `spec.y` and
 * divided out any renderer-applied scale.
 */

/**
 * How far a stroke pushes the hit region past the silhouette (`outer`) and how
 * far it reaches back inside it (`inner`).
 *
 * Mirrors pixi's split: `outer = (1 - alignment) * width`, `inner = width -
 * outer`, with the engine's `'inside' | 'center' | 'outside'` mapping to
 * pixi's `1 | 0.5 | 0` alignment. A missing or non-positive width paints
 * nothing, so it widens nothing.
 */
declare function strokeBandOf(stroke: ShapeStroke | undefined): {
    outer: number;
    inner: number;
};
declare function containsCircle(spec: LocalSpec<CircleSpec>, localX: number, localY: number, pad?: number): boolean;
declare function containsEllipse(spec: LocalSpec<EllipseSpec>, localX: number, localY: number, pad?: number): boolean;
declare function containsRect(spec: LocalSpec<RectSpec>, localX: number, localY: number, pad?: number): boolean;
declare function containsPolygon(spec: LocalSpec<PolygonSpec>, localX: number, localY: number, pad?: number): boolean;
declare function containsRegularPolygon(spec: LocalSpec<RegularPolygonSpec>, localX: number, localY: number, pad?: number): boolean;
declare function containsStar(spec: LocalSpec<StarSpec>, localX: number, localY: number, pad?: number): boolean;
declare function containsTabbedRect(spec: LocalSpec<TabbedRectSpec>, localX: number, localY: number, pad?: number): boolean;
/**
 * An open path is tested against its **run**, not a phantom closed area: only a
 * `closed` (or `smooth`, which implies closed) path has an interior, matching
 * the paint path, which fills only when closed. So an unfilled contour line
 * answers `true` along its stroke and nowhere else.
 *
 * `smooth` paths are approximated by the control polygon rather than the
 * quadratic spline it generates. The spline passes through the segment
 * midpoints and bulges toward each control point, so the two differ by at most
 * half a segment's sagitta — a fraction of a pixel at contour densities.
 */
declare function containsPath(spec: LocalSpec<PathSpec>, localX: number, localY: number, pad?: number): boolean;
/**
 * Annular sector, tested analytically rather than against a sampled outline:
 * radius inside `[innerR, outerR]` and angle inside the sweep, each relaxed by
 * `pad`. Outside the sweep the nearest point of the sector lies on one of the
 * two straight radial edges, so the padded test falls back to a distance check
 * against those two segments.
 */
declare function containsArc(spec: LocalSpec<ArcSpec>, localX: number, localY: number, pad?: number): boolean;
/**
 * A composite is its **root silhouette** (centred in the card box) plus every
 * geometric part painted on top of it. Parts are included because they are
 * painted into the same `Graphics` the backend hit-tests today: a part that
 * pokes outside the root — an accent bar on an unclipped card — is clickable,
 * and stays clickable here.
 *
 * `label` parts are excluded: they are mounted as text children, not painted
 * into the body, so they never contributed a hit region.
 */
declare function containsComposite(spec: CompositeSpec, localX: number, localY: number, pad?: number): boolean;
/**
 * Does `(localX, localY)` fall inside the region this spec paints?
 *
 * `strokeTolerance` overrides the widening the spec's own stroke would imply
 * (both inward and outward). Omit it and the band is derived from
 * `spec.stroke` — width and alignment — which is what the renderer wants: the
 * hit region then tracks whatever the shape actually draws.
 *
 * Returns `undefined` for a kind this module doesn't know. That is not a
 * failure: `registerShape` admits third-party kinds, and the caller falls back
 * to asking the instance (`IShape.getHitArea`). Distinguishing "not contained"
 * from "cannot answer" is the whole point of the `boolean | undefined` return.
 */
declare function containsSpec(spec: BaseShapeSpec, localX: number, localY: number, strokeTolerance?: number): boolean | undefined;

/**
 * Spec geometry — bounds, scale, collapse, fit and containment, computed from a
 * spec and nothing else.
 *
 * This is the half of the old shape classes that was never really drawing: the
 * `static boundsOf` / `scaleSpec` / `collapsedOf` / `fitToContent` methods, plus
 * the new `contains`. They live here so a layout can size a node, an exporter
 * can trace a silhouette and a test can pick a shape with no backend mounted —
 * and so they stay in `@invana/canvas` when the pixi renderer is extracted
 * (`docs/renderer-split-design.md` §9, P4).
 *
 * The renderer-side shape classes now delegate to these functions; the maths
 * exists once.
 */

/**
 * Local bounds of any built-in spec kind, or `undefined` for a kind this module
 * doesn't know.
 *
 * `undefined` is a real answer, not a failure: `registerShape` admits
 * third-party kinds, so callers that must cover those ask the registry (which
 * consults the class's `static boundsOf`) and fall back to a default box.
 */
declare function boundsOfSpec(spec: BaseShapeSpec): Rect | undefined;
/**
 * Uniformly scale a spec's geometry by `factor`, as a partial patch to merge
 * onto it. Paint is untouched — only lengths.
 *
 * The contract: `boundsOfSpec(scaleSpec(spec, k)).width === boundsOfSpec(spec).width * k`
 * (likewise height). `undefined` for kinds with no meaningful uniform scale
 * (`composite` sizes off its box and its parts, so scaling it needs the layer's
 * intent, not a geometric rule).
 */
declare function scaleSpec(spec: BaseShapeSpec, factor: number): Record<string, unknown> | undefined;
/**
 * The spec "as small as it goes" — what a collapsed container renders as.
 * Purely geometric: the kind decides what collapsing means to it. `undefined`
 * when the kind has no collapsed form, and callers then keep the spec as is.
 */
declare function collapsedSpec(spec: BaseShapeSpec): Record<string, unknown> | undefined;
/**
 * Size the spec's geometry to a measured block of content (a title, a label).
 * The caller measures — text metrics belong to the backend — and the kind turns
 * that size into geometry. `undefined` when the kind doesn't size to content.
 */
declare function fitSpecToContent(spec: BaseShapeSpec, content: {
    readonly width: number;
    readonly height: number;
}): Record<string, unknown> | undefined;

/**
 * Element-level pointer events — what a drawing backend reports about the
 * shapes and connectors it holds.
 *
 * Part of the pixi-free spec vocabulary: every payload is plain data in world
 * coordinates, so a domain behaviour subscribes to these without knowing which
 * backend produced them. Canvas-wide input (`input:camera:*`) lives on the
 * kernel bus instead; this is the element-scoped channel.
 */

interface ElementEventMap extends EventMap {
    'shape:pointerover': {
        id: string;
        worldX: number;
        worldY: number;
    };
    'shape:pointerout': {
        id: string;
        worldX: number;
        worldY: number;
    };
    'shape:pointerdown': {
        id: string;
        worldX: number;
        worldY: number;
        button: number;
        pointerId: number;
    };
    'shape:pointerup': {
        id: string;
        worldX: number;
        worldY: number;
        button: number;
        pointerId: number;
    };
    /** Left-button click. Right-button → `shape:contextmenu`. */
    'shape:click': {
        id: string;
        worldX: number;
        worldY: number;
        button: number;
    };
    'shape:doubleclick': {
        id: string;
        worldX: number;
        worldY: number;
        button: number;
    };
    'shape:contextmenu': {
        id: string;
        worldX: number;
        worldY: number;
    };
    /**
     * Sub-part pointer transitions — fired only for shapes that implement
     * {@link IShape.hitTestPart} (e.g. a composite card with `hitId`-tagged
     * parts). `partId` is the id the shape returned for the point under the
     * cursor. `partover` fires on entering a part; `partout` on leaving it (to
     * another part of the same shape, or off the shape entirely).
     */
    'shape:partover': {
        id: string;
        partId: string;
        worldX: number;
        worldY: number;
    };
    'shape:partout': {
        id: string;
        partId: string;
    };
    /**
     * Right-click over a hittable sub-part. Emitted *instead of*
     * `shape:contextmenu` when the cursor is over a `hitId`-tagged part, so a
     * consumer can show a part-scoped menu (e.g. a field row) and reserve the
     * shape-level menu for the rest of the card.
     */
    'shape:partcontextmenu': {
        id: string;
        partId: string;
        worldX: number;
        worldY: number;
    };
    'connector:pointerover': {
        id: string;
        worldX: number;
        worldY: number;
    };
    'connector:pointerout': {
        id: string;
        worldX: number;
        worldY: number;
    };
    'connector:pointerdown': {
        id: string;
        worldX: number;
        worldY: number;
        button: number;
        pointerId: number;
    };
    'connector:pointerup': {
        id: string;
        worldX: number;
        worldY: number;
        button: number;
        pointerId: number;
    };
    /** Left-button click. Right-button → `connector:contextmenu`. */
    'connector:click': {
        id: string;
        worldX: number;
        worldY: number;
        button: number;
    };
    'connector:doubleclick': {
        id: string;
        worldX: number;
        worldY: number;
        button: number;
    };
    'connector:contextmenu': {
        id: string;
        worldX: number;
        worldY: number;
    };
    /** Right-button release on empty canvas — no shape/connector was hit. */
    'background:contextmenu': {
        worldX: number;
        worldY: number;
    };
}

export { type InsetFillLayer as $, type AnchorCtx as A, type BaseShapeSpec as B, type CameraTransform as C, type DecorationSpec as D, type EffectSpec as E, type FlushMode as F, type ConnectorLabelPlacement as G, type HitResult as H, type IAnchor as I, type ConnectorLabelStyle as J, type ConnectorPaintStyle as K, type Listener as L, type DecorationTarget as M, type EffectTarget as N, type EffectTargetKind as O, type Point as P, type EllipseSpec as Q, type Rect as R, type SpecFlush as S, type Endpoint as T, type FlowParticlesConnectorDecorationStyle as U, type Vec2 as V, type FlyMarkerConnectorDecorationStyle as W, type GlowConnectorDecorationStyle as X, type GlowDecorationStyle as Y, type HtmlTagStyle as Z, type InsetAnchor as _, SpecStore as a, boundsOfRegularPolygon as a$, type LabelBackground as a0, type LabelStyleCommon as a1, type LabelVisibility as a2, type LiquidFillDecorationStyle as a3, type LocalSpec as a4, type MarchingAntsConnectorDecorationStyle as a5, type MarchingAntsDecorationStyle as a6, type MarkerShapeSpec as a7, type NamedBadgePlacement as a8, type Obstacle as a9, type SelectionFrameHandleHit as aA, type SelectionFrameHandleShape as aB, type SelectionFramePlacement as aC, type ShapeFillLayer as aD, type ShapeLabelPlacement as aE, type ShapeLabelStyle as aF, type ShapePaintStyle as aG, type ShapeSpec as aH, type Size as aI, type StarSpec as aJ, type StyleOverride as aK, type TabAlign as aL, type TabbedRectGeometry as aM, type TabbedRectGeometrySpec as aN, type TabbedRectSpec as aO, type ToggleDecorationStyle as aP, type ToggleHitGeometry as aQ, type TogglePlacement as aR, type TransformDelta as aS, boundsOfArc as aT, boundsOfCircle as aU, boundsOfComposite as aV, boundsOfCompositeRoot as aW, boundsOfEllipse as aX, boundsOfPath as aY, boundsOfPolygon as aZ, boundsOfRect as a_, type PathCommand as aa, type PathSpec as ab, type PathStyleEndpoints as ac, type PlaneName as ad, type PolygonSpec as ae, type Polyline as af, type PulseRingDecorationStyle as ag, type RectSpec as ah, type RegisterDecorationOptions as ai, type RegisterEffectOptions as aj, type RegularPolygonSpec as ak, type RenderStats as al, type ResizeHandleDecorationStyle as am, type ResizeHandlePlacement as an, type RevealConnectorDecorationStyle as ao, type RevealDirection as ap, type RevealEasingName as aq, type RevealHostStroke as ar, type RevealRepeat as as, type RingConnectorDecorationStyle as at, type RingDecorationStyle as au, type RippleConnectorDecorationStyle as av, type RoundedCorner as aw, type RouterCtx as ax, type SelectionFrameBorderStyle as ay, type SelectionFrameDecorationStyle as az, type BaseConnectorSpec as b, boundsOfSpec as b0, boundsOfStar as b1, collapsedSpec as b2, collapsedTabbedRect as b3, compositeRootOffset as b4, connectorGeometryKey as b5, containsArc as b6, containsCircle as b7, containsComposite as b8, containsEllipse as b9, scaleRegularPolygon as bA, scaleSpec as bB, scaleStar as bC, scaleTabbedRect as bD, scheduleFlush as bE, starVertices as bF, strokeBandOf as bG, tabbedRectBounds as bH, tabbedRectFoldLine as bI, tabbedRectGeometry as bJ, tabbedRectOutline as bK, tabbedRectTabBox as bL, tabbedRectTabWidth as bM, verticesOfRegularPolygon as bN, verticesOfStar as bO, containsPath as ba, containsPolygon as bb, containsRect as bc, containsRegularPolygon as bd, containsSpec as be, containsStar as bf, containsTabbedRect as bg, distanceToOutlineSq as bh, distanceToSegmentSq as bi, fitSpecToContent as bj, fitTabbedRectToContent as bk, hasSilhouetteFill as bl, offsetPolygon as bm, pointInPolygon as bn, polygonBounds as bo, polygonContainsInflated as bp, rayPolygonIntersection as bq, regularPolygonVertices as br, resolveCompositeRoot as bs, roundedPolygonOutline as bt, scaleArc as bu, scaleCircle as bv, scaleEllipse as bw, scalePath as bx, scalePolygon as by, scaleRect as bz, type BadgeOptions as c, type LabelContent as d, type LabelWrap as e, EventEmitter as f, type ElementEventMap as g, type EventMap as h, type IRouter as i, type IPathStyle as j, type Path as k, type BadgePlacement as l, type ShapeFill as m, type ShapeStroke as n, type AnchorShapeRef as o, type AnchorSpec as p, type ArcSpec as q, type BadgeShapeSpec as r, type CircleSpec as s, type CompositePart as t, type CompositePartFill as u, type CompositePartStroke as v, type CompositeRootSpec as w, type CompositeSpec as x, type ConnectorBadgePlacement as y, type ConnectorEndpointSpec as z };
