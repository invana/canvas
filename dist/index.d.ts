import { F as FlushMode, S as SpecFlush, L as Listener, C as CameraTransform$1, R as Rect, a as SpecStore, P as Point, B as BaseShapeSpec, b as BaseConnectorSpec, D as DecorationSpec, c as BadgeOptions, E as EffectSpec, d as LabelContent, e as LabelWrap, H as HitResult, f as EventEmitter, g as ElementEventMap, h as EventMap, I as IAnchor, i as IRouter, j as IPathStyle, k as Path, V as Vec2, l as BadgePlacement, m as ShapeFill, n as ShapeStroke } from './index-CZuSgBOJ.js';
export { A as AnchorCtx, o as AnchorShapeRef, p as AnchorSpec, q as ArcSpec, r as BadgeShapeSpec, s as CircleSpec, t as CompositePart, u as CompositePartFill, v as CompositePartStroke, w as CompositeRootSpec, x as CompositeSpec, y as ConnectorBadgePlacement, z as ConnectorEndpointSpec, G as ConnectorLabelPlacement, J as ConnectorLabelStyle, K as ConnectorPaintStyle, M as DecorationTarget, N as EffectTarget, O as EffectTargetKind, Q as EllipseSpec, T as Endpoint, U as FlowParticlesConnectorDecorationStyle, W as FlyMarkerConnectorDecorationStyle, X as GlowConnectorDecorationStyle, Y as GlowDecorationStyle, Z as HtmlTagStyle, _ as InsetAnchor, $ as InsetFillLayer, a0 as LabelBackground, a1 as LabelStyleCommon, a2 as LabelVisibility, a3 as LiquidFillDecorationStyle, a4 as LocalSpec, a5 as MarchingAntsConnectorDecorationStyle, a6 as MarchingAntsDecorationStyle, a7 as MarkerShapeSpec, a8 as NamedBadgePlacement, a9 as Obstacle, aa as PathCommand, ab as PathSpec, ac as PathStyleEndpoints, ad as PlaneName, ae as PolygonSpec, af as Polyline, ag as PulseRingDecorationStyle, ah as RectSpec, ai as RegisterDecorationOptions, aj as RegisterEffectOptions, ak as RegularPolygonSpec, al as RenderStats, am as ResizeHandleDecorationStyle, an as ResizeHandlePlacement, ao as RevealConnectorDecorationStyle, ap as RevealDirection, aq as RevealEasingName, ar as RevealHostStroke, as as RevealRepeat, at as RingConnectorDecorationStyle, au as RingDecorationStyle, av as RippleConnectorDecorationStyle, aw as RoundedCorner, ax as RouterCtx, ay as SelectionFrameBorderStyle, az as SelectionFrameDecorationStyle, aA as SelectionFrameHandleHit, aB as SelectionFrameHandleShape, aC as SelectionFramePlacement, aD as ShapeFillLayer, aE as ShapeLabelPlacement, aF as ShapeLabelStyle, aG as ShapePaintStyle, aH as ShapeSpec, aI as Size, aJ as StarSpec, aK as StyleOverride, aL as TabAlign, aM as TabbedRectGeometry, aN as TabbedRectGeometrySpec, aO as TabbedRectSpec, aP as ToggleDecorationStyle, aQ as ToggleHitGeometry, aR as TogglePlacement, aS as TransformDelta, aT as boundsOfArc, aU as boundsOfCircle, aV as boundsOfComposite, aW as boundsOfCompositeRoot, aX as boundsOfEllipse, aY as boundsOfPath, aZ as boundsOfPolygon, a_ as boundsOfRect, a$ as boundsOfRegularPolygon, b0 as boundsOfSpec, b1 as boundsOfStar, b2 as collapsedSpec, b3 as collapsedTabbedRect, b4 as compositeRootOffset, b5 as connectorGeometryKey, b6 as containsArc, b7 as containsCircle, b8 as containsComposite, b9 as containsEllipse, ba as containsPath, bb as containsPolygon, bc as containsRect, bd as containsRegularPolygon, be as containsSpec, bf as containsStar, bg as containsTabbedRect, bh as distanceToOutlineSq, bi as distanceToSegmentSq, bj as fitSpecToContent, bk as fitTabbedRectToContent, bl as hasSilhouetteFill, bm as offsetPolygon, bn as pointInPolygon, bo as polygonBounds, bp as polygonContainsInflated, bq as rayPolygonIntersection, br as regularPolygonVertices, bs as resolveCompositeRoot, bt as roundedPolygonOutline, bu as scaleArc, bv as scaleCircle, bw as scaleEllipse, bx as scalePath, by as scalePolygon, bz as scaleRect, bA as scaleRegularPolygon, bB as scaleSpec, bC as scaleStar, bD as scaleTabbedRect, bE as scheduleFlush, bF as starVertices, bG as strokeBandOf, bH as tabbedRectBounds, bI as tabbedRectFoldLine, bJ as tabbedRectGeometry, bK as tabbedRectOutline, bL as tabbedRectTabBox, bM as tabbedRectTabWidth, bN as verticesOfRegularPolygon, bO as verticesOfStar } from './index-CZuSgBOJ.js';

/**
 * The **device-shaped** half of the renderer seam — the part the kernel can
 * legitimately own.
 *
 * ## Why the interface itself moved out
 *
 * This file used to declare `IRenderer` with `applyView` / `applyData`: a push
 * model where the orchestrator handed the renderer view and data deltas. Two
 * things happened to it.
 *
 * 1. **P2 replaced the flow.** Durable visuals became state (`store.specs`) and
 *    the renderer now *subscribes* — `specs:flush` → `SpecProjector` → mounted
 *    elements. Nothing pushes a view or a data delta at a renderer any more, so
 *    those two methods described a design that no longer exists. They had zero
 *    implementers and zero callers, which is exactly how a stale interface
 *    survives unnoticed.
 * 2. **The real contract is made of spec vocabulary.** Surfaces project
 *    `BaseShapeSpec` / `BaseConnectorSpec`; overlays draw in engine geometry.
 *    That vocabulary lives above the kernel (re-exported by `@invana/canvas`), and the kernel imports no
 *    `@invana` package — so the interface cannot live here without inverting the
 *    dependency layering.
 *
 * `IRenderer` therefore lives at `@invana/canvas-core` → `src/contracts/IRenderer.ts`.
 * What stays here is what is genuinely kernel-shaped: the backend name a
 * renderer resolved to, and {@link RendererInitOptions} — the non-syncable
 * device counterpart to the syncable `CanvasSceneOptions`.
 */
/**
 * The backend a renderer resolved to at mount. Open-ended (`string & {}`) so a
 * concrete adapter can report a backend the kernel doesn't enumerate, while the
 * common trio stays autocompletable.
 */
type RendererBackend = 'webgpu' | 'webgl' | 'canvas' | (string & {});

/**
 * `RendererInitOptions` — the **adapter-local, non-syncable** init bag handed to a
 * renderer at `IRenderer.mount` (the interface lives in `@invana/canvas`).
 *
 * These are deliberately the device/backend knobs that {@link CanvasSceneOptions}
 * (`view/CanvasView.ts`) leaves out on purpose — they belong to the renderer
 * adapter, not the syncable `view.definition`. Where the split falls:
 *
 * - **Syncable scene config** (background, zoom clamp, world bounds, default mode)
 *   → `view.definition.canvas` ({@link CanvasSceneOptions}) — converges in a CRDT.
 * - **Device / init options** (which GPU backend, antialias, DPR, canvas size) →
 *   **here** — per-client, never synced, only meaningful at mount.
 *
 * A concrete renderer (e.g. `@invana/renderer-pixijs`) may widen this with its own
 * backend-specific fields; the kernel types only the portable subset.
 */
/**
 * Preferred drawing backend, in descending order of capability:
 *
 * - `'webgpu'` — the fastest path where the browser supports it.
 * - `'webgl'` — the universal fallback; opt out of WebGPU entirely by asking for it.
 * - `'canvas'` — the 2D-context renderer of last resort (no GPU context at all).
 *
 * **This is the single declaration of the preference vocabulary.** The engine's
 * `CanvasOptions.preference` and each backend's own preference type alias *this*,
 * so the seam between them cannot silently diverge — it did once, and a
 * `'canvas'` request was quietly downgraded to WebGL for it. Omit the option
 * entirely to let the backend choose (the documented default); there is no
 * separate `'auto'` spelling of that.
 */
type RenderPreference = 'webgpu' | 'webgl' | 'canvas';
interface RendererInitOptions {
    /**
     * Preferred GPU backend ({@link RenderPreference}). The renderer may downgrade
     * (e.g. `'webgpu'` → `'webgl'` on browsers whose WebGPU path is unavailable);
     * the resolved value is reported on `IRenderer.backend` after mount. Omit to
     * let the backend choose.
     */
    preference?: RenderPreference;
    /** Enable multisample antialiasing. */
    antialias?: boolean;
    /** Device-pixel-ratio / resolution override. Defaults to the display DPR. */
    resolution?: number;
    /**
     * Initial drawing-surface size in CSS pixels. Omit to fill (and track) the host
     * element's client box.
     */
    width?: number;
    height?: number;
    /**
     * Initial clear colour (`0xRRGGBB`) applied before the first frame. The ongoing
     * scene background is the syncable {@link CanvasSceneOptions.backgroundColor};
     * this is only the pre-mount clear.
     */
    background?: number;
}

/**
 * `ColumnStore<TSchema>` — typed-array column store for **bulk hot data** (the
 * kernel's machine-rate **DATA-HOT lane**: node `x`/`y`, flags, bulk attrs).
 *
 * Relocated into `@invana/canvas-store` (decision D1) so the renderer-free kernel
 * owns the data hot path; `@invana/canvas` consumes it (and may re-export for
 * back-compat). Imports **no** drawing library.
 *
 * Designed to scale to millions of items at machine-rate mutation (1000s/sec from
 * external feeds). Where the reactive store (immer) makes per-mutation
 * structural-sharing trade-offs that cap out around 5–10k for hot data,
 * `ColumnStore` mutates typed-array slots in place at ~10 ns per write — so
 * layout churn / position streams **never** touch the reactive/CRDT path.
 *
 * **Mental model:** one id-keyed object `{ id:'n-42', x:100, y:50 }` becomes
 * slot 17 across N parallel typed-array columns. Lookup is id → slot
 * (`Map<string, number>`), then columns are read/written by indexing slot. Slots
 * recycle on remove, so buffers stay compact under churn.
 *
 * @example
 * type NodeSchema = { x: 'f32'; y: 'f32'; flags: 'u8' };
 * const nodes = new ColumnStore<NodeSchema>({ x: 'f32', y: 'f32', flags: 'u8' });
 * nodes.add('n-1', { x: 10, y: 20, flags: 0 });
 * // Renderer / layout fast path — hold refs once, write directly:
 * const xCol = nodes.column('x'); const slot = nodes.slot('n-1')!;
 * xCol[slot] = 40;       // ~10 ns
 * nodes.touch();         // bump version after fast-path writes
 */
/**
 * Numeric type tags for typed-array columns. Each maps to a JS TypedArray ctor.
 * `i8/u8` — bytes (booleans, bitfields, packed enums); `i16/u16` — short ints;
 * `i32/u32` — slot refs / packed colours / hashes; `f32` — coordinates / weights
 * (default); `f64` — only when precision matters.
 */
type ColumnType = 'i8' | 'u8' | 'i16' | 'u16' | 'i32' | 'u32' | 'f32' | 'f64';
type ColumnSchema = Record<string, ColumnType>;
type ColumnValue<T extends ColumnType> = T extends 'f32' | 'f64' ? number : number;
type ColumnArray<T extends ColumnType> = T extends 'i8' ? Int8Array : T extends 'u8' ? Uint8Array : T extends 'i16' ? Int16Array : T extends 'u16' ? Uint16Array : T extends 'i32' ? Int32Array : T extends 'u32' ? Uint32Array : T extends 'f32' ? Float32Array : T extends 'f64' ? Float64Array : never;
/** Shape of a row in `add()` / `addBulk()`: each schema field maps to a number. */
type RowOf<TSchema extends ColumnSchema> = {
    [K in keyof TSchema]: ColumnValue<TSchema[K]>;
};
interface ColumnStoreOptions {
    /** Initial slot capacity. Doubles on overflow. Default 256. */
    initialCapacity?: number;
    /** Max capacity. Throws on overflow. Default 16_777_216 (~16M). */
    maxCapacity?: number;
}
declare class ColumnStore<TSchema extends ColumnSchema = ColumnSchema> {
    private readonly schema;
    private readonly columnNames;
    private readonly maxCapacity;
    /** id → slot. The only object-keyed lookup on the hot path. */
    private readonly idIndex;
    /** slot → id. Filled slots have a string; recycled holes have `undefined`. */
    private readonly idReverse;
    /** Stack of recycled slots. `add()` pops from here before extending. */
    private readonly freeSlots;
    /** TypedArray per column. Replaced on grow (new buffer with copied data). */
    private columns;
    /** Current capacity (length of each TypedArray). */
    private _capacity;
    /** High-water mark — largest slot index ever assigned + 1. Not necessarily filled. */
    private _highWater;
    /** Mutation version. Increments on any add/remove/set or `touch()`. */
    private _version;
    constructor(schema: TSchema, opts?: ColumnStoreOptions);
    /** Number of items currently stored. */
    get size(): number;
    /** Current allocated capacity. Grows automatically when filled. */
    get capacity(): number;
    /** Mutation counter — bumps on any change. Subscribers diff this. */
    get version(): number;
    /** True iff `id` has been added. */
    has(id: string): boolean;
    /** Returns the slot for `id`, or `undefined`. Useful for the renderer fast path. */
    slot(id: string): number | undefined;
    /** Returns the id at `slot`, or `undefined` if the slot is free. */
    idAt(slot: number): string | undefined;
    /**
     * Direct access to a column's TypedArray. **Holds a stable reference until the
     * column is grown** (then the buffer is replaced). Use {@link version} to detect
     * grow events. Renderer/layout fast path: cache `column(name)` + `slot(id)` once
     * per frame and write directly, then call {@link touch}.
     */
    column<K extends keyof TSchema>(name: K): ColumnArray<TSchema[K]>;
    /** Read a single value. ~50 ns: Map.get + TypedArray read. */
    get<K extends keyof TSchema>(id: string, name: K): ColumnValue<TSchema[K]> | undefined;
    /** Materialise a full row by id. Allocates an object — avoid in hot loops. */
    row(id: string): RowOf<TSchema> | undefined;
    /** Add a new item. Throws if `id` already exists. Reuses a recycled slot when available. */
    add(id: string, row: RowOf<TSchema>): number;
    /** Bulk add. Grows once if needed (cheaper than N individual grows). Throws on duplicate id. */
    addBulk(items: ReadonlyArray<{
        id: string;
        row: RowOf<TSchema>;
    }>): void;
    /** Set a single field. ~50 ns. No-op if id doesn't exist. */
    set<K extends keyof TSchema>(id: string, name: K, value: ColumnValue<TSchema[K]>): void;
    /** Update multiple fields of one item in one call (one version bump). */
    update(id: string, partial: Partial<RowOf<TSchema>>): void;
    /** Remove an item. Recycles the slot. No-op if id doesn't exist. */
    remove(id: string): void;
    /** Bulk remove. */
    removeBulk(ids: readonly string[]): void;
    /**
     * Mark the store as mutated without an API change — call after batches of
     * fast-path writes via `column(...)[slot] = ...` so version-driven subscribers
     * re-read.
     */
    touch(): void;
    /** Drop all items + recycled slots. Keeps capacity (no shrink). */
    clear(): void;
    /** Iterate (id, slot) for currently-live ids. O(size) — does not walk holes. */
    forEach(cb: (id: string, slot: number) => void): void;
    /** Iterator over live ids only. */
    ids(): IterableIterator<string>;
    private allocSlot;
    /** Grow each column to at least `target` (doubling past it). */
    private grow;
}

/**
 * `LayerData` — the **non-reactive** graph data for one source: four record
 * collections (nodes · edges · groups · annotations) with full CRUD, **bulk
 * position updates** (layout output), and **one coalesced `flush` per frame**
 * carrying a per-kind delta. Subscribers (the renderer) rebuild only the delta.
 *
 * **Two lanes (the two physics).** Bulk + machine-rate → it lives *outside* the
 * reactive `view` store:
 * - **COLD** — `Map<id, record>` for human-rate fields (payload/label/style/…).
 * - **HOT** — a typed-array {@link ColumnStore} for node **positions** (`x`/`y`)
 *   and a `flags` byte (has-position / pinned / disabled / hidden). A position
 *   write is ~10 ns (one `Float32Array` slot), no per-node object, no GC. The
 *   layout/renderer fast path holds the column ref and writes slots directly
 *   (see {@link positions} + {@link touchPositions}).
 *
 * `node(id)` stitches the two lanes back into one record on read (cold reads are
 * human-rate; the hot path reads the column directly). The `flush` delta shape is
 * **unchanged** by the lane split — `moved` (position-only) stays separate from
 * `changed` (structure), so a move is a transform-only re-render.
 *
 * **When** the coalesced flush fires is the {@link FlushMode} (default `'microtask'`);
 * the engine flips its stores to `'manual'` and drains them from one rAF loop. See
 * `docs/canvas-store-data-event-flow.md` §2.2.
 */

interface NodeRecord {
    id: string;
    x?: number;
    y?: number;
    [key: string]: unknown;
}
interface EdgeRecord {
    id: string;
    source: string;
    target: string;
    [key: string]: unknown;
}
interface GroupRecord {
    id: string;
    memberIds: string[];
    /** Derived encapsulating geometry (hull / rect / …) — computed by a deriver. */
    geometry?: unknown;
    [key: string]: unknown;
}
interface AnnotationRecord {
    id: string;
    kind: string;
    [key: string]: unknown;
}
/** Added / changed / removed ids for one collection. */
interface KindDelta {
    added: string[];
    changed: string[];
    removed: string[];
}
/** Nodes also carry `moved` — position-only changes (transform-only re-render). */
interface NodeDelta extends KindDelta {
    /** Ids whose position changed this frame. Empty when {@link movedAll} is set. */
    moved: string[];
    /**
     * Every node moved (a force-sim tick via {@link LayerData.touchPositions}) —
     * `moved` is left **empty** so the kernel doesn't allocate an N-id array each
     * frame; the renderer iterates all positions directly. O(1) per flush.
     */
    movedAll: boolean;
}
/** The per-frame coalesced delta across all four collections. */
interface LayerFlush {
    nodes: NodeDelta;
    edges: KindDelta;
    groups: KindDelta;
    annotations: KindDelta;
    /** Monotonic version — bumps once per flush. */
    version: number;
}
/** Bulk seed/replace input. */
interface GraphInput {
    nodes?: readonly NodeRecord[];
    edges?: readonly EdgeRecord[];
    groups?: readonly GroupRecord[];
    annotations?: readonly AnnotationRecord[];
}
/** The hot-lane schema: positions (`x`/`y`) + a packed `flags` byte. */
type PosSchema = {
    x: 'f32';
    y: 'f32';
    flags: 'u8';
};
/** Bits in the node `flags` column. `HAS_POSITION` distinguishes unset from `(0,0)`. */
declare const NODE_FLAG: {
    readonly HAS_POSITION: 1;
    readonly PINNED: 2;
    readonly DISABLED: 4;
    readonly HIDDEN: 8;
};
/** Streaming/ingestion lifecycle for a data source. */
type QueryStatus = 'idle' | 'loading' | 'streaming' | 'error';
/** A named data mutation, recorded for audit / collaboration (distinct from the per-frame flush). */
interface IntentLogEntry {
    action: string;
    ids?: readonly string[];
    ts: number;
}
declare class LayerData {
    /** COLD lane — node records WITHOUT `x`/`y` (positions live in {@link _pos}). */
    private readonly _nodes;
    /** HOT lane — typed-array `x`/`y`/`flags` columns, keyed by node id. */
    private readonly _pos;
    private readonly _edges;
    private readonly _groups;
    private readonly _annotations;
    private readonly dNodes;
    private readonly dMoved;
    private _movedAll;
    private readonly dEdges;
    private readonly dGroups;
    private readonly dAnnotations;
    private readonly listeners;
    private version;
    private scheduled;
    private flushMode;
    private cancel;
    private _status;
    private readonly _intents;
    private readonly statusListeners;
    /** Subscribe to coalesced `flush` deltas. Returns an unsubscribe. */
    on(event: 'flush', listener: (e: LayerFlush) => void): () => void;
    /** {@link DataSource} contract — alias for `on('flush', …)`. */
    onFlush(listener: (e: LayerFlush) => void): () => void;
    /**
     * Choose **when** a flush fires ({@link FlushMode}). `'manual'` disarms any pending
     * auto-flush so only an explicit {@link flush} emits — used when the engine drives
     * every layer's data from one rAF loop.
     */
    setFlushMode(mode: FlushMode): void;
    /** Read a node, **stitching** its cold record with its hot `x`/`y` (when set). */
    node(id: string): NodeRecord | undefined;
    edge(id: string): EdgeRecord | undefined;
    group(id: string): GroupRecord | undefined;
    annotation(id: string): AnnotationRecord | undefined;
    nodes(): NodeRecord[];
    edges(): EdgeRecord[];
    groups(): GroupRecord[];
    annotations(): AnnotationRecord[];
    get counts(): {
        nodes: number;
        edges: number;
        groups: number;
        annotations: number;
    };
    /**
     * Direct access to the typed-array position columns. Hold the ref + a slot once
     * and write in place (~10 ns/slot), then call {@link touchPositions} to emit one
     * coalesced moved flush. `positions.slot(id)` maps id → column index.
     */
    get positions(): ColumnStore<PosSchema>;
    /**
     * Bulk-apply layout output from an **interleaved** `[x0,y0,x1,y1,…]` buffer —
     * the layout fast path. Skips ids that aren't present; marks each `moved`.
     */
    setPositionsBulk(ids: readonly string[], xy: ArrayLike<number>): void;
    /**
     * After writing position slots directly via {@link positions}, call this to bump
     * the version and emit **one** flush that marks every node `moved` (the per-tick
     * force-sim path — "everything moved", transform-only).
     */
    touchPositions(): void;
    /** Read a node's `flags` byte, or `undefined`. */
    nodeFlags(id: string): number | undefined;
    /** Toggle a {@link NODE_FLAG} bit (e.g. pinned/disabled) — marks the node `changed`. */
    setNodeFlag(id: string, flag: number, on: boolean): void;
    /** Current ingestion lifecycle status. */
    get status(): QueryStatus;
    /** Set the ingestion status; notifies {@link onStatus} listeners on change. */
    setStatus(status: QueryStatus): void;
    /** Subscribe to status changes. Returns an unsubscribe. */
    onStatus(listener: (status: QueryStatus) => void): () => void;
    /** The data-mutation audit trail (one entry per named action). */
    intents(): readonly IntentLogEntry[];
    /** Record a named data intent (audit / collab). */
    logIntent(action: string, ids?: readonly string[], ts?: number): void;
    /** Replace the whole graph — diffs each collection into the next flush. */
    setData(input: GraphInput): void;
    /** Bulk-apply layout output (positions) → marks nodes `moved` (transform-only). */
    applyPositions(positions: Iterable<{
        id: string;
        x: number;
        y: number;
    }>): void;
    addNode(n: NodeRecord): void;
    updateNode(id: string, patch: Partial<NodeRecord>): void;
    removeNode(id: string): void;
    addEdge(e: EdgeRecord): void;
    updateEdge(id: string, patch: Partial<EdgeRecord>): void;
    removeEdge(id: string): void;
    addGroup(g: GroupRecord): void;
    updateGroup(id: string, patch: Partial<GroupRecord>): void;
    removeGroup(id: string): void;
    addAnnotation(a: AnnotationRecord): void;
    updateAnnotation(id: string, patch: Partial<AnnotationRecord>): void;
    removeAnnotation(id: string): void;
    /** Emit the pending delta now (the engine calls this once per frame). */
    flush(): void;
    private schedule;
    private isClean;
    /** Insert/replace a node: cold record (minus x/y) + hot position columns. */
    private upsertNode;
    /**
     * Write a node's position into the hot column. `replace` (used on full upsert)
     * clears the `HAS_POSITION` bit when no `x`/`y` is supplied; otherwise a partial
     * update keeps the existing coordinate for an omitted axis.
     */
    private writePos;
    private replaceNodes;
    private upsert;
    private patchRecord;
    private removeFrom;
    private replaceKind;
}

/**
 * Frame-performance types — the vendor-neutral contract for the engine's
 * per-frame observability signal. The engine (`@invana/canvas`) *measures*
 * frames and emits a {@link FrameTick} on the `render:loop:tick` bus event;
 * an app-side adapter maps those onto OpenTelemetry metrics + spans (see
 * `telemetry/tracing.ts` for the sibling span port). These types live in the
 * kernel because the kernel owns the {@link CanvasGlobalEvents} contract — the
 * measurement lives in the engine, the shape lives here.
 *
 * Design intent (the "F1 telemetry" model): a continuous FPS/frame-time trace
 * (`dt` / {@link FrameTick.fps}), a per-phase breakdown of where the CPU frame
 * went ({@link FramePhaseTimings}), and an {@link InteractionKind} tag so every
 * frame is attributable to the gesture that caused it — the metric dimension
 * that lets a dashboard show *which* action dipped FPS and by how much.
 */
/**
 * The user-interaction category a frame is attributed to. A deliberately small,
 * closed set so it is safe to use as a metric/span **dimension** (bounded
 * cardinality). `'idle'` is the default when no gesture is active.
 */
type InteractionKind = 'idle' | 'pan' | 'zoom' | 'drag' | 'hover' | 'layout';
/**
 * The CPU sub-phases measured inside one engine tick (`Canvas.tickOnce`):
 * - `camera` — advancing viewport plugins (`camera.tick`).
 * - `dataFlush` — draining every registered data source's coalesced flush.
 * - `layers` — per-layer `flush()` + `tickAnimations()`.
 *
 * These sum to {@link FrameTick.cpuMs}. GPU render + browser compositing happen
 * *outside* the tick and are therefore not in this breakdown — the remainder
 * `dt - cpuMs` approximates render + idle.
 */
type FramePhase = 'camera' | 'dataFlush' | 'layers';
/** Per-phase wall-clock cost (ms) within a single frame's CPU tick. */
type FramePhaseTimings = Record<FramePhase, number>;
/**
 * One measured engine frame — the payload of the `render:loop:tick` bus event.
 * Emitted once per `Canvas.tickOnce`.
 */
interface FrameTick {
    /** `performance.now()` at the start of this frame's tick. */
    ts: number;
    /**
     * Inter-frame period in ms (the renderer ticker's delta) — the FPS
     * denominator and the primary "speed trace" value.
     */
    dt: number;
    /** `1000 / dt`, clamped to a sane ceiling — instantaneous frames-per-second. */
    fps: number;
    /** Total CPU cost measured inside the tick (sum of {@link phases}). */
    cpuMs: number;
    /** Per-phase CPU breakdown; the values sum to {@link cpuMs}. */
    phases: FramePhaseTimings;
    /** The interaction this frame is attributed to (`'idle'` when no gesture is active). */
    interaction: InteractionKind;
    /** True when `dt` exceeded the long-frame (jank) threshold. */
    longFrame: boolean;
}
/**
 * Windowed frame statistics — a cheap pull-model summary for a HUD / status
 * bar, computed on demand from a {@link FrameTick} ring buffer. (The push model
 * is the `render:loop:tick` event; this is the complementary "read the last N"
 * view.)
 */
interface FrameStats {
    /** Number of samples the stats were computed over. */
    count: number;
    /** Median FPS across the window (`1000 / p50Ms`). */
    fps: number;
    /** Median frame time (ms). */
    p50Ms: number;
    /** 95th-percentile frame time (ms) — the "typical worst" frame. */
    p95Ms: number;
    /** Worst single frame time (ms) in the window — the dip. */
    maxMs: number;
    /** Count of long (jank) frames in the window. */
    dropped: number;
}

/**
 * Renderer-free **theme state** for the kernel — the fully-**resolved** theme the
 * engine publishes and theme-aware layers recolour from. Relocated from the
 * engine (`@invana/canvas`); roles are plain `string` keys → colour numbers (the
 * named `ColorRole` vocabulary stays in `@invana/graph`).
 *
 * Two distinct things, don't conflate them:
 * - **Authored theme config** (registry / active family / mode / accent) lives in
 *   `view.definition.theme` (serialisable, synced).
 * - **The resolved theme** below is the *derived* output a `ThemeBehaviour`
 *   computes from that config + mode, and publishes via {@link ThemeState.set}.
 */
/** The concrete kind a theme mode resolves to. */
type ThemeKind = 'light' | 'dark';
/** Mode selector. `'system'` follows the host `prefers-color-scheme`; the rest pin. */
type ThemeMode = 'system' | 'light' | 'dark';
/** A fully-resolved theme — every role already a colour number. Plain JSON; no pixi. */
interface ResolvedTheme {
    readonly kind: ThemeKind;
    /** Opaque family name (`'default'` | `'forest'` | …) — meaningful to the app, not the kernel. */
    readonly name: string;
    /** Role name → `0xRRGGBB`. The engine theme has no role *enum*; roles are strings. */
    readonly palette: Readonly<Record<string, number>>;
    /** Optional fill-by-category ramp (consumed by colour-by-label / minimap). */
    readonly categorical?: readonly number[];
}
/** The theme channel — read the current resolved theme, or set (and broadcast) a new one. */
interface ThemeState {
    /** The current resolved theme, or `null` before the first {@link set}. */
    current(): ResolvedTheme | null;
    /** Store + broadcast a resolved theme (emits `theme:change`). */
    set(theme: ResolvedTheme): void;
}
/**
 * The **inherit sentinel** — the value a themed colour option carries to mean
 * *"resolve me from the active theme's palette"* rather than pinning a colour.
 *
 * It exists because a single-tier option has no other way to say it. An option
 * that is simply absent falls back to a hardcoded default; an option holding a
 * colour pins that colour. `'inherit'` is the third state, and it is the one
 * that should usually be the *default*:
 *
 * | Value | Meaning |
 * |---|---|
 * | `'inherit'` | Follow the palette role the surface declares. Recolours on every `theme:change` |
 * | `0x0f172a` / `'#0f172a'` | Pinned by the author. The theme never touches it |
 *
 * **Config vocabulary, never spec vocabulary.** `'inherit'` is legal in a
 * serialisable *option* and is resolved — via {@link resolveThemed} — at the
 * moment a surface paints. It must never reach a renderer spec: the renderer
 * sees numbers, always.
 *
 * Cascading surfaces don't need it. Where a value already resolves through
 * tiers (a graph node's style: layer template → per-type binding → per-node →
 * state), **absence already means inherit**, exactly as in CSS, and the theme
 * belongs in a tier *below* the author rather than in a sentinel.
 *
 * @see rfc:feat-2026-09-11-a-colour-is-either-themed-or-manual-never-both
 */
declare const INHERIT = "inherit";
/** The literal type of {@link INHERIT}. */
type Inherit = typeof INHERIT;
/**
 * A themed option: either a concrete value of `T` (pinned by the author) or
 * {@link INHERIT} (resolved from the palette). Resolve with
 * {@link resolveThemed}.
 */
type Themed<T> = T | Inherit;
/** Narrow a themed option to the {@link INHERIT} sentinel. */
declare function isInherit(value: unknown): value is Inherit;
/**
 * Resolve a themed colour option against a published palette.
 *
 * A concrete value passes through untouched — an author-set colour always wins
 * over the theme, and keeps winning across theme switches. {@link INHERIT}
 * reads the first of `roles` the palette actually carries, falling back to
 * `fallback` when no theme has been published yet or the palette omits every
 * role (which is what the single-layer `ThemeBehaviour` shorthand's empty
 * palette does).
 *
 * @param value    The option as authored — a colour, or {@link INHERIT}.
 * @param palette  The active `ResolvedTheme.palette`, or `null` before the first publish.
 * @param roles    Role name, or names tried in order (e.g. `['divider', 'stroke']`).
 * @param fallback Used when `value` is `'inherit'` and no role resolves.
 *
 * @example
 * ```ts
 * // `backgroundColor` defaults to 'inherit' → follows the theme's `surface`
 * const fill = resolveThemed(opts.backgroundColor, theme?.palette, 'surface', '#f8fafc');
 * ```
 */
declare function resolveThemed<T>(value: Themed<T>, palette: Readonly<Record<string, number>> | null | undefined, roles: string | readonly string[], fallback: T): T | number;

/** Who emitted an event. */
type EventSourceKind = 'canvas' | 'layer' | 'behaviour' | 'layout' | 'store' | 'data';
/** The emitting instance — `kind` + its id. */
interface EventSource {
    kind: EventSourceKind;
    id: string;
}
/**
 * A structured event envelope as seen on the **tap** channel: the type, a
 * timestamp, the source instance, and the payload. One tap subscriber reading
 * these reconstructs the whole loop (input → state change → render) for telemetry
 * and collaboration.
 */
interface CanvasEvent<P = unknown> {
    type: string;
    timestamp: number;
    source: EventSource;
    payload: P;
}
/** The default source for bus-level emits with no explicit origin. */
declare const CANVAS_SOURCE: EventSource;

/**
 * The canvas-wide event map. Consumers (engine, domain) **augment** this via
 * declaration merging — `declare module '@invana/canvas-core' { interface
 * CanvasGlobalEvents { 'shape:click': … } }` — so new events are typed without
 * touching the core.
 */
interface CanvasGlobalEvents {
    /**
     * A `view`-store mutation, bridged onto the bus (see `createCanvasStore`).
     * `durationMs` is the update's produce+commit wall-clock cost, when the store
     * reports it — so a tap can attribute time without a separate telemetry sink.
     */
    'state:change': {
        action?: string;
        changedPaths: string[];
        durationMs?: number;
    };
    /** A `layer` data flush (nodes/edges/groups/annotations delta), bridged onto the bus. */
    'data:flush': {
        layerId: string;
        delta: LayerFlush;
    };
    /**
     * One layer's coalesced **spec** changes — the visual description, ids only.
     * Domain-free by construction: a renderer subscribes to this and never learns
     * what a node or an edge is. See `docs/renderer-split-design.md` §4.2b.
     */
    'specs:flush': {
        layerId: string;
        delta: SpecFlush;
    };
    /** A named data **intent** — one per data action (audit / collab), distinct from the per-frame flush. */
    'data:intent': {
        action: string;
        layerId: string;
        ids: readonly string[];
    };
    'scene:layer:add': {
        id: string;
    };
    'scene:layer:remove': {
        id: string;
    };
    /**
     * A layer's whole-layer `visible` flag changed via `Layer.setVisible`. Lets
     * dependent layers (e.g. a `MiniMapLayer` mirroring a source graph) react
     * without polling. `visible` is the post-change value.
     */
    'scene:layer:visibilitychange': {
        id: string;
        visible: boolean;
    };
    'scene:behaviour:register': {
        id: string;
    };
    /**
     * A behaviour was removed via `BehaviourRegistry.unregister` (or `clear`).
     * Fires after `scene:behaviour:disable` (when it was enabled) and after the
     * behaviour is destroyed — the counterpart of `scene:layer:remove`.
     */
    'scene:behaviour:unregister': {
        id: string;
    };
    'scene:behaviour:enable': {
        id: string;
    };
    'scene:behaviour:disable': {
        id: string;
    };
    'scene:layout:add': {
        id: string;
    };
    'scene:layout:remove': {
        id: string;
    };
    'input:node:click': {
        layerId: string;
        id: string;
        x: number;
        y: number;
    };
    'input:node:hover': {
        layerId: string;
        id: string | null;
    };
    'input:node:drag:start': {
        layerId: string;
        id: string;
    };
    'input:node:drag:end': {
        layerId: string;
        id: string;
    };
    'input:background:click': {
        x: number;
        y: number;
    };
    'input:background:contextmenu': {
        x: number;
        y: number;
    };
    /**
     * A pan **gesture** reported by the renderer (drag / keyboard / inertia) —
     * gesture *intent*, distinct from the resulting `view.interaction.camera` change
     * (a `state:change`). `x`/`y` are the world-origin offset the camera settled on.
     */
    'input:camera:pan': {
        x: number;
        y: number;
    };
    /** A zoom **gesture** reported by the renderer (wheel / pinch). `scale` is the resolved uniform zoom; `center*` the screen pivot. */
    'input:camera:zoom': {
        scale: number;
        centerX: number;
        centerY: number;
    };
    /** A layout run started. `nodeCount`/`edgeCount`/`animate` describe the run when the producer knows them. */
    'layout:run:start': {
        id: string;
        layerId: string;
        nodeCount?: number;
        edgeCount?: number;
        animate?: boolean;
        /** The run was asked to leave the camera alone (`LayoutRunOptions.preserveCamera`). */
        preserveCamera?: boolean;
        /** The run frames itself (`LayoutRunOptions.fitCamera`) — other fitters stand down. */
        fitCamera?: boolean;
    };
    /** A layout run ended. `reason` distinguishes a natural settle from an external stop / abort. */
    'layout:run:end': {
        id: string;
        layerId: string;
        reason?: 'settled' | 'stopped' | 'cancelled';
        /** The run was asked to leave the camera alone (`LayoutRunOptions.preserveCamera`). */
        preserveCamera?: boolean;
        /** The run frames itself (`LayoutRunOptions.fitCamera`) — other fitters stand down. */
        fitCamera?: boolean;
    };
    'layout:run:tick': {
        id: string;
        progress?: number;
        preserveCamera?: boolean;
        fitCamera?: boolean;
    };
    'canvas:renderer:ready': {
        backend: string;
        capabilities?: Record<string, unknown>;
    };
    /**
     * The active renderer crashed at **render time** and the engine has halted its
     * render loop. Emitted once (experimental WebGPU only — see
     * `CanvasOptions.preference`); the consumer should tear the canvas down and
     * re-init on `to` (WebGL). `reason` is a short diagnostic tag.
     */
    'canvas:renderer:fallback': {
        from: string;
        to: string;
        reason?: string;
    };
    /**
     * One measured engine frame — emitted once per `Canvas.tickOnce`. Carries the
     * inter-frame period, per-phase CPU breakdown, and the attributed
     * {@link InteractionKind}, so a tap can drive an FPS trace + attribute dips to
     * the gesture that caused them. See {@link FrameTick}.
     */
    'render:loop:tick': FrameTick;
    /** The shared status-message channel. `text: null` clears; `timeout` (ms) auto-clears. */
    'canvas:message:show': {
        text: string | null;
        timeout?: number;
    };
    /** A tap dropped an event (filtered or sampled out) — diagnostic. */
    'tap:dropped': {
        type: string;
        reason: 'excluded' | 'sampled';
    };
    'theme:change': ResolvedTheme;
}
/**
 * The granular **`<domain>:<subject>:<action>`** types (`view:layer:setStyle`,
 * `data:node:add`, …) are open-ended — emitted via {@link CanvasEventBus.publish}
 * (they ride on the tap, keyed by the action label) rather than enumerated here.
 * The map above types the **finite, engine-emitted** events for `on()`/`emit()`.
 */
/** Per-tap filters. */
interface TapOptions {
    /** Event `type`s to drop from this tap. */
    exclude?: readonly string[];
    /** Fraction (0..1) of events to forward — cheap sampling for costly sinks. */
    sampleRate?: number;
}
/** A tap receives every emission as a structured {@link CanvasEvent}. */
type Tap = (event: CanvasEvent) => void;
/**
 * Canvas-wide event bus: typed `on`/`emit` for known events, **plus a tap
 * channel** that receives every emission (typed *and* forwarded scoped events) as
 * a structured {@link CanvasEvent}. The tap is the single place telemetry /
 * collaboration observe the whole stream — `bus.tap(e => sink(e))`.
 *
 * Renderer-free: the engine wires pixi pointer events *into* this; the bus knows
 * nothing about pixi.
 */
declare class CanvasEventBus {
    private readonly emitter;
    private readonly taps;
    private readonly now;
    private readonly rand;
    constructor(opts?: {
        now?: () => number;
        random?: () => number;
    });
    /** Subscribe to a typed global event. Returns an unsubscribe fn (or use {@link off}). */
    on<K extends keyof CanvasGlobalEvents>(type: K, listener: Listener<CanvasGlobalEvents[K]>): () => void;
    /** Remove a previously-registered typed listener (the {@link on} handler by reference). */
    off<K extends keyof CanvasGlobalEvents>(type: K, listener: Listener<CanvasGlobalEvents[K]>): void;
    /** Emit a typed global event — reaches typed listeners and the tap channel. */
    emit<K extends keyof CanvasGlobalEvents>(type: K, payload: CanvasGlobalEvents[K], source?: EventSource): void;
    /**
     * Forward a **scoped / foreign** event (not in {@link CanvasGlobalEvents}) to the
     * tap channel only — used by {@link SourceEmitter} so a store/layer/behaviour's
     * own events reach the canvas tap without being global-bus types.
     */
    publish(type: string, payload: unknown, source: EventSource): void;
    private toTaps;
    /** Subscribe to the whole event stream (structured envelopes). */
    tap(fn: Tap, opts?: TapOptions): () => void;
    clearTaps(): void;
    removeAllListeners(): void;
}

/**
 * The default {@link ThemeState} — holds the current {@link ResolvedTheme} and
 * broadcasts `theme:change` on the bus whenever it is {@link set}. Renderer-free;
 * a single publisher (the domain `ThemeBehaviour`) resolves authored config →
 * `ResolvedTheme` and calls {@link set}. Theme-aware layers subscribe to
 * `theme:change` (or read {@link current}) and recolour.
 */
declare class CanvasThemeState implements ThemeState {
    private readonly bus;
    private _current;
    constructor(bus: CanvasEventBus);
    current(): ResolvedTheme | null;
    set(theme: ResolvedTheme): void;
}

/**
 * `DataSource` — the kernel's contract for a **bulk data store** owned by
 * `CanvasStore.data[id]` (decision **D13**: *interface, not inheritance* — see
 * `docs/canvas-store-d13-data-ownership.md`).
 *
 * The kernel owns sources behind this interface **without knowing their domain**:
 * - the default {@link LayerData} satisfies it out of the box, and
 * - a domain store (e.g. `@invana/graph`'s `GraphStore`) *implements* it and is
 *   registered via `CanvasStore.setSource(id, source)`.
 *
 * Only the three members the kernel needs to **own + bridge** a source live here;
 * everything domain-specific (positions fast-path, adjacency, hierarchy, presence)
 * stays off the interface. `CanvasStore` subscribes each source's {@link onFlush}
 * and re-emits it as a coarse `data:flush` on the bus (telemetry / collab); the
 * domain renderer subscribes to the source directly for targeted updates.
 */
interface DataSource {
    /** Subscribe to the coalesced per-frame change delta. Returns an unsubscribe. */
    onFlush(listener: (delta: LayerFlush) => void): () => void;
    /** Choose **when** the coalesced flush fires; the engine drives `'manual'`. */
    setFlushMode(mode: FlushMode): void;
    /** Drain pending changes now (the engine's single rAF loop calls this once/frame). */
    flush(): void;
}

/**
 * A single change operation — structurally identical to immer's `Patch`, but
 * declared here so the port contract has **zero dependencies, even at the type
 * level**. The store engine (`@invana/canvas-store`) produces immer patches;
 * they satisfy this shape verbatim, and this shape satisfies immer's
 * `applyPatches` input. Do not add fields immer doesn't emit.
 */
interface Patch {
    op: 'replace' | 'add' | 'remove';
    path: (string | number)[];
    value?: unknown;
}
/**
 * The library-agnostic state contract. Consumers program against this — never
 * against zustand (or, later, Yjs) directly — so the backend stays swappable.
 *
 * Two write forms, both declarative at the seam:
 * - an **immer recipe** `(draft) => void` that reads like a direct mutation, or
 * - a **deep-partial patch** object that is deep-merged in.
 *
 * Either way `update` produces immer **patches + inverse patches**, which is what
 * lets telemetry, history/undo, and a future CRDT adapter all hang off the one seam.
 */
interface ReactiveStore<T> {
    /** Current state snapshot (structurally shared; treat as immutable). */
    getState(): T;
    /** Apply a recipe or a deep-partial patch, with an optional named action. */
    update(update: Update<T>, action?: string): void;
    /** Fires on every change with the new + previous state. */
    subscribe(listener: (state: T, prev: T) => void): () => void;
    /** Richer change stream (action + immer patches) — for telemetry / history. */
    subscribeChanges(listener: (change: StoreChange<T>) => void): () => void;
    /** Run `fn`'s writes as one coalesced change (one notification, one history step). */
    batch(run: () => void, action?: string): void;
}
/** An immer recipe — mutate the draft; the produced state is structurally shared. */
type Recipe<T> = (draft: T) => void;
/** A write: either a recipe (mutate the draft) or a declarative deep-partial patch. */
type Update<T> = Recipe<T> | DeepPartial<T>;
/** What a change carries — the load-bearing payload for telemetry/history/CRDT. */
interface StoreChange<T> {
    state: T;
    prev: T;
    action?: string;
    /** immer forward patches (apply to `prev` → `state`). */
    patches: Patch[];
    /** immer inverse patches (apply to `state` → `prev` — i.e. undo). */
    inverse: Patch[];
    /** Wall-clock ms the update/batch took (produce + commit) — telemetry / tracing. */
    durationMs?: number;
}
type Primitive = string | number | boolean | bigint | symbol | null | undefined;
/**
 * Deep-partial that **stops at** sets / maps / arrays / functions — those are
 * replaced wholesale, matching the runtime deep-merge (and `CanvasConfig`'s
 * shallow-replace semantics). So `{ interaction: { selection: newSet } }` swaps
 * the set rather than trying to partial-merge its internals.
 */
type DeepPartial<T> = T extends Primitive ? T : T extends ReadonlySet<unknown> ? T : T extends ReadonlyMap<unknown, unknown> ? T : T extends ReadonlyArray<unknown> ? T : T extends (...args: never[]) => unknown ? T : {
    [K in keyof T]?: DeepPartial<T[K]>;
};
/**
 * A minimal state cell an adapter supplies — the only thing that differs between
 * backends. `createStoreFromCell` builds the full {@link ReactiveStore} on top, so
 * the change/patch/batch logic is shared and identical across adapters.
 */
interface StateCell<T> {
    get(): T;
    /** Replace state; must notify state listeners with (next, prev). */
    set(next: T): void;
    subscribe(listener: (state: T, prev: T) => void): () => void;
}

/**
 * Easing functions consumed by `Tween`. Each is a pure `(t: number) => number`
 * where `t ∈ [0, 1]` is normalised progress and the return value is the eased
 * progress (also typically in `[0, 1]`, though overshoot easings may exceed).
 *
 * Naming follows the standard easing taxonomy (Penner et al). Add new entries
 * here rather than inline-defining easings in effect / decoration code so the
 * set stays consistent across animated primitives.
 */
type Easing = (t: number) => number;
declare const linear: Easing;
declare const easeInOutSine: Easing;
declare const easeOutCubic: Easing;
declare const easeInOutCubic: Easing;
declare const easeOutQuad: Easing;
/**
 * Stable string keys for the built-in easings.
 *
 * Serializable easing handle — use this (not an `Easing` function) anywhere an
 * easing must live in JSON config or bind to a `<select>` / lil-gui dropdown
 * (e.g. a layout's `transitionEase`). Resolve to the function with
 * {@link resolveEasing}.
 */
type EasingName = 'linear' | 'easeInOutSine' | 'easeOutCubic' | 'easeInOutCubic' | 'easeOutQuad';
/** All built-in easing names — handy for populating a picker. */
declare const EASING_NAMES: EasingName[];
/**
 * Resolve an {@link EasingName} (or `undefined`) to its `Easing` function,
 * falling back to `fallback` (default {@link easeOutCubic}) for an unknown or
 * missing name. Lets config carry a serializable easing key while runtime code
 * gets the function.
 */
declare function resolveEasing(name: EasingName | undefined, fallback?: Easing): Easing;

/**
 * Control panels — floating UI chrome inside the canvas, as **pure data**.
 *
 * A control panel is a small toolbar / widget cluster pinned over the canvas
 * (zoom buttons bottom-right, a brand + mode picker top-left, …). Its spec lives
 * in `CanvasView.definition.controlPanels`, so panels persist, export and
 * (later) sync like every other part of the definition. Edits are ordinary
 * `view` patches: a Studio edit (`canvas.update(…, 'edit:control-panels')`) is
 * recorded by `Canvas.history` and undone by the `history.undo` command, while a
 * programmatic write (a `<ControlPanel>` mount) is not.
 *
 * Specs hold **no closures and no components**: an item names what it does by
 * string — a `command` (resolved by the canvas's `CommandRegistry`), an `icon`
 * and a `widget` (resolved by the UI kit's registries), or a `slot` (non-persisted
 * React content registered by the declaring component). The kernel only stores
 * and validates the shape; drawing it is the UI kit's job.
 */
/** A preset anchor on the canvas's 9-point grid. */
type ControlPanelAnchor = 'top-left' | 'top' | 'top-right' | 'left' | 'center' | 'right' | 'bottom-left' | 'bottom' | 'bottom-right';
/**
 * Exact insets from the canvas edges, in px or any CSS length. Set one of
 * `top`/`bottom` and one of `left`/`right` (setting both opposite sides
 * stretches the panel between them).
 */
interface ControlPanelInsets {
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;
}
/** Where a panel sits: a preset {@link ControlPanelAnchor} or exact {@link ControlPanelInsets}. */
type ControlPanelPosition = ControlPanelAnchor | ControlPanelInsets;
/** Fields shared by every {@link ControlItemSpec}. */
interface ControlItemBase {
    /** Stable key within the panel; defaults to the item's index. */
    key?: string;
}
/**
 * A button that runs a named command on click. Disabled while the command is
 * missing or reports `isEnabled() === false`.
 *
 * Unlike a {@link ControlToggleItemSpec} it never shows a pressed state, but it
 * may still **swap its face** while the command's `isActive(args)` is true — the
 * `active*` fields below. That's a Run button that turns into Stop while a
 * layout runs (`layout.toggle`), or an Erase button that reads "Selection"
 * while something is selected (`graph.erase`).
 */
interface ControlCommandItemSpec extends ControlItemBase {
    type: 'command';
    /** Command name in the canvas's `CommandRegistry`, e.g. `'camera.fit'`. */
    command: string;
    /** Arguments passed to the command's `run` / `isEnabled`. Must be JSON. */
    args?: unknown;
    /** Icon name, resolved by the UI kit's icon registry (e.g. `'maximize'`). */
    icon?: string;
    /** Tooltip + accessible label. */
    label: string;
    /** Optional visible text beside the icon. */
    text?: string;
    /** Icon name while the command is active. Defaults to {@link icon}. */
    activeIcon?: string;
    /** Tooltip + label while the command is active. Defaults to {@link label}. */
    activeLabel?: string;
    /** Visible text while the command is active. Defaults to {@link text}. */
    activeText?: string;
}
/**
 * A two-state toggle bound to a command: its active state is the command's
 * `isActive(args)`, and clicking runs the command (which flips it).
 */
interface ControlToggleItemSpec extends ControlItemBase {
    type: 'toggle';
    /** Command name in the canvas's `CommandRegistry`, e.g. `'view.lock'`. */
    command: string;
    /** Arguments passed to the command's `run` / `isActive` / `isEnabled`. Must be JSON. */
    args?: unknown;
    /** Icon name while inactive (and while active, unless {@link activeIcon} is set). */
    icon?: string;
    /** Icon name while active. */
    activeIcon?: string;
    /** Tooltip + label while inactive. */
    label: string;
    /** Tooltip + label while active. Defaults to {@link label}. */
    activeLabel?: string;
}
/** One option of a {@link ControlChoiceItemSpec}. */
interface ControlChoiceOption {
    /** Passed to the command as `args.value` when picked. */
    value: string;
    /** Human label. */
    label: string;
    /** Icon name, resolved by the UI kit's icon registry. */
    icon?: string;
}
/**
 * A pick-one control (select mode, edge type, active layout) bound to a command
 * that reports a `value`. Picking an option runs the command with
 * `{ ...args, value }`.
 */
interface ControlChoiceItemSpec extends ControlItemBase {
    type: 'choice';
    /** Command name in the canvas's `CommandRegistry`, e.g. `'select.mode'`. */
    command: string;
    /** Arguments passed to the command (plus `value` when picking). Must be JSON. */
    args?: Record<string, unknown>;
    /** Trigger label + menu heading. */
    label: string;
    /** The options. Default: the command's own `options()`. */
    options?: ControlChoiceOption[];
    /** A collapsed dropdown (default) or every option inline as a segmented group. */
    display?: 'dropdown' | 'segmented';
}
/** A named widget from the UI kit's widget registry (e.g. `'zoom-readout'`). */
interface ControlWidgetItemSpec extends ControlItemBase {
    type: 'widget';
    /** Widget name in the UI kit's widget registry. */
    widget: string;
    /** Widget options. Must be JSON. */
    options?: Record<string, unknown>;
}
/** A group separator. */
interface ControlDividerItemSpec extends ControlItemBase {
    type: 'divider';
}
/** Static text (a brand, a caption). */
interface ControlTextItemSpec extends ControlItemBase {
    type: 'text';
    text: string;
}
/**
 * A placeholder for **non-persisted** React content, registered at runtime under
 * {@link slot} (the declaring component's `children` use the panel id). Exported
 * state keeps the placeholder; a canvas that never registers the slot renders
 * nothing there.
 */
interface ControlSlotItemSpec extends ControlItemBase {
    type: 'slot';
    /** Slot name in the runtime slot registry. */
    slot: string;
}
/** One item in a {@link ControlPanelSpec} — pure JSON, resolved by name at render time. */
type ControlItemSpec = ControlCommandItemSpec | ControlToggleItemSpec | ControlChoiceItemSpec | ControlWidgetItemSpec | ControlDividerItemSpec | ControlTextItemSpec | ControlSlotItemSpec;
/**
 * Which surface draws a panel. `'canvas'` floats it over the canvas (the
 * `position` / `offset` / `stretch` fields place it there). The `header-*` and
 * `footer-*` placements put it in a region of the app shell's header or footer
 * rail instead — `GraphCanvasApp`'s left / centre / right — where it flows
 * inline after that region's own content: `position`, `offset` and `stretch`
 * are ignored, it is always a row, and `surface` defaults to `false`. A shell
 * that doesn't draw a rail ignores panels placed in it.
 */
type ControlPanelPlacement = 'canvas' | 'header-left' | 'header-center' | 'header-right' | 'footer-left' | 'footer-center' | 'footer-right';
/**
 * A control panel — pure JSON, stored in `CanvasView.definition.controlPanels`
 * keyed by panel id. Floats over the canvas by default; {@link placement} can
 * put it in the app header or footer instead.
 */
interface ControlPanelSpec {
    /** Stable discriminator for tooling (the Studio's editor lookup). */
    kind: 'control-panel';
    /**
     * The surface that draws the panel. Default `'canvas'`. A header / footer
     * placement is drawn by a host that renders those rail regions
     * (`GraphCanvasApp`, or `<RegionControlPanels>` in a custom shell);
     * `<ControlPanels>` skips it.
     */
    placement?: ControlPanelPlacement;
    /** Where the panel sits over the canvas. Default `'top-left'`. Ignored for a header / footer placement. */
    position?: ControlPanelPosition;
    /**
     * Distance from the anchored edges for a preset {@link position}, in px —
     * one number for both axes or `{ x, y }`. Ignored for insets and header / footer
     * placements. Default `8`.
     */
    offset?: number | {
        x: number;
        y: number;
    };
    /**
     * Item flow. Default: `'vertical'` for the `left` / `right` anchors,
     * `'horizontal'` everywhere else.
     */
    orientation?: 'horizontal' | 'vertical';
    /**
     * Stretch along the anchored edge — full height for `left` / `right`, full
     * width for `top` / `bottom`. Ignored for corners, `center` and insets.
     * Default `false`.
     */
    stretch?: boolean;
    /** Draw the card surface (background, border, shadow). Default `true` over the canvas, `false` in a header / footer rail. */
    surface?: boolean;
    /** Show the panel. Default `true`. */
    visible?: boolean;
    /** The panel's items, in order. */
    items: ControlItemSpec[];
}

/**
 * The operation-log vocabulary — what the canvas records (history) and what a
 * playbook replays (steps). Types only: the log itself (`createOperationLog`)
 * lives in `@invana/canvas-store`, the one data door (`GraphStore.applyDelta`)
 * in `@invana/graph`.
 *
 * Two directions, never mixed (RFC
 * `docs/rfcs/feat/2026-09-28-an-analysis-cannot-be-recorded-or-replayed.md`,
 * D-7):
 *
 * - **History = record.** {@link OperationLog} is written only by the canvas —
 *   view patches from the reactive store and data ops from each registered
 *   {@link DataOpAdapter} — and carries a free-text `actor` on every
 *   {@link LogEntry}. {@link HistoryView} is its read + undo surface
 *   (`canvas.history`).
 * - **Playbook = script.** A list of JSON {@link StepSpec}s; playing one calls
 *   the ordinary canvas methods, and history records the result like any other
 *   change.
 */

/**
 * A **view** share of a change: reactive-store patches plus their inverse.
 * `undoable: false` marks view intent that is recorded but skipped by plain
 * undo (selection, focus) — a step, or `revertTo`, still reverts it.
 */
interface ViewLogPart {
    kind: 'view';
    /** The action the store change carried (e.g. `'edit:control-panels'`). */
    action?: string;
    /** Forward patches (apply to the state before → the state after). */
    patches: Patch[];
    /** Inverse patches (apply to the state after → the state before). */
    inverse: Patch[];
    /** Whether plain undo / redo applies this part. */
    undoable: boolean;
}
/**
 * A **data** share of a change: ops against one registered data source, in
 * application order. The ops are opaque to the log — the source's
 * {@link DataOpAdapter} knows how to replay them (a graph source records its
 * `HistoryOp`s).
 */
interface DataLogPart {
    kind: 'data';
    /** Which {@link DataOpAdapter} replays these ops. */
    sourceId: string;
    /** Ops in application order. Undo replays their inverses in reverse. */
    ops: unknown[];
}
/** One source's share of a change. A single {@link LogEntry} can hold both kinds. */
type LogPart = ViewLogPart | DataLogPart;
/**
 * One history entry — one undo step. Kept for the life of the canvas (no
 * limit); `clear()` runs only when a new canvas state loads.
 */
interface LogEntry {
    /** Stable id, unique within the log. */
    id: string;
    /** When the entry was recorded (or last merged into), in `performance.now()` ms. */
    at: number;
    /**
     * Who made the change — free text (`'user'`, `'user:ravi'`, `'engine'`,
     * `'assistant'`, `'feed:twitter'`). Defaults to the canvas's session actor.
     */
    actor: string;
    /** Human label: a playbook step's title, a graph transaction's label (`'paste'`). */
    title?: string;
    /** Set when a playbook step produced the entry (or adopted it — `Playbook.addStep` of a `sinceLastStep` result). */
    stepId?: string;
    /**
     * Set on a **streamed** entry — writes made with `applyDelta(delta, { coalesce: true })`,
     * merged into one open entry per actor (RFC G12). Plain undo steps over it;
     * a playbook's `revertTo` / `replayTo` still applies it.
     */
    coalesced?: true;
    /** The parts, in the order they were recorded. */
    parts: LogPart[];
}
/** Filter for {@link OperationLog.entries}. Absent fields match everything. */
interface LogEntryFilter {
    actor?: string;
    stepId?: string;
}
/** What {@link HistoryView.peekUndo} / {@link HistoryView.peekRedo} report about an entry. */
interface LogStepInfo {
    /** The action of the entry's first view part, when it has one. */
    action?: string;
    /** The entry's title, when it has one. */
    title?: string;
    /** The entry's actor. */
    actor: string;
    /** When the entry was recorded. */
    at: number;
}
/**
 * The one shape data changes take — `GraphStore.applyDelta`'s argument, and a
 * playbook step's `data`. Applied in this order: `removed` (edges, then nodes,
 * cascading), `added` (nodes, then edges; an existing id merges), `updated`
 * (nodes, then edges), then `hidden`, `shown` and `pinned`. Unknown ids are
 * skipped.
 *
 * Generic over the record types so the vocabulary stays domain-free; a graph
 * source instantiates it with its node / edge records.
 */
interface Delta<N extends {
    id: string;
} = {
    id: string;
}, E extends {
    id: string;
} = {
    id: string;
}> {
    added?: {
        nodes?: readonly N[];
        edges?: readonly E[];
    };
    updated?: {
        nodes?: ReadonlyArray<{
            id: string;
            patch: Partial<N>;
        }>;
        edges?: ReadonlyArray<{
            id: string;
            patch: Partial<E>;
        }>;
    };
    removed?: {
        nodeIds?: readonly string[];
        edgeIds?: readonly string[];
    };
    /** Set the explicit hidden flag on these ids. */
    hidden?: {
        nodeIds?: readonly string[];
        edgeIds?: readonly string[];
    };
    /** Clear the explicit hidden flag on these ids. */
    shown?: {
        nodeIds?: readonly string[];
        edgeIds?: readonly string[];
    };
    /**
     * Pin (default) or unpin nodes. `x` / `y`, when both are given, also move the
     * node there — a drag's final position.
     */
    pinned?: ReadonlyArray<{
        id: string;
        pinned?: boolean;
        x?: number;
        y?: number;
    }>;
}
/**
 * A record in a playbook step's {@link Delta}: an id plus whatever fields the
 * source's records carry (`type`, `data`, `source` / `target` …). Open, because
 * the vocabulary is domain-free; the source checks the shape when it applies.
 */
type DeltaRecord = {
    id: string;
} & Record<string, unknown>;
/** Options for a recorded data write (`applyDelta(delta, opts)`). */
interface DeltaOptions {
    /** Who the history entry is attributed to. Default: the canvas's session actor. */
    actor?: string;
    /** The history entry's label (`'paste'`, `'delete selection'`), shown by undo menus and `peekUndo`. */
    title?: string;
    /**
     * Streamed write (a live feed): merge into the actor's **open** streamed
     * entry instead of making a new one. Within it, an add and a later remove
     * of the same id cancel. Plain undo steps over streamed entries; any other
     * entry, a playbook step, an undo / redo or a clear seals the open one, so
     * the next streamed write starts a new entry (RFC D-14, G12).
     *
     * Hosts should hold feed ticks while `!history.atLatest()` — a streamed
     * entry recorded while undone entries wait to be redone sits before them.
     */
    coalesce?: boolean;
}
/**
 * A data source the log can replay: it applies its own recorded ops forward or
 * backward. Registered with {@link OperationLog.registerSource}; replay runs
 * with recording suspended, so the source's writes during it are not recorded
 * again.
 */
interface DataOpAdapter {
    /** Matches {@link DataLogPart.sourceId}. */
    readonly sourceId: string;
    /** Re-apply `ops` in order (`'forward'`) or their inverses in reverse (`'back'`). */
    applyOps(ops: readonly unknown[], direction: 'forward' | 'back'): void;
    /**
     * The source's one recorded data door (a graph store's `applyDelta`). A
     * playbook step's `data` goes through it. Absent ⇒ the source takes no
     * steps.
     */
    applyDelta?(delta: Delta, opts?: DeltaOptions): void;
    /** Whether the source holds an element with this id — a step's view ids are checked against it. */
    hasElement?(id: string): boolean;
    /**
     * The **net** change `ops` make, as a {@link Delta}: an add and a later
     * remove of the same id cancel, updates fold into one patch per id, the last
     * hide / show wins. `HistoryView.sinceLastStep` builds a step's `data` with
     * it. Absent ⇒ the source's entries contribute no `data`.
     */
    toDelta?(ops: readonly unknown[]): Delta<DeltaRecord, DeltaRecord>;
    /**
     * Compact an op list that will be replayed as one unit — used when streamed
     * writes merge ({@link DeltaOptions.coalesce}): an element added and removed
     * within `ops` drops out, with every op on it in between. Must replay
     * (forward and back) to the same states as `ops`. Absent ⇒ ops are kept
     * as recorded.
     */
    compact?(ops: readonly unknown[]): unknown[];
}
/** Where an entry id stands in the log: applied, waiting to be redone, or not (or no longer) in it. */
type LogEntryStatus = 'applied' | 'pending' | 'unknown';
/** Metadata for {@link OperationLog.group}. */
interface LogGroupMeta {
    title?: string;
    actor?: string;
    stepId?: string;
}
/**
 * The one operation log behind `canvas.history`. **Written only by the canvas**
 * — the view store's change stream and each data source's recorded writes; a
 * consumer reads it through {@link HistoryView}.
 *
 * Undo is linear across actors (D-10): it takes back the newest undoable entry,
 * whoever made it. Entries with no undoable part (a selection change) are kept
 * in the record but stepped over. A change after an undo keeps the undone
 * entries as a side branch rather than discarding them.
 */
interface OperationLog {
    /** Register a data source for replay. Returns the unregister. */
    registerSource(adapter: DataOpAdapter): () => void;
    /** The registered source with this id, or `undefined`. */
    source(sourceId: string): DataOpAdapter | undefined;
    /**
     * Where `entryId` stands: `'applied'`, `'pending'` (undone, waiting to be
     * redone) or `'unknown'` (never recorded, or moved to a side branch by a
     * change after an undo). A playbook asks before replaying a step's entries.
     */
    status(entryId: string): LogEntryStatus;
    /**
     * Record already-applied data ops as one part. Outside a {@link group} it is
     * its own entry; inside, it joins the open one. Dropped while the log is
     * replaying. With `opts.coalesce` (outside a group) the ops merge into the
     * actor's open streamed entry — see {@link DeltaOptions.coalesce}.
     */
    recordData(sourceId: string, ops: readonly unknown[], actor?: string, opts?: {
        coalesce?: boolean;
    }): void;
    /**
     * Mark applied entries as belonging to a playbook step — how
     * `Playbook.addStep` adopts a `sinceLastStep` result: its entries become the
     * step's, without being re-run. Ids not in the applied record are ignored.
     */
    tagStep(entryIds: readonly string[], meta: {
        stepId: string;
        title?: string;
    }): void;
    /**
     * Run `fn`; everything recorded meanwhile becomes one entry. Nested groups
     * merge. **All or nothing:** if `fn` throws, what it recorded is reverted,
     * no entry is kept, and the error is rethrown.
     */
    group<T>(meta: LogGroupMeta, fn: () => T): T;
    /** Whether the log is applying entries (undo / redo / revertTo / replayTo) right now. */
    readonly replaying: boolean;
    undo(): void;
    redo(): void;
    canUndo(): boolean;
    canRedo(): boolean;
    peekUndo(): LogStepInfo | undefined;
    peekRedo(): LogStepInfo | undefined;
    /** Revert every applied entry after `entryId` (`null` = back to the start), every part included. */
    revertTo(entryId: string | null): void;
    /** Re-apply recorded entries up to and including `entryId`, every part included. */
    replayTo(entryId: string): void;
    /** True when no recorded entry is waiting to be redone. */
    atLatest(): boolean;
    /** The applied entries, oldest first, optionally filtered. */
    entries(filter?: LogEntryFilter): readonly LogEntry[];
    /** Hear every new entry. Returns the unsubscribe. */
    onEntry(listener: (entry: LogEntry) => void): () => void;
    /** Hear every change to the log (record / merge / undo / redo / clear). Returns the unsubscribe. */
    subscribe(listener: () => void): () => void;
    /** Drop every entry and branch. Runs when a new canvas state loads. */
    clear(): void;
    /** Stop recording and release subscriptions. */
    dispose(): void;
}
/**
 * `canvas.history` — the record. Undo / redo as before, plus who-did-what reads.
 * Nobody writes to it: entries come from the canvas's own writes.
 */
interface HistoryView {
    undo(): void;
    redo(): void;
    canUndo(): boolean;
    canRedo(): boolean;
    /** The entry {@link undo} would revert, or `undefined`. */
    peekUndo(): LogStepInfo | undefined;
    /** The entry {@link redo} would re-apply, or `undefined`. */
    peekRedo(): LogStepInfo | undefined;
    /** The applied entries, oldest first, optionally filtered by actor / step. */
    entries(filter?: LogEntryFilter): readonly LogEntry[];
    /** Hear every new entry (e.g. to send a user's changes back to the engine). */
    onEntry(listener: (entry: LogEntry) => void): () => void;
    /** True when no recorded entry is waiting to be redone. */
    atLatest(): boolean;
    /**
     * The work done since the last playbook step, **as a step** (RFC F14, D-13):
     * every applied entry after the newest one carrying a `stepId` (or from the
     * start), summarised —
     *
     * - `data`: the net delta per source (an add then a remove cancels);
     * - `settings`: the definition values those entries changed, as a
     *   `canvas.update` patch holding their current values;
     * - `view`: the current selection / focus / inspect / camera intent, for
     *   the slices those entries changed.
     *
     * Pass the returned object to `playbook.addStep` to make the work a step:
     * it **adopts** the recorded entries rather than playing them again (only
     * while they are still the newest; otherwise, or for a copy of the object,
     * it is added as an ordinary step). Returns a step with no fields besides
     * `id` / `title` when nothing was done. Reading it changes nothing.
     *
     * @typeParam S The settings patch shape — `CanvasConfig` on a `Canvas`.
     */
    sinceLastStep<S = Record<string, unknown>>(title: string): StepSpec<S>;
    /**
     * What one entry did to the data, **per source**: each data part's ops as
     * that source's net {@link Delta} (its {@link DataOpAdapter.toDelta}). A
     * source without `toDelta`, or whose ops net to nothing, is left out; an
     * entry holding only view parts returns `[]`. For display (a history
     * panel's "+3 nodes · −1 edge"); reading it changes nothing.
     */
    entryData(entry: LogEntry): ReadonlyArray<{
        sourceId: string;
        delta: Delta<DeltaRecord, DeltaRecord>;
    }>;
    /** Hear every change (record / undo / redo / clear). Returns the unsubscribe. */
    subscribe(listener: () => void): () => void;
    /** Drop every entry. */
    clear(): void;
    /** Stop recording and release subscriptions. */
    dispose(): void;
}
/** Where a step points the camera: its focus, every visible node, or everything. */
type CameraIntent = 'focus' | 'visible' | 'all';
/**
 * One playbook step — what should happen, as plain JSON. Ids and values only;
 * no functions, no rules. The Invana engine answers prompts in this format.
 *
 * @typeParam S The settings patch shape — `CanvasConfig` in `@invana/canvas`.
 */
interface StepSpec<S = Record<string, unknown>> {
    id: string;
    title: string;
    /** Who the resulting history entry is attributed to. */
    actor?: string;
    /** Presenter text. */
    narration?: string;
    /** The engine's own data; never read by the canvas. */
    meta?: unknown;
    /** Data source id; defaults to the playbook's. */
    source?: string;
    /** Exactly `applyDelta`'s argument, with the source's records as plain JSON. */
    data?: Delta<DeltaRecord, DeltaRecord>;
    /** Exactly `canvas.update`'s argument. */
    settings?: S;
    view?: {
        /** Selected ids; `[]` clears. */
        select?: string[];
        /** Highlighted ids, the rest optionally dimmed; `null` clears. */
        focus?: {
            ids: string[];
            dim?: boolean;
        } | null;
        /** The node whose properties are open; `null` closes. */
        inspect?: string | null;
        camera?: CameraIntent;
    };
    /** Rare verbs that leave no state (export, redraw), run after the rest. */
    do?: Array<{
        command: string;
        args?: Record<string, unknown>;
    }>;
}
/** A saved playbook: the script, nothing more. */
interface PlaybookSpec<S = Record<string, unknown>> {
    version: 1;
    title: string;
    /** Default data source id for its steps. */
    source?: string;
    steps: StepSpec<S>[];
}
/**
 * `canvas.playbook` — a list of {@link StepSpec}s and a position. `addStep` only
 * appends; moving to a step plays it (or replays / reverts its recorded entries).
 */
interface Playbook<S = Record<string, unknown>> {
    /** The script's title (from {@link load}, else `'Playbook'`). */
    readonly title: string;
    readonly steps: readonly StepSpec<S>[];
    /** The step the canvas is at, or `undefined` before the first. */
    readonly current: StepSpec<S> | undefined;
    /** Index of {@link current} in {@link steps}; `-1` before the first. */
    readonly index: number;
    /**
     * Append to the list; the canvas does not change. Returns the step id.
     * Throws on a duplicate id.
     *
     * A step returned by `history.sinceLastStep` is **adopted** instead when its
     * entries are still the newest and the playbook is at its last step: the
     * work is already on the canvas, so its entries are tagged with the step's
     * id, the step counts as played, and the position moves to it — `previous`
     * reverts that work like any played step.
     */
    addStep(spec: StepSpec<S>): string;
    /**
     * Play the next step — or replay it, when it was played and then stepped
     * back over. Rejects (writing nothing) when the step fails validation.
     * Resolves once its `do` verbs finished and the canvas settled.
     */
    next(): Promise<void>;
    /** Revert the current step's recorded entries and move back one. */
    previous(): Promise<void>;
    /** Move to `stepId`, playing / reverting every step in between. */
    goTo(stepId: string): Promise<void>;
    toJSON(): PlaybookSpec<S>;
    /** Replace the list; the canvas does not change. */
    load(doc: PlaybookSpec<S>): Promise<void>;
    /** Hear every change to the list or the position. Returns the unsubscribe. */
    subscribe(listener: () => void): () => void;
}

/**
 * `CanvasView` — the reactive, observable, syncable half of `CanvasStore`: how a
 * visualisation is **defined**, **viewed**, and its small transient **runtime**
 * status. Small + human-rate → it lives on a {@link ReactiveStore}. Bulk data
 * (nodes/edges/positions) is the **other** half (`CanvasStore.data`, typed-array,
 * never reactive).
 *
 * Three compartments, three sync physics (see `docs/canvas-state-plan.md` §9):
 * - **`definition`** — "what it IS": persisted, converges (a CRDT doc later).
 * - **`interaction`** — "the live view": ephemeral / per-user (Awareness later).
 * - **`runtime`** — small observable transient status (layout run, message):
 *   reactive so UIs can react, but **never synced**.
 *
 * Per-instance option bags are intentionally loose (`Record<string, unknown>`) at
 * this layer — the engine and the schema-driven editors give them concrete shape,
 * and the kernel stays domain-free (it treats element `style` as opaque).
 */
interface CanvasView {
    /** "What the visualisation IS" — persisted, converged (a CRDT doc later). */
    definition: {
        /** Canvas/scene-level config (background, zoom limits, world bounds, …). */
        canvas: CanvasSceneOptions;
        /** Layer options keyed by instance id (a rendering layer binds a data source). */
        layers: Record<string, Record<string, unknown>>;
        /** Behaviour options keyed by instance id. `enabled` is explicit (rule 7). */
        behaviours: Record<string, Record<string, unknown>>;
        /** Layout options keyed by instance id. */
        layouts: Record<string, Record<string, unknown>>;
        /** Id of the active layout among {@link layouts}, or `null`. */
        activeLayout: string | null;
        /** Authored node/edge templates (designer output). */
        templates: unknown[];
        /** Theme **config** (registry + active family + mode + accent). The *resolved* theme is derived. */
        theme: Record<string, unknown>;
        /**
         * Floating control panels over the canvas, keyed by panel id. Pure JSON —
         * items name commands / icons / widgets by string (see {@link ControlPanelSpec}).
         */
        controlPanels: Record<string, ControlPanelSpec>;
    };
    /** "The live view onto it" — mostly ephemeral / per-user (Awareness later). */
    interaction: {
        /** The semantic selection set (D11 — owned here, not in a behaviour). */
        selection: ReadonlySet<string>;
        /** Hovered element id, or `null`. */
        hover: string | null;
        /** Visual state sets (highlighted / context-open / …) keyed by state name (presence overlay). */
        states: Record<string, ReadonlySet<string>>;
        /**
         * Elements lifted above their peers, keyed by the **source** that lifted
         * them (a behaviour id) — so independent sources (hover, selection, …)
         * never clobber each other's set, and each can be cleared on its own.
         *
         * The renderer projects the union of every source onto its own paint order
         * and lowers anything absent from it. That single projection is what keeps
         * the lift honest: a raise is *derived from state*, not a side effect, so
         * it self-corrects when the state that motivated it changes (an element
         * stops being hovered, a frame opens and becomes a backdrop, …). Before,
         * each behaviour reparented display objects imperatively and tracked what
         * it had touched privately — nothing could reconcile them, so a stale lift
         * outranked the whole scene until that behaviour happened to run again.
         *
         * Ids only: the kernel stays domain-free. What an id *means* (a frame
         * lifting its contents instead of itself, say) is the renderer's business.
         */
        raised: Record<string, ReadonlySet<string>>;
        /** Abstract camera transform — renderer-agnostic; throttled/ephemeral. */
        camera: CameraTransform$1;
        /**
         * Focal-emphasis: the highlight set + whether the rest is dimmed. O(1) to set;
         * "muted" is a render-time derivation (`dim && !ids.has(id)`), not a per-node
         * write (see `canvas-state-plan.md` §7.1B). `null` when no focus is active.
         */
        focus: {
            ids: ReadonlySet<string>;
            dim: boolean;
        } | null;
        /**
         * The element whose properties are open (a node or edge id), or `null`.
         * Written by a playbook step, the assistant or a panel; a property-view
         * behaviour (`ClickViewBehaviour`) follows it and writes it back when the
         * user opens or closes one. Recorded as view intent — plain undo steps
         * over it.
         */
        inspect: string | null;
        /**
         * The latest request to frame the camera — `'focus'` (the focus set),
         * `'visible'` (every visible element) or `'all'` (all content, hidden
         * included) — or `null` before any. An **intent, not pixels** (RFC D-4):
         * whoever owns that framing performs it once the canvas settles (the
         * engine frames `'visible'` / `'all'`, `FocusBehaviour` frames `'focus'`).
         * `seq` increases on every request, so asking for the same intent twice
         * frames twice. Recorded as view intent — plain undo steps over it.
         */
        cameraIntent: {
            intent: CameraIntent;
            seq: number;
        } | null;
        /**
         * Nodes transiently locked during a drag/resize gesture — held against the
         * layout for the gesture's duration. **Distinct from data `pinned`** (the
         * permanent, synced user flag); these are ephemeral and never synced.
         */
        transientPins: ReadonlySet<string>;
        /**
         * Active interaction mode — the modeller "tool" (`'select'`, `'add'`,
         * `'connect'`, `'delete'`, or any string a host defines). Per-user and
         * ephemeral like the rest of `interaction`. Behaviours opt into following it
         * through `BehaviourOptions.modes`; commands switch it (`tool.active`).
         * Seeded from `definition.canvas.defaultViewMode` when a canvas starts.
         */
        viewMode: string;
        /**
         * Parameters of the active mode, as plain strings keyed by name — e.g.
         * `{ nodeKind: 'circle' }` for an "add node" tool. A bag rather than typed
         * fields so the kernel stays domain-free: what a key means is the
         * business of whoever reads it (the graph's `tool.nodeKind` command).
         */
        viewModeArgs: Readonly<Record<string, string>>;
    };
    /** Small observable transient status — reactive (UIs react) but **never synced**. */
    runtime: {
        /** Layout run status — drives spinners / a stop control. */
        layout: {
            running: boolean;
            /** The layout id currently executing, or `null`. */
            activeId: string | null;
            /** Whether the run animates its settle (force sim) vs jumps to final positions. */
            animate: boolean;
            /** 0..1 progress when known (force `alpha`); `null` for one-shot / unknown. */
            progress: number | null;
        };
        /** Transient overlay/status message, or `null`. */
        message: string | null;
    };
}
/**
 * Canvas/scene-level configuration — the settings that sit *above* individual
 * layers/behaviours/layouts. Renderer-init options (`preference`, `antialias`,
 * `resolution`, …) are deliberately **not** here: those belong to the renderer
 * adapter, not the syncable definition.
 */
interface CanvasSceneOptions {
    /** Scene background colour (`0xRRGGBB`). */
    backgroundColor?: number;
    /** Suppress the browser's native context menu over the canvas. */
    suppressBrowserContextMenu?: boolean;
    /** Zoom clamp for the abstract camera. */
    zoom: {
        min: number;
        max: number;
    };
    /** Initial camera transform applied on load. */
    initialCamera?: CameraTransform$1;
    /** Optional world/scene bounds (for fit-on-load / clamping), or `null`. */
    worldBounds?: Rect | null;
    /** Default interaction mode the view starts in. */
    defaultViewMode?: string;
    /**
     * Frame the camera on the content once on load. See
     * `CanvasConfig.fitOnLoad`.
     */
    fitOnLoad?: boolean;
    /**
     * Ease the first auto-fit instead of snapping to it. See
     * `CanvasConfig.fitAnimation`.
     */
    fitAnimation?: {
        durationMs?: number;
        easing?: EasingName;
    };
    /**
     * Fade the world content in once, the first time it is worth showing. See
     * `CanvasConfig.entrance`.
     */
    entrance?: {
        kind: 'fade';
        durationMs?: number;
        easing?: EasingName;
    };
}
/** The empty-but-valid initial {@link CanvasView}. */
declare function defaultCanvasView(): CanvasView;

/** Loose option/patch bag for the view's per-instance config. */
type Bag = Record<string, unknown>;
/** Partial camera transform. */
type CameraInput = Partial<{
    x: number;
    y: number;
    zoom: number;
}>;
/**
 * `createActions` — the **named, action-typed command API** over the kernel.
 *
 * Every mutation is a discoverable method (not a raw `view.update(recipe, …)`),
 * and each **bakes in its action label** (`'view:layer:setStyle'`, `'view:camera:zoom'`, …),
 * so telemetry, history, and the CRDT op-log all read as intent. View commands go
 * through the one `view.update(recipe, action)` seam; data commands proxy to the
 * target {@link LayerData}.
 *
 * Group by concern: `node / edge / group / annotation / positions` (data) and
 * `layers / behaviours / layouts / camera / selection / hover / viewMode / templates /
 * theme / controlPanels` (view).
 *
 * ⚠ **Data actions target the default {@link LayerData} store only.** The
 * injected `layer(id)` accessor (see `createCanvasStore`) **throws** for any id
 * where a *custom* {@link DataSource} was registered via `setSource` — e.g.
 * `@invana/graph`'s `GraphStore`. For those, mutate through the domain store's
 * own API (`store.source(id)` / the layer's methods) instead. Unifying the data
 * actions over the `DataSource` interface is future work — audited and
 * deliberately deferred 2026-08-13 (the contract would need write methods it
 * doesn't carry today).
 */
declare function createActions(view: ReactiveStore<CanvasView>, layer: (id: string) => LayerData, events: CanvasEventBus): {
    node: {
        add: (l: string, n: NodeRecord) => void;
        update: (l: string, id: string, patch: Partial<NodeRecord>) => void;
        remove: (l: string, id: string) => void;
        moveTo: (l: string, id: string, x: number, y: number) => void;
    };
    edge: {
        add: (l: string, e: EdgeRecord) => void;
        update: (l: string, id: string, patch: Partial<EdgeRecord>) => void;
        remove: (l: string, id: string) => void;
    };
    group: {
        add: (l: string, g: GroupRecord) => void;
        update: (l: string, id: string, patch: Partial<GroupRecord>) => void;
        remove: (l: string, id: string) => void;
    };
    annotation: {
        add: (l: string, a: AnnotationRecord) => void;
        update: (l: string, id: string, patch: Partial<AnnotationRecord>) => void;
        remove: (l: string, id: string) => void;
    };
    /** Bulk layout output → node positions (transform-only re-render). */
    positions: {
        apply: (l: string, positions: Iterable<{
            id: string;
            x: number;
            y: number;
        }>) => void;
    };
    layers: {
        add: (id: string, opts: Bag) => void;
        update: (id: string, patch: Bag) => void;
        setStyle: (id: string, style: Bag) => void;
        setVisible: (id: string, visible: boolean) => void;
        remove: (id: string) => void;
    };
    behaviours: {
        add: (id: string, opts: Bag) => void;
        update: (id: string, patch: Bag) => void;
        enable: (id: string) => void;
        disable: (id: string) => void;
        remove: (id: string) => void;
    };
    layouts: {
        set: (id: string, opts: Bag) => void;
        tune: (id: string, patch: Bag) => void;
        run: (id: string) => void;
        remove: (id: string) => void;
    };
    camera: {
        set: (c: CameraInput) => void;
        pan: (dx: number, dy: number) => void;
        zoom: (factor: number) => void;
        zoomTo: (zoom: number) => void;
        reset: () => void;
    };
    selection: {
        set: (ids: Iterable<string>) => void;
        add: (ids: Iterable<string>) => void;
        toggle: (id: string) => void;
        clear: () => void;
    };
    hover: {
        set: (id: string) => void;
        clear: () => void;
    };
    /**
     * Paint-order lift, per source. `source` is the id of whatever is asking
     * (a behaviour id) — each owns its own set, so a hover lift and a selection
     * lift coexist and either can be dropped without disturbing the other.
     * The renderer projects the union; see `CanvasView.interaction.raised`.
     */
    raise: {
        set: (source: string, ids: Iterable<string>) => void;
        clear: (source: string) => void;
    };
    viewMode: {
        /**
         * Switch the active mode. `args`, when given, **replaces** the mode's
         * parameters; omit it to keep the current ones (a tool's node kind
         * survives a trip through Select).
         */
        set: (mode: string, args?: Readonly<Record<string, string>>) => void;
        /** Shallow-merge `patch` into the mode parameters. */
        setArgs: (patch: Readonly<Record<string, string>>) => void;
    };
    templates: {
        create: (template: unknown) => void;
        update: (id: string, patch: Bag) => void;
        remove: (id: string) => void;
    };
    controlPanels: {
        /** Add (or replace) the panel `id`. */
        add: (id: string, spec: ControlPanelSpec) => void;
        /** Shallow-merge `patch` into panel `id` (`items` replaces). No-op when absent. */
        update: (id: string, patch: Partial<ControlPanelSpec>) => void;
        show: (id: string) => void;
        hide: (id: string) => void;
        remove: (id: string) => void;
    };
    theme: {
        set: (patch: Bag) => void;
    };
    scene: {
        set: (patch: Partial<CanvasSceneOptions>) => void;
        setBackground: (backgroundColor: number) => void;
        setZoomLimits: (min: number, max: number) => void;
    };
    layoutStatus: {
        begin: (id: string, animate?: boolean) => void;
        progress: (progress: number) => void;
        end: () => void;
    };
    message: {
        show: (text: string) => void;
        clear: () => void;
    };
    focus: {
        set: (ids: Iterable<string>, dim?: boolean) => void;
        clear: () => void;
    };
    inspect: {
        set: (id: string) => void;
        clear: () => void;
    };
    cameraIntent: {
        /** Ask for a framing; the owner performs it once the canvas settles. */
        request: (intent: CameraIntent) => void;
    };
    transientPins: {
        add: (ids: Iterable<string>) => void;
        remove: (ids: Iterable<string>) => void;
        clear: () => void;
    };
};
/** The named, action-typed command API (see {@link createActions}). */
type CanvasActions = ReturnType<typeof createActions>;

/**
 * `CanvasStore` — the **contract** of the renderer-free store, one per `Canvas`.
 * The single hub the engine writes to *and* subscribes from:
 *
 * - {@link CanvasStore.view} — reactive `ReactiveStore<CanvasView>` (config + interaction state).
 * - {@link CanvasStore.data} — owned, keyed `LayerData` stores (the bulk graph).
 * - {@link CanvasStore.events} — the canvas-wide `CanvasEventBus` (tap channel for
 *   telemetry / collaboration).
 *
 * The **implementation** (`createCanvasStore` — the zustand/immer-backed factory,
 * the state↔bus bridges, telemetry wiring) lives in `@invana/canvas-store`; this
 * package holds only the shape, so contracts and abstracts (`CanvasContext`,
 * `Camera`) can type against the store without depending on the machinery.
 */

interface CanvasStore {
    /** Reactive config + interaction store (layers/behaviours/layouts settings, interaction). */
    readonly view: ReactiveStore<CanvasView>;
    /** Owned data, keyed by **source** id (D13 — each a {@link DataSource}). */
    readonly data: Record<string, DataSource>;
    /**
     * Owned **spec** collections, keyed by layer id — the durable visual
     * description each renderer projects. Populated via {@link specsFor}.
     */
    readonly specs: Record<string, SpecStore>;
    /** Canvas-wide event bus + tap channel (state:change + data:flush). */
    readonly events: CanvasEventBus;
    /** Resolved-theme channel (`theme.current()` / `theme.set(...)` → `theme:change`). */
    readonly theme: CanvasThemeState;
    /**
     * Register a domain {@link DataSource} under `id` (D13) — e.g. `@invana/graph`'s
     * `GraphStore`. Its {@link DataSource.onFlush} is bridged onto {@link events} as
     * `data:flush`. Replaces any source previously registered (or lazily created) for `id`.
     */
    setSource(id: string, source: DataSource): void;
    /** The {@link DataSource} registered for `id`, or `undefined`. */
    source(id: string): DataSource | undefined;
    /**
     * Get (lazily creating) the **default** {@link LayerData} for `id`; its flush is
     * bridged onto {@link events}. Throws if a non-`LayerData` source was registered
     * for `id` via {@link setSource} — use {@link source} / {@link data} for those.
     */
    layer(id: string): LayerData;
    /**
     * Get (lazily creating) the {@link SpecStore} for layer `id`; its flush is
     * bridged onto {@link events} as `specs:flush`.
     */
    specsFor<T extends object = object>(id: string): SpecStore<T>;
    /** Named, action-typed command API (`actions.layers.setStyle`, `actions.camera.zoom`, …). */
    readonly actions: CanvasActions;
}

/**
 * `ICameraBinding` — the renderer's half of the camera.
 *
 * {@link Camera} is the engine's pan/zoom facade: it owns the semantics
 * (clamping, anchored zoom, fit-to-rect, bus events, store sync) and holds no
 * backend type. The *concrete* viewport — a `pixi-viewport` `Viewport` today, an
 * orthographic three.js camera later — sits behind this interface.
 *
 * Everything here is expressed in engine vocabulary: an abstract
 * `{ x, y, zoom }` transform, screen↔world projection, and **semantic** input
 * config (`percent`, `modifier`) rather than a plugin registry. The mapping from
 * `modifier` to physical key codes, and from an input to whatever the backend
 * calls its pan/zoom machinery, belongs to the implementation
 * (`docs/renderer-split-design.md` §5, P6).
 *
 * The split is what lets `Camera` be tested with no GPU, and what lets P6 move
 * the pixi realisation into `@invana/renderer-pixijs` without touching a single
 * camera-input behaviour.
 */

/** An absolute transform: world (0,0) sits at `(x, y)` screen px, uniform `zoom`. */
interface CameraTransformValue {
    x: number;
    y: number;
    zoom: number;
}
/**
 * A modifier key an input gesture can be gated on. Semantic on purpose — the
 * binding maps these to whatever key codes its backend wants.
 *
 * `space` is a held key rather than a true modifier, but it gates drag-pan the
 * same way (Figma / Sketch style), so it rides the same vocabulary.
 */
type CameraInputModifier = 'control' | 'shift' | 'alt' | 'meta' | 'space';
/** Drag-pan input configuration. */
interface DragInputOptions {
    /** Which mouse buttons drag the canvas. Default `'left'`. */
    mouseButtons?: 'all' | 'left' | 'right' | 'middle';
    /**
     * Require this key to be held for a drag to pan, leaving plain drag to other
     * gestures (lasso, brush, …). `null` / omitted = no modifier.
     */
    modifier?: CameraInputModifier | null;
    /** Momentum glide after the pointer lifts. Default `true`. */
    decelerate?: boolean;
}
/** Wheel-zoom input configuration. */
interface WheelInputOptions {
    /** Zoom fraction per wheel tick. Default `0.1` (10%). */
    percent?: number;
    /** Smooth-scroll frame count; `false` = instant snap. Default `false`. */
    smooth?: false | number;
    /**
     * Require this modifier to be held for the wheel to zoom, leaving plain
     * scroll to the page. `null` / omitted = no modifier.
     */
    modifier?: CameraInputModifier | null;
    /** Treat a two-finger trackpad pinch as zoom rather than scroll. Default `true`. */
    trackpadPinch?: boolean;
}
/** Pinch-zoom input configuration. */
interface PinchInputOptions {
    /** Suppress the implicit pan that accompanies a pinch. Default `false`. */
    noDrag?: boolean;
    /** Zoom speed multiplier. Default `0.1`. */
    percent?: number;
}
/**
 * Patch for camera input. An omitted key leaves that input untouched; `null`
 * removes it.
 */
interface CameraInputConfig {
    wheel?: WheelInputOptions | null;
    pinch?: PinchInputOptions | null;
    drag?: DragInputOptions | null;
}
/** What moved, when a binding reports a backend-driven transform change. */
type CameraChangeKind = 'pan' | 'zoom';
interface ICameraBinding {
    /** The current transform, read straight from the backend viewport. */
    getTransform(): CameraTransformValue;
    /**
     * Write the transform verbatim — no clamping, no re-anchoring. `Camera` has
     * already applied its own semantics; this is the raw write.
     *
     * Must **not** re-report through {@link onTransformChange}: `Camera` knows it
     * made this change and emits its own events, so an echo would double-fire.
     */
    setTransform(t: CameraTransformValue): void;
    /**
     * Zoom about the viewport centre, keeping the centre world point fixed. Split
     * out from {@link setTransform} because backends implement centre-anchored
     * zoom themselves and their arithmetic is what users' muscle memory expects.
     */
    zoomToCentre(zoom: number): void;
    /** Viewport size changed (CSS px). */
    resize(screenWidth: number, screenHeight: number): void;
    toWorld(screenX: number, screenY: number): Point;
    toScreen(worldX: number, worldY: number): Point;
    /** The world-space rectangle currently visible. */
    getVisibleBounds(): Rect;
    /**
     * Install / replace / remove the backend's own pan and zoom inputs. Patch
     * semantics: an omitted key is untouched, `null` removes that input.
     */
    configureInput(config: CameraInputConfig): void;
    /**
     * Suspend or restore drag-panning without tearing it down — how gesture
     * arbitration yields the camera. Momentum is deliberately left running so an
     * in-flight glide finishes.
     */
    setDragSuspended(suspended: boolean): void;
    /**
     * Subscribe to transform changes the **backend** made on its own — a wheel
     * tick, a drag, a momentum glide. Changes `Camera` initiates never arrive
     * here. Returns an unsubscribe function.
     */
    onTransformChange(fn: (kind: CameraChangeKind) => void): () => void;
    /**
     * Subscribe to the start of a drag-pan, fired once the pointer has moved
     * enough to pan. Returns an unsubscribe function.
     */
    onDragStart(fn: () => void): () => void;
    /** Advance time-based input animation (momentum, snap). Driven by the engine's clock. */
    tick(dtMs: number): void;
}

/**
 * `Camera` — the engine's pan/zoom/projection facade.
 *
 * Architecture: see `architecture-proposal.md` §2.4 (CanvasContext.camera) and
 * §2.6 (camera input is a Behaviour, not a hard-coded gesture).
 *
 * **Design notes**
 *
 * - **No backend type crosses this class.** The concrete viewport lives behind
 *   {@link ICameraBinding} — `PixiViewportBinding` today, an orthographic
 *   three.js camera later. Camera owns the *semantics* (clamping, anchored zoom,
 *   fit-to-rect, bus events, store sync); the binding owns the realisation
 *   (`docs/renderer-split-design.md` §9, P5/P6).
 * - The Camera owns no input gestures — those live in opt-in camera-input
 *   `Behaviour`s (proposal §2.6). They configure inputs through
 *   {@link Camera.configureInput} / {@link Camera.setDragSuspended} /
 *   {@link Camera.onDragStart}, described semantically (`percent`, `modifier`),
 *   so a behaviour never names a plugin.
 * - The **binding is the single source of truth** for the transform: Camera
 *   reads it back rather than caching, so a gesture driven inside the backend
 *   and a programmatic `pan()` can't drift apart.
 * - Coordinate model (uniform scale, no rotation):
 *
 *     screen.x = world.x * scale + tx
 *     screen.y = world.y * scale + ty
 *     world.x  = (screen.x - tx) / scale
 *     world.y  = (screen.y - ty) / scale
 *
 *   We deliberately keep `scale.x === scale.y` (no anisotropic zoom) and no
 *   rotation. Both are enforceable as needed.
 *
 * - Events are emitted on the canvas-wide `CanvasEventBus`:
 *   `camera:zoom`, `camera:pan`. They flow through the tap channel so
 *   telemetry sees every camera change.
 */

/** An absolute camera transform — world (0,0) at `(x, y)` screen px, uniform `zoom`. */
type CameraTransform = CameraTransformValue;
interface CameraOptions {
    /**
     * The renderer's viewport, behind the pixi-free {@link ICameraBinding} seam.
     * Created by the renderer (`Canvas` wires `PixiViewportBinding` today).
     */
    binding: ICameraBinding;
    /** Initial viewport size in CSS pixels. Mirrors the binding's own screen size for projection math. */
    screenWidth: number;
    screenHeight: number;
    /** Optional bus for `input:camera:zoom` / `input:camera:pan` events. */
    bus?: CanvasEventBus;
    /**
     * Optional kernel store. When present, the camera keeps
     * `store.view.interaction.camera` (the abstract `{x,y,zoom}` transform) in sync
     * with the binding **both ways** — gestures/mutators push into the store,
     * and external `actions.camera.*` writes apply to the binding.
     */
    store?: CanvasStore;
    /** Initial uniform scale. Default 1. */
    initialScale?: number;
    /** Initial world-container offset (= where world (0,0) lives in screen pixels). Default (0,0). */
    initialX?: number;
    initialY?: number;
    /** Min / max zoom clamp. Defaults: 0.01 .. 100. */
    minScale?: number;
    maxScale?: number;
}
declare class Camera {
    /**
     * The renderer's viewport, behind the pixi-free binding seam. **Private** —
     * nothing outside this class reaches the backend, which is what lets P6 move
     * the realisation into `@invana/renderer-pixijs` without a public break.
     */
    private readonly binding;
    private readonly bus?;
    private _screenWidth;
    private _screenHeight;
    private readonly _minScale;
    private readonly _maxScale;
    /** Kernel store (optional) — the home of the abstract `interaction.camera` transform. */
    private readonly store?;
    /** Re-entrancy guard so binding↔store sync never ping-pongs. */
    private _syncing;
    /** Unsubscribe for the `interaction.camera` slice subscription. */
    private _offStoreCam?;
    /** Unsubscribe for the binding's backend-driven transform reports. */
    private _offBindingChange?;
    /** Whether drag-panning is currently yielded to another gesture owner. */
    private _dragSuspended;
    /**
     * In-flight {@link animateTo} tween, or `null`. Holds the endpoints and the
     * eased progress; {@link tick} advances it and writes the interpolated
     * transform through {@link binding} directly, bypassing the public mutators
     * so it cannot cancel itself.
     */
    private _fitTween;
    constructor(opts: CameraOptions);
    /**
     * Push the current transform into `store.view.interaction.camera`. Called from
     * every camera mutation (gesture + programmatic). No-op when the store already
     * matches or a store→binding apply is in flight.
     */
    private pushToStore;
    /**
     * Apply `store.view.interaction.camera` onto the binding — realises an external
     * `actions.camera.*` write. No-op when the binding already matches or a
     * binding→store push is in flight.
     */
    private applyFromStore;
    /** Current uniform scale. */
    get scale(): number;
    /** Current world-container x in screen pixels. (Where world (0,0) sits.) */
    get x(): number;
    get y(): number;
    get screenWidth(): number;
    get screenHeight(): number;
    /**
     * Set absolute world-container offset. `(x, y)` is where world (0,0) lives
     * in screen pixels. Most consumers want `pan(dx, dy)` instead.
     */
    setPosition(x: number, y: number): void;
    /** Pan by `(dx, dy)` screen pixels. */
    pan(dx: number, dy: number): void;
    /**
     * Write an absolute `{ x, y, zoom }` transform in one step — the seam for a
     * layer mirroring an **external** camera authority (a MapLibre basemap, a
     * remote collaborator's viewport, a replayed session).
     *
     * Unlike `setZoom` + `setPosition`, this re-anchors nothing: the transform
     * lands exactly as given, because the external authority has already solved
     * for it and any re-anchoring here would desync the two views. `zoom` is
     * emitted only when it actually changed — most mirrored gestures are pan-only
     * and the `input:camera:zoom` listeners are O(N) over their tracked elements.
     *
     * @param t      The transform to apply.
     * @param opts.clamp  Apply the camera's min/max zoom clamp. Default `true`.
     *   Pass `false` when mirroring an authority with its own scale range — a web
     *   mercator basemap runs to `2 ** 22`, far past the camera's default ceiling
     *   of 100, and clamping would silently peg the canvas away from the map.
     */
    setTransform(t: CameraTransform, opts?: {
        clamp?: boolean;
    }): void;
    /**
     * Set absolute scale, anchored at the viewport centre. The world point at
     * the centre stays put. For zoom-around-an-arbitrary-point semantics use
     * `zoomAt`.
     */
    setZoom(scale: number): void;
    /**
     * Multiply scale by `factor`, holding the world point under the screen
     * cursor `(centerX, centerY)` in place. Default centre = viewport centre.
     *
     * Bindings offer only centre-anchored zoom, so the arbitrary-anchor math is
     * done here: project the anchor to world, change scale, then translate so the
     * same world point lands at the same screen point.
     */
    zoomAt(factor: number, centerX?: number, centerY?: number): void;
    /**
     * Fit a world-space rectangle into the viewport. Scales so the whole rect
     * is visible (limited by the smaller axis), centres it. `padding` is in
     * screen pixels around the rect.
     */
    fitContent(worldRect: Rect | null | undefined, padding?: number): void;
    /**
     * Centre the viewport on a world-space point — pan so `(worldX, worldY)`
     * maps to the screen centre, keeping the current zoom. The pan-only
     * counterpart to {@link fitContent}: use it for "focus" / "go to" actions
     * that should locate a target without rescaling the view.
     *
     * By default the pan is applied at once. Pass a positive `durationMs` to
     * glide there instead — the move then runs through {@link animateTo}, so it
     * follows the same rules: eased, and cancelled by any other camera write.
     *
     * @param durationMs Length of the glide. Absent or `<= 0` pans immediately.
     * @param easing     Named curve for the glide; defaults to `'easeOutCubic'`.
     * @param onDone     Called once the camera is on target (immediately when
     *                   not gliding; never when a glide is cancelled).
     */
    centerOn(worldX: number, worldY: number, { durationMs, easing, onDone }?: {
        durationMs?: number;
        easing?: EasingName;
        onDone?: () => void;
    }): void;
    /** Update on viewport resize. Forwarded so the binding's own math stays correct. */
    resize(screenWidth: number, screenHeight: number): void;
    /** Screen → world. */
    toWorld(screenX: number, screenY: number): Point;
    /** World → screen. */
    toScreen(worldX: number, worldY: number): Point;
    /**
     * The world-space rectangle currently visible. Used by viewport culling
     * (per `decorations-plan.md` §11.6) and minimap layers.
     */
    getVisibleBounds(): Rect;
    /**
     * Configure the camera's own pan / zoom inputs. This is the seam camera-input
     * behaviours use instead of naming a backend plugin: the options are described
     * semantically (`percent`, `modifier`) and the realisation lives in the
     * binding, so `DragPanBehaviour` / `WheelZoomBehaviour` / `PinchZoomBehaviour`
     * survive the renderer swap unchanged.
     *
     * Patch semantics — an omitted key is left alone, `null` removes that input:
     *
     * ```ts
     * camera.configureInput({ wheel: { percent: 0.2, modifier: 'control' } });
     * camera.configureInput({ wheel: null });   // wheel zoom off, pinch untouched
     * ```
     *
     * Re-configuring an already-installed input replaces it, because the
     * underlying inputs read their config only at install time.
     */
    configureInput(config: CameraInputConfig): void;
    /**
     * Suspend / restore drag-panning without tearing the input down. This is how
     * gesture arbitration yields the camera: while another behaviour owns the
     * pointer (a node drag, a lasso, a resize) panning is suspended, and it
     * resumes when that gesture releases.
     *
     * Momentum is deliberately left running, so an in-flight glide finishes as it
     * always has. Edge-triggered — restoring resets the underlying input, so a
     * repeated call in the same state is a no-op.
     */
    setDragSuspended(suspended: boolean): void;
    /**
     * Subscribe to the start of a drag-pan gesture — fired once the pointer has
     * actually moved enough to pan. `DragPanBehaviour` uses it as the cursor
     * fallback for the `space` modifier, which can't be read off a pointer event.
     *
     * @returns an unsubscribe function.
     */
    onDragStart(fn: () => void): () => void;
    /**
     * Ease the camera to an absolute transform over `durationMs`, instead of
     * snapping to it.
     *
     * The animated counterpart of {@link setTransform}, and the mechanism behind
     * `CanvasConfig.fitAnimation`: the first auto-fit of a canvas can glide into
     * frame rather than cutting. `x`, `y` and `zoom` are interpolated together on
     * one eased curve, so the move reads as a single gesture.
     *
     * **Any other camera write cancels it.** A user who pans or zooms mid-glide
     * owns the camera from that moment — an animation that fought back would be
     * the `fitOnResize` mistake in a different costume (`D7`). The tween is also
     * dropped, not finished, so `onDone` does not fire.
     *
     * Requires {@link tick} to be called each frame, which `Canvas.tickOnce` does.
     *
     * @param to         Target transform. `zoom` is clamped like any other write.
     * @param durationMs Length of the glide. `<= 0` applies `to` immediately.
     * @param easing     Named curve; defaults to `'easeOutCubic'`.
     * @param onDone     Called once the glide completes naturally.
     */
    animateTo(to: CameraTransform, { durationMs, easing, onDone }?: {
        durationMs?: number;
        easing?: EasingName;
        onDone?: () => void;
    }): void;
    /**
     * Drop an in-flight {@link animateTo} without finishing it. Called by every
     * public transform mutator, so whoever writes last owns the camera.
     */
    cancelAnimation(): void;
    /** Whether an {@link animateTo} glide is currently running. */
    get isAnimating(): boolean;
    /**
     * Advance time-based input animation (momentum, snap). Called by
     * `Canvas.tickOnce()` every frame — the engine owns the only clock (G3).
     * No-op until a camera-input behaviour enables an input that animates.
     */
    tick(dt: number): void;
    /**
     * Step an {@link animateTo} glide. Writes through {@link binding} rather than
     * the public mutators — those cancel the tween, which would end the glide on
     * its own first frame.
     */
    private advanceAnimation;
    /** Tear down subscriptions. Called by `Canvas.destroy`. */
    dispose(): void;
    private clampScale;
}

/**
 * `IOverlayDevice` — immediate-mode drawing for **transient** visuals only.
 *
 * A lasso polygon, a brush rectangle, a drag ghost, a minimap viewport
 * rectangle: things that change at pointer or camera rate, mean nothing once the
 * gesture ends, and must never reach history, undo, serialisation or export.
 * Publishing those as specs would put gesture noise into state and force every
 * writer to remember an exclusion flag — so they get their own path instead
 * (`docs/renderer-split-design.md` §3, decision D3).
 *
 * **Not for layer content.** Anything durable — nodes, edges, group frames,
 * contour bands, hulls — is a spec in the store, projected by `SpecProjector`.
 * If a visual survives a reload, it does not belong here.
 *
 * The vocabulary is deliberately the eleven operations the transient visuals in
 * this repo actually use. Every one maps to a `Graphics` path op in pixi and to
 * `BufferGeometry` in three.js, which is what keeps the device portable.
 */
/** Solid fill. Overlays never need image or inset fills. */
interface OverlayFill {
    readonly color: number | string;
    readonly alpha?: number;
}
/**
 * A bare colour is accepted wherever a fill is, since an opaque solid is the
 * common case — `fill(0x1677ff)` rather than `fill({ color: 0x1677ff })`.
 */
type OverlayFillLike = OverlayFill | number | string;
/** Solid stroke, optionally dashed. */
interface OverlayStroke {
    readonly color: number;
    readonly width: number;
    readonly alpha?: number;
    /** `[dash, gap]` in world units. Omit for a solid line. */
    readonly dashArray?: readonly [number, number];
}
interface IOverlayDevice {
    /** Erase everything drawn so far. Every redraw starts here. */
    clear(): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    quadraticCurveTo(cx: number, cy: number, x: number, y: number): this;
    closePath(): this;
    rect(x: number, y: number, width: number, height: number): this;
    roundRect(x: number, y: number, width: number, height: number, radius: number): this;
    ellipse(cx: number, cy: number, radiusX: number, radiusY: number): this;
    /** Flat `[x0, y0, x1, y1, …]` or point objects. */
    poly(points: readonly number[] | ReadonlyArray<{
        x: number;
        y: number;
    }>, close?: boolean): this;
    fill(style: OverlayFillLike): this;
    stroke(style: OverlayStroke): this;
    /** Hide without discarding — cheaper than clear + redraw for a blinking overlay. */
    setVisible(visible: boolean): this;
    /** Paint order against sibling overlays. */
    setZIndex(z: number): this;
    /** Move the whole overlay; useful for screen-space chrome. */
    setPosition(x: number, y: number): this;
    destroy(): void;
}
/** Which space an overlay is drawn in. */
type OverlaySpace = 'world' | 'screen';

/**
 * `SpecProjector` — drives a renderer from a {@link SpecStore}.
 *
 * The store holds the visual description; this turns it into mounted elements.
 * Every drawing layer uses the same projector, which is what makes "the renderer
 * is a projection of state" true for the whole engine rather than for one layer.
 *
 * Two entry points, and the difference matters:
 *
 * - {@link project} — synchronous, for a layer publishing its own spec. Anything
 *   the layer does *after* publishing (attaching a label, a decoration, a badge)
 *   needs the element mounted already, so this path cannot wait for a flush.
 * - the **flush subscription** — for every other writer: a behaviour, a tool, a
 *   restored session. Ids already projected synchronously in the same frame are
 *   skipped so nothing is drawn twice.
 *
 * Shapes and connectors are told apart by **which registry owns the spec's
 * `kind`**, so no discriminator has to be baked into the spec vocabulary.
 *
 * See `docs/renderer-split-design.md` §2 and §4.2b.
 */

/** The slice of a renderer this projector drives. */
interface SpecProjectionTarget {
    readonly shapeKinds: ReadonlySet<string>;
    getShapeKind(id: string): string | undefined;
    hasConnector(id: string): boolean;
    addShape<TSpec extends BaseShapeSpec>(id: string, spec: TSpec): void;
    updateShape<TSpec extends BaseShapeSpec>(id: string, patch: Partial<TSpec>): void;
    removeShape(id: string): void;
    addConnector<TSpec extends BaseConnectorSpec>(id: string, spec: TSpec): void;
    updateConnector<TSpec extends BaseConnectorSpec>(id: string, patch: Partial<TSpec>): void;
    removeConnector(id: string): void;
}
interface SpecProjectorOptions {
    /**
     * Called before an element is removed and re-added because its `kind` changed.
     * A host may be tracking decoration / badge slots that the removal disposes.
     */
    onKindChange?: (id: string) => void;
}
declare class SpecProjector<TSpec extends BaseShapeSpec | BaseConnectorSpec> {
    private readonly specs;
    private readonly target;
    private readonly options;
    private readonly projectedThisFlush;
    private readonly off;
    constructor(specs: SpecStore<TSpec>, target: SpecProjectionTarget, options?: SpecProjectorOptions);
    /**
     * Mount / update `id` from the store **now**, and mark it handled so the next
     * flush skips it.
     */
    project(id: string): void;
    /** Remove whatever the renderer holds for `id`, whichever kind it is. */
    unproject(id: string): void;
    /** Drop the flush subscription. */
    destroy(): void;
    private applyFlush;
    private apply;
}

/**
 * `IElementRenderer` — everything a domain layer asks of a drawing backend.
 *
 * `SpecProjectionTarget` covers the part driven by state: add / update / remove
 * an element from `specs:flush`. This interface is the rest — the per-frame
 * commands and geometry answers a layer still calls directly (decorations,
 * badges, LOD, transforms, measurement). It exists so `@invana/graph` can drive
 * a backend it does not import.
 *
 * **Every signature here is pixi-free**, which is the whole point and was not a
 * given: it works because the decoration styles, badge options and label
 * content moved into the spec vocabulary earlier (P6.0), and because
 * `IDecorationBase` is generic over its host info rather than naming a display
 * object. A signature that cannot be expressed without a backend type belongs
 * on the concrete renderer, not here.
 *
 * **This is not the end state.** The classification table in
 * `docs/renderer-split-design.md` (P4.5) records where each of these is headed:
 * decorations and badges become spec state, while the LOD setters stay
 * per-element commands (G5 was revised: a single global level cannot express
 * per-element exemptions). Until then the interface describes
 * what is really called, rather than what we wish were called — a smaller
 * interface that lied would not let the package split at all.
 */

/**
 * A mounted decoration, seen from the engine side. Generic in its host info, so
 * this reference carries no backend type — a layer can hold one, tick it and
 * read its padding without knowing what it draws into.
 */
interface MountedDecoration<TStyle = unknown> {
    readonly style: TStyle;
    tick?(deltaMs: number): boolean;
    getEndPadding?(): {
        readonly source: number;
        readonly target: number;
    };
    getOuterExtent?(): number;
}
/**
 * A custom element class, seen from the engine side.
 *
 * Registering a new shape kind is **irreducibly backend-specific**: a pixi
 * implementation extends `ShapeBase` and paints into a `Graphics`, a three.js
 * one would extend something else entirely. So the engine types the constructor
 * opaquely — it only routes the registration through to the backend, which is
 * the thing that can give it meaning.
 */
type CustomElementCtor = abstract new (...args: never[]) => object;
/**
 * A **display-only** adjustment to one shape, layered on top of everything
 * else that positions or scales it — the logical position (`spec.x/y`, kept
 * current by `moveShape` / `updateShape`), the LOD/hover visual scale
 * (`scaleShape`) and any text-LOD visibility. None of those writes clobbers an
 * override, and the override never reaches the spec, the store or history.
 *
 * Built for focus+context distortion (a fisheye lens): nodes inside the lens
 * are drawn displaced and enlarged while their layout positions stay put.
 * Connectors, anchors and picking follow the **drawn** shape, so edges stay
 * glued to it and a click lands on what the user sees.
 */
interface ShapeDisplayOverride {
    /** World-space offset added to the drawn origin. Default `0`. */
    readonly dx?: number;
    /** World-space offset added to the drawn origin. Default `0`. */
    readonly dy?: number;
    /**
     * Multiplier on the shape's current visual scale, applied about the shape's
     * visual centre (so top-left-anchored rects and cards grow in place).
     * Default `1`.
     */
    readonly scale?: number;
    /**
     * `true` forces the shape's text (its `'label'` decoration and any internal
     * text) visible while the override is set, regardless of text-LOD or
     * label-collision hiding. Clearing the override restores whatever those last
     * asked for. Omitted / `false` leaves text visibility to them.
     */
    readonly showText?: boolean;
}
/**
 * Which labels a {@link LabelSizePolicy} governs: `'shape'` = the `'label'`
 * decoration of every shape (graph nodes), `'connector'` = the `'label'`
 * decoration of every connector (graph edges). Badge plates and the text
 * *inside* a shape (composite `label` parts) are never governed.
 */
type LabelSizeTarget = 'shape' | 'connector';
/**
 * How big a label is drawn **on screen** as the camera zooms — the input to
 * {@link IElementRenderer.setLabelSizePolicy}. Sizes are CSS pixels; a label's
 * authored `fontSize` is its size at camera zoom `1`.
 *
 * Every field is optional and an empty policy changes nothing: without
 * `zoomGrowth` a label keeps whatever size its host gives it today (it grows
 * with the world, or stays pixel-constant under a node-size LOD); the clamps
 * then bound that.
 *
 * @example
 * ```ts
 * // Grow with √zoom, never above 24px on screen.
 * renderer.setLabelSizePolicy('shape', { zoomGrowth: 0.5, maxFontPx: 24 });
 * ```
 */
interface LabelSizePolicy {
    /**
     * How on-screen size follows camera zoom: `fontSize × zoom ^ zoomGrowth`.
     * `1` grows with the world, `0.5` with its square root, `0` keeps each
     * label's own `fontSize` on screen. Clamped to `[0, 1]`. Omit to keep the
     * size the host gives the label (see the interface doc).
     */
    readonly zoomGrowth?: number;
    /** Smallest on-screen font size in CSS px. Omit for no floor. */
    readonly minFontPx?: number;
    /** Largest on-screen font size in CSS px. Omit for no cap. */
    readonly maxFontPx?: number;
}
interface IElementRenderer extends SpecProjectionTarget {
    /**
     * Teach this backend a new element kind. The spec vocabulary stays open —
     * `containsSpec` / `boundsOfSpec` return `undefined` for kinds they don't
     * know, and picking falls back to asking the instance.
     */
    registerShape(kind: string, ctor: CustomElementCtor): void;
    hasShape(id: string): boolean;
    getShapeKind(id: string): string | undefined;
    hasConnector(id: string): boolean;
    moveShape(id: string, x: number, y: number): void;
    scaleShape(id: string, scale: number): void;
    /**
     * Set (or, with `null`, clear) a shape's {@link ShapeDisplayOverride}. The
     * drawn shape, its connectors' anchors and its hit area follow the override;
     * {@link getShapePosition} keeps answering the **logical** position, because
     * its callers (drag, resize, collapse) write that position back. Connectors
     * are **not** re-routed here — the caller re-routes the ones it cares about
     * with `updateConnector(id, {})`, once per batch. No-op for unknown ids.
     */
    setShapeDisplayOverride(id: string, override: ShapeDisplayOverride | null): void;
    /**
     * Clear every display override this renderer holds. Same re-routing caveat
     * as {@link setShapeDisplayOverride}.
     */
    clearShapeDisplayOverrides(): void;
    setConnectorStroke(id: string, stroke: {
        color: number;
        width: number;
    }): void;
    scaleConnectorStroke(id: string, scale: number): void;
    setRaised(ids: Iterable<string>): void;
    /**
     * Text-LOD visibility of a shape's text: its `'label'` decoration **and** any
     * text the shape draws inside itself (composite `label` parts). This is the
     * LOD channel only — label collision writes its own channel through
     * `setDecorationVisible(id, 'label', …)`, and a label is drawn only when both
     * allow it (a display override's `showText` forces it on).
     */
    setShapeTextVisible(id: string, visible: boolean): void;
    /**
     * Text-LOD visibility of a connector's `'label'` decoration. Same two-channel
     * rule as {@link setShapeTextVisible}: collision's
     * `setDecorationVisible(id, 'label', …)` is a separate channel, and the label
     * is drawn only when both allow it. No-op for unknown ids.
     */
    setConnectorTextVisible(id: string, visible: boolean): void;
    /**
     * What the text-LOD channel last asked for this shape or connector (`true`
     * when a display override's `showText` forces it on); `false` for an unknown
     * id. Lets label collision ignore labels LOD has hidden, so an invisible
     * label never blocks a visible one.
     */
    isTextVisible(id: string): boolean;
    setShapeIconVisible(id: string, visible: boolean): void;
    setShapeImageVisible(id: string, visible: boolean): void;
    setLabelsResolution(resolution: number): void;
    /**
     * Set (or, with `null`, clear) how this renderer sizes the `'label'`
     * decorations of every shape or every connector across camera zoom — see
     * {@link LabelSizePolicy}. The backend re-applies it whenever the camera
     * scale, a host's visual scale or a label changes; a caller pushes it once
     * per configuration change, never per frame. Clearing restores each label's
     * natural size.
     *
     * **Cost.** The pixi backend sizes only labels that are drawn (not hidden by a
     * label LOD) and on screen on a zoom frame, catching off-screen ones up while
     * the zoom holds still — so a zoomed-in view or a visibility band keeps it
     * under ~1 ms a frame at 10 000 labels. The known limit is every label on
     * screen at once with no band (a zoomed-out hairball): each still costs one
     * transform write per zoom frame, ~3–4 ms at 10 000. Pair a size policy with
     * a band (`NodeLabelLODBehaviour.minZoom`) on large graphs.
     */
    setLabelSizePolicy(target: LabelSizeTarget, policy: LabelSizePolicy | null): void;
    setVisibleSet(ids: ReadonlySet<string> | null): void;
    cull(visibleBounds: Rect, padWorld?: number): void;
    uncull(): void;
    setDecoration<TStyle = unknown>(targetId: string, slot: string, decoration: DecorationSpec<TStyle> | null): void;
    getDecoration(id: string, slot: string): MountedDecoration | undefined;
    setDecorationVisible(targetId: string, slot: string, visible: boolean): void;
    getDecorationWorldBounds(targetId: string, slot: string): Rect | null;
    setBadge(hostId: string, slot: string, options: BadgeOptions): void;
    /**
     * Attach / replace / clear an effect. Sibling of {@link setDecoration}: a
     * decoration adds geometry beside the host, an effect modulates the host
     * itself (transform delta or style override).
     */
    setEffect<TStyle = unknown>(targetId: string, slot: string, effect: EffectSpec<TStyle> | null): void;
    removeBadge(hostId: string, slot: string): void;
    getShapeWorldBounds(id: string): Rect | null;
    getShapePosition(id: string): Point | null;
    getConnectorPolyline(id: string): readonly Point[] | null;
    connectorGeometryUnchanged(id: string, next: BaseConnectorSpec): boolean;
    boundsOfSpec(spec: {
        readonly kind: string;
    }): Rect | undefined;
    collapsedShapeSpec(spec: {
        readonly kind: string;
    }): Record<string, unknown> | undefined;
    /** Visual centre of a shape — its bounds' midpoint, not its origin. */
    getShapeCenter(id: string): Point | null;
    scaleShapeSpec(spec: {
        readonly kind: string;
    }, factor: number): Record<string, unknown> | undefined;
    fitShapeSpecToContent(spec: {
        readonly kind: string;
    }, content: {
        readonly width: number;
        readonly height: number;
    }): Record<string, unknown> | undefined;
    /**
     * Text metrics. Backend-provided on purpose — SDF and canvas-2d metrics
     * genuinely disagree, so this is the `measureText` seam (§5), not a geometry
     * answer the engine could compute.
     */
    measureLabel(content: LabelContent, wrap?: LabelWrap): {
        width: number;
        height: number;
    } | null;
    hitTest(worldX: number, worldY: number, exclude?: ReadonlySet<string>): HitResult | null;
    setHitTestEnabled(enabled: boolean): void;
    reindexScaledShapeHits(ids?: Iterable<string>): void;
    reanchorAllConnectors(): void;
    reRouteAllConnectors(): void;
    tickAnimations(deltaMs: number): void;
    /** Vector fragment for this renderer's elements. Spec-driven; every backend can answer. */
    toSVG(): string;
    /**
     * Element-scoped pointer events — `shape:click`, `connector:pointerover`,
     * `shape:partcontextmenu`, … Canvas-wide input goes on the kernel bus; this
     * channel is per-renderer because the payloads name elements it owns.
     */
    readonly events: EventEmitter<ElementEventMap>;
    /**
     * Release everything this device holds.
     *
     * Called by whoever *owns* the device. A layer that received its renderer
     * from `surface.primitives` does **not** own it — the surface does, and
     * destroys it in `ISurface.destroy()`. Calling it from both places is a
     * double-free.
     */
    destroy(): void;
}

/**
 * `ISurface` — a layer's slice of the renderer.
 *
 * A layer asks the renderer for a surface at mount and draws through it. It
 * never sees a display object, a scene graph, or anything else backend-shaped:
 * a surface hands back a **drawing device** for durable content, an **overlay
 * device** for transient gesture visuals, and the three knobs a layer genuinely
 * needs (visibility, paint order, teardown).
 *
 * This is what replaces `new Container()` in `WorldLayer.mount()` — the last
 * place the orchestrator constructed a pixi object for a layer to fill.
 *
 * The two spaces mirror the two layer bases: `'world'` is camera-affected and
 * pans/zooms with the diagram, `'screen'` stays glued to the viewport.
 *
 * See `docs/renderer-split-design.md` §4.
 */

/** Which space a surface's contents live in. */
type SurfaceSpace = 'world' | 'screen';
/**
 * Per-layer knobs for the device a surface builds. These are *engine policy a
 * layer owns*, not device config — a graph layer with tiny nodes wants a larger
 * hit floor than a layer of big cards, and only the layer knows that.
 */
interface SurfaceOptions {
    /**
     * Minimum hover/click target in screen pixels, used as a fallback when no
     * silhouette contains the cursor. See `PrimitivesRendererOptions.hitFloorPx`.
     */
    hitFloorPx?: number;
}
/**
 * A full-surface backdrop: a solid fill, optionally overlaid with a repeating
 * tile that can be offset and scaled to follow the camera.
 *
 * The split of responsibility is the point. The **engine** decides what the
 * pattern looks like — dots, grid, lines, spacing, colour, DPR — and rasterises
 * one tile with a 2D canvas, which needs no backend at all. The **backend**
 * decides how that tile is repeated across the surface, which is the only part
 * that touches the GPU.
 *
 * This is deliberately not a spec and not an overlay. A backdrop is neither
 * durable content (it is derived from theme + camera, never authored) nor a
 * transient gesture visual — it is a property of the surface itself.
 */
interface SurfaceBackdrop {
    /** Solid fill painted behind everything on the surface. */
    readonly color: number | string;
    /** Surface size in CSS pixels. */
    readonly width: number;
    readonly height: number;
    /** Optional repeating tile drawn over the solid fill. */
    readonly tile?: {
        /**
         * One tile, already rasterised by the engine. A plain DOM image source, so
         * a backend wraps it in whatever texture type it uses.
         *
         * Identity matters: a backend may cache its texture and rebuild only when
         * this changes, so pass the *same* object when only the transform moves.
         */
        readonly source: CanvasImageSource;
        /** Uniform scale applied to the tile. */
        readonly scale: number;
        /** Tile offset in surface pixels — how the pattern tracks the camera. */
        readonly offsetX: number;
        readonly offsetY: number;
        readonly alpha?: number;
        /** `false` hides the tile while keeping the solid fill. */
        readonly visible?: boolean;
    };
}
interface ISurface {
    /** Stable id — the owning layer's id. Names the surface in a scene tree. */
    readonly id: string;
    readonly space: SurfaceSpace;
    /**
     * This layer's drawing device: the target a `SpecProjector` drives from the
     * store, plus the per-frame commands and geometry answers a domain layer
     * still calls directly. Pixi-free, so `@invana/graph` drives a backend it
     * never imports.
     */
    readonly primitives: IElementRenderer;
    /**
     * An immediate-mode device for **transient** visuals owned by this layer
     * (a minimap's viewport box, a hover outline). Anything durable is a spec.
     */
    overlay(label: string): IOverlayDevice;
    /**
     * Paint (or clear, with `null`) this surface's backdrop. Cheap to call every
     * frame: a backend rebuilds its tile texture only when `tile.source` changes
     * identity, so a camera-following pattern costs a transform write.
     */
    setBackdrop(backdrop: SurfaceBackdrop | null): void;
    setVisible(visible: boolean): void;
    /**
     * Opacity of everything this surface holds, `0`–`1`. `1` is fully opaque and
     * is every surface's starting state.
     *
     * The sibling of {@link setVisible}, which can only answer yes or no. A
     * surface that can be *partly* there is what lets one tween fade a whole
     * layer — the canvas entrance (`CanvasConfig.entrance`), and later any layer
     * dim or cross-fade — without touching a single item's style.
     *
     * Compounds with per-item alpha rather than replacing it: a half-faded
     * surface holding a half-transparent node shows it at a quarter. A backend
     * with no notion of group opacity may no-op, in which case the effect is
     * silently lost rather than failing.
     */
    setAlpha(alpha: number): void;
    setZIndex(z: number): void;
    destroy(): void;
}
/**
 * The lifecycle half of the renderer contract: how surfaces come into being.
 * The drawing half is {@link IElementRenderer}, reached through a surface.
 */
interface ISurfaceHost {
    createSurface(space: SurfaceSpace, id: string, opts?: SurfaceOptions): ISurface;
}

/**
 * `IRenderer` — the drawing backend contract.
 *
 * ## Why this lives in `@invana/canvas` and not the kernel
 *
 * The kernel (`@invana/canvas-store`) is renderer-free and has no spec
 * vocabulary — and this contract is *made of* spec vocabulary: a surface
 * projects `BaseShapeSpec` / `BaseConnectorSpec`, an overlay draws in engine
 * geometry, a camera binding speaks the abstract transform. So the seam belongs
 * to the orchestrator, which owns that vocabulary. The kernel keeps only the two
 * genuinely device-shaped types it already had — {@link RendererBackend} and
 * `RendererInitOptions` — because those are the non-syncable counterpart to
 * `CanvasSceneOptions` and carry no drawing concepts.
 *
 * ## What a renderer actually is here
 *
 * Not a push target. `@invana/canvas` hands out **devices** and the renderer
 * answers with realisations:
 *
 * ```
 * Canvas ──mount()──────────────► stands up the backend + its scene root
 *        ──createSurface(id)────► ISurface   → SpecProjectionTarget (durable content)
 *                                            → IOverlayDevice      (transient gestures)
 *        ──createCameraBinding()► ICameraBinding — Camera drives it
 *        ──tick(dt)─────────────► advance backend animation; the engine owns the only rAF (G3)
 * ```
 *
 * Durable content reaches the backend through {@link SpecProjector}, driven by
 * `specs:flush` from the store — the renderer is a projection of state, not a
 * thing that gets told what to draw (`docs/renderer-split-design.md` §2, §4).
 *
 * ## What is deliberately *not* here
 *
 * - **`applyView` / `applyData`.** An earlier draft of this seam had the
 *   orchestrator pushing view and data deltas at the renderer. P2 replaced that
 *   with spec state + `specs:flush`, so those methods described a flow that no
 *   longer exists. They are gone rather than left as decoration.
 * - **Input.** A renderer emits `input:*` onto the shared `CanvasEventBus`; it
 *   is not a member of this interface. There is exactly one bus, so the seam
 *   stays one-way: devices out, input published on the bus.
 * - **Picking.** Interaction, not drawing (design D5) — `hit/PickingIndex` owns
 *   it, and the renderer only answers `HitGeometrySource`.
 */

/**
 * What a backend can and cannot do. The engine reads this to degrade rather
 * than throw — a spec kind a backend doesn't know is skipped with a
 * `capability:unsupported` event, which is what lets a second backend ship with
 * a subset (`docs/renderer-split-design.md` §4.2).
 */
interface RendererCapabilities {
    /** How far visual effects go: none, style-level (tint/alpha), or real shaders. */
    readonly effects: 'none' | 'style' | 'shader';
    /** How text is rasterised. Drives which label features are honoured. */
    readonly textMode: 'native' | 'sdf' | 'dom';
    /** Whether {@link IRenderer.extract} is available. */
    readonly rasterExport: boolean;
    /** Whether the backend has a real depth axis (2D backends: `false`). */
    readonly depth: boolean;
    /** Spec kinds this backend can draw. Unknown kinds degrade, never throw. */
    readonly specKinds: readonly string[];
}
/** Where a renderer attaches, and the device knobs for standing it up. */
interface RendererMountOptions extends RendererInitOptions {
    /**
     * Suppress the browser context menu on the drawing surface, so a right-click
     * can be a canvas gesture. Default `true`.
     */
    suppressBrowserContextMenu?: boolean;
    /** Track the host element's size and resize the surface to match. Default `false`. */
    autoResize?: boolean;
    /** Opaque background (`backgroundAlpha: 1`) rather than a transparent surface. */
    opaque?: boolean;
    /** GPU power hint forwarded to the backend where it has one. */
    powerPreference?: 'high-performance' | 'low-power';
}
interface IRenderer {
    /**
     * Stand the backend up against a DOM host: create the drawing surface, attach
     * it, and build the scene root. May be async (GPU adapter acquisition); the
     * orchestrator awaits it before creating any surface. {@link backend} and
     * {@link capabilities} are meaningful only once this resolves.
     */
    mount(host: HTMLElement, opts?: RendererMountOptions): Promise<void> | void;
    /**
     * A layer's slice of the renderer — durable spec projection, transient
     * overlays, visibility and paint order. This replaces a layer constructing a
     * backend container for itself.
     */
    createSurface(space: SurfaceSpace, id: string, opts?: SurfaceOptions): ISurface;
    /**
     * A standalone transient device not owned by any layer — a lasso, a brush
     * rectangle, a drag ghost. Behaviours use this, because a gesture overlay
     * belongs to the gesture rather than to a layer (§3, decision D3).
     */
    createOverlay(label: string, space?: OverlaySpace): IOverlayDevice;
    /**
     * The concrete viewport behind the engine's {@link Camera}. The renderer owns
     * the realisation; `Camera` owns clamping, anchored zoom, fit and the bus /
     * store sync.
     */
    createCameraBinding(): ICameraBinding;
    /**
     * Hand back the engine's `Camera` once it wraps this renderer's binding.
     * Surfaces need it (hit-floor scaling, label-raster priority), so the order is
     * `createCameraBinding` → `new Camera` → `attachCamera` → `createSurface`.
     */
    attachCamera(camera: Camera): void;
    /**
     * World-space bounds of everything drawn, or `null` when nothing is. Used by
     * `area: 'content'` export. The backend answers because only it knows what is
     * actually mounted.
     */
    worldContentBounds(): Rect | null;
    /** The drawing surface, when there is one. `null` on a headless backend. */
    readonly canvasElement: HTMLCanvasElement | null;
    /** Viewport size changed (CSS px). */
    resize(width: number, height: number): void;
    /**
     * Advance backend-owned animation and **present the frame**.
     *
     * The engine owns the only `requestAnimationFrame` (G3) and calls this once
     * per frame, after advancing the camera, flushing data and updating layers. A
     * renderer must **not** schedule frames of its own: two clocks disagree about
     * frame order, and a test can't drive time by hand.
     */
    tick(dtMs: number): void;
    /**
     * Raster capture, capability-gated by {@link RendererCapabilities.rasterExport}
     * (G1). Vector/SVG export is engine-side and spec-driven, so it is *not* here —
     * it works on every backend including headless.
     */
    extract?(opts: {
        /** World-space region to capture. */
        region: Rect;
        /** Output pixels per world unit. */
        resolution: number;
    }): HTMLCanvasElement;
    /** Tear down: release the backend, the DOM surface, and every listener. */
    destroy(): void;
    /** The backend actually resolved at {@link mount} (may differ from the preference). */
    readonly backend: RendererBackend;
    /** What this backend supports. Read after {@link mount}. */
    readonly capabilities: RendererCapabilities;
}

/**
 * `GestureArbiter` — who owns the pointer right now.
 *
 * Architecture: see `docs/renderer-split-design.md` §9 (P5).
 *
 * **Why this exists.** Before P5, a behaviour that needed the camera to stop
 * panning during its own gesture reached for `camera.viewport.plugins.pause('drag')`
 * — sixteen calls across six behaviours, every one of them poking at a
 * `pixi-viewport` internal from domain code. The thing they actually wanted was
 * never a camera API: it was *exclusivity*. A node drag, a lasso, a brush, a
 * resize and an edge draw are all mutually exclusive pointer gestures, and the
 * camera pan is simply the lowest-priority one of them.
 *
 * So the arbiter models the real invariant — **at most one owner at a time** —
 * and the camera becomes a subscriber like anything else: `DragPanBehaviour`
 * yields while {@link GestureArbiter.owner} names somebody else. That inverts
 * the old direction (others suspending the camera) into the camera suspending
 * itself, which is what lets the pixi-viewport handle move into the renderer
 * package in P6 without dragging six domain behaviours along with it.
 *
 * **Leak safety is the whole design.** A claim that is never released freezes
 * every gesture *and* the camera, which is worse than the failure it replaces.
 * Three properties defend against that:
 *
 * 1. **Release is token-identified.** The function returned by
 *    {@link GestureArbiter.claim} only clears *that* claim. Calling it twice is a
 *    no-op, and calling a stale one can never evict a later owner.
 * 2. **A re-claim by the current owner always succeeds.** A behaviour that
 *    leaks its own claim can never deadlock *itself* out of its next gesture —
 *    the old token is simply invalidated.
 * 3. **`Behaviour` releases on `disable()` and `destroy()`** regardless of what
 *    the subclass did (see `Behaviour.claimGesture`), so unmount and mid-gesture
 *    teardown can't strand a claim.
 */
/** Options for a single {@link GestureArbiter.claim}. */
interface GestureClaimOptions {
    /**
     * Higher wins. A claim is refused when another owner holds the gesture at an
     * equal or higher priority; a strictly higher priority **pre-empts** the
     * current owner (whose {@link GestureClaimOptions.onRevoke} fires and whose
     * release function goes inert). Default `0` — every built-in behaviour claims
     * at the default, so no pre-emption happens unless a consumer asks for it.
     */
    priority?: number;
    /**
     * Called when this claim is pre-empted by a higher-priority owner. The seam
     * a long-running gesture uses to abort cleanly instead of continuing to move
     * things while somebody else drives the pointer. Not called on a normal
     * release, nor when the same owner re-claims.
     */
    onRevoke?: () => void;
}
/**
 * Arbitrates exclusive ownership of the pointer gesture. Reached as
 * `ctx.gestures`; provided per-`Canvas`.
 */
interface GestureArbiter {
    /**
     * Try to take the gesture for `owner` (by convention the behaviour's `id`).
     * Returns a **release** function on success, or `null` when another owner
     * already holds it at an equal-or-higher priority — in which case the caller
     * should not start its gesture.
     *
     * Release is idempotent and identity-checked: calling it after the claim has
     * already ended (or been pre-empted) does nothing, so it can never clear
     * somebody else's claim.
     */
    claim(owner: string, opts?: GestureClaimOptions): (() => void) | null;
    /** The current owner id, or `null` when the gesture is free. */
    readonly owner: string | null;
    /**
     * Subscribe to ownership changes — the hook `DragPanBehaviour` uses to
     * suspend and restore camera panning. Fires with the new owner (`null` when
     * released). Returns an unsubscribe function.
     */
    onOwnerChange(listener: (owner: string | null) => void): () => void;
}
/**
 * The default in-memory {@link GestureArbiter}. Renderer-free and DOM-free: it
 * knows nothing about pointers, only about who asked first.
 */
declare class DefaultGestureArbiter implements GestureArbiter {
    private active;
    private readonly listeners;
    get owner(): string | null;
    claim(owner: string, opts?: GestureClaimOptions): (() => void) | null;
    onOwnerChange(listener: (owner: string | null) => void): () => void;
    /**
     * Drop the claim identified by `token`. A stale token — from a released or
     * pre-empted claim — is ignored, which is what makes double-release safe.
     */
    private release;
    /** Snapshot before iterating: a listener may unsubscribe from inside itself. */
    private emit;
}

/**
 * `LayerRegistry` — stores the Layers added to a Canvas.
 *
 * Architecture: see `architecture-proposal.md` §2.4 (CanvasContext.layers).
 *
 * **Responsibilities**
 *   - Add / remove (with mount / unmount lifecycle).
 *   - Typed `get<T>(id)`.
 *   - `byZOrder()` iteration — used by the Canvas tick.
 *   - Fires `'scene:layer:add'` / `'scene:layer:remove'` on the bus.
 *
 * **Lifecycle wiring**
 *
 * The registry doesn't itself construct the `CanvasContext` — it would be
 * circular (the registry is a field of the context). Instead the Canvas
 * passes a `getContext()` thunk; `add(layer)` resolves it at the moment of
 * mount. This keeps the registry decoupled from the context's full shape.
 */

interface LayerRegistryOptions {
    /**
     * Resolves the `CanvasContext` at the moment of mount, or `undefined` before
     * the Canvas is initialised. Layers added pre-init are stored and mounted
     * later by `mountAll()`.
     */
    getContext: () => CanvasContext | undefined;
    /** Bus for `layer:added` / `layer:removed` events. */
    bus: CanvasEventBus;
}
declare class LayerRegistry {
    private readonly layers;
    private readonly getContext;
    private readonly bus;
    /** Cached z-sorted view; invalidated on add/remove/setZIndex. */
    private zOrderCache;
    constructor(opts: LayerRegistryOptions);
    /** Number of registered layers. */
    get size(): number;
    /**
     * Add a Layer to the canvas. Mounts immediately if the Canvas is initialised;
     * otherwise the layer waits for `mountAll()` (called by `Canvas.init`). Fires
     * `layer:added`. Throws if `id` is already registered.
     */
    add(layer: ILayer): void;
    /** Mount every not-yet-mounted layer. Called by `Canvas.init` once the context exists. */
    mountAll(): void;
    /**
     * Remove a Layer. Calls `layer.unmount()` and fires `layer:removed`.
     * No-op if `id` isn't registered.
     */
    remove(id: string): void;
    /** Typed get by id. Returns `undefined` if not found. */
    get<T extends ILayer = ILayer>(id: string): T | undefined;
    has(id: string): boolean;
    /** Snapshot of all layers in insertion order. */
    list(): readonly ILayer[];
    /**
     * Iterate layers in z-order (low → high). The Canvas tick walks layers in
     * z-order to flush dirty work; rendering order is then determined by
     * pixi's child order (handled by `SurfaceManager.setWorldLayerZ`).
     *
     * The result is cached and reused until `add` / `remove` / `setZIndex` invalidates.
     */
    byZOrder(): readonly ILayer[];
    /**
     * Update a layer's `zIndex` and propagate to surfaces. Invalidates the
     * z-order cache. No-op if the layer isn't registered.
     */
    setZIndex(id: string, zIndex: number): void;
    /**
     * Tear down every registered layer. Called on Canvas destroy.
     * Iteration is over a snapshot so unmount-triggered side effects don't
     * corrupt the loop.
     */
    clear(): void;
}

/**
 * `Behaviour` — input subscriber that translates user input into state mutations.
 *
 * Architecture: see `architecture-proposal.md` §2.2.
 *
 * Behaviours own neither rendering output nor source-of-truth data. They
 * subscribe to layer events (`'node:hover'`, `'shape:click'`) or canvas events
 * (`'pointerdown'`) and mutate the appropriate `state` slice.
 *
 * **Default `enabled: false`.** Registration wires the behaviour up; the
 * developer explicitly enables it. Matches the rule that no input behaviour
 * is auto-active (`architecture-proposal.md` §2.2 + repo CLAUDE.md rule 7).
 *
 * **`shortcuts`** is advisory metadata — used by `BehaviourRegistry` to log
 * conflict warnings when two enabled behaviours claim the same gesture
 * (e.g. lasso vs. pan both wanting `'shift+drag'`). The framework warns;
 * it does not enforce — that's the developer's job.
 *
 * **`modes`** ties a behaviour to the canvas's interaction mode
 * (`view.interaction.viewMode` — the modeller "tool"). An enabled behaviour with
 * `modes: ['add']` is only *live* while the mode is `'add'`: outside it the base
 * runs {@link Behaviour.onDisable} (cancelling any gesture) and back inside it
 * runs {@link Behaviour.onEnable}. `enabled` stays the developer's flag — a mode
 * switch never changes it, never fires `scene:behaviour:enable`, and never shows
 * up in {@link Behaviour.getOptions}.
 */

/** What `BehaviourRegistry` sees. */
interface IBehaviour {
    readonly id: string;
    readonly enabled: boolean;
    /** `true` once `register(ctx)` has run. Lets the registry skip already-wired behaviours. */
    readonly isRegistered: boolean;
    readonly scope: 'layer' | 'canvas';
    readonly targetLayerId?: string;
    readonly shortcuts?: readonly string[];
    register(ctx: CanvasContext): void;
    destroy(): void;
    enable(): void;
    disable(): void;
    /**
     * Merge a serialisable options patch and apply it live. Every behaviour
     * supports this (the base provides a generic implementation) so the engine's
     * `canvas.update({ behaviours })` path can retune any behaviour uniformly.
     */
    setOptions(changes: Record<string, unknown>): void;
    /**
     * Replace the interaction modes this behaviour is live in (`undefined` = all).
     * The engine calls it directly for a `modes` patch, like it routes `enabled`
     * through the registry, because some behaviours override `setOptions`
     * without calling `super`.
     */
    setModes?(modes: readonly string[] | undefined): void;
}
interface BehaviourOptions {
    id: string;
    /**
     * Layer-scoped behaviours target a specific Layer by id. Canvas-scoped
     * behaviours have no `targetLayerId` and `scope: 'canvas'`.
     */
    targetLayerId?: string;
    /** Default `false` — the developer explicitly enables. */
    enabled?: boolean;
    /**
     * Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
     * for conflict warnings. Format is convention-free (`'shift+drag'`,
     * `'wheel+ctrl'`, `'rclick'`); registries match strings as-is.
     */
    shortcuts?: readonly string[];
    /**
     * Interaction modes (`view.interaction.viewMode` values) this behaviour is live
     * in. Omitted = every mode. An enabled behaviour outside its modes is
     * suspended — its `onDisable` runs, `enabled` is unchanged — and resumes when
     * the mode comes back. E.g. `modes: ['connect']` on an edge-drawing behaviour
     * makes the modeller's Connect tool switch it on and off with no host wiring.
     */
    modes?: readonly string[];
}
declare abstract class Behaviour<TOptions extends BehaviourOptions = BehaviourOptions> implements IBehaviour {
    readonly id: string;
    readonly targetLayerId?: string;
    readonly shortcuts?: readonly string[];
    /**
     * Stable **class kind** — a minification-safe discriminator matching the
     * `@invana/canvas-ui` settings-editor registry key (e.g. `'drag-pan'`,
     * `'wheel-zoom'`). Distinct from {@link id} (the per-instance key): all
     * `DragPanBehaviour` instances share `kind: 'drag-pan'`. Concrete behaviours
     * set it as a class field; left `undefined` on any that haven't, so consumers
     * fall back (e.g. to the class name). Lets domain-free tooling resolve an
     * instance's editor without an `instanceof` ladder.
     */
    readonly kind?: string;
    /**
     * `'layer'` if `targetLayerId` is set, otherwise `'canvas'`. Set automatically
     * from the constructor — subclasses don't need to re-declare.
     */
    readonly scope: 'layer' | 'canvas';
    /**
     * Whether the behaviour is **live**: the developer's flag ({@link enabled})
     * *and* the current interaction mode being one of {@link BehaviourOptions.modes}.
     * Subclasses gate their handlers on this (or {@link isEnabled}); only the base
     * writes it.
     */
    protected _enabled: boolean;
    protected ctx?: CanvasContext;
    /** The developer's enable flag — what {@link enabled} reports and snapshots capture. */
    private _wanted;
    /** `false` while the canvas's mode is outside {@link BehaviourOptions.modes}. */
    private _inMode;
    /** Releases the `viewMode` subscription, or `null` when not watching. */
    private _modeUnsub;
    /**
     * The construction options, merged in-place by {@link setOptions}. Named
     * `_options` (not `options`) so subclasses that expose a bespoke
     * `get options()` snapshot don't collide with it. Subclasses read their live
     * config from here (or from fields re-synced in {@link onOptionsChanged}).
     */
    protected _options: TOptions;
    /**
     * Release function for this behaviour's live gesture claim, or `null` when it
     * holds none. Held privately (not `protected`) so the only way to end a claim
     * is {@link releaseGesture} — which nulls the field *before* invoking it, so a
     * double release can't happen even under re-entrancy.
     */
    private _gestureRelease;
    constructor(opts: TOptions);
    /** The developer's enable flag. A behaviour suspended by its `modes` still reports `true`. */
    get enabled(): boolean;
    get isRegistered(): boolean;
    /** Called by `BehaviourRegistry.register(behaviour)`. Subscribes to inputs. */
    register(ctx: CanvasContext): void;
    /** Called by `BehaviourRegistry.unregister(id)`. Drops subscriptions. */
    destroy(): void;
    enable(): void;
    disable(): void;
    /**
     * Bring {@link _enabled} in line with `_wanted && _inMode`, running the
     * matching hook on a change. The single place a behaviour goes live or idle.
     */
    private syncLive;
    /** Is `mode` one this behaviour is live in? */
    private matchesMode;
    /**
     * Follow `view.interaction.viewMode` while registered and `modes` is set;
     * otherwise stop following and count as in-mode. Idempotent — `setOptions`
     * calls it again when `modes` changes.
     */
    private watchMode;
    private unwatchMode;
    /**
     * Merge a serialisable options patch and apply it live. Reflects an `enabled`
     * change by enabling/disabling, then calls {@link onOptionsChanged} so the
     * subclass can apply the rest (re-sync cached fields, re-arm a viewport
     * plugin, recompute). This is the seam the engine's
     * `canvas.update({ behaviours: { [id]: patch } })` path invokes — so a settings
     * editor can retune any behaviour without remounting it.
     *
     * Subclasses with bespoke apply logic (e.g. clearing selection state on a
     * mode change) override this and should call `super.setOptions(changes)` first
     * to keep `_options` — and thus {@link getOptions} — coherent.
     */
    setOptions(changes: Partial<TOptions>): void;
    /**
     * Apply an `enabled` option. While this instance is the one mounted under its
     * id, the toggle goes through the registry so `scene:behaviour:enable` /
     * `disable` and the gesture-conflict warning fire — calling {@link enable}
     * directly would leave the registry's own `setEnabled` (the engine's
     * `canvas.update` path) a silent no-op. Unmounted, or superseded by a newer
     * instance under the same id, it toggles itself directly.
     */
    private applyEnabled;
    /**
     * Replace {@link BehaviourOptions.modes} and re-evaluate liveness against the
     * current interaction mode. `undefined` = live in every mode.
     */
    setModes(modes: readonly string[] | undefined): void;
    /**
     * Merge `changes` into the options {@link getOptions} returns — and nothing
     * else: no enable / disable, no mode re-wiring, no {@link onOptionsChanged}.
     *
     * For subclasses that override {@link setOptions} with their own apply logic
     * and don't call `super`: call this first so `getOptions()` (a settings
     * editor's seed, the engine's undo baseline) stays current. Prefer it to
     * `super.setOptions` there: the engine routes `enabled` / `modes` through
     * the registry itself, and the base's direct `enable()` would pre-empt the
     * registry's `scene:behaviour:enable` event.
     */
    protected recordOptions(changes: Partial<TOptions>): void;
    /** Snapshot of the current (merged) options — seeds a settings editor. */
    getOptions(): Readonly<TOptions>;
    /**
     * Contribute this behaviour's serialisable config to a canvas-state snapshot
     * (the engine's `DefinitionSerializable` contract). The base implementation
     * captures the explicit `enabled` flag (rule 7). Subclasses with additional
     * JSON-serialisable options should override and spread `super.serializeDefinition()`.
     */
    serializeDefinition(): Record<string, unknown> | undefined;
    /** Subscribe to events / setup any handler resources. */
    protected abstract onRegister(ctx: CanvasContext): void;
    /** Cleanup on destroy. Default no-op. */
    protected onDestroy(_ctx: CanvasContext): void;
    /** Hook fired when the developer enables the behaviour. */
    protected onEnable(): void;
    /** Hook fired on disable. */
    protected onDisable(): void;
    /**
     * Hook fired after {@link setOptions} merges a patch (and after any `enabled`
     * toggle is applied). Default no-op. Override to apply an option change live:
     * a behaviour whose effect is wired in {@link onEnable} (a pixi-viewport
     * plugin, a DOM listener) re-arms here; one that caches option values in
     * fields re-syncs them from `this._options` here. `changes` is the raw patch;
     * `this._options` already holds the merged result.
     */
    protected onOptionsChanged(_changes: Partial<TOptions>): void;
    /**
     * Convenience `if (!enabled) return;` for use inside event handlers
     * (without rebinding `this` cost). `false` while suspended by `modes`.
     */
    protected get isEnabled(): boolean;
    /**
     * Take exclusive ownership of the pointer gesture for the duration of a drag
     * (`ctx.gestures`, see `input/GestureArbiter.ts`). Returns `false` when
     * another behaviour already owns it — the caller must then **not** start its
     * gesture, because two behaviours steering the same pointer is exactly what
     * the arbiter exists to prevent.
     *
     * Claiming also suspends camera panning: `DragPanBehaviour` watches the
     * arbiter and yields while anybody else owns the gesture. That replaces the
     * old `camera.viewport.plugins.pause('drag')` reach-through, which put a
     * `pixi-viewport` internal in the hands of domain behaviours.
     *
     * Pair every successful claim with {@link releaseGesture} on **every** exit
     * path — pointerup, pointercancel, abort. `disable()` and `destroy()` release
     * automatically as a backstop.
     */
    protected claimGesture(opts?: GestureClaimOptions): boolean;
    /**
     * End this behaviour's gesture claim. Safe to call any number of times and
     * when no claim is held — the arbiter identifies claims by token, so a stale
     * release can never evict a later owner.
     */
    protected releaseGesture(): void;
    /** Does this behaviour currently hold the gesture? */
    protected get hasGestureClaim(): boolean;
    /**
     * Re-run {@link onDisable} then {@link onEnable} when the behaviour is live, so
     * an option change wired at enable-time (a pixi-viewport plugin, a listener
     * bound with the old config) picks up `this._options`. No-op when disabled or
     * unregistered (the next {@link onEnable} will read the fresh options anyway).
     * The idiomatic body of an {@link onOptionsChanged} override for such
     * behaviours.
     */
    protected reArm(): void;
}

/**
 * `BehaviourRegistry` — stores Behaviours and toggles their enabled state.
 *
 * Architecture: see `architecture-proposal.md` §2.2.
 *
 * **Responsibilities**
 *   - `register` / `unregister` (with register / destroy lifecycle; fires
 *     `'scene:behaviour:register'` / `'scene:behaviour:unregister'`).
 *   - `setEnabled(id, enabled)` — toggles + fires `'scene:behaviour:enable'` /
 *     `'scene:behaviour:disable'`.
 *   - Typed `get<T>(id)`.
 *   - **Gesture-conflict warning**: when two enabled behaviours claim the same
 *     `shortcut`, log a `console.warn`. Doesn't enforce — the developer
 *     decides whether two behaviours can coexist on the same gesture.
 */

interface BehaviourRegistryOptions {
    getContext: () => CanvasContext | undefined;
    bus: CanvasEventBus;
}
declare class BehaviourRegistry {
    private readonly behaviours;
    private readonly getContext;
    private readonly bus;
    constructor(opts: BehaviourRegistryOptions);
    get size(): number;
    /**
     * Register a Behaviour. Wires it (`behaviour.register(ctx)` + events) now if
     * the Canvas is initialised; otherwise it's stored and wired later by
     * `registerAll()` (called by `Canvas.init`). Throws on duplicate id.
     *
     * When wiring throws (the behaviour rejects its context — a missing target
     * layer, a second instance of a one-per-layer kind), the entry is removed
     * before the error propagates, so a rejected behaviour never shows up in
     * {@link list} and its id stays free.
     */
    register(behaviour: IBehaviour): void;
    /** Wire every not-yet-registered behaviour. Called by `Canvas.init` (after layers mount). */
    registerAll(): void;
    /** `behaviour.register(ctx)` + the registered/enabled events. */
    private wire;
    /**
     * Remove a behaviour. Calls `destroy()`, then fires
     * `'scene:behaviour:unregister'` (after `'scene:behaviour:disable'` when it
     * was enabled). No-op if not registered.
     */
    unregister(id: string): void;
    /** Enable / disable a behaviour. Fires the corresponding bus event. */
    setEnabled(id: string, enabled: boolean): void;
    get<T extends IBehaviour = IBehaviour>(id: string): T | undefined;
    has(id: string): boolean;
    list(): readonly IBehaviour[];
    /** Tear down all behaviours. Called on Canvas destroy. */
    clear(): void;
    private warnOnShortcutConflict;
}

/**
 * `CommandRegistry` — named, serialisable-by-reference actions.
 *
 * Serialisable UI (control panels today; shortcuts and menus later) can't hold
 * closures, so it names what it does — `'camera.fit'`, `'view.lock'` — and this
 * registry resolves the name to behaviour at run time. Names are
 * `namespace.verb`; the engine registers its built-ins, a domain package or an
 * app adds its own.
 *
 * Generic over the context `C` a command runs against (the engine binds it to
 * its `Canvas`), so the kernel stays free of any engine type.
 */
/** One option of a pick-one command (see {@link CanvasCommand.options}). */
interface CommandOption {
    /** The value passed back to `run` as `args.value` when picked. */
    value: string;
    /** Human label. */
    label: string;
    /** Icon name, resolved by the UI kit's icon registry. */
    icon?: string;
}
/**
 * The value kinds a {@link CommandArgSpec} can describe. The first five are
 * plain JSON values; `layer` / `behaviour` / `layout` are the **id** of a
 * registered instance (an editor offers the live registry as choices); `json`
 * is any JSON value the editor can only take as text (maps, number lists).
 */
type CommandArgKind = 'string' | 'number' | 'boolean' | 'enum' | 'strings' | 'layer' | 'behaviour' | 'layout' | 'json';
/**
 * Describes one key of a command's `args` bag — plain data, so the kernel stays
 * UI-free; the UI kit maps it to a form field. Optional on every command: an
 * undescribed command (or key) is still editable as raw JSON.
 */
interface CommandArgSpec {
    /** The value's kind. */
    kind: CommandArgKind;
    /** Field label. Default: the key. */
    label?: string;
    /** One-line help shown under the field. */
    description?: string;
    /** The value the command uses when the key is absent — shown as a hint, never written. */
    default?: unknown;
    /** The allowed values, for `kind: 'enum'`. */
    options?: readonly CommandOption[];
    /**
     * The key a **pick-one** control supplies itself (`value` — see
     * {@link CanvasCommand.value}). An editor hides it on a `choice` item, where
     * picking sets it, and shows it on a button / toggle, where it's fixed.
     */
    pick?: boolean;
    /**
     * The command can't run without this key (`behaviour.toggle`'s `id`). A
     * surface that runs commands bare — the palette — leaves such commands out.
     * Default `false`: an absent key falls back to {@link default} or the
     * command's own behaviour.
     */
    required?: boolean;
}
/**
 * A **command map**: command name → the type of its `args` bag. A package
 * exports its commands' map as a type (`EngineCommandMap` in `@invana/canvas`,
 * `GraphCommandMap` in `@invana/graph`) and a registry typed with it
 * (`CommandRegistry<C, M>`) checks the args of those names at compile time —
 * types only, nothing at runtime. Any other name still takes `unknown` args, so
 * app-registered commands keep working. Merge maps with `&`.
 */
type CommandMap = object;
/** A command name: one of `M`'s (offered for completion), or any other string. */
type CommandName<M extends CommandMap> = (keyof M & string) | (string & {});
/**
 * The `args` type of command `K` in map `M` — `unknown` for a name `M` doesn't
 * list. An indexed access, not a conditional type, so a registry stays
 * covariant in its map: a `CommandRegistry<C, Wider>` is a
 * `CommandRegistry<C, Narrower>` (a subclass can widen `commands`' map).
 */
type CommandArgsOf<M extends CommandMap, K extends string> = (M & Record<string, unknown>)[K];
/**
 * A named command, run against a context `C`. `args` is whatever the caller's
 * spec carried (JSON); `A` narrows it for a command whose map entry is known.
 *
 * Its `isEnabled` / `isActive` / `value` / `options` may read anything; a bound
 * control re-reads them on view-store writes and on the registry's
 * {@link CommandRegistry.subscribe} signal. State outside the store needs an
 * owner-side {@link CommandRegistry.invalidate} bridge — see there.
 */
interface CanvasCommand<C, A = unknown> {
    /** Human label — a default tooltip when a spec doesn't give one. */
    label?: string;
    /**
     * Group a command palette / menu lists it under (`'Camera'`, `'Edit'`,
     * `'Layout'`, …). Data only — the kernel never reads it.
     */
    category?: string;
    /** Extra search terms a command palette matches besides the label and name. Data only. */
    keywords?: readonly string[];
    /**
     * The keys `args` may carry, described for editors (the Studio's control-panel
     * editor draws a field per key). In dev builds {@link CommandRegistry.run}
     * checks a described key's value against its `kind` and warns (never throws)
     * on a mismatch — see {@link CommandRegistryOptions.validateArgs}. Keys it
     * doesn't name still pass through unchecked.
     */
    args?: Readonly<Record<string, CommandArgSpec>>;
    /**
     * Perform the command. A command whose work finishes later (a layout run)
     * returns its promise, so {@link CommandRegistry.runAsync} can wait for it;
     * {@link CommandRegistry.run} ignores it.
     */
    run(ctx: C, args?: A): void | Promise<void>;
    /** Toggle state for toggle-style controls. Absent ⇒ never active. */
    isActive?(ctx: C, args?: A): boolean;
    /** Whether the command can run now. Absent ⇒ always enabled. */
    isEnabled?(ctx: C, args?: A): boolean;
    /**
     * Current value, for a **pick-one** command (select mode, edge type, active
     * layout). Picking an option runs the command with `{ ...args, value }`.
     * `null` when nothing is picked.
     */
    value?(ctx: C, args?: A): string | null;
    /** The options a pick-one command offers. A spec's own `options` take precedence. */
    options?(ctx: C, args?: A): CommandOption[];
}
/** Options for {@link CommandRegistry}. */
interface CommandRegistryOptions<C> {
    /** The context every command runs against (resolved lazily, per call). */
    getContext: () => C;
    /**
     * Check `args` against each command's {@link CanvasCommand.args} descriptors
     * in {@link CommandRegistry.run}, warning once per (command, key, problem) on
     * a mismatch. Never throws, never blocks the run. Default: on in dev builds
     * (`process.env.NODE_ENV !== 'production'`), off in production bundles.
     */
    validateArgs?: boolean;
}
/**
 * Holds {@link CanvasCommand}s by name and runs them against a bound context.
 *
 * `M` ({@link CommandMap}) types the args of the names it lists — `register`
 * (the handler's `args`), `run`, `isEnabled`, `isActive`, `value`, `options` —
 * while every other name takes `unknown` args. Unset, nothing is typed, and a
 * typed registry still passes where a `CommandRegistry<C>` is expected. Types
 * only: the registry behaves the same for any `M`.
 *
 * Registrations **stack** per name: registering a name that already exists
 * overrides it (a provider upgrading `graph.clear` to its undoable form, an app
 * replacing a built-in), and disposing an override restores whatever is
 * underneath — in any disposal order. {@link subscribe} listeners hear every
 * register / unregister and every {@link invalidate}, so a UI can re-read
 * command state.
 */
declare class CommandRegistry<C, M extends CommandMap = Record<never, never>> {
    /** Per name, the registrations oldest → newest; the last one is live. */
    private readonly stacks;
    private readonly listeners;
    /** Bumped on every {@link subscribe} signal — see {@link version}. */
    private _version;
    private readonly getContext;
    private readonly validateArgs;
    /** `command|key|problem` already warned about, so a bound button doesn't flood the console. */
    private readonly warned;
    constructor(opts: CommandRegistryOptions<C>);
    /**
     * Register `name`, overriding any existing registration. Returns a disposer
     * that removes **this** registration only: if it is live, the one underneath
     * becomes live again; if it was already overridden, the override stays.
     */
    register<K extends CommandName<M>>(name: K, command: CanvasCommand<C, CommandArgsOf<M, K>>): () => void;
    /** Remove every registration of `name`. No-op when absent. */
    unregister(name: string): void;
    has(name: string): boolean;
    /** The live (most recent) registration of `name`. */
    get(name: string): CanvasCommand<C> | undefined;
    /** Registered command names, in first-registration order. */
    list(): string[];
    /**
     * Run `name` with `args`. Returns `false` (and does nothing) when the command
     * is missing or disabled. With `validateArgs` on, first warns about any
     * described key whose value doesn't fit its descriptor — the run proceeds
     * regardless.
     */
    run<K extends CommandName<M>>(name: K, args?: CommandArgsOf<M, K>): boolean;
    /**
     * {@link run}, awaiting the command's work: resolves once the promise a
     * command's `run` returned settles (`layout.run` resolves when the layout
     * run ends). Resolves `false` — without running anything — when the command
     * is missing or disabled; a synchronous command resolves `true` at once. A
     * playbook step's `do` verbs go through here, so each finishes before the
     * next starts.
     */
    runAsync<K extends CommandName<M>>(name: K, args?: CommandArgsOf<M, K>): Promise<boolean>;
    /** `isActive` of `name`; `false` when missing or not a toggle. */
    isActive<K extends CommandName<M>>(name: K, args?: CommandArgsOf<M, K>): boolean;
    /** `isEnabled` of `name`; `false` when missing, `true` when it declares no check. */
    isEnabled<K extends CommandName<M>>(name: K, args?: CommandArgsOf<M, K>): boolean;
    /** `value` of a pick-one command; `null` when missing or not a picker. */
    value<K extends CommandName<M>>(name: K, args?: CommandArgsOf<M, K>): string | null;
    /** `options` of a pick-one command; `[]` when missing or it declares none. */
    options<K extends CommandName<M>>(name: K, args?: CommandArgsOf<M, K>): CommandOption[];
    /**
     * Tell subscribers that command state changed **outside** the view store (a
     * history stack, a clipboard buffer, a layer's edge defaults, a registry), so
     * a bound control re-reads `isEnabled` / `isActive` / `value` / `options`.
     *
     * Call it from the state's **owner** — a bridge from the owner's own change
     * signal, set up once (the engine bridges the registries, layer visibility and
     * `canvas.history`; `GraphCanvas` its layers' edge templates; a provider its
     * own history / clipboard) — never from the write sites, where another
     * writer would forget it. A command whose state lives in the view store
     * needs none.
     */
    invalidate(): void;
    /**
     * A counter bumped on every {@link subscribe} signal (register, unregister,
     * dispose, {@link invalidate}, {@link clear}) — and only then. Use it as a
     * `useSyncExternalStore` snapshot when a UI must re-read *everything* on a
     * signal: a snapshot derived from `list()` stays equal when only a command's
     * `options` / state changed, and React would skip the re-render.
     */
    get version(): number;
    /** Hear every register / unregister / {@link invalidate}. Returns an unsubscribe. */
    subscribe(listener: () => void): () => void;
    /** Drop every command and listener. */
    clear(): void;
    /** Warn (once each) about `args` values that don't fit `specs`. */
    private checkArgs;
    private warn;
    private notify;
}

/**
 * `Layout` — function from data to positions.
 *
 * Architecture: see `architecture-proposal.md` §2.3.
 *
 * Per the proposal:
 *  - A Layout does NOT register with the canvas.
 *  - It does NOT render.
 *  - It does NOT subscribe to input.
 *  - You instantiate it and call it against a layer.
 *
 *      const layout = new D3ForceLayout({ charge: -300 });
 *      layout.events.on('end', () => canvas.camera.fitContent(...));
 *      await layout.apply(graphLayer);
 *
 * Continuous-running cases (e.g. always-relax force simulation) are handled
 * by a thin wrapper Behaviour that calls `apply()` on a tick — keeps the
 * Layout API clean while supporting the rare continuous case.
 *
 * Whether two layouts conflict is a domain concern (don't apply two layouts
 * to the same data) — not enforced here.
 *
 * ## Lifecycle events
 *
 * Every layout owns a typed `events` emitter and fires three lifecycle
 * events around `apply()`:
 *
 *  - `start` — emitted once, synchronously, after the layout has set up
 *    its internal state and just before it begins producing positions.
 *  - `tick` — emitted whenever the layout writes a fresh batch of positions.
 *    One-shot layouts (e.g. ELK) fire it once. Iterative layouts (force
 *    sims) fire it on every iteration. High-frequency; subscribe sparingly.
 *  - `end` — emitted once when the run terminates. `reason` distinguishes
 *    a natural settle from an external `stop()` call.
 *
 * Subscribe to these events to drive camera fits, progress UI, etc. —
 * instead of listening to per-tick `data:changed` on the layer, which
 * conflates "structure changed" with "positions updated".
 */

/**
 * Why the run ended.
 *
 *  - `completed` — the layout settled / finished on its own.
 *  - `stopped`   — `stop()` (or a second `apply()`) cancelled it.
 */
type LayoutEndReason = 'completed' | 'stopped';
/**
 * Lifecycle events fired by every `Layout`.
 *
 * Subclass-specific telemetry (e.g. d3-force's `alpha`) belongs on a
 * subclass-specific event map, not here.
 */
type LayoutEvents = {
    /**
     * Run is about to produce positions. Optional run-size / animation metadata
     * lets a `Canvas.runLayout` bridge forward it onto the canvas bus as
     * `layout:run:start` without reaching into layer internals. Every field is
     * optional — a layout that doesn't know (or care) emits `{}`, and the bridge
     * substitutes `0` / `false`.
     *
     *  - `nodeCount` / `edgeCount` — size of the run, for progress UIs / telemetry.
     *  - `animate` — whether the run animates its settle (iterative force sims)
     *    vs. jumps straight to final positions; render policies branch on it.
     */
    start: {
        nodeCount?: number;
        edgeCount?: number;
        animate?: boolean;
    };
    tick: Record<string, never>;
    /**
     * A position **transition** advanced one frame — a one-shot layout gliding
     * nodes from where they were to where the run put them. `progress` is the
     * **eased** fraction of the glide, `0..1`, and reaches exactly `1` on the
     * last frame (before `end`). A run that snaps emits none.
     *
     * Separate from `tick` on purpose: `tick` means "the layout placed nodes",
     * and fitters react to it as such; this is per-frame motion, which a
     * {@link LayoutRunOptions.fitCamera} run follows with the camera.
     */
    transition: {
        progress: number;
    };
    end: {
        reason: LayoutEndReason;
    };
};
/**
 * How one layout run should behave — passed per call to {@link Layout.apply}
 * (and `Canvas.runLayout`), as opposed to {@link LayoutOptions}, which are the
 * layout's standing configuration.
 *
 * Both fields describe a **re-flow** the user did not ask for directly — e.g.
 * `CollapseExpandBehaviour` re-running the active layout after a group frame
 * opens or closes — where the point is to keep the picture steady.
 */
interface LayoutRunOptions {
    /**
     * Keep this node where it is on screen. The run computes positions as usual,
     * then shifts the whole result so this node's box centre stays where it was;
     * everything else re-flows around it. Honoured by layouts that support it
     * (the one-shot layouts and `D3ForceLayout`); ignored by the rest.
     */
    anchorNodeId?: string;
    /**
     * Leave the camera alone for this run. Fitters that normally re-frame the
     * view when a layout ends (the `fitOnLoad` auto-fitter, the React layout
     * wrappers' `fitPadding`) skip a run carrying this flag.
     */
    preserveCamera?: boolean;
    /**
     * Frame the result, moving the camera **together with** the nodes. While
     * the run's position transition plays, `Canvas.runLayout` blends the camera
     * from where it started toward a fit of the content as it is on that frame
     * (by the transition's eased progress), so the picture stays framed the
     * whole way and ends exactly fitted — no glide under a stale camera
     * followed by a snap. A run that snaps (or a layout that reports no
     * `transition`) gets one fit when it ends. A user pan / zoom mid-run takes
     * the camera and stops the follow.
     *
     * `true` fits with the default padding (80 screen px); `{ padding }` sets
     * it. Fitters that would otherwise frame on `end` (the `fitOnLoad`
     * auto-fitter, the React layout wrappers' `fitPadding`) skip such a run —
     * it already owns the camera. Ignored when {@link preserveCamera} is set.
     */
    fitCamera?: boolean | {
        padding?: number;
    };
}
/**
 * How an **active** layout re-runs when its target layer's data changes
 * (nodes added / removed / hidden / shown). Read by the facade that wires the
 * active layout (`GraphCanvas`) each time it re-runs, so assigning
 * {@link Layout.onData} takes effect on the next change.
 */
interface LayoutDataRunOptions {
    /**
     * At most one data-triggered run per this many ms: the first change runs at
     * once, later ones inside the window collapse into one run at its end — so
     * a feed writing every tick doesn't restart the layout every tick. Default
     * `0` (every change runs).
     */
    throttleMs?: number;
    /**
     * Leave the camera alone on data-triggered runs
     * ({@link LayoutRunOptions.preserveCamera}) — the view doesn't re-frame each
     * time the data changes. Default `false`.
     */
    preserveCamera?: boolean;
}
/** Construction options every layout shares (for the `LayoutRegistry`). */
interface LayoutOptions {
    /** Stable id, used to address the layout in a `LayoutRegistry` / config. Default `'layout'`. */
    id?: string;
    /** The layer this layout is meant to run against. Informational — `apply(layer)` still takes one explicitly. */
    targetLayerId?: string;
    /** How data-triggered re-runs behave while this layout is active. See {@link LayoutDataRunOptions}. */
    onData?: LayoutDataRunOptions;
}
declare abstract class Layout<TLayer extends Layer<any, any, any, any> = Layer<any, any, any, any>> {
    /** Stable id (registry / config key). */
    readonly id: string;
    /** The layer this layout targets, if declared at construction. */
    readonly targetLayerId?: string;
    /**
     * Stable **class kind** — a minification-safe discriminator matching the
     * `@invana/canvas-ui` settings-editor registry key (e.g. `'d3-force-layout'`,
     * `'elk-layout'`). Distinct from {@link id} (the per-instance key): all
     * `D3ForceLayout` instances share `kind: 'd3-force-layout'`. Concrete layouts
     * set it as a class field; left `undefined` on any that haven't, so consumers
     * fall back (e.g. to the class name). Lets domain-free tooling resolve an
     * instance's editor without an `instanceof` ladder.
     */
    readonly kind?: string;
    /**
     * Lifecycle event bus. See class docs for the event vocabulary.
     * Subclasses with richer telemetry can declare their own typed
     * emitter on top (`override readonly events = new EventEmitter<MyEvents>()`).
     */
    readonly events: EventEmitter<LayoutEvents>;
    /**
     * Options of the run in flight, or of the last one once it has ended.
     * Implementations record them at the top of {@link apply}, so an `end`
     * listener can tell what kind of run just finished — e.g. a fitter skipping
     * a {@link LayoutRunOptions.preserveCamera} run.
     */
    runOptions: Readonly<LayoutRunOptions>;
    /**
     * How data-triggered re-runs behave while this layout is active (throttle,
     * keep the camera). Mutable: the wiring reads it on every data change.
     */
    onData: LayoutDataRunOptions;
    constructor(opts?: LayoutOptions);
    /**
     * Live-reconfigure. Called by `Canvas.update({ layouts: { id: patch } })`.
     * Default no-op; iterative layouts (e.g. `D3ForceLayout`) override to merge
     * the patch and re-heat a running simulation.
     */
    setOptions(_patch: unknown): void;
    /**
     * Contribute this layout's serialisable config to a canvas-state snapshot (the
     * engine's `DefinitionSerializable` contract). The base captures the wiring
     * `targetLayerId`; iterative layouts holding tunable params (e.g. force
     * strengths) should override and spread `super.serializeDefinition()` with a
     * JSON-safe copy of those params.
     */
    serializeDefinition(): Record<string, unknown> | undefined;
    /**
     * Run the layout against `layer`. Resolves when the run terminates
     * (either a natural settle or an external `stop()`).
     *
     * Calling `apply()` again on the same instance must cancel any in-flight
     * run first, and must record `run` on {@link runOptions} before emitting
     * `start`.
     *
     * @param run How this particular run should behave; see {@link LayoutRunOptions}.
     */
    abstract apply(layer: TLayer, run?: LayoutRunOptions): Promise<void>;
}

/**
 * `CanvasContext` — the shared service surface every Layer / Behaviour /
 * Layout receives at mount/register time.
 *
 * Architecture: see `architecture-proposal.md` §2.4.
 *
 * **One context, three audiences.** Per the proposal, there is no separate
 * `LayerContext` / `BehaviourContext` / `LayoutContext` — the same shape is
 * handed to every participant so cross-cutting access (read peer layers,
 * fire camera moves, tap telemetry) doesn't need three parallel context types.
 *
 * The `Canvas` builds a concrete object that satisfies this interface and
 * passes it down. Tests can construct a stub by satisfying these fields.
 */

interface CanvasContext {
    /** Layer registry — `add / remove / get<T>(id) / list / byZOrder`. */
    readonly layers: LayerRegistry;
    /**
     * Behaviour registry — `register / setEnabled / get<T>(id) / list`.
     * Behaviours never auto-enable; the developer registers + enables explicitly
     * (`architecture-proposal.md` §2.2).
     */
    readonly behaviours: BehaviourRegistry;
    /** Camera — pan/zoom/projection. Wraps a `pixi-viewport` `Viewport`. */
    readonly camera: Camera;
    /**
     * Pointer-gesture arbitration — at most one owner at a time. A behaviour that
     * needs the pointer to itself (drag, lasso, brush, resize, edge draw) claims
     * it here rather than suspending the camera's pan plugin behind its back;
     * `DragPanBehaviour` yields whenever `gestures.owner` names somebody else.
     *
     * Behaviours should reach for `Behaviour.claimGesture` /
     * `Behaviour.releaseGesture` instead of calling this directly — the base class
     * releases on `disable()` / `destroy()`, and a stranded claim would freeze
     * both the camera and every other gesture.
     */
    readonly gestures: GestureArbiter;
    /** Canvas-wide event bus + telemetry tap channel. */
    readonly events: CanvasEventBus;
    /**
     * The renderer-free kernel (`@invana/canvas-store`) — `view` (reactive config +
     * interaction state), `data` (bulk per-source stores), `events`, `theme`,
     * history. The cross-cutting handle for the state migration: layers
     * read/subscribe `store.data[id]` + `store.view`; behaviours write interaction
     * via `store.view.update(...)`. During M0 the engine mirrors its config into
     * `store.view.definition` (see `Canvas.update`).
     */
    readonly store: CanvasStore;
    /**
     * The active theme channel. A single publisher (the domain `ThemeBehaviour`)
     * calls `theme.set(...)`; theme-aware layers read `theme.current()` and/or
     * subscribe to the `'theme:change'` event to recolour. `current()` is `null`
     * until a theme is first published.
     */
    readonly theme: ThemeState;
    /**
     * The underlying HTMLCanvasElement when running in DOM mode (`Canvas.init`).
     * Undefined for `Canvas.initWithStage` (headless / test path). Layers that
     * overlay DOM content above the canvas — `DevInfoLayer`, tooltips, popovers —
     * read this to find a parent element and to attach native DOM listeners.
     */
    readonly canvasElement?: HTMLCanvasElement;
    /**
     * The canvas's named commands (`canvas.commands`) — for an extension that
     * dispatches by name, such as a keyboard-shortcut behaviour. Optional so a
     * hand-built context (a test double) needn't supply one.
     */
    readonly commands?: CommandRegistry<unknown>;
    /**
     * The canvas's operation log — the record behind `canvas.history`. A data
     * layer attaches its store here on mount (`GraphStore.attachLog`) so the
     * store's recorded writes and the view's edits land in one undo order.
     * Optional so a hand-built context (a test double) needn't supply one.
     */
    readonly log?: OperationLog;
    /**
     * Build a patch-emitting {@link ReactiveStore} — the factory behind
     * `Layer.state`. Injected by the engine (which implements it with the
     * kernel's `createReactiveStore`) because this package is dependency-free
     * and cannot construct a store itself; the seam is also what makes the
     * backend swappable (a collaborative canvas injects a Yjs-backed factory).
     */
    createStateStore<T extends object>(initial: T): ReactiveStore<T>;
    /**
     * A drawing device for a **transient** visual — a lasso, a brush rectangle, a
     * drag ghost. Not for layer content: anything durable is a spec in the store
     * (`docs/renderer-split-design.md` §3).
     *
     * Available to behaviours as well as layers, because a gesture overlay belongs
     * to the gesture, not to any one layer.
     */
    createOverlay(label: string, space?: OverlaySpace): IOverlayDevice;
    /**
     * A layer's slice of the renderer — its drawing device, overlays, visibility
     * and paint order. Replaces the layer bases constructing a pixi `Container`
     * themselves, and is the seam a second backend implements
     * (`docs/renderer-split-design.md` §4).
     */
    createSurface(space: SurfaceSpace, id: string, opts?: SurfaceOptions): ISurface;
    /**
     * Show a transient message on the shared canvas message channel — the same
     * call as `Canvas.showMessage`. Lets layers / behaviours / layouts surface a
     * status line (e.g. a layout announcing "Running…" on start) without reaching
     * for the bus directly. `timeout` (ms) auto-clears it.
     */
    showMessage(text: string, timeout?: number): void;
    /** Clear the current canvas message. */
    clearMessage(): void;
    /**
     * Re-run the canvas's **active** layout (`definition.activeLayout`) — the
     * same call as `Canvas.runLayout(activeLayout, run)`. Lets a behaviour ask
     * for a re-flow without knowing which layout is showing (e.g.
     * `CollapseExpandBehaviour` after a group frame opens or closes). Resolves
     * once the run settles; resolves immediately when no layout is active.
     *
     * Optional so hand-built contexts (tests, the headless double) need not
     * provide it — callers use `ctx.runActiveLayout?.(…)`.
     */
    runActiveLayout?(run?: LayoutRunOptions): Promise<void>;
    /**
     * Resolve on the first frame on which the canvas is **settled**: no layout
     * run in flight (its position transition included) and no camera glide.
     * Waits at least one frame, so writes made just before the call have
     * flushed. Resolves anyway after `timeoutMs` (default 15 000) so a
     * never-ending simulation can't hold a caller forever.
     *
     * What a playbook step and `FocusBehaviour`'s framing wait on. Not on the
     * public `Canvas` surface. Optional so hand-built contexts need not provide
     * it — callers use `ctx.whenSettled?.()`.
     */
    whenSettled?(opts?: {
        timeoutMs?: number;
    }): Promise<void>;
}

/**
 * A scoped {@link EventEmitter} stamped with an {@link EventSource}. When connected
 * to a bus via {@link setBus}, every emit is **also** forwarded to the bus tap as a
 * structured envelope — so a store/layer/behaviour's own events reach the
 * canvas-wide tap (telemetry / collaboration) without each one re-plumbing.
 *
 * Local `on(...)` subscribers still get the raw typed payload as usual.
 */
declare class SourceEmitter<M extends object> extends EventEmitter<M> {
    readonly source: EventSource;
    private bus;
    constructor(source: EventSource);
    /** Connect (or disconnect with `null`/`undefined`) this emitter's stream to a bus tap. */
    setBus(bus: CanvasEventBus | null | undefined): void;
    emit<K extends keyof M>(type: K, payload: M[K]): void;
}

/**
 * `DirtyBatcher<TBucket>` — accumulates "this id changed" signals between frames,
 * deduplicates them, and hands a per-frame snapshot to a flush callback.
 *
 * Relocated into `@invana/canvas-store` (decision D1) alongside {@link ColumnStore}
 * — the renderer-free machinery behind the kernel's coalesced data flush. Pure;
 * **no rendering, no pixi, no `requestAnimationFrame` of its own** — the owner
 * (the engine's single rAF loop) calls {@link flush} once per tick.
 *
 * **Performance contract:** `mark` O(1) (Map.get + Set.add, no steady-state
 * alloc); `markAll` O(1) (a flag); `flush` O(1) (Map swap, no copy). Per-frame
 * consumer work is proportional to *changed* ids, never total scene size. Sets are
 * reused across frames (double-buffered) — zero GC pressure in steady state.
 *
 * **Double buffering:** `flush()` returns a snapshot of the previous frame's marks
 * and swaps in the empty buffer, so any `mark()` during the consumer's handler
 * lands in the *next* frame — never corrupts the iteration in flight.
 */
/**
 * The snapshot handed to the flush handler. `buckets` is keyed by bucket name →
 * the Set of dirty ids this frame (untouched buckets are absent). `rebuildAll` is
 * the set of buckets flagged via {@link DirtyBatcher.markAll} — for those, iterate
 * the underlying data, not the per-id Set.
 */
interface DirtySnapshot<TBucket extends string = string> {
    readonly buckets: ReadonlyMap<TBucket, ReadonlySet<string>>;
    readonly rebuildAll: ReadonlySet<TBucket>;
}
declare class DirtyBatcher<TBucket extends string = string> {
    private active;
    private buffer;
    private _dirty;
    /** Mark a single id dirty in a bucket. O(1); bucket Sets are created lazily + reused. */
    mark(bucket: TBucket, id: string): void;
    /** Flag a whole bucket for rebuild (theme change, LOD swap, wholesale replace). */
    markAll(bucket: TBucket): void;
    /** Cheap check the tick uses to decide whether to call {@link flush}. */
    hasPending(): boolean;
    /**
     * Swap buffers and return the previous frame's snapshot. The returned Sets are
     * still owned by the batcher — **do not retain references past the flush call**;
     * the next `flush()` reuses and clears them.
     */
    flush(): DirtySnapshot<TBucket>;
    /** Drop both buffers. Call on unmount; usable again afterwards. */
    reset(): void;
    /** Number of dirty ids in a bucket (0 if never touched). Debug. */
    bucketSize(bucket: TBucket): number;
    /** True iff the bucket is flagged for rebuild this frame. Debug. */
    isRebuildAll(bucket: TBucket): boolean;
}

/**
 * `Layer` — base class for everything composable onto `canvas.layers`.
 *
 * Architecture: see `architecture-proposal.md` §2.1.
 *
 * **What every Layer owns:**
 *   - `id` — stable identifier; used by registries, events, telemetry envelopes.
 *   - `options` — construction-time, mostly-immutable config.
 *   - `state` — UI / interaction state (`ReactiveStore<T>` from the kernel; small,
 *     observable, and — because it goes through the port — patch-emitting, so
 *     history, telemetry and a future CRDT backend all see it.
 *   - `events` — typed `SourceEmitter` that auto-forwards to the canvas tap.
 *   - `dirty` — `DirtyBatcher` for per-frame batched flush.
 *   - `visible` / `hittable` / `zIndex` / `cullable` — composition flags.
 *
 * **Lifecycle:** `mount(ctx)` → … → `unmount()`. `Canvas` calls these via the
 * `LayerRegistry`. `flush()` is called once per Canvas tick when
 * `dirty.hasPending()` is true.
 *
 * **Bulk hot data (`data`)** is NOT on the base class — it lives on subclasses
 * that need it (e.g. `GraphLayer` ships `GraphNodeStore`). See
 * `architecture-proposal.md` §2.1 for the bifurcated state/data model.
 *
 * **What subclasses provide:**
 *   - `createState()` — initial UI state.
 *   - `applyDirty(snap)` — translate dirty buckets → renderer commands.
 *   - `onMount()` / `onUnmount()` — domain-specific setup/teardown
 *     (subscribe to feeds, register decorations, etc.).
 *   - `WorldLayer` / `ScreenLayer` add `hitTest(coord, coord)`.
 */

/**
 * The subset of `Layer` the `LayerRegistry` and `Canvas.tick` interact with.
 * Lets the registry stay decoupled from the abstract class implementation.
 */
interface ILayer {
    readonly id: string;
    visible: boolean;
    hittable: boolean;
    zIndex: number;
    cullable: boolean;
    /** `true` between `mount(ctx)` and `unmount()`. Lets the registry skip already-mounted layers. */
    readonly mounted: boolean;
    mount(ctx: CanvasContext): void;
    unmount(): void;
    flush(): void;
    hasPending(): boolean;
    redraw(): void;
    setVisible(visible: boolean): void;
}
interface LayerOptions<TOptions = unknown> {
    id: string;
    options: TOptions;
    visible?: boolean;
    hittable?: boolean;
    zIndex?: number;
    /**
     * Off-screen culling participation. Default `true`. Set `false` for
     * full-canvas effect layers (background gradient, overlay) that should
     * always render regardless of camera visibility.
     */
    cullable?: boolean;
}
declare abstract class Layer<TOptions = unknown, TState extends object = object, TEvents extends EventMap = EventMap, TDirtyBucket extends string = string> implements ILayer {
    readonly id: string;
    /**
     * Stable **class kind** — a minification-safe discriminator matching the
     * `@invana/canvas-ui` settings-editor registry key (e.g. `'background-layer'`,
     * `'minimap-layer'`). Distinct from {@link id} (the per-instance key): all
     * `BackgroundLayer` instances share `kind: 'background-layer'`. Concrete layers
     * set it as a class field; left `undefined` on any that haven't, so consumers
     * fall back (e.g. to the class name). Lets domain-free tooling resolve an
     * instance's editor without an `instanceof` ladder.
     */
    readonly kind?: string;
    readonly options: TOptions;
    readonly events: SourceEmitter<TEvents>;
    readonly dirty: DirtyBatcher<TDirtyBucket>;
    /**
     * Backing field for {@link state}. Created on **first mount** via
     * `ctx.createStateStore` (the engine injects the reactive-store factory — this
     * package is dependency-free and cannot construct one), then kept for the
     * layer's lifetime: a remount reuses the same store, preserving state.
     */
    private _state?;
    /**
     * UI / interaction state (`ReactiveStore<TState>`). Because it is built
     * through the injected kernel factory, every write emits patches and history /
     * telemetry / a future CRDT backend all observe it.
     *
     * **Available from `mount()` onward** — accessing it before the first mount
     * throws. (`createState()` is also called at first mount, so it may safely
     * read subclass fields initialised in the subclass constructor.)
     */
    get state(): ReactiveStore<TState>;
    /** Backing field for the `visible` accessor. */
    private _visible;
    hittable: boolean;
    zIndex: number;
    cullable: boolean;
    /**
     * Whether this layer renders. Setting `false` hides the layer's pixi
     * container (via `onVisibleChange`, overridden by `WorldLayer` /
     * `ScreenLayer`) and the Canvas tick skips its flush.
     */
    get visible(): boolean;
    set visible(value: boolean);
    /**
     * Toggle whole-layer visibility, repaint, and announce it. Unlike assigning
     * `visible` (which only hides the pixi container via {@link onVisibleChange}),
     * this also forces a {@link redraw} and emits `scene:layer:visibilitychange`
     * on the canvas bus so dependent layers (minimap) and the render loop react
     * automatically. No-op if the value is unchanged.
     */
    setVisible(visible: boolean): void;
    /** Set by `mount(ctx)`; cleared by `unmount()`. */
    protected ctx?: CanvasContext;
    /** True between `mount` and `unmount`. */
    get mounted(): boolean;
    constructor(opts: LayerOptions<TOptions>);
    mount(ctx: CanvasContext): void;
    unmount(): void;
    /** Convenience accessor; throws when called pre-mount. */
    protected get context(): CanvasContext;
    /** Whether `flush()` has work to do this frame. */
    hasPending(): boolean;
    /**
     * Called by Canvas tick when `hasPending()` is true. Swaps the dirty
     * snapshot, hands it to `applyDirty`. Subclasses normally don't override.
     */
    flush(): void;
    /**
     * Force a full repaint of this layer from its current state, bypassing the
     * per-frame dirty path. Base implementation is a no-op — only layers that
     * mount a renderer override it (e.g. `GraphLayer.redraw` re-renders every
     * node and edge). Driven by {@link Canvas.redraw}; reach for it after an
     * external change that sidestepped the normal mutate-and-flush path (theme
     * swap, palette change) or to recover from a suspected render desync.
     */
    redraw(): void;
    /** Build the initial UI / interaction state. Called once in the constructor. */
    protected abstract createState(): TState;
    /**
     * Translate a dirty snapshot into renderer / pixi commands.
     * Default: no-op. Override when the layer batches work via `dirty.mark(...)`.
     */
    protected applyDirty(_snap: DirtySnapshot<TDirtyBucket>): void;
    /** Domain-specific mount setup (subscribe to peers, attach renderer, etc.). */
    protected onMount(_ctx: CanvasContext): void;
    /** Domain-specific unmount teardown. */
    protected onUnmount(_ctx: CanvasContext): void;
    /**
     * Called whenever `visible` changes (setter only — not on initial
     * construction). Subclasses override to keep their pixi container's
     * `.visible` in sync. Default: no-op.
     */
    protected onVisibleChange(_value: boolean): void;
}

/**
 * `LayoutRegistry` — stores the Layouts registered on a Canvas, addressed by id.
 *
 * Simpler than `LayerRegistry` / `BehaviourRegistry`: layouts aren't mounted,
 * z-ordered, or wired to input — they're held so `Canvas.update()` can push
 * config to them by id and consumers can fetch + `apply()` them. A graph runs
 * one layout at a time, but several may be registered (e.g. a layout picker).
 */

interface LayoutRegistryOptions {
    bus: CanvasEventBus;
}
declare class LayoutRegistry {
    private readonly layouts;
    private readonly bus;
    constructor(opts: LayoutRegistryOptions);
    get size(): number;
    /** Register a layout. Fires `layout:added`. Throws on duplicate id. */
    add(layout: Layout): void;
    /** Remove a layout, stopping it first if it exposes `stop()`. Fires `layout:removed`. */
    remove(id: string): void;
    get<T extends Layout = Layout>(id: string): T | undefined;
    has(id: string): boolean;
    list(): readonly Layout[];
    /** Stop + drop every layout. Called on Canvas destroy. */
    clear(): void;
}

/**
 * `ICameraBinding` with no backend behind it.
 *
 * The projection math mirrors the engine's coordinate model exactly
 * (`screen = world * zoom + offset`), so camera semantics — clamping, anchored
 * zoom, fit, the bus and store sync — are exercisable with no GPU.
 * `emitTransformChange` simulates a backend-driven gesture (a wheel tick, a
 * momentum glide), the one path `Camera` cannot trigger itself.
 *
 * Shipped rather than test-only: §7 keeps a headless backend deliberately, so
 * consumers can test layouts, picking and projection without a renderer.
 */

declare class HeadlessCameraBinding implements ICameraBinding {
    private t;
    private screenWidth;
    private screenHeight;
    private readonly changeListeners;
    private readonly dragStartListeners;
    /** Every `configureInput` patch received, in order — for asserting input wiring. */
    readonly inputConfigs: CameraInputConfig[];
    /** Latest `setDragSuspended` value. */
    dragSuspended: boolean;
    /** Accumulated `tick` time, to prove the engine drives the clock. */
    tickedMs: number;
    constructor(screenWidth?: number, screenHeight?: number);
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
    /** Simulate a backend-driven transform change (wheel, drag, momentum). */
    emitTransformChange(t: CameraTransformValue, kind: CameraChangeKind): void;
    /** Simulate the backend reporting the start of a drag-pan. */
    emitDragStart(): void;
}

/**
 * `HeadlessRenderer` — a complete `IRenderer` that draws nothing.
 *
 * Not a product renderer: a **test double**, kept deliberately (§7) so layouts,
 * picking, bounds, spec projection and the whole layer / behaviour lifecycle can
 * be exercised with no GPU and no DOM. It is why `@invana/canvas` needs a
 * drawing library neither as a dependency nor a devDependency.
 *
 * It doubles as the reference for how small the contract really is: if a new
 * feature means adding a method here that cannot be implemented without pixels,
 * that method belongs on a concrete backend, not on `IRenderer`.
 *
 * ```ts
 * const canvas = new Canvas();
 * canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
 * ```
 */

/**
 * An `IElementRenderer` that tracks which ids exist and their specs, and
 * answers geometry from the spec alone. Enough for a layer test to assert that
 * elements were mounted, moved and removed.
 */
declare class HeadlessElementRenderer implements IElementRenderer {
    readonly events: EventEmitter<ElementEventMap>;
    readonly shapes: Map<string, {
        kind: string;
        x: number;
        y: number;
    }>;
    readonly connectors: Set<string>;
    readonly shapeKinds: Set<string>;
    registerShape(kind: string): void;
    getShapeKind(id: string): string | undefined;
    hasShape(id: string): boolean;
    hasConnector(id: string): boolean;
    addShape(id: string, spec: {
        kind: string;
        x?: number;
        y?: number;
    }): void;
    updateShape(id: string, patch: {
        x?: number;
        y?: number;
    }): void;
    removeShape(id: string): void;
    addConnector(id: string): void;
    updateConnector(): void;
    removeConnector(id: string): void;
    moveShape(id: string, x: number, y: number): void;
    getShapePosition(id: string): {
        x: number;
        y: number;
    } | null;
    /**
     * Display overrides by shape id — recorded so a test can assert what a
     * behaviour asked to draw. Nothing is drawn, and positions stay logical.
     */
    readonly displayOverrides: Map<string, ShapeDisplayOverride>;
    setShapeDisplayOverride(id: string, override: ShapeDisplayOverride | null): void;
    clearShapeDisplayOverrides(): void;
    /**
     * Ids whose text the LOD channel has hidden (`setShapeTextVisible` /
     * `setConnectorTextVisible` with `false`) — recorded so a behaviour test can
     * assert what a text LOD asked for.
     */
    readonly textHidden: Set<string>;
    setShapeTextVisible(id: string, visible: boolean): void;
    setConnectorTextVisible(id: string, visible: boolean): void;
    isTextVisible(id: string): boolean;
    /** The label-size policy last pushed per target — recorded for assertions. */
    readonly labelSizePolicies: Record<LabelSizeTarget, LabelSizePolicy | null>;
    setLabelSizePolicy(target: LabelSizeTarget, policy: LabelSizePolicy | null): void;
    scaleShape(): void;
    setConnectorStroke(): void;
    scaleConnectorStroke(): void;
    setRaised(): void;
    setShapeIconVisible(): void;
    setShapeImageVisible(): void;
    setLabelsResolution(): void;
    setVisibleSet(): void;
    cull(): void;
    uncull(): void;
    setDecoration(): void;
    setEffect(): void;
    getDecoration(): undefined;
    setDecorationVisible(): void;
    getDecorationWorldBounds(): null;
    setBadge(): void;
    removeBadge(): void;
    getShapeWorldBounds(): null;
    getShapeCenter(): null;
    getConnectorPolyline(): null;
    connectorGeometryUnchanged(): boolean;
    /**
     * Pure geometry, answered for real: the kernel's spec-geometry covers every
     * built-in kind, so a headless canvas measures node footprints exactly like
     * a drawing backend would (`GraphLayer.boundsOfNode`, minimap estimates,
     * ELK size queries — and `getBounds()`'s store-derived fit box — all work
     * with no GPU). `undefined` only for unregistered third-party kinds.
     */
    boundsOfSpec(spec: {
        readonly kind: string;
    }): Rect | undefined;
    scaleShapeSpec(): undefined;
    collapsedShapeSpec(): undefined;
    fitShapeSpecToContent(): undefined;
    measureLabel(): null;
    hitTest(): null;
    setHitTestEnabled(): void;
    reindexScaledShapeHits(): void;
    reanchorAllConnectors(): void;
    reRouteAllConnectors(): void;
    tickAnimations(): void;
    toSVG(): string;
    destroy(): void;
}
declare class HeadlessSurface implements ISurface {
    readonly id: string;
    readonly space: SurfaceSpace;
    readonly primitives: HeadlessElementRenderer;
    /** Last backdrop pushed — lets a background test assert without pixels. */
    backdrop: SurfaceBackdrop | null;
    visible: boolean;
    /** Last alpha pushed — lets an entrance test assert without pixels. */
    alpha: number;
    zIndex: number;
    destroyed: boolean;
    constructor(id: string, space: SurfaceSpace);
    overlay(): IOverlayDevice;
    setBackdrop(backdrop: SurfaceBackdrop | null): void;
    setVisible(visible: boolean): void;
    setAlpha(alpha: number): void;
    setZIndex(z: number): void;
    destroy(): void;
}
declare class HeadlessRenderer implements IRenderer {
    readonly backend: "canvas";
    readonly canvasElement: HTMLCanvasElement | null;
    /** Every surface handed out, by layer id — for asserting layer lifecycle. */
    readonly surfaces: Map<string, HeadlessSurface>;
    readonly binding: HeadlessCameraBinding;
    camera?: Camera;
    destroyed: boolean;
    /** Every `tick(dt)` the engine drove, in order. */
    readonly frames: number[];
    get capabilities(): RendererCapabilities;
    mount(): void;
    createSurface(space: SurfaceSpace, id: string): ISurface;
    createOverlay(): IOverlayDevice;
    createCameraBinding(): ICameraBinding;
    attachCamera(camera: Camera): void;
    worldContentBounds(): Rect | null;
    resize(): void;
    /** Records the frames the engine drove, so a test can assert the clock ran. */
    tick(dtMs: number): void;
    destroy(): void;
}

/**
 * Default anchor — resolves a shape endpoint to the shape's bounding-box
 * **centre** in world space. Uses `ref.center` (computed by the renderer
 * from `origin + bounds`) rather than the raw `(spec.x, spec.y)` origin so
 * the anchor is uniform regardless of each shape's local-origin convention
 * (`RectShape` is anchored top-left; `CircleShape` is centred).
 *
 * Ignores `fromPoint`; the centre never depends on the other endpoint.
 */
declare const centerAnchor: IAnchor;

/**
 * Boundary anchor — snaps the endpoint onto the shape silhouette where the
 * ray from the shape's geometric **centre** toward the *other* endpoint
 * exits.
 *
 * The ray is cast from `ref.center` (the bounding-box centre, computed by
 * the renderer from `origin + bounds`) rather than from `ref.origin` so the
 * behaviour is uniform regardless of each shape's local-origin convention.
 * `RectShape` is anchored top-left, `CircleShape` is centred — `ref.center`
 * normalises the difference.
 *
 * Calls the shape's optional `boundaryIntersect(localFromCenter)` for
 * analytical shapes (`CircleShape` overrides). For shapes that don't
 * override, falls back to a centred-AABB ray-exit (provided by
 * `ShapeBase.boundaryIntersect`). The input is centre-relative; the output
 * is centre-relative; this anchor converts back to world via `ref.center`.
 *
 * Sets an outward-pointing `tangent` on the returned endpoint (unit vector
 * from shape centre to the boundary point) so port-aware routers can use it
 * as an exit-direction hint.
 */
declare const boundaryAnchor: IAnchor;

/**
 * Perpendicular anchor — exits at the **midpoint of the face** of the
 * shape's bounding box that is closest to the other endpoint. The face is
 * picked by comparing `|dx| / halfWidth` against `|dy| / halfHeight`: the
 * ratio that's larger wins (so a target slightly to the right of a wide,
 * short rect still picks the right side; a tall, narrow rect picks the top
 * or bottom more readily).
 *
 * Best for **orth-style routing** (`orth`, `manhattan`, `metro`, `er`,
 * `oneSide`) where the natural exit is along one cardinal axis. Produces
 * the "lines start at the middle of a side" look common in flowcharts and
 * ER diagrams.
 *
 * For circles (square bounds), this lands at the cardinal points
 * (N / S / E / W) on the perimeter — a useful default though `boundary`
 * still gives smoother diagonal exits for non-orthogonal routers.
 *
 * Sets the outward tangent to the face normal: `(±1, 0)` for left/right
 * faces, `(0, ±1)` for top/bottom. Routers like `orth` consume this to
 * pick H-first vs V-first.
 */
declare const perpendicularAnchor: IAnchor;

declare const edgePortAnchor: IAnchor;

declare const silhouettePortAnchor: IAnchor;

/**
 * Direct line from source through any waypoints to target.
 * Output: `[source, ...waypoints, target]` — a flat polyline.
 *
 * Routers decide topology (where bends sit). The visual style of segments
 * between these points is owned by the downstream `PathStyle`:
 * - `normal` → straight segments (`M, L, L, …`)
 * - `rounded` → quadratic fillets at corners
 * - `smooth` → Catmull-Rom cubic spline
 * - `bezier` → single cubic A→B (intermediate points ignored)
 */
declare const straightRouter: IRouter;

/**
 * Orth router — produces a polyline made of horizontal and vertical
 * segments only. Simple, geometric, **no obstacle awareness**: pick this
 * for clean H/V routing in layouts you trust to have no shapes in the way.
 * For obstacle avoidance, use `manhattan` (which is built on top of A*).
 *
 * Naming follows X6 / JointJS / mxGraph: their `Orth` is also the simple
 * H/V router, while their `Manhattan` is the obstacle-aware variant.
 *
 * For each consecutive pair `(P, Q)` of `[source, ...waypoints, target]`,
 * one bend point is inserted (producing an L-shape for that pair). The bend
 * direction (H-first vs V-first) is chosen by:
 *
 *   1. **Source tangent** on the first segment — the line exits along the
 *      tangent's dominant axis. The boundary anchor sets this as an outward
 *      normal hint.
 *   2. **Target tangent** on the last segment — the line approaches matching
 *      the tangent's dominant axis (so the final leg is perpendicular to the
 *      target boundary).
 *   3. **Alternation** in between — alternate H ↔ V across consecutive
 *      segments to avoid back-tracking.
 *   4. **Dominant axis** as a final fallback when no other signal applies.
 *
 * Aligned consecutive points (same x or same y) emit no bend.
 */
declare const orthRouter: IRouter;

/**
 * Manhattan router — H/V segments only, **routing around obstacles when
 * necessary**.
 *
 * Naming follows X6 / JointJS / mxGraph where `Manhattan` is the
 * obstacle-aware variant and `Orth` is the simple non-avoiding one.
 *
 * Pipeline (lazy A*):
 *   1. Compute the simple `orthRouter` polyline first (single L-bend or
 *      tangent-aware Z-bend).
 *   2. If `ctx.obstacles` is empty OR no segment of the simple polyline
 *      crosses an inflated obstacle, return it directly. Same output as the
 *      `orth` router — clean, no stair-stepping.
 *   3. Otherwise build a coarse `ObstacleGrid` and run A* (connectivity 4)
 *      from source cell to target cell. Simplify the cell path to bend
 *      points only and convert back to world coordinates.
 *
 * Failure cases all fall back to the simple `orthRouter` polyline:
 *   - Grid construction returns `null` (cell-count cap exceeded).
 *   - A* finds no path (source/target unreachable through inflated obstacles).
 *
 * The fallback emits a `console.warn` so the dev sees why avoidance didn't
 * kick in; toggle `routerOpts.obstacles: 'none'` to skip the obstacle check
 * entirely.
 *
 * Waypoints are not yet threaded through A* — when present, the simple orth
 * polyline (which respects waypoints) is checked against obstacles. If it's
 * clear, return it; if not, A* runs between source and target only.
 * Routing through waypoints with obstacle awareness is a future extension.
 */
declare const manhattanRouter: IRouter;

/**
 * Metro router — manhattan-style topology with 45° diagonals.
 *
 * Pipeline (lazy A*):
 *   1. Compute the simple geometric metro polyline first — one straight
 *      axis-aligned leg followed by a 45° diagonal absorbing the remaining
 *      distance. Mirrors classic transit-map line drawing.
 *   2. If `ctx.obstacles` is empty OR no segment of the simple polyline
 *      crosses an inflated obstacle, return it directly.
 *   3. Otherwise run A* with **connectivity 8** (H + V + 45° moves) on a
 *      coarse grid. Simplify cell runs and convert back to world coords.
 *
 * Connectivity 8 is what makes this metro-shaped: diagonal cost `√2` is
 * cheaper than two cardinals (`1 + 1 = 2`), so A* prefers 45° moves where
 * obstacles permit — producing the metro look around obstacles too.
 */
declare const metroRouter: IRouter;

/**
 * ER (entity-relationship) router — exits each endpoint perpendicular to
 * its boundary, then routes orthogonally between the stub points.
 *
 * Reads the outward `tangent` set by the `boundary` anchor on each endpoint.
 * Each stub leg is `tangent * stubLength`. The bridge between stubs is a
 * single H-or-V segment plus one bend, picked so the bend axis alternates
 * with each stub direction (horizontal stubs → vertical bridge first).
 *
 * Falls back to a single bend (manhattan-equivalent) when neither endpoint
 * has a tangent. Waypoints are inserted between the stubs as plain
 * polyline points (no extra orthogonalisation pass).
 */
declare const erRouter: IRouter;

/**
 * oneSide router — forces the line to exit the source on a designated side,
 * then routes orthogonally to the target. Useful for swimlane / "all on one
 * side" diagrams where every connector must leave the source in the same
 * direction regardless of where the target is.
 *
 * Polyline shape:
 *   `source → exit → midBend → target`
 *
 * - `exit`     — source stepped `padLength` along the side direction.
 * - `midBend`  — perpendicular to the side at the target's parallel axis
 *                (so the leg from exit→midBend is along the side direction
 *                inverted, and midBend→target is perpendicular).
 *
 * For 'right' / 'left' the exit/midBend legs are horizontal then vertical;
 * for 'top' / 'bottom' they're vertical then horizontal. When source and
 * target are perfectly aligned with the side direction the path collapses
 * to a single-leg traversal.
 *
 * Waypoints are not honoured by this router — its purpose is the forced
 * exit, not free-form routing. Pass `manhattan` for waypoint routing.
 */
declare const oneSideRouter: IRouter;

/**
 * Sharp segments. Walks the polyline emitting `M` then `L L L …`.
 *
 * For a 2-point polyline, this is `[M source, L target]` — equivalent to
 * the straight-line baseline. For an N-point polyline (router-produced
 * bends), this draws straight segments between every consecutive pair with
 * no corner treatment.
 */
declare const normalPathStyle: IPathStyle;

/**
 * Quadratic arc fillets at every interior polyline corner.
 *
 * For each interior corner B between segments A→B and B→C:
 *   - Pick a per-corner radius `t = min(radius, |AB|/2, |BC|/2)`.
 *   - Approach point P1 on segment AB at distance `t` from B.
 *   - Departure point P2 on segment BC at distance `t` from B.
 *   - Emit `L P1`, then `Q B P2` — the corner becomes a quadratic with control
 *     at the original corner.
 *
 * For a 2-point polyline (no interior corners) the output is identical to
 * `normal`: `[M, L]`. Collinear corners (parallel incoming/outgoing) emit a
 * straight `L` through B with no Q (degenerate fillet).
 */
declare const roundedPathStyle: IPathStyle;

/**
 * Single cubic Bézier between the first and last polyline points, with
 * auto-generated control handles. Intermediate polyline points (router
 * waypoints, manhattan corners, …) are **ignored** — pick `smooth` if you
 * want the path to follow them.
 *
 * Control-point strategy: direction-aware s-curve.
 * - For horizontal-dominant layouts the controls pull horizontally:
 *   `c1 = source + (dx * tension, 0)`, `c2 = target - (dx * tension, 0)`.
 *   Source leaves and target arrives along the x-axis.
 * - For vertical-dominant layouts the controls pull vertically.
 *
 * Output: `[M source, C target]` — a single curve segment.
 */
declare const bezierPathStyle: IPathStyle;

/**
 * Quadratic Bézier from the first polyline point to the last with a single
 * control point placed **perpendicular to the chord** at `curvePosition`
 * along it and `curveOffset` units to the side.
 *
 * This is the G6-style "quadratic edge": one control point, signed
 * perpendicular offset, fixed position along the chord. Unlike axis-aligned
 * `bezier` (whose control handles pull along `axis: 'h' | 'v'`), the
 * perpendicular construction gives a real bow on **every** orientation —
 * cardinal chords no longer collapse to straight lines.
 *
 * Pair with `router: 'straight'`; intermediate polyline waypoints are
 * ignored (a router that produces extra points doesn't compose
 * meaningfully with a single-control-point quadratic).
 *
 * Edge cases:
 *  - Polyline shorter than two points → `[]` (matches the other pathStyles).
 *  - Coincident endpoints (`len === 0`) → degenerate `M` only; the
 *    perpendicular is undefined.
 */
declare const quadraticPathStyle: IPathStyle;

/**
 * Single cubic Bézier from the first to the last polyline point with control
 * points placed on the **midradius circle** at the source and target angles.
 *
 * This is the same curve `d3.linkRadial()` produces, ported to operate on
 * cartesian polyline endpoints (we recover the polar coordinates from the
 * configured origin). It gives a tree edge that:
 *  - leaves the source tangent to the radius (radially outward / inward),
 *  - sweeps through the midradius arc between the two angles,
 *  - arrives at the target tangent to the radius.
 *
 * The result reads correctly in any orientation — it doesn't bulge sideways
 * the way an axis-aligned `bezier` does on near-vertical edges. Pair with
 * `router: 'straight'`; intermediate polyline waypoints are ignored (a
 * router that produces extra points doesn't compose meaningfully with a
 * polar curve).
 *
 * Edge cases:
 *  - Co-linear with the origin (`r0` or `r1` is zero, or both angles equal):
 *    falls back to a straight line, since a polar curve isn't defined.
 *  - Polyline shorter than two points: returns `[]` (matches other styles).
 */
declare const bumpRadialPathStyle: IPathStyle;

/**
 * Single cubic Bézier from the first to the last polyline point.
 *
 * Two modes depending on whether anchor `endpoints` are passed in:
 *
 *  - **Tangent-aware (preferred)** — when `endpoints.source.tangent` and / or
 *    `endpoints.target.tangent` are available, the control points are placed
 *    along each shape's outward surface normal: `c1 = s + sTan × handle`,
 *    `c2 = t + tTan × handle`, with `handle = |tx − sx| / 2`. The curve
 *    therefore leaves the source flush with its silhouette tangent and
 *    arrives at the target flush with *its* silhouette tangent — no kink
 *    at off-equator anchors (circles, polygons, rounded rects).
 *
 *  - **Fallback** — when no tangents are available (direct unit-test
 *    invocation, or an anchor that produced no tangent), the control
 *    points fall back to the **vertical midline** between source and
 *    target — `c1 = ((sx + tx)/2, sy)` and `c2 = ((sx + tx)/2, ty)` —
 *    matching d3-shape's `linkHorizontal()` / d3-sankey's
 *    `sankeyLinkHorizontal()` ribbon curve. For rect + horizontal-face
 *    anchors (`edge-port` on `'left'` / `'right'`) the tangent-aware
 *    formula reduces to this same placement, so existing rect-on-rect
 *    visuals are unchanged.
 *
 * Pair with `router: 'straight'`; intermediate polyline waypoints are
 * ignored (a router that produces extra points doesn't compose
 * meaningfully with a horizontal-bump curve).
 *
 * Edge cases:
 *  - Polyline shorter than two points → `[]` (matches the other pathStyles).
 *  - `sx === tx` (vertical link) → tangent-aware path uses `handle = 0`,
 *    collapsing both control points onto the endpoints (a straight line);
 *    fallback degenerates to a vertical line on `x = sx`. Both stay
 *    well-defined.
 */
declare const bumpHorizontalPathStyle: IPathStyle;

/**
 * Catmull-Rom spline through every polyline point, emitted as cubic Béziers.
 * The curve passes through every input point exactly; intermediate router
 * waypoints / manhattan corners become smoothly interpolated bends.
 *
 * For each segment `Pi → Pi+1`, the control points use Catmull-Rom to Bézier
 * conversion:
 *   `c1 = Pi + (Pi+1 - Pi-1) * tension / 6`
 *   `c2 = Pi+1 - (Pi+2 - Pi) * tension / 6`
 *
 * At the endpoints, the missing virtual neighbour is mirrored
 * (`P-1 = P0`, `Pn+1 = Pn`).
 *
 * For a 2-point polyline this produces a single cubic with collinear control
 * points — visually identical to a straight line.
 */
declare const smoothPathStyle: IPathStyle;

/**
 * Two-segment **radial step** (a.k.a. "elbow") link, matching the d3
 * `linkStep` helper used by the canonical Tree of Life example:
 *
 *  1. Circular **arc** at the source's radius from the source angle to the
 *     target angle (constant-radius sweep along the parent's tier).
 *  2. Straight **radial line** outward from there to the target.
 *
 * Visually this produces the boxy / angular cluster-dendrogram look — every
 * subtree fans out from a horizontal arc at its parent's radius, then shoots
 * outward as straight spokes. It's the right pick for radial *clusters*
 * (where all leaves sit on a single outer rim and the eye reads tiers via
 * the constant-radius arcs); the smooth {@link bumpRadialPathStyle} is the
 * right pick for radial *trees* (where edges should curve continuously).
 *
 * The arc is approximated with cubic Bézier sub-arcs (≤ 90° each) using the
 * standard `k = (4/3) tan(θ/4) r` handle-length formula — visually
 * indistinguishable from a true SVG `A` command at any zoom, and stays a
 * flat sequence of `M / C / L` commands the Pixi renderer already knows
 * how to consume.
 *
 * Pair with `router: 'straight'`; intermediate polyline waypoints are
 * ignored. Use `anchor: 'center'` on the edge so the tangent is computed
 * from the true node-centre angle (otherwise the arc would launch from the
 * trimmed boundary cut-point and read crooked).
 *
 * Edge cases:
 *  - `r0 === 0` (source at the origin): emits a single straight `M → L`.
 *  - Source / target angles equal (single-child clade, or angular wrap
 *    collapses to zero): emits a straight radial `M → L`.
 *  - Polyline shorter than two points: returns `[]`.
 */
declare const stepRadialPathStyle: IPathStyle;

/**
 * Hierarchical-edge-bundling curve through the polyline, emitted as cubic
 * Béziers. This is the d3-shape `curveBundle.beta(β)` shape: an open cubic
 * B-spline driven by control points that are β-blended toward the straight
 * line from `P_0` to `P_{n-1}`.
 *
 * Pair with `router: 'straight'` and feed the hierarchy-ancestor sequence as
 * `waypoints` on the connector spec (per-edge layout output); the router will
 * pass `[source, ...waypoints, target]` through unchanged, and this pathStyle
 * sees the full sequence.
 *
 * Reference: d3-shape `src/curve/bundle.js` + `src/curve/basis.js`.
 */
declare const bundlePathStyle: IPathStyle;

/**
 * Self-loop pathStyle — orthogonal polyline anchored at the first
 * polyline point. Designed for edges where source and target reference
 * the same shape; the router output is `[p, p]` and this style ignores
 * everything after `polyline[0]`.
 *
 * Two geometries dispatch on `side`:
 *
 * **Cardinal U-bracket** (`top` / `right` / `bottom` / `left` or any
 * numeric angle) — three segments. Feet sit on a chord perpendicular
 * to `side` at distance `baseOffset` from the pivot, separated by
 * `gap`. From each foot the path runs `stubLength` further along
 * `side` to the two outer corners, joined by one cross segment.
 *
 * **Corner wrap** (`top-right` / `bottom-right` / `bottom-left` /
 * `top-left`) — four segments. Both feet sit on the host silhouette:
 * one on the horizontal edge `gap` from the named corner, the other
 * on the vertical edge `gap` from the same corner. From each foot the
 * path runs `stubLength` perpendicular to its edge (outward), the two
 * outward stubs are joined by a cross segment past the corner, and the
 * arrow lands flush with the perpendicular edge. The wrap's inner
 * corner sits at `(±baseOffsetX, ±baseOffsetY)` from the pivot.
 *
 * Pair with `router: 'straight'`; the polyline content beyond the first
 * point is ignored.
 *
 * Edge cases:
 *  - Polyline shorter than one point: returns `[]`.
 *  - Cardinal `gap = 0`: both stubs collapse onto the same line — the
 *    loop reads as a single out-and-back spike.
 *  - Corner `gap = 0`: both feet land at the corner itself; the wrap
 *    degenerates to a closed rectangle whose inner corner touches the
 *    silhouette.
 */
declare const loopPolylinePathStyle: IPathStyle;

/**
 * Named loop-curve shape presets. Each preset carries the four
 * profile-shaping opts (`baseOffset`, `radius`, `width`, `bulge`); the
 * caller fills in placement (`side` / `angle`, `pivotOffset`) per
 * instance. Spread into `pathStyleOpts`:
 *
 *   pathStyleOpts: { ...LOOP_CURVE_PRESETS.balloon, side: 'top' }
 *
 * Definitions:
 *   - `balloon`  — fat puffed belly. `bulge >> width/2` → controls
 *     splay wide; `bulge > radius` → belly bulges past the tip.
 *   - `teardrop` — slender pointed petal. `radius >> bulge`, narrow
 *     `width` → long axis with controls converging toward the tip.
 *   - `ring`     — near-circular loop. `radius ≈ bulge`, modest neck.
 *   - `hairpin`  — parallel-sided U (legacy). `bulge ≈ width/2` →
 *     controls sit directly above the feet, no flare.
 */
declare const LOOP_CURVE_PRESETS: {
    readonly balloon: {
        readonly baseOffset: 2;
        readonly radius: 22;
        readonly width: 6;
        readonly bulge: 26;
    };
    readonly teardrop: {
        readonly baseOffset: 2;
        readonly radius: 34;
        readonly width: 4;
        readonly bulge: 8;
    };
    readonly ring: {
        readonly baseOffset: 2;
        readonly radius: 20;
        readonly width: 10;
        readonly bulge: 20;
    };
    readonly hairpin: {
        readonly baseOffset: 2;
        readonly radius: 28;
        readonly width: 8;
        readonly bulge: 4;
    };
};
type LoopCurvePresetName = keyof typeof LOOP_CURVE_PRESETS;
/**
 * Self-loop pathStyle — single cubic Bézier "balloon / petal / teardrop"
 * drawn between two foot points. Mirrors AntV G6's `loop-curve` placement
 * model: cardinal placements (`top`, `right`, `bottom`, `left`) put both
 * feet on the same edge of the host; diagonal placements (`top-right`,
 * `bottom-right`, `bottom-left`, `top-left`) put the two feet on the two
 * adjacent edges that meet at the named corner.
 *
 * The path style runs in one of two modes depending on the polyline it
 * receives:
 *
 *  - **Two-foot mode** (preferred): when `polyline[0]` and `polyline[N-1]`
 *    are distinct (chord length > {@link COINCIDENT_EPS}), they are used
 *    as the two feet. The caller positions them via anchors — typically
 *    an `edge-port` anchor on the source endpoint and another on the
 *    target endpoint. The path style only shapes the curve between them.
 *
 *  - **Single-pivot mode** (legacy): when the two endpoints coincide
 *    (typical when both source and target use the `center` anchor on the
 *    same shape), the feet are synthesised from `pivotOffset`,
 *    `baseOffset` and `width`. `baseOffset` shifts the foot midpoint
 *    along `angle`; `width` separates the feet perpendicular to it.
 *    Useful when no edge-port anchor is configured.
 *
 * Geometry (both modes): given two feet `start` and `end`, the tip sits
 * at `chordMid + bloom * radius`, and the two cubic control points are
 * placed at `tip ± chordDir * bulge`. `bulge > chordLen/2` → balloon
 * (controls splayed outward past the feet); `bulge = chordLen/2` →
 * parallel-sided U; `bulge < chordLen/2` → teardrop (controls converge).
 *
 * Pair with `router: 'straight'`. The polyline content between
 * `polyline[0]` and `polyline[N-1]` is ignored.
 *
 * Edge cases:
 *  - Polyline shorter than one point: returns `[]`.
 *  - `width = 0` in single-pivot mode: feet coincide → closed teardrop
 *    cusp; the arrow marker lands on the start point.
 */
declare const loopCurvePathStyle: IPathStyle;

/**
 * Path-walking utilities. Used by:
 *  - `PrimitivesRenderer.hitTest` — needs a polyline approximation of the
 *    path for distance-to-segment checks.
 *  - `ConnectorBase.paintMarkers` — needs the tangent angle at the source /
 *    target endpoints to orient marker shapes.
 *  - Any future connector decoration that walks arc length (e.g. label-along-
 *    path). Static / glow / halo decorations don't sample — they call
 *    `connector.paintInto(...)` for native-rendered silhouettes.
 *
 * For v0 the only router is `straight` (just `[M, L]`), so the sampling /
 * tangent paths are degenerate. The functions are written to handle the full
 * `Path` type so additional router kinds drop in without changes.
 */

/**
 * Densify a `Path` into a flat polyline. Lines emit two endpoints per
 * segment; quadratic / cubic curves are sampled with fixed substep counts.
 * Returns at least the move-to point when the path has only one command.
 */
declare function samplePath(path: Path): Point[];
/**
 * Compute the tangent unit vector at `t ∈ [0, 1]` along the path.
 * For v0 we only need `t = 0` (source) and `t = 1` (target) for marker
 * orientation; intermediate `t` is sampled via `samplePath` for now.
 */
declare function tangentAt(path: Path, t: number): Vec2;
/**
 * Combined point + unit-tangent sample at parameter `t ∈ [0, 1]` along the
 * path. Used by labels-along-path and any other decoration that needs both
 * the location and the local direction at the same parameter (e.g. for
 * `autoRotate`). Cheaper than calling `samplePath` + `tangentAt` separately
 * because it walks the polyline once.
 *
 * `t` is fractional in arc-length space — the function picks the segment of
 * the densified polyline whose cumulative length most closely matches `t *
 * totalLength` and linearly interpolates inside it. For most practical path
 * kinds this matches an analytical sample to within a pixel; orthogonal
 * paths reproduce segment endpoints exactly.
 */
declare function samplePathAt(path: Path, t: number): {
    point: Point;
    tangent: Vec2;
};
/** AABB of the path's anchor + control points. Used by hit-test bbox indexing. */
declare function pathBounds(path: Path): Rect;
/**
 * Pull the path's start / end anchors inward by the requested arc-length
 * insets so the connector body stops short of where its markers will be
 * drawn. Markers themselves still anchor at the *original* endpoints (their
 * tips touch the target) — only the body is shortened.
 *
 * Correctness:
 *   - `L` segments are trimmed in closed form (exact).
 *   - `Q` / `C` segments are trimmed by walking arc length over a fine
 *     sub-step table, refining the parameter `t` between bracketing samples,
 *     and **De Casteljau subdividing** the curve at `t`. The kept half is
 *     emitted as a new `Q` / `C` command, preserving correct curvature on
 *     tight bends — chord-along-tangent approximation would diverge.
 *   - When an inset exceeds the trailing segment's arc length, the segment
 *     is consumed entirely and the trim continues into the prior segment.
 *
 * v0 only ships the `straight` router, so curve trimming is forward-looking
 * scaffolding for the upcoming `bezier` / `orthogonal` routers.
 */
declare function trimPathEnds(path: Path, startInset: number, endInset: number): Path;
/**
 * Squared minimum distance from `(px, py)` to any segment of the polyline.
 * Squared (no sqrt) so callers can compare against a squared tolerance —
 * faster + branch-free for the common no-hit case.
 */
declare function distanceToPolylineSq(poly: ReadonlyArray<Point>, px: number, py: number): number;

/**
 * Pure placement math for badges. Given the host's world-space AABB and the
 * badge's local-space AABB, resolve the world-space `(x, y)` to put on the
 * badge spec so that a chosen point on the badge's AABB lands at a chosen
 * point on the host's AABB (plus an optional pixel offset).
 *
 * No Pixi imports. Trivially testable.
 *
 * The maths splits cleanly along two axes:
 * 1. **Host anchor** — which point on the host AABB is the target. Driven by
 *    `BadgePlacement` (8 named points around the host).
 * 2. **Badge origin** — which point on the badge AABB lands at that anchor.
 *    Driven by the optional `origin` field. Defaults to the *mirror* of the
 *    placement so the badge sits fully outside the host edge.
 */

/**
 * Returns the point on the badge's local AABB that should land at the host
 * anchor, given the chosen origin. The default (omitted origin) is the
 * mirror of `placement` so the badge sits fully outside the host edge.
 * When `placement` is a raw `{x, y}` point with no inherent mirror, the
 * default falls back to `'center'`.
 */
declare function originToBadgeLocal(badgeLocalBounds: Rect, placement: BadgePlacement, origin: BadgeOptions['origin']): {
    x: number;
    y: number;
};
/**
 * Resolve the badge spec's `(x, y)` so that the chosen origin point on the
 * badge AABB lands at the chosen anchor point on the host AABB, plus the
 * caller's pixel offset.
 *
 * The badge spec's `(x, y)` represents the badge's *local-origin* in world
 * space (e.g. circle centre, rect top-left). Local AABB origin is at
 * `(badgeLocalBounds.x, badgeLocalBounds.y)` — for a circle these are
 * negative (`-r, -r`); for a rect they are `(0, 0)`. We compute the badge's
 * `(x, y)` such that the chosen origin point — at
 * `(specX + originLocal.x, specY + originLocal.y)` in world space — equals
 * the host anchor + offset.
 */
declare function resolveBadgePosition(hostWorldBounds: Rect, badgeLocalBounds: Rect, options: BadgeOptions): {
    x: number;
    y: number;
};

/**
 * Pure placement math for connector-hosted badges. Given a router-resolved
 * `Path` and the badge's local-space AABB, resolve the world-space `(x, y)`
 * (plus optional rotation) so that a chosen point on the badge's AABB lands
 * on a chosen anchor along the path — `'start'` / `'middle'` / `'end'` or
 * an arbitrary arc-length `t ∈ [0, 1]`.
 *
 * No Pixi imports. The math mirrors {@link LabelConnectorDecoration} so
 * connector badges and connector labels share the same arc-length walk.
 */

/**
 * Resolve the badge spec's `(x, y)` (and optional `rotation`) so that the
 * chosen origin point on the badge's local AABB lands at the path-anchor
 * defined by `options.placement`. The origin defaults to `'center'` for
 * connector hosts (badge centres on the path point); shape-style mirror
 * defaults don't apply here because the path has no "outside edge".
 *
 * The returned `rotation` is `0` unless {@link BadgeOptions.autoRotate} is
 * `true`. When auto-rotating with `keepUpright !== false` (the default),
 * tangents whose angle exceeds `±90°` are flipped by `π` so the badge's
 * top edge keeps facing the viewer.
 */
/**
 * Per-endpoint extra clearance added to the auto-shift when
 * {@link BadgeOptions.placement} is `'start'` or `'end'`. The renderer
 * passes the source / target marker length here (so the badge clears the
 * arrowhead, not just the trimmed path endpoint) plus a small visual gap.
 *
 * Numeric placements (`0`, `1`, raw `t`) ignore this — they're the "raw
 * arc-length" escape hatch.
 */
interface ConnectorBadgeEndpointClearance {
    readonly source: number;
    readonly target: number;
}
/** Default pixel gap inserted between an endpoint-anchored badge and the
 *  endpoint shape's silhouette (or, when a marker is present, the marker's
 *  far tip). Tunable by callers via the `clearance` parameter — this is
 *  just the engine-side floor when the renderer doesn't know better. */
declare const DEFAULT_ENDPOINT_BADGE_GAP_PX = 8;
declare function resolveConnectorBadgePosition(path: Path, badgeLocalBounds: Rect, options: BadgeOptions, clearance?: ConnectorBadgeEndpointClearance): {
    x: number;
    y: number;
    rotation: number;
};

/**
 * The scale to draw a label at so its on-screen font size follows `policy`.
 *
 * Positional arguments, not an options object: the renderer calls this once per
 * label per zoom-changed frame, so it must not allocate.
 *
 * @param fontSize  The label's authored font size — its on-screen size at zoom `1`.
 * @param zoom      Current camera zoom (`camera.scale`).
 * @param hostScale Visual scale the label inherits from its host before any label
 *   scaling — e.g. a node-size LOD drawing the node at `1 / zoom`; `1` for
 *   connectors. Excludes display-only magnification (a fisheye lens), which
 *   should still enlarge the label.
 * @param policy    The policy in force, or `null` for none.
 * @param contained `true` when the label must stay inside its host (an `inside-*`
 *   placement): the result never exceeds `1`, so the host's fit-to-box budget holds.
 *
 * - `natural = fontSize × zoom × hostScale` — what the label measures on
 *   screen with no policy.
 * - `target = zoomGrowth === undefined ? natural : fontSize × zoom ^ zoomGrowth`,
 *   then clamped to `[minFontPx, maxFontPx]`.
 * - Result: `target / natural`, capped at `1` for a contained label.
 *
 * Returns `1` for a `null` policy and for degenerate input (non-positive font
 * size, zoom or host scale), so a caller can apply the result unconditionally.
 *
 * @example
 * ```ts
 * resolveLabelScale(12, 4, 1, { maxFontPx: 20 });
 * // → 20 / 48 ≈ 0.417 — the label reads 20px on screen instead of 48px
 * ```
 */
declare function resolveLabelScale(fontSize: number, zoom: number, hostScale: number, policy: LabelSizePolicy | null, contained?: boolean): number;

/**
 * Options for constructing a `Tween`. `from` / `to` / `duration` are required;
 * everything else is optional and falls back to a sensible default.
 *
 * - `easing` defaults to `linear`.
 * - `repeat` is either an integer count (number of additional cycles after the
 *   first) or `'forever'`. Defaults to `0` (play once).
 * - `yoyo` reverses direction on each repeat. Only meaningful when `repeat`
 *   is non-zero. Defaults to `false`.
 * - `onUpdate(value)` fires every `tick` with the current eased value.
 * - `onComplete()` fires once when the tween retires (final cycle ends).
 *   Never fires for `repeat: 'forever'`.
 */
interface TweenOptions {
    readonly from: number;
    readonly to: number;
    readonly duration: number;
    readonly easing?: Easing;
    readonly repeat?: number | 'forever';
    readonly yoyo?: boolean;
    readonly onUpdate?: (value: number) => void;
    readonly onComplete?: () => void;
}
/**
 * Time-based interpolation primitive. Authors call `tick(deltaMs)` once per
 * frame; the tween advances internal time, applies easing, fires `onUpdate`,
 * and returns `false` when finished so the caller can retire it.
 *
 * The tween itself does no scheduling — it's a pure state machine. Effects
 * and decorations hold a `Tween` and drive it from their own `tick(dt)`.
 *
 * Reusable: call `reset()` to play again from `from`.
 */
declare class Tween {
    private readonly opts;
    private readonly easing;
    private readonly maxRepeat;
    private elapsed;
    private cycle;
    private _value;
    private _done;
    constructor(opts: TweenOptions);
    get value(): number;
    get done(): boolean;
    /**
     * Advance by `dt` milliseconds. Returns `false` when the tween has finished
     * its final cycle; callers should remove finished tweens from their tick
     * set. Returns `true` while still running (including indefinitely for
     * `repeat: 'forever'`).
     */
    tick(dt: number): boolean;
    /** Restart from `from`. Clears `done`. */
    reset(): void;
}

/**
 * Options for {@link animatePositions}.
 *
 * Positions are passed as flat `Float32Array`s of length `n * 2` — `x, y`
 * interleaved per node — the same shape `GraphStore.setPositionsBulk` consumes,
 * so a layout can hand its result buffer straight through.
 */
interface PositionTransitionOptions {
    /** Start positions (`n * 2`, x/y interleaved). Usually the nodes' current spots. */
    from: Float32Array;
    /** Target positions (`n * 2`, x/y interleaved). The computed layout result. */
    to: Float32Array;
    /** Transition duration in milliseconds. `<= 0` snaps to `to` immediately. */
    duration: number;
    /** Eased progress curve. Default {@link easeOutCubic}. */
    easing?: Easing;
    /**
     * Called once per frame with the interpolated buffer — write it straight to
     * the store (e.g. `store.setPositionsBulk(ids, xy)`). The SAME buffer is
     * reused every frame; copy it if you need to retain it.
     *
     * `progress` is the **eased** fraction of the transition, `0..1` — the same
     * factor the buffer was interpolated with — and is exactly `1` on the final
     * frame. Lets a caller move something else in lock-step (e.g. the camera).
     */
    onFrame: (xy: Float32Array, progress: number) => void;
    /** Fires once when the transition finishes naturally. NOT called on `cancel()`. */
    onComplete?: () => void;
}
/** Handle to an in-flight {@link animatePositions} transition. */
interface PositionTransition {
    /** Abort the transition. `onComplete` will not fire; positions stop where they are. */
    cancel(): void;
    /** `true` once the transition has finished or been cancelled. */
    readonly done: boolean;
}
/** Default transition length when a caller opts in without specifying one. */
declare const DEFAULT_POSITION_TRANSITION_MS = 500;
/**
 * Tween a set of node positions from `from` to `to` over `duration` ms,
 * self-driven on `requestAnimationFrame`.
 *
 * One-shot layouts (ELK, d3-hierarchy, d3-sankey, …) compute a final position
 * set in a single pass and would otherwise `setPositionsBulk` it in one write,
 * teleporting every node. Routing that final buffer through `animatePositions`
 * instead glides each node from where it currently sits to its computed slot —
 * a far more legible layout switch / re-layout.
 *
 * The `Layout` base class is deliberately canvas-agnostic (it owns no RAF), so
 * this helper drives its own frame loop — mirroring how `D3ForceLayout` rides
 * d3's internal timer. It is store-agnostic: it only interpolates buffers and
 * hands each frame back via `onFrame`; the caller owns the write.
 *
 * Cancellation: call `cancel()` (typically from the layout's `stop()` or its
 * next `apply()`) to abort cleanly — the next run can start a fresh transition
 * from wherever the nodes currently are. SSR-safe and degenerate-input-safe:
 * with no `requestAnimationFrame`, a non-positive `duration`, or an empty set,
 * it writes the final positions once and completes synchronously.
 *
 * @throws if `from.length !== to.length`.
 */
declare function animatePositions(opts: PositionTransitionOptions): PositionTransition;

/**
 * `Path` → SVG path-data serialisation. Pure: a routed {@link Path} in, a `d`
 * attribute string out.
 */

/** A `Path` (M/L/Q/C commands) → an SVG `d` attribute string. */
declare function pathToSvgD(path: Path): string;

/**
 * Shape spec → SVG element serialisation — one half of the vector export path
 * (see `@invana/canvas`'s `exportSVG` for document assembly, and
 * {@link connectorToSvg} for the other half).
 *
 * The serialisers here are **pure and domain-free** (a `CircleSpec` knows
 * nothing about "nodes"): a spec goes in, markup comes out — no display object,
 * no canvas handle, which is why they live in `@invana/canvas-core` where a
 * rendering backend can call them directly.
 *
 * ## Coverage (v1)
 *
 * Faithful: `circle`, `ellipse`, `rect` (+ `cornerRadius`), `polygon`,
 * `regular-polygon`, `star`, `arc`, `composite` (root silhouette + `rect` /
 * `circle` / `line` / `label` parts), solid fills, strokes (colour / width /
 * alpha / dash / cap / join), per-shape `alpha` and container `rotation`, and
 * `text`-kind label decorations (approximate placement).
 *
 * Not represented (raster export covers these exactly — prefer PNG when they
 * matter): `image` / `glyph` / `svg` / `svg-url` fills, decorations other than
 * labels (glow / halo / rings / pulses), effects, blur / shadow filters, and
 * `html-text` labels. These are skipped rather than approximated.
 */

/**
 * Serialise a single shape spec to an SVG element. Returns `''` for a shape
 * kind that has no vector representation. `labelStyle` (from an attached
 * `label` decoration) is rendered as `<text>` when present.
 */
declare function shapeSpecToSvg(spec: BaseShapeSpec, labelStyle?: unknown): string;

/**
 * Connector spec → SVG serialisation — the other half of the vector export
 * path (see {@link shapeSpecToSvg}). Pure: a spec + its routed {@link Path} in,
 * markup out.
 */

/**
 * Serialise a connector (its routed `path` + stroke + optional arrow markers)
 * to SVG. `strokeWidthScale` mirrors the renderer's per-instance LOD scaling.
 */
declare function connectorToSvg(spec: BaseConnectorSpec, path: Path, strokeWidthScale?: number, labelStyle?: unknown): string;

/**
 * SVG markup primitives — number formatting, XML escaping, attribute
 * serialisation and colour conversion shared by every serialiser in this
 * folder (and by the `exportSVG` document assembler in `@invana/canvas`).
 *
 * Pure string helpers: no DOM, no canvas, no backend.
 */

/** Round to 3 decimals and drop a trailing `.0` — keeps the markup compact. */
declare function n(v: number): string;
/** Escape text for use in an XML text node / attribute value. */
declare function esc(s: string): string;
/** Serialise an attribute map, skipping `undefined` / empty values. */
declare function attrs(map: Record<string, string | number | undefined>): string;
/** `points="x,y x,y …"` for `<polygon>`. */
declare function pointsAttr(pts: readonly Point[]): string;
/** `0xRRGGBB` → `#rrggbb`. */
declare function hexToCss(n: number): string;

/**
 * Spec paint → SVG paint attributes — the fill/stroke resolution shared by the
 * shape and connector serialisers, plus label-content extraction.
 *
 * Only the first `solid` fill layer is representable in flat SVG; `image` /
 * `glyph` / `svg` fills are skipped (→ `fill: none`) — a raster-only feature.
 */

/**
 * Resolve a {@link ShapeFill} to SVG `fill` / `fill-opacity`. Only the first
 * `solid` layer is representable in flat SVG; `image` / `glyph` / `svg` fills
 * are skipped (→ `fill: none`), documented as a raster-only feature.
 */
declare function fillPaint(fill: ShapeFill | undefined): Record<string, string | number | undefined>;
/** Resolve a {@link ShapeStroke} to SVG stroke attributes. `widthScale` mirrors LOD scaling. */
declare function strokePaint(stroke: ShapeStroke | undefined, widthScale?: number): Record<string, string | number | undefined>;
/** Extract plain-text `LabelContent` from a label decoration style, if any. */
declare function textContent(style: unknown): (LabelContent & {
    kind: 'text';
}) | undefined;

/** Reference-equality default; selector slices are compared with this. */
declare function defaultEqual<U>(a: U, b: U): boolean;
/** Shallow-equal for objects/arrays — a common selector equality for derived slices. */
declare function shallowEqual<U>(a: U, b: U): boolean;
/** A subscribable view of one selected slice — what `useSyncExternalStore` binds to. */
interface Selected<U> {
    get(): U;
    subscribe(onChange: () => void): () => void;
}
/**
 * Project a {@link ReactiveStore} to one slice, re-notifying **only** when that
 * slice changes (by `isEqual`). Selector + equality semantics live here — in our
 * code, not the backend — so they survive a backend swap. The React `useStore`
 * hook (in `@invana/canvas-react`) binds this to `useSyncExternalStore`.
 */
declare function select<T, U>(store: ReactiveStore<T>, selector: (state: T) => U, isEqual?: (a: U, b: U) => boolean): Selected<U>;

export { type AnnotationRecord, BadgeOptions, BadgePlacement, BaseConnectorSpec, BaseShapeSpec, Behaviour, type BehaviourOptions, BehaviourRegistry, type BehaviourRegistryOptions, CANVAS_SOURCE, Camera, type CameraChangeKind, type CameraInputConfig, type CameraInputModifier, type CameraIntent, type CameraOptions, type CameraTransform, type CameraTransformValue, type CanvasActions, type CanvasCommand, type CanvasContext, type CanvasEvent, CanvasEventBus, type CanvasGlobalEvents, type CanvasSceneOptions, type CanvasStore, CanvasThemeState, type CanvasView, type ColumnArray, type ColumnSchema, ColumnStore, type ColumnStoreOptions, type ColumnType, type ColumnValue, type CommandArgKind, type CommandArgSpec, type CommandArgsOf, type CommandMap, type CommandName, type CommandOption, CommandRegistry, type CommandRegistryOptions, type ControlChoiceItemSpec, type ControlChoiceOption, type ControlCommandItemSpec, type ControlDividerItemSpec, type ControlItemSpec, type ControlPanelAnchor, type ControlPanelInsets, type ControlPanelPlacement, type ControlPanelPosition, type ControlPanelSpec, type ControlSlotItemSpec, type ControlTextItemSpec, type ControlToggleItemSpec, type ControlWidgetItemSpec, type CustomElementCtor, DEFAULT_ENDPOINT_BADGE_GAP_PX, DEFAULT_POSITION_TRANSITION_MS, type DataLogPart, type DataOpAdapter, type DataSource, DecorationSpec, type DeepPartial, DefaultGestureArbiter, type Delta, type DeltaOptions, type DeltaRecord, DirtyBatcher, type DirtySnapshot, EASING_NAMES, type Easing, type EasingName, type EdgeRecord, EffectSpec, ElementEventMap, EventEmitter, EventMap, type EventSource, type EventSourceKind, FlushMode, type FramePhase, type FramePhaseTimings, type FrameStats, type FrameTick, type GestureArbiter, type GestureClaimOptions, type GraphInput, type GroupRecord, HeadlessCameraBinding, HeadlessElementRenderer, HeadlessRenderer, HeadlessSurface, type HistoryView, HitResult, IAnchor, type IBehaviour, type ICameraBinding, type IElementRenderer, type ILayer, INHERIT, type IOverlayDevice, IPathStyle, type IRenderer, IRouter, type ISurface, type ISurfaceHost, type Inherit, type IntentLogEntry, type InteractionKind, type KindDelta, LOOP_CURVE_PRESETS, LabelContent, type LabelSizePolicy, type LabelSizeTarget, LabelWrap, Layer, LayerData, type LayerFlush, type LayerOptions, LayerRegistry, type LayerRegistryOptions, Layout, type LayoutDataRunOptions, type LayoutEndReason, type LayoutEvents, type LayoutOptions, LayoutRegistry, type LayoutRegistryOptions, type LayoutRunOptions, Listener, type LogEntry, type LogEntryFilter, type LogEntryStatus, type LogGroupMeta, type LogPart, type LogStepInfo, type LoopCurvePresetName, type MountedDecoration, NODE_FLAG, type NodeDelta, type NodeRecord, type OperationLog, type OverlayFill, type OverlayFillLike, type OverlaySpace, type OverlayStroke, type Patch, Path, type PinchInputOptions, type Playbook, type PlaybookSpec, Point, type PosSchema, type PositionTransition, type PositionTransitionOptions, type QueryStatus, type ReactiveStore, type Recipe, Rect, type RenderPreference, type RendererBackend, type RendererCapabilities, type RendererInitOptions, type RendererMountOptions, type ResolvedTheme, type RowOf, type Selected, type ShapeDisplayOverride, ShapeFill, ShapeStroke, SourceEmitter, SpecFlush, type SpecProjectionTarget, SpecProjector, type SpecProjectorOptions, SpecStore, type StateCell, type StepSpec, type StoreChange, type SurfaceBackdrop, type SurfaceOptions, type SurfaceSpace, type Tap, type TapOptions, type ThemeKind, type ThemeMode, type ThemeState, type Themed, Tween, type TweenOptions, type Update, Vec2, type ViewLogPart, type WheelInputOptions, animatePositions, attrs, bezierPathStyle, boundaryAnchor, bumpHorizontalPathStyle, bumpRadialPathStyle, bundlePathStyle, centerAnchor, connectorToSvg, createActions, defaultCanvasView, defaultEqual, distanceToPolylineSq, easeInOutCubic, easeInOutSine, easeOutCubic, easeOutQuad, edgePortAnchor, erRouter, esc, fillPaint, hexToCss, isInherit, linear, loopCurvePathStyle, loopPolylinePathStyle, manhattanRouter, metroRouter, normalPathStyle, oneSideRouter, originToBadgeLocal, orthRouter, pathBounds, pathToSvgD, perpendicularAnchor, pointsAttr, quadraticPathStyle, resolveBadgePosition, resolveConnectorBadgePosition, resolveEasing, resolveLabelScale, resolveThemed, roundedPathStyle, samplePath, samplePathAt, select, shallowEqual, shapeSpecToSvg, silhouettePortAnchor, smoothPathStyle, stepRadialPathStyle, straightRouter, strokePaint, n as svgNum, tangentAt, textContent, trimPathEnds };
