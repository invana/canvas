import { EventMap, WorldLayer, WorldLayerHit, LayerOptions, CanvasContext, PathSpec } from '@invana/canvas';
import { ContourMultiPolygon } from 'd3-contour';

/**
 * Built-in colour ramps for {@link DensityContourLayer}.
 *
 * Each palette is an ordered array of `0xRRGGBB` stops from low-density to
 * high-density. The layer interpolates between adjacent stops so any band
 * count (3, 10, 30...) lands on a perceptually-smooth colour.
 *
 * Sequential single-hue palettes (`blues`, `greens`, ...) are drawn from
 * ColorBrewer; perceptual ramps (`viridis`, `plasma`, `magma`, `inferno`)
 * are 10-stop quantizations of matplotlib's perceptual colour maps. `warm`
 * and `cool` are ColorBrewer YlOrRd / BuPu equivalents.
 */
type DensityContourPaletteName = 'blues' | 'greens' | 'oranges' | 'purples' | 'reds' | 'viridis' | 'plasma' | 'magma' | 'inferno' | 'warm' | 'cool';
declare const DENSITY_CONTOUR_PALETTES: Record<DensityContourPaletteName, number[]>;
/** All built-in palette names in declaration order. Useful for GUI menus. */
declare const DENSITY_CONTOUR_PALETTE_NAMES: readonly DensityContourPaletteName[];
/**
 * Linear interpolation between two `0xRRGGBB` colours in sRGB space.
 * `t` is clamped to `[0, 1]`. sRGB-linear is "good enough" for adjacent
 * stops in a smooth ramp; for perceptually-uniform mixing across distant
 * hues, supply a function via `paletteFn`.
 */
declare function lerpColor(a: number, b: number, t: number): number;
/**
 * Linearly interpolate a `0xRRGGBB` colour from a stop array based on the
 * band's position `(index / (total - 1))`. Returns the last stop if there's
 * only one band or one stop.
 */
declare function sampleStops(stops: number[], index: number, total: number): number;

/**
 * Options shared by every `DensityContourLayer*` — the d3-contour compute
 * inputs and the recompute lifecycle. Both {@link DensityContourFillLayer}
 * and {@link DensityContourStrokeLayer} extend this; their layer-specific
 * presentation knobs live on their own options interfaces.
 */
interface DensityContourLayerBaseOptions {
    /**
     * Required. Id of the `GraphLayer` whose node positions feed the density
     * estimate. Per canvas architecture: cross-layer deps are declared
     * explicitly, never inferred.
     */
    graphLayerId: string;
    /**
     * Kernel bandwidth in world units. Larger = smoother / broader blobs.
     * Defaults to `20` (d3's own default).
     */
    bandwidth?: number;
    /**
     * Either a count of iso-bands or an explicit array of iso-values. Defaults
     * to `10`. With a number, d3-contour picks evenly-spaced thresholds across
     * the value range.
     */
    thresholds?: number | number[];
    /**
     * Grid cell size in world units. Smaller = sharper bands but quadratically
     * more compute. d3 requires a power of two (1, 2, 4, 8, 16). Defaults to `4`.
     */
    cellSize?: number;
    /**
     * Padding added around the node bounding box before building the grid, so
     * bands at the edge of the cluster aren't clipped against the grid border.
     * World units. Defaults to `50`.
     */
    padding?: number;
    /**
     * Recompute trigger:
     * - `'auto'` (default) — subscribe to the source layer's `data:changed`
     *   and recompute on a debounce.
     * - `'manual'` — caller drives recompute via `layer.recompute()`.
     */
    recompute?: 'auto' | 'manual';
    /** Debounce window for `auto` recomputes. Default `120` ms. */
    recomputeDebounceMs?: number;
}
/**
 * The palette-resolution chain shared by both layers. The fill layer
 * consumes it to colour bands; the stroke layer consumes it when
 * `strokeColor: 'palette'`. Resolution order (most specific wins):
 * `fillColor` callback (fill layer only) > `paletteFn(t)` >
 * `paletteRangeStart`/`paletteRangeEnd` (only when BOTH set) > `palette`
 * (name or stop array) > default `'blues'`.
 */
interface DensityContourPaletteOptions {
    palette?: DensityContourPaletteName | number[];
    paletteRangeStart?: number;
    paletteRangeEnd?: number;
    paletteFn?: (t: number) => number;
}
/**
 * Options for {@link DensityContourFillLayer}. Paints filled iso-bands and
 * nothing else — no stroke. For an outline-only look use
 * {@link DensityContourStrokeLayer}; compose both layers (same
 * `graphLayerId`, different `zIndex`) for fill + outline together.
 */
interface DensityContourFillLayerOptions extends DensityContourLayerBaseOptions, DensityContourPaletteOptions {
    /**
     * Fully-custom fill colour per band. Receives `(value, index, total)` and
     * returns a `0xRRGGBB` integer. `value` is the iso-value (density);
     * `index` runs 0..total-1 from low-density to high-density. Wins over
     * every other palette option.
     */
    fillColor?: (value: number, index: number, total: number) => number;
    /** Fill alpha 0..1. Defaults to `0.4`. */
    fillOpacity?: number;
}
/**
 * Options for {@link DensityContourStrokeLayer}. Paints iso-line outlines
 * and nothing else — no fill. Defaults match Observable's
 * [`@d3/density-contours`](https://observablehq.com/@d3/density-contours):
 * steelblue strokes, every 5th band stroked at 1 unit, the rest at 0.25
 * (the topographic "index contour" pattern).
 */
interface DensityContourStrokeLayerOptions extends DensityContourLayerBaseOptions, DensityContourPaletteOptions {
    /**
     * Band outline colour.
     *
     * - `0xRRGGBB` → constant colour for every band. Default `0x4682b4`
     *   (steelblue, Observable's default).
     * - `'palette'` → resolved per band through the palette chain above
     *   ({@link paletteFn} > range > {@link palette}). Use this for the
     *   "rainbow iso-lines" look.
     */
    strokeColor?: number | 'palette';
    /**
     * Band outline width. Either a constant or a per-band function that
     * receives `(index, total, value)` and returns a width in world units.
     *
     * The function form is the most general — useful for any pattern where
     * width depends on `index`. For the canonical topo-map "every Nth line
     * heavy" look, prefer the declarative {@link indexEvery}/
     * {@link indexMajorWidth}/{@link indexMinorWidth} sugar below.
     *
     * Default `0.5`.
     */
    strokeWidth?: number | ((index: number, total: number, value: number) => number);
    /**
     * Index-contour sugar — every `indexEvery`-th band (counting from
     * low-density at `i=0`) is stroked with {@link indexMajorWidth}, all
     * others with {@link indexMinorWidth}. Reproduces the topographic
     * "index contour every N lines" pattern used by Observable's
     * `@d3/density-contours`.
     *
     * Precedence: function-form {@link strokeWidth} wins over the sugar (so
     * callers can opt fully out by setting `strokeWidth` to a callback). The
     * sugar wins over numeric {@link strokeWidth}. All three sugar fields
     * must be set together; partial setups fall back to {@link strokeWidth}.
     *
     * Defaults reproduce Observable's example: `indexEvery: 5`,
     * `indexMajorWidth: 1`, `indexMinorWidth: 0.25`.
     */
    indexEvery?: number;
    indexMajorWidth?: number;
    indexMinorWidth?: number;
}
/**
 * Reserved. Neither layer currently projects user-mutated state — the
 * computed contour data is held as a private field, not in `Layer.state`,
 * because it's bulk geometry that's rebuilt wholesale on each recompute
 * rather than diffed.
 */
interface DensityContourLayerState {
    readonly _placeholder?: never;
}
interface DensityContourLayerEvents extends EventMap {
    /** Fired after each recompute completes, before paint. */
    recompute: {
        thresholds: number;
        points: number;
        durationMs: number;
    };
}

/**
 * `DensityContourLayerBase` — abstract `WorldLayer` that owns the
 * d3-contour density compute and recompute lifecycle. Concrete subclasses
 * decide *how* the resulting iso-bands are painted: filled
 * ({@link DensityContourFillLayer}) or stroked
 * ({@link DensityContourStrokeLayer}).
 *
 * The compute lives in world space so iso-bands track the source graph as
 * the camera pans and zooms. Recompute is debounced (default 120 ms) and
 * triggered by the source `GraphLayer`'s `data:changed`. `contourDensity`
 * is O(n · grid²), so per-frame recompute during drag would tank perf —
 * set `recompute: 'manual'` and call `layer.recompute()` from a drag
 * behaviour if you need that.
 *
 * Subclasses implement {@link paintDensity} to render the
 * `ContourMultiPolygon[]` into the layer's `Graphics`. All shared state
 * (subscription, debounce timer, bounds math) is owned here.
 */

declare abstract class DensityContourLayerBase<TOpt extends DensityContourLayerBaseOptions, TEvt extends DensityContourLayerEvents = DensityContourLayerEvents> extends WorldLayer<TOpt, DensityContourLayerState, TEvt, never, WorldLayerHit> {
    private readonly graphLayerId;
    private graph;
    private specs;
    private projector;
    /** Ids published on the previous recompute, so stale bands are retired. */
    private published;
    private readonly subs;
    private debounceTimer;
    constructor(opts: LayerOptions<TOpt>);
    protected createState(): DensityContourLayerState;
    protected onMount(ctx: CanvasContext): void;
    protected onUnmount(): void;
    /**
     * Apply a config patch — the seam `canvas.update({ layers: { [id]: … } })`
     * (and therefore the settings editors + the React wrapper) drives. Merges
     * over the current options and repaints, so appearance fields (`bandwidth`,
     * `thresholds`, `cellSize`, `padding`, the subclass's fill / stroke fields)
     * are live-editable.
     *
     * `graphLayerId` is identity, not appearance — it's read once on mount, so
     * patching it here has no effect; re-add the layer to retarget it.
     */
    setOptions(patch: Partial<TOpt>): void;
    /**
     * Force an immediate recompute — e.g. in `recompute: 'manual'` mode, or after
     * a layout moved node positions without changing the data.
     */
    recompute(): void;
    hitTest(_worldX: number, _worldY: number): WorldLayerHit | null;
    private scheduleRecompute;
    private computeAndPaint;
    /**
     * Describe the iso-bands as `path` specs. Bands arrive low-density →
     * high-density; emit in that order so denser bands sit on top (later specs get
     * a higher `zIndex`). `offsetX`/`offsetY` are the world-space origin of the
     * compute grid — add them to each polygon point.
     *
     * Subclasses *describe*; they never draw. That is what lets these bands render
     * on any backend and appear in a serialised canvas.
     */
    protected abstract buildBands(density: ContourMultiPolygon[], offsetX: number, offsetY: number): PathSpec[];
    /** Publish this pass's bands, returning the ids used. */
    private publishBands;
    /** Drop bands published last pass that this pass no longer produced. */
    private retireBands;
}

/**
 * `DensityContourFillLayer` — paints filled iso-bands from a
 * d3-contour density estimate over a source `GraphLayer`'s node positions.
 * No outline. For the stroked / Observable-style look, use
 * {@link DensityContourStrokeLayer}; compose both layers (same
 * `graphLayerId`, different `zIndex`) for fill + outline together.
 */

declare class DensityContourFillLayer extends DensityContourLayerBase<DensityContourFillLayerOptions> {
    readonly kind = "density-contour-fill-layer";
    protected buildBands(density: ContourMultiPolygon[], offsetX: number, offsetY: number): PathSpec[];
    /**
     * Resolve the palette chain into a per-band colour function. Order
     * (most specific wins): {@link DensityContourFillLayerOptions.fillColor}
     * > `paletteFn(t)` > `paletteRangeStart`/`paletteRangeEnd` (both set) >
     * `palette` > default `'blues'`.
     */
    private resolveFillColor;
}

/**
 * `DensityContourStrokeLayer` — paints stroked iso-lines from a
 * d3-contour density estimate over a source `GraphLayer`'s node positions.
 * No fill. Defaults reproduce Observable's
 * [`@d3/density-contours`](https://observablehq.com/@d3/density-contours):
 * steelblue strokes with the topographic "index contour" pattern (every 5th
 * band heavy at 1 unit, the rest hair-thin at 0.25).
 *
 * For filled iso-bands use {@link DensityContourFillLayer}; compose both
 * layers (same `graphLayerId`, different `zIndex`) for fill + outline
 * together.
 */

declare class DensityContourStrokeLayer extends DensityContourLayerBase<DensityContourStrokeLayerOptions> {
    readonly kind = "density-contour-stroke-layer";
    protected buildBands(density: ContourMultiPolygon[], offsetX: number, offsetY: number): PathSpec[];
    /**
     * Resolve the per-band stroke-width function. Precedence:
     *   1. `strokeWidth` is a function → use it directly.
     *   2. All three index-contour sugar fields set → build
     *      `(i) => i % every === 0 ? major : minor`.
     *   3. `strokeWidth` is a number → constant.
     *   4. Default {@link STROKE_DEFAULTS.strokeWidth}.
     */
    private resolveWidth;
    /**
     * Resolve the per-band stroke-colour function. When `strokeColor` is
     * `'palette'`, walk the palette chain (`paletteFn` > range > `palette`);
     * otherwise return a constant colour function. Default is steelblue.
     */
    private resolveStrokeColor;
}

export { DENSITY_CONTOUR_PALETTES, DENSITY_CONTOUR_PALETTE_NAMES, DensityContourFillLayer, type DensityContourFillLayerOptions, DensityContourLayerBase, type DensityContourLayerBaseOptions, type DensityContourLayerEvents, type DensityContourLayerState, type DensityContourPaletteName, type DensityContourPaletteOptions, DensityContourStrokeLayer, type DensityContourStrokeLayerOptions, lerpColor, sampleStops };
