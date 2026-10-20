/**
 * How a board keeps a dense graph readable, as rules the drawing and the
 * status bar share so the two never disagree.
 *
 * - **Fade.** Edges draw fainter as their count grows — fully opaque up to
 *   {@link EDGE_DENSITY}`.fadeFrom` relationships, then `√(fadeFrom / n)`,
 *   never below `minAlpha`. Thousands of solid lines into one hub fill its fan
 *   with colour; faint ones leave the nodes readable. A board keeps hovered,
 *   selected and highlighted edges opaque.
 * - **Thin.** With at least `thinFrom` relationships and the camera below
 *   `thinBelowZoom`, about `thinKeep` of them are drawn — an even sample
 *   (`EdgeLODBehaviour`, `keepBy: 'sample'`), so every hub keeps its share.
 *   Zooming in draws them all.
 */
export const EDGE_DENSITY = {
  /** Relationship count up to which edges draw fully opaque. */
  fadeFrom: 200,
  /** The faintest an edge is drawn. */
  minAlpha: 0.15,
  /** Relationship count from which edges thin when zoomed out. */
  thinFrom: 500,
  /** Camera zoom below which edges thin. */
  thinBelowZoom: 0.5,
  /** Fraction of relationships drawn while thinned. */
  thinKeep: 0.1,
} as const;

/** Edge opacity for a graph of `relationships` edges. */
export function edgeAlphaForCount(relationships: number): number {
  const { fadeFrom, minAlpha } = EDGE_DENSITY;
  if (relationships <= fadeFrom) return 1;
  return Math.max(minAlpha, Math.sqrt(fadeFrom / relationships));
}

/** Whether a graph this size thins its edges at all. */
export function thinsEdges(relationships: number): boolean {
  return relationships >= EDGE_DENSITY.thinFrom;
}

/** Whether edges are thinned right now, at this size and zoom. */
export function edgesThinned(relationships: number, zoom: number): boolean {
  return thinsEdges(relationships) && zoom < EDGE_DENSITY.thinBelowZoom;
}
