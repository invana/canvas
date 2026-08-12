/**
 * `svg/` — pure spec → markup serialisers.
 *
 * Split out of `@invana/canvas`'s `export/svgExport.ts` so a rendering backend
 * (e.g. `PrimitivesRenderer.toSVG`) can serialise specs without depending on
 * the engine. Document assembly (`exportSVG`) stays in `@invana/canvas` — it
 * walks a live `Canvas`.
 */

export { pathToSvgD } from './pathToSvgD';
export { shapeSpecToSvg } from './shapeSpecToSvg';
export { connectorToSvg } from './connectorToSvg';
export { attrs, esc, hexToCss, n as svgNum, pointsAttr } from './markup';
export { fillPaint, strokePaint, textContent } from './paint';
