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

import type {
  ArcSpec,
  BaseShapeSpec,
  CircleSpec,
  CompositePart,
  CompositeSpec,
  EllipseSpec,
  Point,
  PolygonSpec,
  RectSpec,
  RegularPolygonSpec,
  ShapeLabelStyle,
  StarSpec,
  TabbedRectSpec,
} from '@invana/canvas-store';
import { tabbedRectFoldLine, tabbedRectOutline } from '@invana/canvas-store';
import { attrs, esc, hexToCss, n, pointsAttr } from './markup';
import { fillPaint, strokePaint, textContent } from './paint';

/** Vertices of a regular n-gon (pointy-top at `rotation = 0`). */
function regularPolygonPoints(cx: number, cy: number, sides: number, radius: number, rotation = 0): Point[] {
  const pts: Point[] = [];
  const step = (Math.PI * 2) / Math.max(3, sides);
  const start = -Math.PI / 2 - rotation;
  for (let i = 0; i < sides; i++) {
    const a = start + i * step;
    pts.push({ x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) });
  }
  return pts;
}

/** Vertices of a star alternating outer/inner radius. */
function starPoints(cx: number, cy: number, points: number, innerR: number, outerR: number, rotation = 0): Point[] {
  const pts: Point[] = [];
  const step = Math.PI / Math.max(2, points);
  const start = -Math.PI / 2 - rotation;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = start + i * step;
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  return pts;
}

/**
 * Wrap `inner` in a `<g>` when the spec carries a container-level `alpha` or
 * `rotation` (radians, about the spec origin). Returns `inner` unchanged when
 * neither applies, to keep the markup minimal.
 */
function wrapTransform(spec: BaseShapeSpec, inner: string): string {
  const rot = spec.rotation ?? 0;
  const hasAlpha = spec.alpha !== undefined && spec.alpha !== 1;
  if (!rot && !hasAlpha) return inner;
  const t = rot ? `transform="rotate(${n((rot * 180) / Math.PI)} ${n(spec.x)} ${n(spec.y)})"` : '';
  const o = hasAlpha ? `opacity="${n(spec.alpha as number)}"` : '';
  return `<g ${[t, o].filter(Boolean).join(' ')}>${inner}</g>`;
}

/**
 * Serialise a single shape spec to an SVG element. Returns `''` for a shape
 * kind that has no vector representation. `labelStyle` (from an attached
 * `label` decoration) is rendered as `<text>` when present.
 */
export function shapeSpecToSvg(spec: BaseShapeSpec, labelStyle?: unknown): string {
  if (spec.visible === false) return '';
  const paint = { ...fillPaint(spec.fill), ...strokePaint(spec.stroke) };
  let body = '';

  switch (spec.kind) {
    case 'circle': {
      const s = spec as CircleSpec;
      body = `<circle ${attrs({ cx: s.x, cy: s.y, r: s.radius, ...paint })}/>`;
      break;
    }
    case 'ellipse': {
      const s = spec as EllipseSpec;
      body = `<ellipse ${attrs({ cx: s.x, cy: s.y, rx: s.radiusX, ry: s.radiusY, ...paint })}/>`;
      break;
    }
    case 'rect': {
      const s = spec as RectSpec;
      body = `<rect ${attrs({ x: s.x, y: s.y, width: s.width, height: s.height, rx: s.cornerRadius || undefined, ...paint })}/>`;
      break;
    }
    case 'tabbed-rect': {
      const s = spec as TabbedRectSpec;
      // The folder outline is already a polyline (fillets sampled as
      // segments), so it exports exactly as the renderer draws it.
      const pts = tabbedRectOutline(s).map((v) => ({ x: v.x + s.x, y: v.y + s.y }));
      body = `<polygon ${attrs({ points: pointsAttr(pts), ...paint })}/>`;
      // The fold line closing the tab's base is interior geometry, so it
      // rides as a separate stroked segment rather than part of the outline.
      const fold = tabbedRectFoldLine(s);
      if (fold && s.stroke) {
        body += `<line ${attrs({
          x1: fold[0].x + s.x,
          y1: fold[0].y + s.y,
          x2: fold[1].x + s.x,
          y2: fold[1].y + s.y,
          ...strokePaint(s.stroke),
          fill: 'none',
        })}/>`;
      }
      break;
    }
    case 'polygon': {
      const s = spec as PolygonSpec;
      const pts = s.vertices.map((v) => ({ x: v.x + s.x, y: v.y + s.y }));
      body = `<polygon ${attrs({ points: pointsAttr(pts), ...paint })}/>`;
      break;
    }
    case 'regular-polygon': {
      const s = spec as RegularPolygonSpec;
      const pts = regularPolygonPoints(s.x, s.y, s.sides, s.radius, s.rotation ?? 0);
      body = `<polygon ${attrs({ points: pointsAttr(pts), ...paint })}/>`;
      break;
    }
    case 'star': {
      const s = spec as StarSpec;
      const pts = starPoints(s.x, s.y, s.points, s.innerRadius, s.outerRadius, s.rotation ?? 0);
      body = `<polygon ${attrs({ points: pointsAttr(pts), ...paint })}/>`;
      break;
    }
    case 'arc': {
      body = `<path ${attrs({ d: arcToSvgD(spec as ArcSpec), 'fill-rule': 'evenodd', ...paint })}/>`;
      break;
    }
    case 'composite': {
      body = compositeToSvg(spec as CompositeSpec);
      break;
    }
    default:
      return ''; // unknown / raster-only shape kind
  }

  return wrapTransform(spec, body + labelToSvg(spec, labelStyle));
}

/** Annular-sector / pie `arc` spec → SVG path `d`. */
function arcToSvgD(s: ArcSpec): string {
  const { x: cx, y: cy, innerR, outerR, startAngle: a0, endAngle: a1 } = s;
  const full = Math.abs(a1 - a0) >= Math.PI * 2 - 1e-6;
  const pt = (r: number, a: number): Point => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });

  if (full) {
    // Full disc / annulus — two half-arcs per ring; evenodd punches the hole.
    const ring = (r: number) =>
      `M ${n(cx - r)} ${n(cy)} A ${n(r)} ${n(r)} 0 1 1 ${n(cx + r)} ${n(cy)} A ${n(r)} ${n(r)} 0 1 1 ${n(cx - r)} ${n(cy)} Z`;
    return innerR > 0 ? `${ring(outerR)} ${ring(innerR)}` : ring(outerR);
  }

  const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
  const os = pt(outerR, a0);
  const oe = pt(outerR, a1);
  if (innerR <= 0) {
    // Pie slice.
    return `M ${n(cx)} ${n(cy)} L ${n(os.x)} ${n(os.y)} A ${n(outerR)} ${n(outerR)} 0 ${large} 1 ${n(oe.x)} ${n(oe.y)} Z`;
  }
  const ie = pt(innerR, a1);
  const is = pt(innerR, a0);
  return (
    `M ${n(os.x)} ${n(os.y)} A ${n(outerR)} ${n(outerR)} 0 ${large} 1 ${n(oe.x)} ${n(oe.y)} ` +
    `L ${n(ie.x)} ${n(ie.y)} A ${n(innerR)} ${n(innerR)} 0 ${large} 0 ${n(is.x)} ${n(is.y)} Z`
  );
}

/**
 * Composite card → an SVG `<g>` translated to the composite's top-left origin:
 * the background silhouette (default rounded-rect, or the `root` shape centred
 * in the box) followed by each `rect` / `circle` / `line` / `label` part.
 */
function compositeToSvg(s: CompositeSpec): string {
  const els: string[] = [];
  const paint = { ...fillPaint(s.fill), ...strokePaint(s.stroke) };

  if (s.root) {
    // Centre the borrowed root shape in the width×height box (its own x/y are
    // ignored per CompositeSpec) and serialise it as a normal shape.
    const centred = { ...s.root, x: s.width / 2, y: s.height / 2 } as BaseShapeSpec;
    // Rect roots are top-left anchored — offset so the box is centred.
    if (s.root.kind === 'rect') {
      const r = s.root as RectSpec;
      (centred as { x: number; y: number }).x = (s.width - r.width) / 2;
      (centred as { x: number; y: number }).y = (s.height - r.height) / 2;
    }
    els.push(shapeSpecToSvg(centred));
  } else {
    els.push(`<rect ${attrs({ x: 0, y: 0, width: s.width, height: s.height, rx: s.cornerRadius || undefined, ...paint })}/>`);
  }

  for (const part of s.parts) els.push(partToSvg(part));
  return `<g ${attrs({ transform: `translate(${n(s.x)} ${n(s.y)})` })}>${els.join('')}</g>`;
}

/** A single {@link CompositePart} → SVG element (coords relative to the card origin). */
function partToSvg(part: CompositePart): string {
  switch (part.part) {
    case 'rect':
      return `<rect ${attrs({
        x: part.x,
        y: part.y,
        width: part.width,
        height: part.height,
        rx: part.cornerRadius || undefined,
        fill: part.fill !== undefined ? hexToCss(part.fill) : 'none',
        'fill-opacity': part.fillAlpha,
        ...(part.stroke ? { stroke: hexToCss(part.stroke.color), 'stroke-width': part.stroke.width ?? 1, 'stroke-opacity': part.stroke.alpha } : {}),
      })}/>`;
    case 'circle':
      return `<circle ${attrs({
        cx: part.x,
        cy: part.y,
        r: part.radius,
        fill: part.fill !== undefined ? hexToCss(part.fill) : 'none',
        'fill-opacity': part.fillAlpha,
        ...(part.stroke ? { stroke: hexToCss(part.stroke.color), 'stroke-width': part.stroke.width ?? 1, 'stroke-opacity': part.stroke.alpha } : {}),
      })}/>`;
    case 'line':
      return `<line ${attrs({
        x1: part.x,
        y1: part.y,
        x2: part.x2,
        y2: part.y2,
        stroke: hexToCss(part.stroke.color),
        'stroke-width': part.stroke.width ?? 1,
        'stroke-opacity': part.stroke.alpha,
      })}/>`;
    case 'label': {
      const anchor = part.anchor === 'center' ? 'middle' : part.anchor === 'right' ? 'end' : 'start';
      return `<text ${attrs({
        x: part.x,
        y: part.y,
        'font-size': part.fontSize ?? 12,
        'font-weight': part.fontWeight as string | number | undefined,
        'font-style': part.fontStyle,
        'text-anchor': anchor,
        'dominant-baseline': 'hanging',
        fill: part.fill !== undefined ? hexToCss(part.fill) : '#111827',
      })}>${esc(part.text)}</text>`;
    }
    default:
      return '';
  }
}

/**
 * Approximate an attached `text` label as `<text>`, anchored at the shape
 * centre with a placement-derived vertical offset. Placement is coarse (SVG
 * can't run the engine's fit/collision cascade); it captures the text, colour,
 * and rough position — good enough for a legible vector export.
 */
function labelToSvg(spec: BaseShapeSpec, style: unknown): string {
  const content = textContent(style);
  if (!content) return '';
  const s = style as ShapeLabelStyle;
  const placement = s.placement ?? 'bottom';
  // Rough half-extent from any radius/size field so outside labels clear the shape.
  const r =
    (spec as { radius?: number }).radius ??
    (spec as { outerRadius?: number }).outerRadius ??
    ((spec as { height?: number }).height ?? 24) / 2;
  let dy = 0;
  if (placement.includes('bottom')) dy = r + (content.fontSize ?? 12);
  else if (placement.includes('top')) dy = -(r + 4);
  const ox = s.offset?.x ?? 0;
  const oy = s.offset?.y ?? 0;
  return `<text ${attrs({
    x: spec.x + ox,
    y: spec.y + dy + oy,
    'font-size': content.fontSize ?? 12,
    'font-family': content.fontFamily ?? 'sans-serif',
    'font-weight': content.fontWeight as string | number | undefined,
    'font-style': content.fontStyle,
    'text-anchor': 'middle',
    'dominant-baseline': 'middle',
    fill: content.fill !== undefined ? hexToCss(content.fill) : '#111827',
    opacity: content.alpha,
  })}>${esc(content.text)}</text>`;
}
