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

export * from './polygonMath';
export * from './tabbedRect';
export * from './bounds';
export * from './contains';

import type { Rect } from '../geometry';
import type { BaseShapeSpec } from '../shape';
import {
  boundsOfArc,
  boundsOfCircle,
  boundsOfComposite,
  boundsOfEllipse,
  boundsOfPath,
  boundsOfPolygon,
  boundsOfRect,
  boundsOfRegularPolygon,
  boundsOfStar,
  scaleArc,
  scaleCircle,
  scaleEllipse,
  scalePath,
  scalePolygon,
  scaleRect,
  scaleRegularPolygon,
  scaleStar,
} from './bounds';
import {
  collapsedTabbedRect,
  fitTabbedRectToContent,
  scaleTabbedRect,
  tabbedRectBounds,
} from './tabbedRect';

/**
 * Local bounds of any built-in spec kind, or `undefined` for a kind this module
 * doesn't know.
 *
 * `undefined` is a real answer, not a failure: `registerShape` admits
 * third-party kinds, so callers that must cover those ask the registry (which
 * consults the class's `static boundsOf`) and fall back to a default box.
 */
export function boundsOfSpec(spec: BaseShapeSpec): Rect | undefined {
  switch (spec.kind) {
    case 'circle':
      return boundsOfCircle(spec as never);
    case 'ellipse':
      return boundsOfEllipse(spec as never);
    case 'rect':
      return boundsOfRect(spec as never);
    case 'tabbed-rect':
      return tabbedRectBounds(spec as never);
    case 'polygon':
      return boundsOfPolygon(spec as never);
    case 'regular-polygon':
      return boundsOfRegularPolygon(spec as never);
    case 'star':
      return boundsOfStar(spec as never);
    case 'arc':
      return boundsOfArc(spec as never);
    case 'path':
      return boundsOfPath(spec as never);
    case 'composite':
      return boundsOfComposite(spec as never);
    default:
      return undefined;
  }
}

/**
 * Uniformly scale a spec's geometry by `factor`, as a partial patch to merge
 * onto it. Paint is untouched — only lengths.
 *
 * The contract: `boundsOfSpec(scaleSpec(spec, k)).width === boundsOfSpec(spec).width * k`
 * (likewise height). `undefined` for kinds with no meaningful uniform scale
 * (`composite` sizes off its box and its parts, so scaling it needs the layer's
 * intent, not a geometric rule).
 */
export function scaleSpec(
  spec: BaseShapeSpec,
  factor: number,
): Record<string, unknown> | undefined {
  switch (spec.kind) {
    case 'circle':
      return scaleCircle(spec as never, factor);
    case 'ellipse':
      return scaleEllipse(spec as never, factor);
    case 'rect':
      return scaleRect(spec as never, factor);
    case 'tabbed-rect':
      return scaleTabbedRect(spec as never, factor);
    case 'polygon':
      return scalePolygon(spec as never, factor);
    case 'regular-polygon':
      return scaleRegularPolygon(spec as never, factor);
    case 'star':
      return scaleStar(spec as never, factor);
    case 'arc':
      return scaleArc(spec as never, factor);
    case 'path':
      return scalePath(spec as never, factor);
    default:
      return undefined;
  }
}

/**
 * The spec "as small as it goes" — what a collapsed container renders as.
 * Purely geometric: the kind decides what collapsing means to it. `undefined`
 * when the kind has no collapsed form, and callers then keep the spec as is.
 */
export function collapsedSpec(
  spec: BaseShapeSpec,
): Record<string, unknown> | undefined {
  return spec.kind === 'tabbed-rect' ? collapsedTabbedRect(spec as never) : undefined;
}

/**
 * Size the spec's geometry to a measured block of content (a title, a label).
 * The caller measures — text metrics belong to the backend — and the kind turns
 * that size into geometry. `undefined` when the kind doesn't size to content.
 */
export function fitSpecToContent(
  spec: BaseShapeSpec,
  content: { readonly width: number; readonly height: number },
): Record<string, unknown> | undefined {
  return spec.kind === 'tabbed-rect'
    ? fitTabbedRectToContent(spec as never, content)
    : undefined;
}
