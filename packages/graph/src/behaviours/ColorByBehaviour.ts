/**
 * `ColorByBehaviour` — colours nodes and edges from **one addressable field**,
 * in one of two modes:
 *
 * - **`'categorical'`** *(default)* — *"which kind is this?"* One distinct colour
 *   per distinct value, handed out from a palette in order of first appearance
 *   and remembered. The classic "colour by node/edge type" view.
 * - **`'range'`** — *"how much of this is there?"* A numeric value mapped
 *   through a {@link ColorByScale} onto a colour ramp — continuously, or
 *   quantised into quantile / threshold bins.
 *
 * ### Addressing — one option, any field
 *
 * {@link ColorByBehaviourOptions.nodeValueKey} is a **root-relative dot path**
 * over the stored record, so it reaches everything: `'type'` (the default),
 * `'data.riskScore'`, `'data.meta.tier'`, `'parentId'`, `'style.shape.kind'`.
 * A string path is used rather than a function because it **survives
 * serialisation** — it can live in `view.definition`, be edited in a settings
 * panel, and sync to a collaborator. {@link ColorByBehaviourOptions.nodeValueBy}
 * remains as the escape hatch for values that must be *computed* rather than
 * addressed.
 *
 * > There is **no `kind` field** on a node or edge. `GraphElementKind` is the
 * > package-wide `'node' | 'edge'` discriminator used on events, never stored
 * > per item; `Behaviour.kind` is the unrelated editor-registry key. The
 * > per-item discriminator is `type`. For the *shape* kind, use
 * > `'style.shape.kind'`.
 *
 * ### Validity matrix — which options each mode reads
 *
 * | Option | `'categorical'` | `'range'` continuous | `quantile` | `threshold` |
 * |---|:--:|:--:|:--:|:--:|
 * | `*ValueKey` / `*ValueBy` | ✅ as string | ✅ as number | ✅ | ✅ |
 * | `colorNodes` / `colorEdges` / `fallbackColor` | ✅ | ✅ | ✅ | ✅ |
 * | `palette` · `valueColors` · `maxCategories` | ✅ | — | — | — |
 * | `colorStops` | — | ✅ | ✅ per bucket | ✅ per bucket |
 * | `nodeDomain` / `edgeDomain` | — | ✅ | ✅ | — |
 * | `bins` | — | — | ✅ | — |
 * | `nodeThresholds` / `edgeThresholds` | — | — | — | ✅ |
 *
 * Options outside their mode are **ignored, not errors** — switching `mode`
 * shouldn't require clearing the other mode's fields, and round-tripping through
 * an editor must not destroy the settings of the mode you aren't on.
 *
 * ### How it writes
 *
 * As **field resolvers on the layer template** — `bgFill` for nodes (via
 * `setNodeDefaults`), `strokeColor` + `arrowTargetColor` for edges (via
 * `setEdgeDefaults`). Because the colour lives on the template as a function of
 * the item, **new nodes and edges are coloured as they arrive** — no per-item
 * loop, no re-apply wiring. The template only sets these specific fields, so
 * other styling (shape, size, label, node border) is untouched; run a
 * `ThemeBehaviour` for those alongside.
 *
 * Default `enabled: false` — register, then explicitly enable. On disable it
 * restores whatever those template fields held before (best effort).
 *
 * **Precedence — applied once, overridable.** Any behaviour that writes the same
 * template fields *after* it wins. In particular `ThemeBehaviour`, whose palette
 * drives the layer to re-apply its defaults on every theme change. Its base
 * recolour touches `labelColor` / `bgStrokeColor` (node) and `strokeColor`
 * (edge), **not** `bgFill`, so colour-by fills sit alongside the theme's
 * border/label colours rather than fighting them.
 *
 * @example
 * ```ts
 * // colour by type (the default — no options needed)
 * new ColorByBehaviour({ id: 'color', targetLayerId: 'graph', enabled: true });
 *
 * // colour by a nested payload field, edges left alone
 * new ColorByBehaviour({
 *   id: 'color', targetLayerId: 'graph', enabled: true,
 *   colorEdges: false,
 *   nodeValueKey: 'data.subject',
 * });
 *
 * // colour by magnitude — a continuous ramp over an explicit domain
 * new ColorByBehaviour({
 *   id: 'color', targetLayerId: 'graph', enabled: true,
 *   mode: 'range',
 *   nodeValueKey: 'data.coverage',
 *   nodeDomain: [0, 100],
 * });
 * ```
 */

import { Behaviour, type BehaviourOptions, type CanvasContext } from '@invana/canvas';

import { GraphLayer } from '../layer/GraphLayer';
import type { EdgeStyle, NodeStyle } from '../layer/types';
import type { GraphEdge, GraphNode } from '../store/types';

// ─── Public types ────────────────────────────────────────────────────────────

/** Which colouring job — see the class TSDoc's validity matrix. */
export type ColorByMode = 'categorical' | 'range';

/**
 * Curve / binning mapping a numeric value to a colour. Continuous curves
 * interpolate along `colorStops`; binning scales quantise into discrete steps.
 * `'linear' | 'sqrt' | 'log'` match `NodeCentralityScale` deliberately.
 */
export type ColorByScale = 'linear' | 'sqrt' | 'log' | 'quantile' | 'threshold';

/** Maps an item to its colour value. `null` / `undefined` / `''` → `fallbackColor`. */
export type ColorValueAccessor<T> = (item: T) => string | number | null | undefined;

/**
 * What a legend should render for one channel. Derived from the same resolved
 * options and domain the canvas is painted from, so the two can never disagree.
 */
export type ColorByLegendSection =
  | {
      kind: 'categories';
      /** The field path (or `'(computed)'` when a `*ValueBy` accessor is in use). */
      field: string;
      entries: { value: string; color: number }[];
      /** Values beyond `maxCategories`, collapsed. Absent when nothing was capped. */
      other?: { count: number; color: number };
    }
  | { kind: 'bins'; field: string; bins: { from: number; to: number; color: number }[] }
  | { kind: 'gradient'; field: string; domain: [number, number]; stops: readonly number[] };

/**
 * Default 12-colour categorical palette (0xRRGGBB) — distinct hues that read on
 * both light and dark backgrounds. Cycled when a graph has more values than
 * colours. Override via {@link ColorByBehaviourOptions.palette}.
 */
export const DEFAULT_CATEGORY_PALETTE: readonly number[] = [
  0x3b82f6, 0xef4444, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xec4899, 0x06b6d4, 0xeab308, 0x14b8a6,
  0xa3e635, 0xf97316, 0x6366f1,
];

/**
 * Default ramp for `mode: 'range'` — a **sequential single-hue** scale
 * (light → dark blue).
 *
 * Single-hue on purpose. Interpolation happens in sRGB, where a ramp between
 * distant hues can pass near grey at its midpoint and read as "no data" exactly
 * where mid-range values live. A single hue is both the conventionally correct
 * default for a magnitude and immune to that. Multi-hue and diverging ramps are
 * opt-in via {@link ColorByBehaviourOptions.colorStops}, where the caller is
 * choosing the endpoints deliberately.
 */
export const DEFAULT_RANGE_STOPS: readonly number[] = [0xeff6ff, 0xbfdbfe, 0x60a5fa, 0x2563eb, 0x1e3a8a];

/** Constructor options for {@link ColorByBehaviour}. */
export interface ColorByBehaviourOptions extends BehaviourOptions {
  /** Required — the `GraphLayer` id this behaviour colours. */
  targetLayerId: string;

  /**
   * Which colouring job. Default `'categorical'` — one distinct colour per distinct
   * value. `'range'` maps a numeric value through {@link scale} onto
   * {@link colorStops}. Determines which options below are read.
   */
  mode?: ColorByMode;

  // ─── Value selection (per-kind; serialisable first) ─────────────────────

  /**
   * **Root-relative dot path** to the value driving a node's colour — e.g.
   * `'type'`, `'data.riskScore'`, `'data.meta.tier'`. Default `'type'`.
   * A missing path, or a non-numeric value in `'range'` mode, yields
   * {@link fallbackColor}. Superseded by {@link nodeValueBy}.
   *
   * A path from the node **root**, not a key inside `data` — unlike
   * `NodeCentralityBehaviourOptions.weightKey`, because the default (`type`)
   * lives at the root.
   */
  nodeValueKey?: string;
  /** Edge equivalent of {@link nodeValueKey}. Default `'type'`. */
  edgeValueKey?: string;

  /**
   * **Code escape hatch.** Per-node value accessor; supersedes
   * {@link nodeValueKey} when set. Use for computed keys the store doesn't hold
   * (`` `community-${n.data.group}` ``) or derived magnitudes. Return a `string`
   * in `'categorical'` mode, a `number` in `'range'` mode.
   * **Not editor-exposed** (it's a function) and not persisted.
   */
  nodeValueBy?: ColorValueAccessor<GraphNode>;
  /** Edge equivalent of {@link nodeValueBy}. */
  edgeValueBy?: ColorValueAccessor<GraphEdge>;

  // ─── Channels ───────────────────────────────────────────────────────────

  /** Colour nodes — writes `bgFill`. Default `true`. */
  colorNodes?: boolean;
  /** Colour edges — writes `strokeColor` + `arrowTargetColor`. Default `true`. */
  colorEdges?: boolean;
  /**
   * Colour for items whose value is missing, empty, or (in `'range'` mode)
   * non-numeric. Default `0x9ca3af` (grey).
   */
  fallbackColor?: number;

  // ─── mode: 'categorical' ───────────────────────────────────────────────────

  /**
   * Colours (`0xRRGGBB`) handed out in order of first appearance and remembered,
   * cycled when there are more distinct values than colours.
   * Default {@link DEFAULT_CATEGORY_PALETTE}.
   */
  palette?: readonly number[];

  /**
   * **Pin known values to specific colours.** Anything not listed falls through
   * to {@link palette} in first-appearance order. Without this, `'failed'` gets
   * whatever colour happens to be next — and that changes with data arrival
   * order. Shared across nodes and edges (values compare as strings).
   */
  valueColors?: Readonly<Record<string, number>>;

  /**
   * **Cardinality cap.** Values beyond the first `maxCategories` distinct ones
   * (in first-appearance order) share {@link fallbackColor} and collapse into a
   * single `other` legend row. Default `24`.
   *
   * A guard against colouring by a high-cardinality field — `nodeValueKey: 'id'`
   * is legal and yields one distinct value *per node*, which cycles the palette
   * into meaninglessness and grows a legend row per item. Capping makes the
   * truncation **visible** (`other (317)`) instead of silently lying.
   *
   * Values pinned by {@link valueColors} are always honoured and **do not count
   * against the cap** — an explicit choice is never truncated.
   *
   * Set to `Infinity` to disable.
   */
  maxCategories?: number;

  // ─── mode: 'range' ──────────────────────────────────────────────────────

  /**
   * How a numeric value becomes a colour. Default `'linear'`.
   *
   * - `'linear'` / `'sqrt'` / `'log'` — **continuous**: normalise into `[0,1]`
   *   against the domain, ease, then interpolate along {@link colorStops}.
   * - `'quantile'` — **binned** into {@link bins} equal-*count* buckets, edges
   *   derived from the observed values.
   * - `'threshold'` — **binned** at explicit edges ({@link nodeThresholds} /
   *   {@link edgeThresholds}).
   */
  scale?: ColorByScale;

  /**
   * Colour ramp (`0xRRGGBB`), interpolated in sRGB. Two or more stops; a single
   * stop is a constant colour. Default {@link DEFAULT_RANGE_STOPS}.
   */
  colorStops?: readonly number[];

  /**
   * Explicit `[min, max]` for node values. **Omit to auto-scan** the field across
   * the layer's nodes, rescanned when the node/edge set changes.
   *
   * ⚠️ With auto-domain, loading a node that widens the range **recolours every
   * other node** — set this explicitly for stable colours across a streaming load.
   */
  nodeDomain?: readonly [number, number];
  /** Edge equivalent of {@link nodeDomain}. */
  edgeDomain?: readonly [number, number];

  /** Bucket count for `scale: 'quantile'`. Default `5`. Ignored by other scales. */
  bins?: number;

  /**
   * Explicit bucket edges for `scale: 'threshold'`, in the node field's units —
   * `[10, 50, 200]` gives four buckets. Sorted ascending on resolve; duplicates
   * dropped. Ignored by other scales.
   */
  nodeThresholds?: readonly number[];
  /** Edge equivalent of {@link nodeThresholds}, in the edge field's units. */
  edgeThresholds?: readonly number[];
}

// ─── Option resolution ───────────────────────────────────────────────────────

/**
 * Every option resolved to a concrete value — nothing past the constructor
 * writes `?? default`.
 *
 * Exported because {@link ColorByBehaviour.getResolvedOptions} hands it out:
 * the base `getOptions()` returns only what the caller *passed*, which omits
 * every default and so can't answer "what is this behaviour actually doing".
 */
export interface ResolvedColorByOptions {
  mode: ColorByMode;
  nodeValueKey: string;
  edgeValueKey: string;
  nodeValueBy: ColorValueAccessor<GraphNode> | undefined;
  edgeValueBy: ColorValueAccessor<GraphEdge> | undefined;
  colorNodes: boolean;
  colorEdges: boolean;
  fallbackColor: number;
  palette: readonly number[];
  valueColors: Readonly<Record<string, number>>;
  maxCategories: number;
  scale: ColorByScale;
  colorStops: readonly number[];
  nodeDomain: readonly [number, number] | undefined;
  edgeDomain: readonly [number, number] | undefined;
  bins: number;
  nodeThresholds: readonly number[] | undefined;
  edgeThresholds: readonly number[] | undefined;
}

/**
 * Merge a patch over the previous resolved options.
 *
 * The `??` vs `'x' in patch` split is load-bearing: `??` fields fall back to the
 * previous value when the patch omits *or* nulls them, while `'x' in patch`
 * fields can be **explicitly cleared** by passing `undefined` — which is how a
 * caller drops back to auto-domain or removes an accessor.
 */
function resolveOptions(
  prev: ResolvedColorByOptions | null,
  patch: Partial<ColorByBehaviourOptions>,
): ResolvedColorByOptions {
  const base: ResolvedColorByOptions = prev ?? {
    mode: 'categorical',
    nodeValueKey: 'type',
    edgeValueKey: 'type',
    nodeValueBy: undefined,
    edgeValueBy: undefined,
    colorNodes: true,
    colorEdges: true,
    fallbackColor: 0x9ca3af,
    palette: DEFAULT_CATEGORY_PALETTE,
    valueColors: {},
    maxCategories: 24,
    scale: 'linear',
    colorStops: DEFAULT_RANGE_STOPS,
    nodeDomain: undefined,
    edgeDomain: undefined,
    bins: 5,
    nodeThresholds: undefined,
    edgeThresholds: undefined,
  };
  const stops = patch.colorStops ?? base.colorStops;
  return {
    mode: patch.mode ?? base.mode,
    nodeValueKey: patch.nodeValueKey ?? base.nodeValueKey,
    edgeValueKey: patch.edgeValueKey ?? base.edgeValueKey,
    nodeValueBy: 'nodeValueBy' in patch ? patch.nodeValueBy : base.nodeValueBy,
    edgeValueBy: 'edgeValueBy' in patch ? patch.edgeValueBy : base.edgeValueBy,
    colorNodes: patch.colorNodes ?? base.colorNodes,
    colorEdges: patch.colorEdges ?? base.colorEdges,
    fallbackColor: patch.fallbackColor ?? base.fallbackColor,
    // An empty palette would divide by zero in the cycle; treat it as "unset".
    palette:
      patch.palette && patch.palette.length > 0 ? patch.palette : base.palette,
    valueColors: patch.valueColors ?? base.valueColors,
    maxCategories: patch.maxCategories ?? base.maxCategories,
    scale: patch.scale ?? base.scale,
    colorStops: stops.length > 0 ? stops : DEFAULT_RANGE_STOPS,
    nodeDomain: 'nodeDomain' in patch ? patch.nodeDomain : base.nodeDomain,
    edgeDomain: 'edgeDomain' in patch ? patch.edgeDomain : base.edgeDomain,
    bins: patch.bins ?? base.bins,
    nodeThresholds:
      'nodeThresholds' in patch ? normaliseEdgesList(patch.nodeThresholds) : base.nodeThresholds,
    edgeThresholds:
      'edgeThresholds' in patch ? normaliseEdgesList(patch.edgeThresholds) : base.edgeThresholds,
  };
}

/** Sort ascending and drop duplicates + non-finite entries. */
function normaliseEdgesList(xs: readonly number[] | undefined): readonly number[] | undefined {
  if (!xs) return undefined;
  return [...new Set(xs.filter((n) => Number.isFinite(n)))].sort((a, b) => a - b);
}

// ─── Free functions ──────────────────────────────────────────────────────────

/**
 * Walk a root-relative dot path, returning `undefined` on any missing segment.
 * A small local helper rather than a dependency — `@invana/graph` has none by design.
 */
function readPath(root: unknown, path: string): unknown {
  let cur: unknown = root;
  for (const seg of path.split('.')) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur;
}

/**
 * Coerce an extracted value for `'categorical'` mode: `String(value)` uniformly.
 *
 * So booleans give `'true'`/`'false'`, numbers `'42'`, and arrays join
 * (`states` → `'hover,selected'`). Objects all collapse to `'[object Object]'`
 * and therefore share one colour — including a mis-typed path landing on `data`.
 * The uniform rule was chosen over per-type special-casing because *everything
 * collapsing to one colour* is itself a loud symptom, and the legend shows the
 * single `[object Object]` row.
 */
function toCategory(value: unknown): string | null {
  if (value == null || value === '') return null;
  return String(value);
}

/**
 * Coerce for `'range'` mode: a finite number, **no coercion**.
 *
 * Numeric strings are deliberately rejected — silent coercion hides a mis-typed
 * path, and falling back to grey makes it visible.
 */
function toMagnitude(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Linear interpolation between two 0xRRGGBB colours, per sRGB channel. */
function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

/**
 * Sample a ramp at `t ∈ [0,1]`.
 *
 * Degenerate cases resolve here rather than at the call site: an empty ramp
 * returns `null` (the caller substitutes `fallbackColor`), and a one-stop ramp
 * is a constant colour.
 */
function sampleStops(stops: readonly number[], t: number): number | null {
  if (stops.length === 0) return null;
  if (stops.length === 1) return stops[0]!;
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t;
  const pos = clamped * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(pos));
  return lerpColor(stops[i]!, stops[i + 1]!, pos - i);
}

/**
 * Normalise + ease a magnitude into `[0,1]` for the continuous scales.
 * `hi === lo` collapses to 0 so a single-valued field takes the first stop
 * rather than dividing by zero.
 */
function easeMagnitude(value: number, lo: number, hi: number, scale: ColorByScale): number {
  if (hi <= lo) return 0;
  const t = (value - lo) / (hi - lo);
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t;
  switch (scale) {
    case 'sqrt':
      return Math.sqrt(clamped);
    case 'log':
      return Math.log1p(clamped * (hi - lo)) / Math.log1p(hi - lo);
    default:
      return clamped;
  }
}

/** Index of the bucket `value` falls in, given ascending interior edges. */
function bucketIndex(value: number, edges: readonly number[]): number {
  let i = 0;
  while (i < edges.length && value >= edges[i]!) i += 1;
  return i;
}

/** Equal-count bucket edges over a sorted sample — the `'quantile'` scale's edges. */
function quantileEdges(sorted: readonly number[], bins: number): number[] {
  if (sorted.length === 0 || bins <= 1) return [];
  const edges: number[] = [];
  for (let i = 1; i < bins; i++) {
    const idx = Math.floor((i / bins) * sorted.length);
    edges.push(sorted[Math.min(sorted.length - 1, idx)]!);
  }
  return [...new Set(edges)];
}

/** Snapshot of a template field so disable can restore it. */
type Resolvable<T> = T | ((item: never) => T) | undefined;

/** Per-channel derived state — the domain / bin edges the resolvers read. */
interface ChannelState {
  /** Resolved `[lo, hi]` for the continuous + quantile scales. */
  domain: [number, number];
  /** Ascending interior bucket edges for the binned scales. */
  edges: number[];
}

// ─── Behaviour ───────────────────────────────────────────────────────────────

export class ColorByBehaviour extends Behaviour<ColorByBehaviourOptions> {
  override readonly kind = 'color-by';

  private layer: GraphLayer | null = null;
  private opts: ResolvedColorByOptions;

  /** Subscription disposers, called in `onDestroy`. */
  private readonly subs: (() => void)[] = [];
  /** Coalesces a burst of topology events into one domain rescan. */
  private rescanScheduled = false;
  /** Re-entrancy guard — our own repaint must not feed back into a rescan. */
  private patching = false;

  /** value → assigned colour, in first-appearance order. Categorical mode. */
  private readonly colors = new Map<string, number>();
  /** Distinct values assigned *from the palette* — what `maxCategories` counts. */
  private paletteAssigned = 0;
  /** Values that overflowed the cap, for the legend's `other (N)` row. */
  private readonly overflow = new Set<string>();

  private nodeState: ChannelState = { domain: [0, 1], edges: [] };
  private edgeState: ChannelState = { domain: [0, 1], edges: [] };

  /** True while the resolvers are installed on the template. */
  private applied = false;
  /** Prior template fields, captured on `apply` and put back on `restore`. */
  private priorNodeBgFill: Resolvable<NodeStyle['bgFill']> = undefined;
  private priorEdgeStroke: Resolvable<EdgeStyle['strokeColor']> = undefined;
  private priorEdgeArrow: Resolvable<EdgeStyle['arrowTargetColor']> = undefined;
  /**
   * The exact resolver instances this behaviour installed, so `restore` can tell
   * **its own** function from a consumer's. Identity, not `typeof === 'function'`:
   * a consumer's `bgFill: (n) => …` is also a function, and treating it as ours
   * meant disabling this behaviour overwrote their fill with a snapshot taken
   * before their config was ever applied — usually `undefined`, which renders a
   * node with no fill at all.
   */
  private installedNodeBgFill: Resolvable<NodeStyle['bgFill']> = undefined;
  /** Stroke alone identifies the edge channel — both fields install together. */
  private installedEdgeStroke: Resolvable<EdgeStyle['strokeColor']> = undefined;

  constructor(opts: ColorByBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
    this.opts = resolveOptions(null, opts);
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.targetLayerId!);
    if (!layer) {
      throw new Error(
        `ColorByBehaviour "${this.id}": layer "${this.targetLayerId}" not found. ` +
          `Add the GraphLayer before registering this behaviour.`,
      );
    }
    this.layer = layer;

    // Auto-domain has to follow the data. Subscribe to topology only — the same
    // reasoning as `NodeCentralityBehaviour`: `'node:update'` would catch our own
    // writes, and `'flush'` fires on every render projection (hover, drag,
    // camera), which turns an unrelated hover into a full rescan.
    const schedule = (): void => this.scheduleRescan();
    this.subs.push(
      layer.store.events.on('node:add', schedule),
      layer.store.events.on('node:remove', schedule),
      layer.store.events.on('edge:add', schedule),
      layer.store.events.on('edge:remove', schedule),
    );
  }

  protected override onEnable(): void {
    this.rescanDomains();
    this.apply();
  }

  protected override onDisable(): void {
    this.restore();
  }

  protected override onDestroy(): void {
    this.restore();
    for (const off of this.subs.splice(0)) off();
    this.layer = null;
  }

  /**
   * Re-apply when a live option patch lands, so a mode / key / palette change
   * recolours immediately.
   *
   * Resets the value→colour assignment (a new palette or cap re-assigns from
   * scratch), re-scans any auto-domain, and re-syncs each channel to its current
   * flag — installing the resolver when the channel is on, uninstalling it when
   * off, so toggling `colorNodes` off *while enabled* reverts that channel
   * immediately. A no-op while disabled; the next enable picks up the merged
   * options.
   */
  protected override onOptionsChanged(patch: Partial<ColorByBehaviourOptions>): void {
    this.opts = resolveOptions(this.opts, patch);
    if (!this.isEnabled || !this.layer) return;
    this.resetAssignments();
    this.rescanDomains();
    this.apply();
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * The fully-resolved option set actually in use — **every default filled in**.
   *
   * Distinct from the base `getOptions()`, which returns only the options the
   * caller passed. A settings panel or a story that wants to show what the
   * behaviour is doing needs the resolved set, otherwise it silently omits every
   * default and reports `mode: undefined` for a behaviour that is very
   * definitely in categorical mode.
   *
   * Remember the validity matrix (class TSDoc): options outside the active mode
   * are present here but **ignored** by the write path.
   */
  getResolvedOptions(): Readonly<ResolvedColorByOptions> {
    return this.opts;
  }

  /**
   * The derived per-channel domain and bin edges the colour resolvers read.
   *
   * Only meaningful in `'range'` mode. Worth exposing separately from
   * {@link getResolvedOptions} because when `nodeDomain` / `edgeDomain` are unset
   * the *resolved option* is `undefined` while the *domain in use* is whatever
   * the last auto-scan found — and that gap is exactly what surprises people.
   */
  getDomains(): { nodes: { domain: [number, number]; edges: number[] }; edges: { domain: [number, number]; edges: number[] } } {
    return {
      nodes: { domain: [...this.nodeState.domain], edges: [...this.nodeState.edges] },
      edges: { domain: [...this.edgeState.domain], edges: [...this.edgeState.edges] },
    };
  }

  /**
   * Live value → colour mapping. Categorical mode only — `'range'` has no discrete
   * assignment, so prefer {@link getLegend} for anything mode-agnostic.
   */
  getColorMap(): ReadonlyMap<string, number> {
    return this.colors;
  }

  /**
   * What a legend should render, per coloured channel.
   *
   * Derived from the same resolved options and domain the canvas is painted
   * from, so a legend sourced here can never disagree with what's on screen —
   * which a type-keyed legend structurally does once `mode: 'range'` is on.
   */
  getLegend(): { nodes?: ColorByLegendSection; edges?: ColorByLegendSection } {
    const out: { nodes?: ColorByLegendSection; edges?: ColorByLegendSection } = {};
    if (this.opts.colorNodes) out.nodes = this.legendFor('node');
    if (this.opts.colorEdges) out.edges = this.legendFor('edge');
    return out;
  }

  /** The colour for one already-extracted category value. */
  colorForValue(value: string | null | undefined): number {
    if (value == null || value === '') return this.opts.fallbackColor;
    const pinned = this.opts.valueColors[value];
    if (pinned !== undefined) return pinned;

    const existing = this.colors.get(value);
    if (existing !== undefined) return existing;

    if (this.paletteAssigned >= this.opts.maxCategories) {
      this.overflow.add(value);
      return this.opts.fallbackColor;
    }
    const colour = this.opts.palette[this.paletteAssigned % this.opts.palette.length]!;
    this.paletteAssigned += 1;
    this.colors.set(value, colour);
    return colour;
  }

  // ─── Internals — value extraction ─────────────────────────────────────────

  /** Extract a node's raw colour value: accessor if set, else the dot path. */
  private nodeValue(n: GraphNode): unknown {
    return this.opts.nodeValueBy ? this.opts.nodeValueBy(n) : readPath(n, this.opts.nodeValueKey);
  }

  /** Extract an edge's raw colour value: accessor if set, else the dot path. */
  private edgeValue(e: GraphEdge): unknown {
    return this.opts.edgeValueBy ? this.opts.edgeValueBy(e) : readPath(e, this.opts.edgeValueKey);
  }

  /** Map a raw value to a colour under the current mode. */
  private colorFor(raw: unknown, state: ChannelState): number {
    if (this.opts.mode === 'categorical') return this.colorForValue(toCategory(raw));

    const value = toMagnitude(raw);
    if (value === null) return this.opts.fallbackColor;

    const { scale, colorStops } = this.opts;
    if (scale === 'quantile' || scale === 'threshold') {
      const i = bucketIndex(value, state.edges);
      const t = state.edges.length === 0 ? 0 : i / state.edges.length;
      return sampleStops(colorStops, t) ?? this.opts.fallbackColor;
    }
    const [lo, hi] = state.domain;
    return sampleStops(colorStops, easeMagnitude(value, lo, hi, scale)) ?? this.opts.fallbackColor;
  }

  // ─── Internals — domain ───────────────────────────────────────────────────

  /** Drop category assignments so a new palette / cap re-assigns from scratch. */
  private resetAssignments(): void {
    this.colors.clear();
    this.paletteAssigned = 0;
    this.overflow.clear();
  }

  /**
   * Coalesce a burst of topology events into one rescan on the next microtask.
   * Guarded by `patching` so the repaint we trigger can't feed back into another.
   */
  private scheduleRescan(): void {
    if (!this.isEnabled || this.patching || this.rescanScheduled) return;
    if (this.opts.mode !== 'range') return; // only auto-domain needs the data
    this.rescanScheduled = true;
    queueMicrotask(() => {
      this.rescanScheduled = false;
      if (!this.isEnabled) return;
      this.rescanDomains();
      this.repaint();
    });
  }

  /**
   * Recompute each channel's domain and bin edges.
   *
   * **Refreshes the derived fields only — it never re-runs the install path.**
   * The resolvers close over `this`, so a fresh domain is picked up on the next
   * read; re-installing would re-snapshot the prior template fields and break
   * restore.
   */
  private rescanDomains(): void {
    const layer = this.layer;
    if (!layer || this.opts.mode !== 'range') return;

    if (this.opts.colorNodes) {
      const values: number[] = [];
      for (const n of layer.store.nodes()) {
        const v = toMagnitude(this.nodeValue(n));
        if (v !== null) values.push(v);
      }
      this.nodeState = this.deriveState(values, this.opts.nodeDomain, this.opts.nodeThresholds);
    }
    if (this.opts.colorEdges) {
      const values: number[] = [];
      for (const e of layer.store.edges()) {
        const v = toMagnitude(this.edgeValue(e));
        if (v !== null) values.push(v);
      }
      this.edgeState = this.deriveState(values, this.opts.edgeDomain, this.opts.edgeThresholds);
    }
  }

  /** Build one channel's domain + bin edges from its observed values. */
  private deriveState(
    values: number[],
    explicitDomain: readonly [number, number] | undefined,
    thresholds: readonly number[] | undefined,
  ): ChannelState {
    const sorted = values.slice().sort((a, b) => a - b);
    const domain: [number, number] = explicitDomain
      ? [explicitDomain[0], explicitDomain[1]]
      : sorted.length > 0
        ? [sorted[0]!, sorted[sorted.length - 1]!]
        : [0, 1];

    const edges =
      this.opts.scale === 'threshold'
        ? [...(thresholds ?? [])]
        : this.opts.scale === 'quantile'
          ? quantileEdges(sorted, this.opts.bins)
          : [];

    return { domain, edges };
  }

  // ─── Internals — legend ───────────────────────────────────────────────────

  /** Build one channel's legend section from the resolved options + domain. */
  private legendFor(channel: 'node' | 'edge'): ColorByLegendSection {
    const usesAccessor =
      channel === 'node' ? this.opts.nodeValueBy !== undefined : this.opts.edgeValueBy !== undefined;
    const field = usesAccessor
      ? '(computed)'
      : channel === 'node'
        ? this.opts.nodeValueKey
        : this.opts.edgeValueKey;

    if (this.opts.mode === 'categorical') {
      const entries = [...this.colors].map(([value, color]) => ({ value, color }));
      for (const [value, color] of Object.entries(this.opts.valueColors)) {
        if (!this.colors.has(value)) entries.push({ value, color });
      }
      return this.overflow.size > 0
        ? {
            kind: 'categories',
            field,
            entries,
            other: { count: this.overflow.size, color: this.opts.fallbackColor },
          }
        : { kind: 'categories', field, entries };
    }

    const state = channel === 'node' ? this.nodeState : this.edgeState;
    if (this.opts.scale === 'quantile' || this.opts.scale === 'threshold') {
      const cuts = state.edges;
      const lo = state.domain[0];
      const hi = state.domain[1];
      const bounds = [lo, ...cuts, hi];
      const bins = bounds.slice(0, -1).map((from, i) => ({
        from,
        to: bounds[i + 1]!,
        color: sampleStops(this.opts.colorStops, cuts.length === 0 ? 0 : i / cuts.length) ??
          this.opts.fallbackColor,
      }));
      return { kind: 'bins', field, bins };
    }
    return { kind: 'gradient', field, domain: [...state.domain], stops: this.opts.colorStops };
  }

  // ─── Internals — write path ───────────────────────────────────────────────

  /**
   * Sync the node channel to `on`. When on, snapshot whatever base `bgFill` the
   * template currently carries — unless *our own* resolver is what's sitting
   * there, so we never snapshot ourselves — then install the colour resolver.
   * When off, put the snapshot back, but **only if our resolver is still the
   * installed one**.
   *
   * The guard is identity (`current === this.installedNodeBgFill`), not
   * `typeof current === 'function'`. A consumer's own `bgFill: (n) => …` is a
   * function too, and the old test claimed it as ours: disabling this behaviour
   * then wrote the pre-config snapshot (usually `undefined`) over the consumer's
   * resolver, leaving every node with no fill — invisible shapes with visible
   * labels. Identity also covers the ordering case: when a config lands *after*
   * we enabled, the template no longer holds our function, so we leave it alone.
   */
  private syncNode(layer: GraphLayer, on: boolean): void {
    const current = layer.nodeDefaults?.bgFill;
    const ours = this.installedNodeBgFill !== undefined && current === this.installedNodeBgFill;
    if (on) {
      if (!ours) this.priorNodeBgFill = current;
      const bgFill = (n: GraphNode): number => this.colorFor(this.nodeValue(n), this.nodeState);
      this.installedNodeBgFill = bgFill as Resolvable<NodeStyle['bgFill']>;
      layer.setNodeDefaults({ bgFill } as unknown as Partial<NodeStyle>);
    } else if (ours) {
      layer.setNodeDefaults({ bgFill: this.priorNodeBgFill } as unknown as Partial<NodeStyle>);
      this.installedNodeBgFill = undefined;
    }
  }

  /**
   * Sibling of {@link syncNode} for the edge channel (`strokeColor` +
   * `arrowTargetColor`), with the same identity guard — a consumer's own stroke
   * resolver is never mistaken for ours and restored over.
   */
  private syncEdge(layer: GraphLayer, on: boolean): void {
    const current = layer.edgeDefaults?.strokeColor;
    const ours = this.installedEdgeStroke !== undefined && current === this.installedEdgeStroke;
    if (on) {
      if (!ours) {
        this.priorEdgeStroke = layer.edgeDefaults?.strokeColor;
        this.priorEdgeArrow = layer.edgeDefaults?.arrowTargetColor;
      }
      const colour = (e: GraphEdge): number => this.colorFor(this.edgeValue(e), this.edgeState);
      this.installedEdgeStroke = colour as Resolvable<EdgeStyle['strokeColor']>;
      layer.setEdgeDefaults({
        strokeColor: colour,
        arrowTargetColor: colour,
      } as unknown as Partial<EdgeStyle>);
    } else if (ours) {
      layer.setEdgeDefaults({
        strokeColor: this.priorEdgeStroke,
        arrowTargetColor: this.priorEdgeArrow,
      } as unknown as Partial<EdgeStyle>);
      this.installedEdgeStroke = undefined;
    }
  }

  /** Install the colour resolvers for the enabled channels. */
  private apply(): void {
    const layer = this.layer;
    if (!layer) return;
    this.syncNode(layer, this.opts.colorNodes);
    this.syncEdge(layer, this.opts.colorEdges);
    this.applied = true;
  }

  /**
   * Re-render with the **already-installed** resolvers, after a domain rescan
   * changed what they return.
   *
   * Deliberately not `apply()`: re-installing would re-snapshot the prior
   * template fields (§restore) and, on every data batch, break disable. Passing
   * the same function identity back through `setNodeDefaults` re-renders every
   * item while leaving the identity guard intact.
   */
  private repaint(): void {
    const layer = this.layer;
    if (!layer || !this.applied) return;
    this.patching = true;
    try {
      if (this.installedNodeBgFill !== undefined) {
        layer.setNodeDefaults({ bgFill: this.installedNodeBgFill } as unknown as Partial<NodeStyle>);
      }
      if (this.installedEdgeStroke !== undefined) {
        layer.setEdgeDefaults({
          strokeColor: this.installedEdgeStroke,
          arrowTargetColor: this.installedEdgeStroke,
        } as unknown as Partial<EdgeStyle>);
      }
    } finally {
      this.patching = false;
    }
  }

  /** Put the snapshotted template fields back (uninstall both channels). */
  private restore(): void {
    const layer = this.layer;
    if (!layer || !this.applied) return;
    this.syncNode(layer, false);
    this.syncEdge(layer, false);
    this.applied = false;
  }
}
