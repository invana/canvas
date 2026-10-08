import { Update, StateCell, ReactiveStore, Patch as Patch$1, StoreChange, OperationLog, ViewLogPart, StepSpec, HistoryView, PlaybookSpec, Playbook, BaseConnectorSpec, Point, BaseShapeSpec, Rect, HitResult, CanvasEventBus, TapOptions, CanvasEvent, CanvasView, CanvasStore } from '@invana/canvas-core';
export { AnnotationRecord, CANVAS_SOURCE, CameraIntent, CameraTransform, CanvasActions, CanvasEvent, CanvasEventBus, CanvasGlobalEvents, CanvasSceneOptions, CanvasStore, CanvasThemeState, CanvasView, ColumnArray, ColumnSchema, ColumnStore, ColumnStoreOptions, ColumnType, ColumnValue, ControlChoiceItemSpec, ControlChoiceOption, ControlCommandItemSpec, ControlDividerItemSpec, ControlItemSpec, ControlPanelAnchor, ControlPanelInsets, ControlPanelPlacement, ControlPanelPosition, ControlPanelSpec, ControlSlotItemSpec, ControlTextItemSpec, ControlToggleItemSpec, ControlWidgetItemSpec, DataLogPart, DataOpAdapter, DataSource, DeepPartial, Delta, DeltaOptions, DeltaRecord, DirtyBatcher, DirtySnapshot, EdgeRecord, EventEmitter, EventMap, EventSource, EventSourceKind, FlushMode, FramePhase, FramePhaseTimings, FrameStats, FrameTick, GraphInput, GroupRecord, HistoryView, INHERIT, Inherit, IntentLogEntry, InteractionKind, KindDelta, LayerData, LayerFlush, Listener, LogEntry, LogEntryFilter, LogEntryStatus, LogGroupMeta, LogPart, LogStepInfo, NODE_FLAG, NodeDelta, NodeRecord, OperationLog, Patch, Playbook, PlaybookSpec, PosSchema, QueryStatus, ReactiveStore, Recipe, RendererBackend, RendererInitOptions, ResolvedTheme, RowOf, Selected, SourceEmitter, StateCell, StepSpec, StoreChange, Tap, TapOptions, ThemeKind, ThemeMode, ThemeState, Themed, Update, ViewLogPart, createActions, defaultCanvasView, defaultEqual, isInherit, resolveThemed, scheduleFlush, select, shallowEqual } from '@invana/canvas-core';
export * from '@invana/canvas-core/specs';
import { Patch } from 'immer';

/**
 * Deep-merge `patch` into a mutable `draft` in place: plain objects merge
 * field-by-field; everything else (arrays, sets, maps, functions, primitives,
 * class instances) **replaces**. Mirrors the engine's `deepMerge` semantics.
 *
 * Prototype-polluting keys ({@link FORBIDDEN_MERGE_KEYS}) are skipped — this is
 * the store's public write path (`update(patch)`) and receives untrusted input.
 */
declare function applyDeepPartial(draft: Record<string, unknown>, patch: Record<string, unknown>): void;
/**
 * Apply an {@link Update} (recipe or deep-partial patch) to `state` via immer,
 * returning the next state plus the forward/inverse patch pair. Pure — does not
 * mutate `state`.
 */
declare function computeChange<T>(state: T, update: Update<T>): {
    next: T;
    patches: Patch[];
    inverse: Patch[];
};
/** Top-level keys touched by a patch set — bounded cardinality, span/metric-safe. */
declare function changedPaths(patches: readonly Patch[]): string[];

/**
 * Build a full {@link ReactiveStore} on top of a {@link StateCell}. This is where
 * the change/patch/batch logic lives — shared by every adapter (memory, zustand,
 * later Yjs), so they behave identically and only the state container differs.
 */
declare function createStoreFromCell<T>(cell: StateCell<T>): ReactiveStore<T>;

/**
 * The zustand-backed {@link ReactiveStore} adapter — **the only file in the
 * package allowed to import zustand** (lint-enforceable). State container +
 * subscription come from zustand vanilla; the declarative-patch / change-stream /
 * batch logic is the shared {@link createStoreFromCell} core, so this behaves
 * identically to {@link createMemoryStore} (port parity).
 */
declare function createReactiveStore<T extends object>(initial: T): ReactiveStore<T>;

/**
 * A dependency-free, in-memory {@link ReactiveStore} — the reference adapter.
 *
 * Imports **no** backend library, so it proves the {@link ReactiveStore} port is
 * real and swappable (the zustand adapter must behave identically). Also the
 * lightest backend for tests.
 */
declare function createMemoryStore<T extends object>(initial: T): ReactiveStore<T>;

/**
 * How the log treats one view-store patch:
 *
 * - `'undoable'` — recorded; plain undo / redo applies it (a Studio `edit:*`).
 * - `'record'` — recorded, but plain undo steps over it (selection, focus). A
 *   `revertTo` / `replayTo` still applies it, so a playbook step keeps its view.
 * - `'skip'` — not recorded (camera frames, hover, layout progress, programmatic
 *   config).
 */
type ViewPatchMode = 'undoable' | 'record' | 'skip';
/** Options for {@link createOperationLog}. */
interface OperationLogOptions<T> {
    /** The view store whose change stream is recorded. Absent ⇒ data parts only. */
    view?: ReactiveStore<T>;
    /** The session actor stamped on entries that name none. Default `'user'`. */
    actor?: () => string;
    /**
     * Classify each view patch (the forward and the inverse lists are classified
     * independently). Default: every patch
     * is `'undoable'`.
     */
    classify?: (patch: Patch$1, change: StoreChange<T>) => ViewPatchMode;
    /**
     * Merge an undoable view change into the newest entry when both carry the
     * same action and actor and arrive within this many ms — so a live editor
     * writing per keystroke records one step per gesture. Absent / `0` ⇒ never.
     */
    mergeWithinMs?: number;
    /** Clock for {@link LogEntry.at}. Default `performance.now` (or `Date.now`). */
    now?: () => number;
}
/**
 * The canvas's **one operation log** — the record behind `canvas.history`
 * (RFC `feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`, G1).
 *
 * It taps the view store's patch + inverse stream and
 * takes data ops from each registered source (`GraphStore.applyDelta`), so one
 * entry can hold both — a change that touches data and view undoes in one call.
 * Every entry carries a free-text `actor`.
 *
 * - **Linear undo across actors.** Undo reverts the newest entry with an
 *   undoable part and moves it to the redo side, stepping over record-only
 *   entries (selection, focus), which stay applied.
 * - **Record-only entries never branch.** They join the applied side without
 *   discarding a redo tail — clicking a node after an undo keeps the redo.
 * - **Branches, not discards.** An undoable change after an undo moves the redo
 *   tail to a kept side branch.
 * - **No limit**; replays run with recording suspended, so nothing a
 *   replay writes is recorded again.
 * - **Streamed writes merge** (`recordData(…, { coalesce: true })`, G12): one
 *   open entry per actor, compacted through the source, skipped by plain undo,
 *   sealed by any other entry.
 *
 * View replays write with the action `undo:<action>` / `redo:<action>`, so a
 * store subscriber can tell a history write from an ordinary one (the engine's
 * definition reconciler keys on that).
 */
declare function createOperationLog<T>(opts?: OperationLogOptions<T>): OperationLog;

/** Options for {@link historyView}. */
interface HistoryViewOptions {
    /**
     * Summarise the view parts recorded since the last step as a step's
     * `settings` and `view` — the engine supplies it, because it knows how the
     * definition maps onto a `canvas.update` patch. Absent ⇒ `sinceLastStep`
     * carries data only.
     */
    describeView?(parts: readonly ViewLogPart[]): {
        settings?: unknown;
        view?: StepSpec['view'];
    };
}
/**
 * `canvas.history` — the read + undo surface over an {@link OperationLog}. The
 * log's recording side (`recordData`, `group`, `registerSource`) is not on it:
 * entries come only from the canvas's own writes.
 */
declare function historyView(log: OperationLog, opts?: HistoryViewOptions): HistoryView;

/**
 * What a playbook needs from its canvas — the ordinary canvas methods a step
 * is played with. The engine (`@invana/canvas`) supplies it; tests supply a
 * double. Kept here so the playbook's logic is testable without a renderer.
 *
 * @typeParam S The settings patch shape (`CanvasConfig` in `@invana/canvas`).
 */
interface PlaybookEnv<S = Record<string, unknown>> {
    /**
     * Check a step before anything is written. Returns the problems found (an
     * unknown command, a view id no source holds, settings that aren't JSON…);
     * empty means the step may play. `source` is the step's resolved source id.
     */
    validate(step: StepSpec<S>, source: string | undefined): string[];
    /**
     * Write the step's state **synchronously** — `data` through the source's
     * `applyDelta`, `settings` through `canvas.update`, `view` through the store
     * actions. Runs inside one log group, so everything it records becomes one
     * entry tagged with the step.
     */
    apply(step: StepSpec<S>, source: string | undefined): void;
    /** Run a command and wait for its work (`commands.runAsync`). Resolves `false` when it can't run. */
    runCommand(name: string, args: Record<string, unknown> | undefined): Promise<boolean>;
    /** Resolve once the canvas has settled (no layout, transition or camera glide). */
    whenSettled(): Promise<void>;
    /** The canvas's session actor — a step with no `actor` is attributed to it. */
    actor(): string;
}
/** Options for {@link createPlaybook}. */
interface PlaybookOptions<S = Record<string, unknown>> {
    /** Starting script. */
    doc?: PlaybookSpec<S>;
}
/** Thrown by `next` / `goTo` when a step fails {@link PlaybookEnv.validate}. Nothing was written. */
declare class PlaybookStepError extends Error {
    /** The step that failed. */
    readonly stepId: string;
    /** Every problem found. */
    readonly problems: readonly string[];
    constructor(
    /** The step that failed. */
    stepId: string, 
    /** Every problem found. */
    problems: readonly string[]);
}
/**
 * `canvas.playbook` — the **script** (RFC
 * `feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`, G8 / F13): a
 * list of JSON {@link StepSpec}s and a position.
 *
 * - **`addStep` only appends** (D-8); the canvas does not change until a step
 *   is moved to.
 * - **`next` plays** the following step: validates it (a bad step writes
 *   nothing and throws {@link PlaybookStepError}), writes its `data`,
 *   `settings` and `view` as **one** log entry carrying the step's `stepId`,
 *   `title` and `actor`, then runs its `do` verbs in order (each awaited) and
 *   waits for the canvas to settle. A step already played and then stepped
 *   back over is **replayed** from its recorded entries rather than re-run —
 *   unless a change made meanwhile cut those entries off, in which case it is
 *   played afresh.
 * - **`previous` reverts** the current step: every entry recorded since the
 *   step started is taken back, view intent included.
 * - **`goTo`** moves step by step to any step.
 *
 * Moves are serialised: a `next` called while one is still settling waits for
 * it. History is untouched as a model: the playbook only calls the ordinary
 * canvas methods and the log's `revertTo` / `replayTo`.
 */
declare function createPlaybook<S = Record<string, unknown>>(log: OperationLog, env: PlaybookEnv<S>, opts?: PlaybookOptions<S>): Playbook<S>;

/**
 * `PickingIndex` — the engine's picking engine: spatial index, world-space hit
 * boxes, narrow-phase geometry and the hover heuristics, all computed from
 * **specs** rather than display objects.
 *
 * This is design decision **D5** made real (`docs/renderer-split-design.md`):
 * picking is *interaction*, not drawing, so it stays in `@invana/canvas` when
 * the pixi backend is extracted. Everything here is renderer-free — no
 * `pixi.js` import, no `gfx`, no scene traversal — which is also what lets
 * picking be tested with no GPU mounted.
 *
 * **Why a pull-based {@link HitGeometrySource} rather than pushed records.**
 * Three facts about an element are the renderer's to know, not the store's: the
 * visual `scale` multiplier a LOD behaviour writes without touching the spec,
 * the routed polyline of a connector (the router runs at draw time), and the
 * silhouette of a `registerShape` custom kind the spec vocabulary has never
 * heard of. Pulling them at query time keeps picking answering against what is
 * on screen *right now*; pushing them would add a second staleness surface next
 * to the deferred-bbox one, and a stale pick is a bug the user feels
 * immediately.
 *
 * Bounds are deliberately *deferred*: `markShapeMoved` / `markConnectorMoved`
 * record that an element's box is stale, and {@link flushMoved} rebuilds them
 * all in one `bulkUpdateBoxes` the first time a query needs accurate geometry.
 * A layout settle nobody hovers over pays nothing.
 */

/** A sampled polyline — the densified form of a connector's routed path. */
type HitPolyline = readonly Point[];
/**
 * What picking needs to know about a shape. `spec` carries the geometry;
 * `scale` and `containsLocal` are the two things only the renderer knows.
 */
interface ShapeHitRecord {
    readonly spec: BaseShapeSpec;
    /**
     * Visual scale multiplier applied on top of the spec (LOD inflation, hover
     * zoom). The spec's geometry is in the *unscaled* local frame, so world-space
     * deltas are divided by this before the narrow phase.
     */
    readonly scale: number;
    /**
     * Narrow-phase containment for a `registerShape` kind the spec geometry
     * doesn't know, in the shape's **local** frame. Omitted — or ignored — for
     * built-in kinds, which {@link containsSpec} answers.
     */
    readonly containsLocal?: (localX: number, localY: number) => boolean;
    /**
     * Local-frame bounds for a custom kind, same fallback rule as
     * {@link containsLocal}.
     */
    readonly localBounds?: () => Rect;
}
/** What picking needs to know about a connector: its spec and its routed shape. */
interface ConnectorHitRecord {
    readonly spec: BaseConnectorSpec;
    /** The sampled, world-space polyline the connector actually draws along. */
    readonly polyline: HitPolyline;
}
/**
 * The renderer's side of the picking contract — the three facts specs can't
 * carry. Returning `null` means "gone"; the index treats it as a miss rather
 * than an error, because an element can be removed between an index write and
 * a query.
 */
interface HitGeometrySource {
    shapeRecord(id: string): ShapeHitRecord | null;
    connectorRecord(id: string): ConnectorHitRecord | null;
    /** Every currently-indexable shape id — for a full reindex. */
    shapeIds(): Iterable<string>;
}
/** The camera facts picking needs: screen-pixel margins scale with zoom. */
interface PickingCamera {
    readonly scale: number;
}
interface PickingIndexOptions {
    source: HitGeometrySource;
    camera: PickingCamera;
    /** @see PickingIndexOptions.hitFloorPx on the renderer */
    hitFloorPx?: number;
    hoverHysteresisPx?: number;
    hoverNodeIncidencePx?: number;
}
/**
 * World-space hit **boxes** for a connector — the segment-level hit index
 * (edge-pick correctness H). A single loose AABB over a long diagonal edge
 * makes that edge a candidate for every point in a huge empty box; splitting
 * the sampled polyline into up to {@link CONNECTOR_HIT_MAX_BOXES} tight boxes
 * (cut at equal arc-length, so straight diagonals subdivide and curves — which
 * sampling already densifies — get one box per run) keeps the candidate set to
 * edges *physically near* the cursor, making "nearest" cheaper and more
 * meaningful in a bundle. Short edges collapse to one loose box, so nothing
 * regresses.
 */
declare function connectorHitBoxes(poly: HitPolyline, strokeWidth: number): Rect[];
declare class PickingIndex {
    private readonly index;
    private readonly source;
    private readonly camera;
    private readonly hitFloorPx;
    private readonly hoverHysteresisPx;
    private readonly hoverNodeIncidencePx;
    /**
     * Shapes whose indexed bbox is stale after a position-only move, awaiting a
     * bulk reflush. Per-move `remove + insert` is O(N) in rbush, so a full
     * layout sweep would be O(N²); deferring makes it one rebuild, and only when
     * a query actually needs accurate bounds.
     */
    private readonly movedShapes;
    /** The connector analog of {@link movedShapes} — stale after a re-route. */
    private readonly movedConnectors;
    private _enabled;
    constructor(opts: PickingIndexOptions);
    /**
     * Enable / disable all picking. When disabled, {@link hitTest} and
     * {@link pickHover} return `null` regardless of what's under the cursor — the
     * owning layer flips this so a hidden layer's elements aren't clickable.
     */
    setEnabled(enabled: boolean): void;
    get enabled(): boolean;
    /** Index (or re-index) a shape from its current record. */
    insertShape(id: string, zIndex: number): void;
    /** Index (or re-index) a connector as its segment boxes. */
    insertConnector(id: string, zIndex: number): void;
    remove(id: string): void;
    has(id: string): boolean;
    clear(): void;
    /** Record that a shape moved; its bbox is refreshed on the next flush. */
    markShapeMoved(id: string): void;
    /** Record that a connector re-routed; its boxes are refreshed on the next flush. */
    markConnectorMoved(id: string): void;
    /**
     * Bulk re-index shape bboxes eagerly — pairs with a scale gesture that
     * intentionally skipped per-call hit updates. Omitting `ids` touches every
     * shape. Either way the tree is rebuilt once rather than N × remove+insert.
     */
    reindexShapes(ids?: Iterable<string>): void;
    /**
     * Flush deferred bbox updates from moved shapes and re-routed connectors in a
     * SINGLE rbush rebuild. Called lazily from the query methods the first time
     * accurate bounds matter, so a layout settle with no pointer interaction pays
     * nothing — and when it does pay, it's one O(N log N) rebuild.
     */
    flushMoved(): void;
    /**
     * World-space AABB of a shape — spec geometry, scaled by the renderer's
     * visual multiplier and offset to the spec's origin. `null` when the id is
     * unknown or its kind has no geometry the engine can compute and no fallback.
     */
    shapeWorldBounds(id: string): Rect | null;
    /** Ids whose indexed boxes intersect `rect`. Elements not indexed are absent. */
    visibleIds(rect: Rect): Set<string>;
    /**
     * Topmost element at a world point, or `null`.
     *
     * Two bands, in priority order:
     *
     *   1. **Exact hit** — the cursor is genuinely inside the silhouette (or
     *      within the connector's stroke tolerance). Ranked by `zIndex`, then
     *      shape-over-connector, then closest origin.
     *   2. **Floor fallback** — if NO exact hit, the closest candidate whose
     *      origin sits within `hitFloorPx` screen pixels of the cursor. Lets tiny
     *      pinpoints stay hoverable in sparse regions without widening hit areas
     *      in dense ones.
     *
     * @param exclude ids to skip — e.g. a transient drag preview sitting under
     *   the cursor that would otherwise mask the real target.
     */
    hitTest(worldX: number, worldY: number, exclude?: ReadonlySet<string>): HitResult | null;
    /**
     * Hover-specific pick: {@link hitTest}'s winner, refined by two hover-only
     * heuristics that make tracing an edge out of a dense bundle reliable.
     * **Click / drag picking deliberately stays on the raw {@link hitTest}** — a
     * press must resolve exactly what is under the cursor, with no memory of the
     * last hover.
     *
     * - **Node-incidence bias (J).** When the raw winner is a connector but the
     *   cursor also sits within `hoverNodeIncidencePx` of a shape's centre, an
     *   edge *incident to that shape* (an endpoint at the node) is preferred over
     *   an unrelated edge merely passing through. Incident edges fan out and
     *   separate near their shared endpoint — where you aim. The test is purely
     *   geometric (endpoint ≈ node centre), so this stays domain-free; it never
     *   inspects graph adjacency.
     * - **Hysteresis (I).** `currentHover` of the *same kind* is kept unless the
     *   new winner is closer by more than `hoverHysteresisPx` — and only while the
     *   old target is still genuinely under the cursor — so sub-pixel jitter
     *   between two near-equidistant edges doesn't flicker the highlight.
     *
     * Falls back to identical behaviour to {@link hitTest} when both margins are
     * `0` or nothing nearby qualifies.
     *
     * @param currentHover what the caller currently shows as hovered — the
     *   hysteresis anchor. Kept as a parameter rather than state so the index
     *   owns no interaction bookkeeping.
     */
    pickHover(worldX: number, worldY: number, currentHover: HitResult | null): HitResult | null;
    /**
     * Geometric test returning *both* whether the cursor exactly contains the
     * element AND the squared distance to the shape's origin (or the connector's
     * nearest polyline point) — used together by the two-band ranking.
     */
    private geometricHit;
    /**
     * Narrow-phase containment for one shape, in its **local** frame.
     *
     * Answered from the **spec** — pure geometry, no display object consulted —
     * so picking is identical across backends and works with no GPU. A spec kind
     * the engine has no geometry for is necessarily a `registerShape` custom
     * kind; those fall back to the record's own silhouette test, the only thing
     * that knows their shape.
     */
    private shapeContainsLocal;
    /** `hitFloorPx` translated into world units at the current camera scale. */
    private hitFloorWorld;
    /** `hoverHysteresisPx` in world units at the current camera scale. */
    private hoverHysteresisWorld;
    /** `hoverNodeIncidencePx` in world units at the current camera scale. */
    private hoverIncidenceWorld;
}

/**
 * `HitIndex` — thin wrapper around `rbush` for spatial hit-testing.
 *
 * Stays generic over kind ('shape' | 'connector') so a single index serves
 * both. Hit-testing returns candidates in indeterminate order; the renderer
 * resolves topmost-by-zIndex.
 *
 * **One id → one *or many* boxes.** Shapes index as a single bbox; a connector
 * may index as several tight **segment boxes** (edge-pick correctness H) so a
 * long diagonal edge isn't a candidate for every point inside its huge loose
 * AABB — only points genuinely near the line. The per-id `entries` map holds
 * the full box list for that id so `update` / `remove` stay O(boxes). Query
 * results are **deduped by id**, so a caller still sees each element once
 * regardless of how many boxes back it — the renderer's candidate loop is
 * unchanged.
 */

interface HitEntry {
    readonly id: string;
    readonly kind: 'shape' | 'connector';
    /** zIndex from the spec; used by `PrimitivesRenderer` to pick topmost. */
    readonly zIndex: number;
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}
declare class HitIndex {
    private readonly tree;
    /** id → its indexed box(es). Shapes hold one; connectors may hold several. */
    private readonly entries;
    /**
     * Index `id` under one bbox (shapes) or several (connector segment boxes).
     * Replaces any existing boxes for the id.
     */
    insert(id: string, kind: HitEntry['kind'], rect: Rect | readonly Rect[], zIndex: number): void;
    /** Update the bbox(es) + zIndex for an existing entry. No-op if unknown. */
    update(id: string, rect: Rect | readonly Rect[], zIndex: number): void;
    remove(id: string): void;
    /** True if an entry with this id is currently indexed. Lets callers choose
     * between an immediate insert (new id) and a deferred bulk bbox refresh
     * (existing id) — see `PrimitivesRenderer`'s moved-hit deferral. */
    has(id: string): boolean;
    /**
     * Query candidates whose bbox intersects a `padWorld`-padded box around
     * `(x, y)`. With `padWorld = 0` (default), this matches the classic
     * "point in bbox" search.
     *
     * The pad exists for the renderer's **screen-pixel hit floor**:
     * `PrimitivesRenderer.hitTest` passes `MIN_HIT_PX / camera.scale` so a
     * shape whose bbox is smaller than the floor (e.g. a node collapsed to
     * sub-pixel size at low zoom) is still in the candidate set. The
     * subsequent `containsWithFloor` / precise check applies the same floor
     * in local coords. Without this pad, rbush would prune the tiny shape
     * before the floor could rescue it.
     *
     * Caller is responsible for the precise per-shape hit-test if the bbox
     * isn't the final answer (e.g. a circle inside its bbox).
     */
    query(x: number, y: number, padWorld?: number): HitEntry[];
    /**
     * All entries whose bbox intersects `rect` (world coords). Powers viewport
     * culling — query the camera's visible bounds to get the on-screen working
     * set. Conservative for loose bboxes (e.g. connectors): may over-return, never
     * under-returns, so nothing on-screen is missed.
     */
    searchRect(rect: Rect): HitEntry[];
    clear(): void;
    /**
     * Bulk replace bboxes for many existing entries in one O(N log N) pass.
     *
     * Per-id `update(...)` does `remove + insert`, and rbush's `remove(item)`
     * is a linear tree walk — so updating thousands of entries one at a time
     * is O(N²). When a behaviour like `NodeScaleLODBehaviour` rescales every
     * node on each camera-zoom frame, the per-id path floors fps even at
     * modest graph sizes.
     *
     * This path replaces the cached box list for each touched id in the map,
     * then rebuilds the tree once via `clear + load` over the flattened entries.
     * Bulk-loading is `O(N log N)` total — for 3k entries, ~10× faster than the
     * per-id variant. Each id's kind + zIndex are carried over from its prior
     * boxes (an id that changed box *count* — e.g. a re-routed connector whose
     * segment split changed — is handled since we rebuild its list wholesale).
     *
     * Use when many entries change in the same logical tick (zoom settle,
     * bulk position update). For single-shape edits, prefer {@link update}.
     */
    bulkUpdateBoxes(updates: Iterable<{
        id: string;
        rects: readonly Rect[];
    }>): void;
    /** Number of indexed ids (not boxes — a multi-box connector counts once). */
    get size(): number;
}

/** One observable state mutation — OTel-agnostic; the app maps it to spans/metrics. */
interface TelemetryEvent {
    /** Named action from `update(patch, action)`, or `'update'`. */
    action: string;
    /** Top-level keys the patch touched — bounded cardinality (span/metric-safe). */
    changedPaths: string[];
    /** The minimal forward delta (the patch *is* the diff — no deep-diff cost). */
    patches: Patch[];
    /** Timestamp (ms). */
    ts: number;
    /** Wall-clock ms the update took (produce + commit), when the store reports it. */
    durationMs?: number;
}
/** Where telemetry events go. The engine stays exporter-agnostic; the app wires this. */
interface TelemetrySink {
    emit(event: TelemetryEvent): void;
}
/** A sink that drops everything — the default. */
declare const NoopSink: TelemetrySink;
/**
 * Attach telemetry to a {@link ReactiveStore} — a **port decorator**, not a zustand
 * middleware, so it survives a backend swap (zustand → Yjs) and is scoped to this
 * (view) store, never the bulk data hot path. One event per change, carrying the
 * action label + the patch diff. Returns an **unsubscribe** so the caller can
 * detach the sink (e.g. when tearing telemetry down).
 */
declare function withTelemetry<T>(store: ReactiveStore<T>, sink: TelemetrySink, now?: () => number): () => void;

/**
 * Tracing adapters — turn the kernel's observability streams into **spans**,
 * without the kernel taking an OpenTelemetry dependency. You inject a
 * {@link Tracer}; a real OpenTelemetry `Tracer` **structurally satisfies** it
 * (`trace.getTracer('canvas')`), so the "concrete OTel adapter" is just:
 *
 * ```ts
 * import { trace } from '@opentelemetry/api';
 * const tracer = trace.getTracer('canvas');
 * const store = createCanvasStore({ telemetry: createTracingSink(tracer) }); // view updates → spans
 * const off = createTapTracer(store.events, tracer);                          // whole event loop → spans
 * ```
 *
 * Two channels, two granularities (see `canvas-state-plan.md` §8):
 * - {@link createTracingSink} — one span per **`view` update** (action-labelled,
 *   with the patch diff + `durationMs`). Scoped to `view`, never the data hot path.
 * - {@link createTapTracer} — one span per **bus event** (input / state / data /
 *   scene / layout / render), with `exclude` / `sampleRate` so machine-rate types
 *   can be filtered or sampled.
 *
 * {@link createConsoleTracer} + {@link createCollectorTracer} are dep-free
 * reference tracers for debugging / tests / the playground.
 */

/** Attribute value types a span accepts (the OpenTelemetry-compatible subset). */
type SpanAttrValue = string | number | boolean;
type SpanAttributes = Record<string, SpanAttrValue>;
/** Minimal span — structurally satisfied by an OpenTelemetry `Span`. */
interface TraceSpan {
    setAttribute(key: string, value: SpanAttrValue): void;
    end(): void;
}
/**
 * Minimal tracer — structurally satisfied by an OpenTelemetry `Tracer`. Inject a
 * real one; the kernel keeps **no** OTel dependency (stays a renderer-free leaf).
 */
interface Tracer {
    startSpan(name: string, options?: {
        attributes?: SpanAttributes;
    }): TraceSpan;
    /**
     * Run `fn` with `span` as the **active parent**, so any {@link startSpan} called
     * synchronously inside `fn` auto-nests beneath it (a causal trace). Optional on the
     * port — OpenTelemetry's `Tracer` provides it; {@link traceActions} falls back to a
     * flat span when a tracer omits it. Does **not** auto-end the span (the caller does).
     */
    startActiveSpan?<T>(name: string, fn: (span: TraceSpan) => T): T;
}
/**
 * A {@link TelemetrySink} that emits one span per `view` update — wire it via
 * `createCanvasStore({ telemetry: createTracingSink(tracer) })`. Maps `action` →
 * span name; `changedPaths` / patch count / `durationMs` → attributes. Updates are
 * point-in-time, so the span opens and ends immediately (a marker span whose
 * `duration_ms` attribute carries the real produce+commit cost).
 */
declare function createTracingSink(tracer: Tracer, opts?: {
    prefix?: string;
}): TelemetrySink;
/**
 * Derive span attributes from a {@link CanvasEvent} envelope — the `source`, plus
 * the dashboard-useful fields off the kernel's well-known payload shapes:
 * `action` / `changed_paths` / `duration_ms` (view mutations), `layer_id` +
 * `ids_count` (data intents), the per-kind `data:flush` delta counts, and `id`
 * (input on an element). Defensive — only sets an attribute when the field exists,
 * so foreign / future event types degrade to just the source attributes.
 */
declare function tapAttributes(ev: CanvasEvent): SpanAttributes;
/**
 * Bridge the whole event **tap** stream to spans — every {@link CanvasEvent}
 * envelope becomes a span named by its `type`, attributed via {@link tapAttributes}
 * (source + payload fields). With a real OpenTelemetry tracer, each span
 * **auto-parents to the active context**, so wrapping an interaction in
 * `tracer.startActiveSpan(...)` nests the whole synchronous ripple (input →
 * `state:change` → `data:flush`) into one causal trace. Returns an unsubscribe.
 * Honours `exclude` / `sampleRate` so machine-rate types don't flood.
 */
declare function createTapTracer(bus: CanvasEventBus, tracer: Tracer, opts?: TapOptions & {
    prefix?: string;
}): () => void;
/**
 * **Decorator that traces the command API.** Wraps a {@link CanvasActions}-shaped
 * object (a `Record` of grouped methods — `node.add`, `camera.zoom`,
 * `layers.setStyle`, …) so **every call opens a span** named `<prefix><group>.<method>`,
 * captures its arguments as attributes, and (with an active-span-capable {@link Tracer})
 * runs the call as the active parent — so the mutation's whole synchronous ripple
 * (`state:change` / granular / `data:intent`, traced by {@link createTapTracer})
 * **nests beneath it** as one causal trace. This is the port-decorator idiom (cf.
 * {@link withTelemetry}) applied to the actions: query + interaction patterns become
 * traces without the caller wrapping anything.
 *
 * Returns a **new** object with the same shape (the original is untouched). Non-function
 * members and functions are wrapped; nested groups recurse.
 */
declare function traceActions<A extends object>(actions: A, tracer: Tracer, opts?: {
    prefix?: string;
}): A;
/** A dep-free reference {@link Tracer} that logs each span on `end()`. */
declare function createConsoleTracer(log?: (name: string, attrs: SpanAttributes) => void): Tracer;
/** One finished span collected in memory. */
interface CollectedSpan {
    name: string;
    attributes: SpanAttributes;
    endedAt: number;
}
/**
 * An in-memory {@link Tracer} that pushes finished spans into `spans` — for tests,
 * the playground, or a debug overlay. Not for production export.
 */
declare function createCollectorTracer(now?: () => number): {
    tracer: Tracer;
    spans: CollectedSpan[];
};

/**
 * Metrics adapters — turn the engine's per-frame {@link FrameTick} stream into
 * OpenTelemetry **metrics** (histograms + counters) and per-gesture **spans**,
 * without the kernel taking an OpenTelemetry dependency. Sibling of
 * `tracing.ts`: you inject a {@link Meter} / {@link Tracer}; a real OpenTelemetry
 * `Meter` (`metrics.getMeter('canvas')`) / `Tracer` **structurally satisfies**
 * them, so the concrete adapter is just:
 *
 * ```ts
 * import { metrics, trace } from '@opentelemetry/api';
 * const offMetrics = createFrameMetrics(canvas.events, metrics.getMeter('canvas'));
 * const offSpans   = createInteractionTracer(canvas.events, trace.getTracer('canvas'));
 * ```
 *
 * This is the "F1 telemetry" wiring:
 * - {@link createFrameMetrics} — the continuous **speed trace**: one histogram
 *   record per frame for total frame time + CPU time, one per phase, and a
 *   dropped-frame counter. Every instrument is tagged with the frame's
 *   {@link InteractionKind}, so a dashboard can `group by interaction` and see
 *   which gesture owns each FPS dip.
 * - {@link createInteractionTracer} — the **event markers**: one span per gesture
 *   (`zoom` / `pan` / `drag` / `hover` / `layout`), carrying how far FPS dipped
 *   during it (`fps.baseline` → `fps.min` = `fps.drop`) and the worst frame.
 *   Derived purely from the tick stream's `interaction` transitions — no extra
 *   subscriptions.
 *
 * {@link createConsoleMeter} is a dep-free reference meter for debugging / tests.
 */

/** Metric attribute values (the OpenTelemetry-compatible subset). */
type MetricAttributes = Record<string, string | number | boolean>;
/** A recorded-value instrument — structurally satisfied by an OTel `Histogram`. */
interface Histogram {
    record(value: number, attributes?: MetricAttributes): void;
}
/** A monotonic instrument — structurally satisfied by an OTel `Counter`. */
interface Counter {
    add(value: number, attributes?: MetricAttributes): void;
}
/**
 * Minimal meter — structurally satisfied by an OpenTelemetry `Meter`. Inject a
 * real one; the kernel keeps **no** OTel dependency (stays a renderer-free leaf).
 */
interface Meter {
    createHistogram(name: string, options?: {
        description?: string;
        unit?: string;
    }): Histogram;
    createCounter(name: string, options?: {
        description?: string;
        unit?: string;
    }): Counter;
}
/** Options shared by the frame recorders. */
interface FrameMetricsOptions {
    /** Instrument-name prefix. Default `'canvas.'`. */
    prefix?: string;
}
/**
 * Bridge the `render:loop:tick` stream to OpenTelemetry metrics. Per frame it
 * records:
 * - `<prefix>frame.duration` (ms histogram) — total inter-frame time, attr `interaction`.
 * - `<prefix>frame.cpu` (ms histogram) — engine CPU cost that frame, attr `interaction`.
 * - `<prefix>frame.phase` (ms histogram) — one record per phase, attr `phase` (+ `interaction`).
 * - `<prefix>frame.count` (counter) — frames, attr `interaction` (denominator for an FPS rate).
 * - `<prefix>frame.dropped` (counter) — long/jank frames, attr `interaction`.
 *
 * Only bounded-cardinality attributes (`interaction`, `phase`) are attached, so the
 * series stay dashboard-safe. Returns an unsubscribe.
 */
declare function createFrameMetrics(bus: CanvasEventBus, meter: Meter, opts?: FrameMetricsOptions): () => void;
/** Options for the interaction tracer. */
interface InteractionTracerOptions {
    /** Span-name prefix. Default `'canvas.interaction.'`. */
    prefix?: string;
}
/**
 * Emit one span per user gesture, derived purely from the `render:loop:tick`
 * stream's {@link InteractionKind} transitions — no extra bus subscriptions.
 *
 * A span opens when the attributed interaction leaves `'idle'` and closes when it
 * returns to `'idle'` (or switches to a different gesture). While open it tracks
 * the FPS floor and worst frame, so on close the span carries:
 * `interaction.kind`, `frames`, `fps.baseline` (the idle FPS just before),
 * `fps.min`, **`fps.drop`** (`baseline - min`, ≥0), `frame.max_ms`, and
 * `duration_ms`. Overlaid on the FPS metric these are the "braking markers": the
 * action, when it happened, and how much it cost. Returns an unsubscribe.
 */
declare function createInteractionTracer(bus: CanvasEventBus, tracer: Tracer, opts?: InteractionTracerOptions): () => void;
/**
 * A dep-free reference {@link Meter} that logs each record/add — for debugging,
 * tests, or a console-only harness. Not for production export.
 */
declare function createConsoleMeter(log?: (name: string, value: number, attrs: MetricAttributes) => void): Meter;
/** One buffered metric record shipped by {@link createHttpMeter}. */
interface HttpMetricRecord {
    /** Instrument name, e.g. `canvas.frame.phase`. */
    name: string;
    /** Recorded value (histogram) or increment (counter). */
    value: number;
    /** Bounded-cardinality attributes, e.g. `{ interaction, phase }`. */
    attrs: MetricAttributes;
}
/** Options for {@link createHttpMeter}. */
interface HttpMeterOptions {
    /** Max time (ms) a record waits before its batch is POSTed. Default `1000`. */
    batchMs?: number;
    /** Force a flush once the buffer reaches this many records. Default `600`. */
    maxBatch?: number;
}
/**
 * A dep-free {@link Meter} that **batches every record and POSTs it as JSON** to
 * an HTTP endpoint — the local counterpart to the OTLP exporter. Where
 * `createConsoleMeter` prints and the OTLP meter ships aggregated protobuf to a
 * collector, this ships the **raw per-record stream** (`[{ name, value, attrs }]`)
 * to any plain HTTP sink, so a lightweight collector can write it to a file for
 * offline inspection with **no OpenTelemetry backend required**.
 *
 * Wire it through the normal telemetry config —
 * `telemetry: { metrics: { meter: createHttpMeter('http://localhost:4319/metrics') } }`
 * — so it rides the exact same {@link createFrameMetrics} path as OTLP; only the
 * destination differs.
 *
 * Fire-and-forget (`fetch` failures are swallowed) and self-scheduling (a single
 * `setTimeout` per batch window, cleared when the stream goes idle — no leaked
 * interval). No-ops gracefully where `fetch` / timers are unavailable.
 */
declare function createHttpMeter(endpoint: string, opts?: HttpMeterOptions): Meter;

/**
 * Logging adapters — turn the kernel's event stream into structured **logs**,
 * without the kernel taking a logging-vendor dependency. Sibling of `tracing.ts`
 * (spans) and `metrics.ts` (metrics): you inject a {@link Logger}; the concrete
 * adapter (`@invana/canvas-telemetry-otel`) maps it onto OTel logs, and
 * {@link createConsoleLogger} is the dep-free default so the `logging` toggle
 * works out of the box with zero extra installs.
 *
 * {@link createLogBridge} taps the bus and emits a {@link LogRecord} for the
 * **lifecycle-worthy** events (scene composition, layout runs, renderer
 * lifecycle, theme, drops) — deliberately *not* the per-frame / per-input
 * firehose (`render:loop:tick`, `data:flush`, `input:*` below `debug`), so the
 * log stays a readable audit trail rather than noise. A `level` filter gates it.
 */

/** Log severities, low → high. */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
/** Log attribute values (the OpenTelemetry-compatible subset). */
type LogAttributes = Record<string, string | number | boolean>;
/** One structured log record. */
interface LogRecord {
    level: LogLevel;
    /** Human-readable message — here, the event `type`. */
    message: string;
    /** Bounded, low-cardinality context. */
    attributes?: LogAttributes;
    /** Emit time (ms). */
    ts: number;
}
/**
 * Minimal logger port. The kernel keeps **no** logging-vendor dependency; inject
 * a real one (or use {@link createConsoleLogger}). Unlike the tracer/meter ports
 * this is not structurally an OTel type — the OTel *logs* SDK has a different
 * shape, so the `@invana/canvas-telemetry-otel` adapter maps this → OTel.
 */
interface Logger {
    log(record: LogRecord): void;
}
/**
 * Bridge the event **tap** stream to structured logs. Each lifecycle-worthy
 * {@link CanvasEvent} at or above `opts.level` (default `'info'`) becomes a
 * {@link LogRecord} named by its `type`. High-frequency types are always
 * dropped. Honours `exclude` / `sampleRate` and returns an unsubscribe.
 */
declare function createLogBridge(bus: CanvasEventBus, logger: Logger, opts?: TapOptions & {
    level?: LogLevel;
    now?: () => number;
}): () => void;
/** A dep-free reference {@link Logger} that routes to the matching `console` method. */
declare function createConsoleLogger(sink?: Pick<Console, 'debug' | 'info' | 'warn' | 'error'>): Logger;
/** An in-memory {@link Logger} that collects records — for tests / a debug overlay. */
declare function createCollectorLogger(): {
    logger: Logger;
    records: LogRecord[];
};

/**
 * Unified telemetry configuration — the single toggle surface baked into the
 * kernel so **any** consumer (not just the engine, not just Storybook) can turn
 * traces / metrics / logging on or off, passed as `createCanvasStore({ telemetry })`
 * (and forwarded by `new Canvas({ telemetry })`).
 *
 * Each stream is independently toggleable and works with **zero extra installs**:
 * `true` uses the dep-free console reference adapter, so `telemetry: { traces: true }`
 * prints spans to the console immediately. To ship to a backend (OTLP → HyperDX,
 * …), inject a real port — `traces: { tracer }`, `metrics: { meter }`,
 * `logging: { logger }` — which the opt-in `@invana/canvas-telemetry-otel` package
 * produces. The kernel itself takes **no** vendor dependency (renderer-free leaf).
 *
 * {@link wireTelemetry} is the engine-agnostic wiring: given the resolved
 * store + bus, it attaches exactly the streams the config enables and returns one
 * disposer that detaches them all.
 */

/**
 * What telemetry to emit. Every field is off unless set. A boolean `true` uses the
 * built-in console adapter; the object form injects a real port + tuning.
 */
interface CanvasTelemetryConfig {
    /**
     * Low-level raw hook — one {@link TelemetrySink} event per `view` mutation
     * (`action` + `changedPaths` + patch diff + `durationMs`), exporter-agnostic.
     * This is the primitive `traces` builds on; use it directly when you want the
     * raw event stream without spans / the event-bus tap.
     */
    sink?: TelemetrySink;
    /**
     * View-mutation spans + event-bus spans + per-gesture interaction spans. `true`
     * → console tracer; `{ tracer }` injects a real one (e.g. OpenTelemetry). `tap`
     * tunes the event-bus tap (`exclude` / `sampleRate`); the per-frame
     * `render:loop:tick` is always excluded (it is the metrics source, not a span).
     */
    traces?: boolean | {
        tracer?: Tracer;
        tap?: TapOptions;
    };
    /**
     * Per-frame FPS / frame-time / phase histograms + a dropped-frame counter (the
     * "speed trace"). `true` → console meter; `{ meter }` injects a real one.
     */
    metrics?: boolean | {
        meter?: Meter;
    };
    /**
     * Structured lifecycle logs off the event stream. `true` → console at `'info'`;
     * a bare {@link LogLevel} sets the threshold; `{ logger, level }` injects a sink.
     */
    logging?: boolean | LogLevel | {
        logger?: Logger;
        level?: LogLevel;
    };
}
/** The kernel surfaces {@link wireTelemetry} needs — the view store + the bus. */
interface TelemetryTarget {
    view: ReactiveStore<CanvasView>;
    events: CanvasEventBus;
}
/**
 * Attach the telemetry streams a {@link CanvasTelemetryConfig} enables to a
 * store + bus, and return a disposer that detaches them all. Called by
 * `createCanvasStore` when a `telemetry` config is supplied — so the toggles are
 * honoured wherever a `CanvasStore` is created.
 */
declare function wireTelemetry(target: TelemetryTarget, config: CanvasTelemetryConfig): () => void;

interface CreateCanvasStoreOptions {
    /**
     * Telemetry to emit — independently toggle `traces` / `metrics` / `logging`
     * (see {@link CanvasTelemetryConfig}). `true` per stream uses the dep-free
     * console adapter; inject a real port for OTLP/HyperDX export via the opt-in
     * `@invana/canvas-telemetry-otel` package. Omitted → no telemetry.
     */
    telemetry?: CanvasTelemetryConfig;
    /** View-store backend. Default `'zustand'`; `'memory'` is dependency-free. */
    backend?: 'zustand' | 'memory';
}
/** A callback invoked for **every** {@link CanvasStore} at creation. */
type CanvasStoreObserver = (store: CanvasStore) => void;
/**
 * Register a global observer fired for **every** {@link CanvasStore} created via
 * {@link createCanvasStore} — regardless of how the `Canvas` was constructed
 * (imperative `new Canvas()`, `<Canvas>`/`GraphCanvasApp`, or a bare
 * `createCanvasStore()`). The one central seam for cross-cutting instrumentation.
 *
 * Opt-in (nothing runs until you register): production is unaffected. The intended
 * use is dev/observability — e.g. Storybook wires a tracer to *every* story's bus
 * in one place:
 *
 * ```ts
 * onCanvasStoreCreated((store) => createTapTracer(store.events, getTracer()));
 * ```
 *
 * @returns an unsubscribe function.
 */
declare function onCanvasStoreCreated(observer: CanvasStoreObserver): () => void;
/** Create a fresh {@link CanvasStore}. */
declare function createCanvasStore(opts?: CreateCanvasStoreOptions): CanvasStore;

export { type CanvasStoreObserver, type CanvasTelemetryConfig, type CollectedSpan, type ConnectorHitRecord, type Counter, type CreateCanvasStoreOptions, type FrameMetricsOptions, type Histogram, type HistoryViewOptions, type HitEntry, type HitGeometrySource, HitIndex, type HitPolyline, type HttpMeterOptions, type HttpMetricRecord, type InteractionTracerOptions, type LogAttributes, type LogLevel, type LogRecord, type Logger, type Meter, type MetricAttributes, NoopSink, type OperationLogOptions, type PickingCamera, PickingIndex, type PickingIndexOptions, type PlaybookEnv, type PlaybookOptions, PlaybookStepError, type ShapeHitRecord, type SpanAttrValue, type SpanAttributes, type TelemetryEvent, type TelemetrySink, type TelemetryTarget, type TraceSpan, type Tracer, type ViewPatchMode, applyDeepPartial, changedPaths, computeChange, connectorHitBoxes, createCanvasStore, createCollectorLogger, createCollectorTracer, createConsoleLogger, createConsoleMeter, createConsoleTracer, createFrameMetrics, createHttpMeter, createInteractionTracer, createLogBridge, createMemoryStore, createOperationLog, createPlaybook, createReactiveStore, createStoreFromCell, createTapTracer, createTracingSink, historyView, onCanvasStoreCreated, tapAttributes, traceActions, wireTelemetry, withTelemetry };
