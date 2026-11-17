/**
 * Scale-independent wrapper around `bubblesets-js`' `createOutline`.
 *
 * `bubblesets-js` builds an integer-indexed potential grid whose cell is
 * `pixelGroup` units. That is fine for a graph laid out in hundreds of world
 * units, and silent failure for a map: on a `MapLayer` canvas the whole earth is
 * 512 world units across, so a cluster spans a fraction of one unit and any
 * `pixelGroup` small enough to resolve it collapses the grid — the outline comes
 * back empty, with no error.
 *
 * {@link createScaledOutline} runs the library in a *normalised* space instead:
 * every coordinate and every radius is multiplied by `k = LIB_CELL / pixelGroup`,
 * the library is called with its own default cell (`LIB_CELL`), and the outline
 * is divided by `k` on the way out. The options stay in **world units** at any
 * scale. At the default `pixelGroup` (`LIB_CELL`), `k = 1` and the call is
 * byte-identical to calling the library directly.
 *
 * @packageDocumentation
 */

import { createOutline, PointPath, type ILine, type IRectangle } from 'bubblesets-js';

/** The library's own default grid cell, in its units — the normalised cell size. */
export const LIB_CELL = 4;

/** The algorithm options the layer exposes, all in **world units**. */
export interface OutlineOptions {
  /** Grid resolution in world units. */
  pixelGroup: number;
  nodeR0: number;
  nodeR1: number;
  edgeR0: number;
  edgeR1: number;
  morphBuffer: number;
  maxRoutingIterations: number;
  maxMarchingIterations: number;
}

/**
 * The factor that maps world units into the library's normalised space.
 * `1` when `pixelGroup` is the library default; larger for finer grids.
 *
 * @param pixelGroup - The world-unit grid resolution. Non-positive or non-finite
 *   values fall back to {@link LIB_CELL} (so `k = 1`).
 */
export function normalisationFactor(pixelGroup: number): number {
  return Number.isFinite(pixelGroup) && pixelGroup > 0 ? LIB_CELL / pixelGroup : 1;
}

const scaleRect = (r: IRectangle, k: number): IRectangle => ({
  x: r.x * k,
  y: r.y * k,
  width: r.width * k,
  height: r.height * k,
});

const scaleLine = (l: ILine, k: number): ILine => ({
  x1: l.x1 * k,
  y1: l.y1 * k,
  x2: l.x2 * k,
  y2: l.y2 * k,
});

/**
 * Compute a bubble-set outline in world units, at any scale.
 *
 * @param members - Rectangles the outline must enclose, in world units.
 * @param nonMembers - Rectangles the outline routes around, in world units.
 * @param edges - Line segments the outline must enclose, in world units.
 * @param opts - Algorithm options in world units (see {@link OutlineOptions}).
 * @returns The outline as a `PointPath` in world units. Empty when the library
 *   finds no contour.
 */
export function createScaledOutline(
  members: readonly IRectangle[],
  nonMembers: readonly IRectangle[],
  edges: readonly ILine[],
  opts: OutlineOptions,
): PointPath {
  const k = normalisationFactor(opts.pixelGroup);
  // A variable, not a literal: `createOutline` forwards its options to the
  // `BubbleSets` constructor, which honours `pixelGroup`, but the library types
  // `createOutline`'s parameter without it — so a fresh literal would fail the
  // excess-property check for an option that works.
  const libOpts = {
    pixelGroup: LIB_CELL,
    nodeR0: opts.nodeR0 * k,
    nodeR1: opts.nodeR1 * k,
    edgeR0: opts.edgeR0 * k,
    edgeR1: opts.edgeR1 * k,
    morphBuffer: opts.morphBuffer * k,
    maxRoutingIterations: opts.maxRoutingIterations,
    maxMarchingIterations: opts.maxMarchingIterations,
  };
  const path = createOutline(
    members.map((r) => scaleRect(r, k)),
    nonMembers.map((r) => scaleRect(r, k)),
    edges.map((l) => scaleLine(l, k)),
    libOpts,
  );
  if (k === 1) return path;
  return new PointPath(
    path.points.map((p) => ({ x: p.x / k, y: p.y / k })),
    path.closed,
  );
}
