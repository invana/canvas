import { SubgraphLayoutOptions, SubgraphPositionLayout, LayoutSubgraph, LayoutPositions } from '@invana/graph';

/**
 * Geometric layout mode.
 *
 * - `'grid'` — nodes on a regular grid, filled row-major (left→right, top→bottom).
 * - `'snake'` — like `grid`, but every other row reverses direction (a serpentine
 *   / boustrophedon fill) so consecutive nodes stay adjacent across row breaks.
 * - `'circular'` — nodes spaced evenly around a single circle.
 */
type GeometricLayoutMode = 'grid' | 'snake' | 'circular';
/**
 * `GeometricLayout` options.
 *
 * Extends {@link OneShotLayoutOptions}, so it also accepts `id` / `targetLayerId`
 * (registry + `config.activeLayout` wiring) and `transition` / `transitionEase`
 * (glide vs snap — owned by the shared `OneShotPositionLayout` base). All three
 * modes are pure position moves, so they glide by default.
 *
 * Every field is optional with a sensible default; nodes are placed in store
 * iteration order.
 */
interface GeometricLayoutOptions extends SubgraphLayoutOptions {
    /** Layout mode. Default `'grid'`. */
    mode?: GeometricLayoutMode;
    /** Column count for `grid` / `snake`. Default `ceil(sqrt(n))` (a square-ish block). */
    columns?: number;
    /** Horizontal spacing between columns, in world units. Default `60`. */
    columnGap?: number;
    /** Vertical spacing between rows, in world units. Default `60`. */
    rowGap?: number;
    /**
     * Circle radius in world units. Default: auto — derived from the node count
     * and {@link nodeSpacing} so neighbours sit ~`nodeSpacing` apart along the arc.
     */
    radius?: number;
    /** Arc spacing used to auto-derive {@link radius} when it's omitted. Default `50`. */
    nodeSpacing?: number;
    /** Angle of the first node, in radians. Default `-π/2` (12 o'clock). */
    startAngle?: number;
    /** Whether nodes advance clockwise. Default `true`. */
    clockwise?: boolean;
    /** Translate the whole layout by `(x, y)`. Default `{ x: 0, y: 0 }` (centred on origin). */
    center?: {
        x?: number;
        y?: number;
    };
}

/**
 * `GeometricLayout` — dependency-free geometric `Layout`s for `@invana/graph`:
 * `grid`, `snake` (serpentine grid), and `circular`. Pure index→position math,
 * no external libraries and no edge/topology analysis — every node is placed by
 * its position in store iteration order.
 *
 * One-shot: extends {@link SubgraphPositionLayout}, so it only implements
 * `computeSubgraphLayout()` (a single position pass over whatever node set it's
 * handed). The base owns `transition` / `transitionEase` (these are pure
 * position moves, so they glide by default), cancellation, the `start` / `tick`
 * / `end` lifecycle — and, via `includeGroups`, running this layout once per
 * group so members are packed inside their frame.
 *
 * Having no topology analysis makes this the most forgiving group layout in the
 * set: any node set can be gridded or circled, so a group's members always have
 * a solution no matter how they connect.
 *
 * @example
 * const layout = new GeometricLayout({ mode: 'circular', radius: 300 });
 * await layout.apply(graphLayer);
 */

declare class GeometricLayout extends SubgraphPositionLayout<GeometricLayoutOptions> {
    readonly kind = "geometric-layout";
    protected computeSubgraphLayout(sub: LayoutSubgraph): LayoutPositions | null;
}

export { GeometricLayout, type GeometricLayoutMode, type GeometricLayoutOptions };
