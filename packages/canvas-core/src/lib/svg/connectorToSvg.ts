/**
 * Connector spec → SVG serialisation — the other half of the vector export
 * path (see {@link shapeSpecToSvg}). Pure: a spec + its routed {@link Path} in,
 * markup out.
 */

import type { BaseConnectorSpec, ConnectorLabelStyle, Path, Point } from '../../specs';
import { attrs, esc, hexToCss, n, pointsAttr } from './markup';
import { strokePaint, textContent } from './paint';
import { pathToSvgD } from './pathToSvgD';

/**
 * Serialise a connector (its routed `path` + stroke + optional arrow markers)
 * to SVG. `strokeWidthScale` mirrors the renderer's per-instance LOD scaling.
 */
export function connectorToSvg(
  spec: BaseConnectorSpec,
  path: Path,
  strokeWidthScale = 1,
  labelStyle?: unknown,
): string {
  if (spec.visible === false || path.length === 0) return '';
  const paint = strokePaint(spec.stroke, strokeWidthScale);
  const width = (spec.stroke?.width ?? 1) * strokeWidthScale;
  const els = [`<path ${attrs({ d: pathToSvgD(path), fill: 'none', ...paint })}/>`];

  // Arrow markers as filled triangles at the path ends, oriented along the
  // terminal segment. Approximate (marker geometry sizes off stroke width).
  const color = spec.stroke ? hexToCss(spec.stroke.color) : '#000000';
  if (spec.targetMarker) els.push(arrowMarker(path, 'target', width, color));
  if (spec.sourceMarker) els.push(arrowMarker(path, 'source', width, color));

  const label = connectorLabelToSvg(path, labelStyle);
  const alpha = spec.alpha !== undefined && spec.alpha !== 1 ? ` opacity="${n(spec.alpha)}"` : '';
  return `<g${alpha}>${els.join('')}${label}</g>`;
}

/** A triangular arrowhead at the source/target end of a path. */
function arrowMarker(path: Path, end: 'source' | 'target', strokeWidth: number, color: string): string {
  const pts = pathPoints(path);
  if (pts.length < 2) return '';
  const tip = end === 'target' ? pts[pts.length - 1]! : pts[0]!;
  const prev = end === 'target' ? pts[pts.length - 2]! : pts[1]!;
  const ang = Math.atan2(tip.y - prev.y, tip.x - prev.x);
  const len = Math.max(6, strokeWidth * 4);
  const half = Math.max(3, strokeWidth * 2);
  const back = { x: tip.x - len * Math.cos(ang), y: tip.y - len * Math.sin(ang) };
  const nx = Math.cos(ang + Math.PI / 2);
  const ny = Math.sin(ang + Math.PI / 2);
  const p1 = { x: back.x + half * nx, y: back.y + half * ny };
  const p2 = { x: back.x - half * nx, y: back.y - half * ny };
  return `<polygon ${attrs({ points: pointsAttr([tip, p1, p2]), fill: color })}/>`;
}

/** Sample a path's command endpoints as a coarse polyline (ignores control points). */
function pathPoints(path: Path): Point[] {
  return path.filter((c) => c.kind !== undefined).map((c) => ({ x: c.x, y: c.y }));
}

/** Approximate a connector's `text` label at the path midpoint. */
function connectorLabelToSvg(path: Path, style: unknown): string {
  const content = textContent(style);
  if (!content) return '';
  const pts = pathPoints(path);
  if (pts.length === 0) return '';
  const mid = pts[Math.floor(pts.length / 2)]!;
  const s = style as ConnectorLabelStyle;
  return `<text ${attrs({
    x: mid.x + (s.offset?.x ?? 0),
    y: mid.y + (s.offset?.y ?? 0),
    'font-size': content.fontSize ?? 12,
    'font-family': content.fontFamily ?? 'sans-serif',
    'text-anchor': 'middle',
    'dominant-baseline': 'middle',
    fill: content.fill !== undefined ? hexToCss(content.fill) : '#111827',
  })}>${esc(content.text)}</text>`;
}
