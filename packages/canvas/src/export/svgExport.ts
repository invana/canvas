/**
 * Vector SVG export — a **second projection** of the scene into scalable SVG
 * markup, independent of the GPU raster path.
 *
 * PixiJS renders to WebGPU/WebGL, so there is no vector output to read back;
 * instead we serialise the **live specs** the renderer already holds — each
 * shape's geometry spec and each connector's routed {@link Path} — into SVG
 * elements. Because those are the exact specs on screen, the SVG matches the
 * rendered diagram (within the coverage notes below), while staying resolution
 * independent.
 *
 * The per-spec serialisers here are **pure and domain-free** (a `CircleSpec`
 * knows nothing about "nodes"). {@link PrimitivesRenderer.toSVG} walks its
 * instance maps and calls them; {@link exportSVG} stitches every layer's
 * fragment into one `<svg>` document with the right `viewBox` + background.
 *
 * ## Coverage (v1)
 *
 * Faithful: `circle`, `ellipse`, `rect` (+ `cornerRadius`), `polygon`,
 * `regular-polygon`, `star`, `arc`, `composite` (root silhouette + `rect` /
 * `circle` / `line` / `label` parts), connectors (routed path + solid stroke +
 * dash + arrow markers), solid fills, strokes (colour / width / alpha / dash /
 * cap / join), per-shape `alpha` and container `rotation`, and `text`-kind
 * label decorations (approximate placement).
 *
 * Not represented (raster export covers these exactly — prefer PNG when they
 * matter): `image` / `glyph` / `svg` / `svg-url` fills, decorations other than
 * labels (glow / halo / rings / pulses), effects, blur / shadow filters, and
 * `html-text` labels. These are skipped rather than approximated.
 */

import type { Canvas } from '../engine/Canvas';
import type {
  BaseShapeSpec,
  BaseConnectorSpec,
  CircleSpec,
  EllipseSpec,
  RectSpec,
  TabbedRectSpec,
  PolygonSpec,
  RegularPolygonSpec,
  StarSpec,
  ArcSpec,
  Path,
  Point,
  ShapeFill,
  ShapeStroke,
  ShapeLabelStyle,
  ConnectorLabelStyle,
  LabelContent,
  CompositeSpec,
  CompositePart,
} from '@invana/canvas-store';
import { tabbedRectOutline, tabbedRectFoldLine } from '@invana/canvas-store';
import { hexToCss, resolveExportBackground, captureRect, type ExportArea } from './shared';

/** Options for {@link Canvas.exportSVG} (a subset of the raster options). */
export interface ExportSvgOptions {
  /** Capture area. Default `'viewport'`. */
  area?: ExportArea;
  /** Background fill. Default `'canvas'`. `'transparent'` omits the backing rect. */
  background?: string | number | 'transparent' | 'canvas';
  /** World padding around the content bounds (`area: 'content'` only). Default `24`. */
  padding?: number;
  /**
   * Force a specific output aspect ratio (width ÷ height). The `viewBox` is
   * letterboxed to it — grown + re-centred, never cropped. Default: no constraint.
   */
  aspectRatio?: number;
  /** Multiplier for the SVG's pixel `width`/`height` attributes (the `viewBox` is unaffected). Default `1`. */
  scale?: number;
}

/** A layer that can contribute vector markup to an SVG export. */
export interface SvgExportableLayer {
  /** Return an SVG fragment (elements, no `<svg>` wrapper) in world coordinates. */
  toSVG(): string;
}

// ─── Primitives: number / colour / geometry helpers ─────────────────────────

/** Round to 3 decimals and drop a trailing `.0` — keeps the markup compact. */
function n(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(3).replace(/\.?0+$/, '');
}

/** Escape text for use in an XML text node / attribute value. */
function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
  );
}

/** Serialise an attribute map, skipping `undefined` / empty values. */
function attrs(map: Record<string, string | number | undefined>): string {
  return Object.entries(map)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}="${typeof v === 'number' ? n(v) : v}"`)
    .join(' ');
}

/** A `Path` (M/L/Q/C commands) → an SVG `d` attribute string. */
export function pathToSvgD(path: Path): string {
  const out: string[] = [];
  for (const c of path) {
    if (c.kind === 'M') out.push(`M ${n(c.x)} ${n(c.y)}`);
    else if (c.kind === 'L') out.push(`L ${n(c.x)} ${n(c.y)}`);
    else if (c.kind === 'Q') out.push(`Q ${n(c.cx)} ${n(c.cy)} ${n(c.x)} ${n(c.y)}`);
    else out.push(`C ${n(c.c1x)} ${n(c.c1y)} ${n(c.c2x)} ${n(c.c2y)} ${n(c.x)} ${n(c.y)}`);
  }
  return out.join(' ');
}

/** `points="x,y x,y …"` for `<polygon>`. */
function pointsAttr(pts: readonly Point[]): string {
  return pts.map((p) => `${n(p.x)},${n(p.y)}`).join(' ');
}

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

// ─── Fill + stroke → SVG paint attributes ────────────────────────────────────

/**
 * Resolve a {@link ShapeFill} to SVG `fill` / `fill-opacity`. Only the first
 * `solid` layer is representable in flat SVG; `image` / `glyph` / `svg` fills
 * are skipped (→ `fill: none`), documented as a raster-only feature.
 */
function fillPaint(fill: ShapeFill | undefined): Record<string, string | number | undefined> {
  if (fill === undefined) return { fill: 'none' };
  if (typeof fill === 'number') return { fill: hexToCss(fill) };
  const layers = Array.isArray(fill) ? fill : [fill];
  for (const layer of layers) {
    if (layer.kind === 'solid') {
      return { fill: hexToCss(layer.color), 'fill-opacity': layer.alpha ?? undefined };
    }
  }
  return { fill: 'none' };
}

/** Resolve a {@link ShapeStroke} to SVG stroke attributes. `widthScale` mirrors LOD scaling. */
function strokePaint(stroke: ShapeStroke | undefined, widthScale = 1): Record<string, string | number | undefined> {
  if (!stroke) return {};
  const width = (stroke.width ?? 1) * widthScale;
  return {
    stroke: hexToCss(stroke.color),
    'stroke-width': width,
    'stroke-opacity': stroke.alpha ?? undefined,
    'stroke-linecap': stroke.cap,
    'stroke-linejoin': stroke.join,
    'stroke-dasharray': stroke.dashArray ? `${n(stroke.dashArray[0])} ${n(stroke.dashArray[1])}` : undefined,
    'stroke-dashoffset': stroke.dashOffset,
  };
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

// ─── Shape serialisation ─────────────────────────────────────────────────────

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

// ─── Labels (attached label decorations) ─────────────────────────────────────

/** Extract plain-text `LabelContent` from a label decoration style, if any. */
function textContent(style: unknown): (LabelContent & { kind: 'text' }) | undefined {
  const content = (style as { content?: LabelContent } | undefined)?.content;
  return content?.kind === 'text' ? content : undefined;
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

// ─── Connector serialisation ─────────────────────────────────────────────────

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

// ─── Document assembly ───────────────────────────────────────────────────────

/**
 * Build the full SVG document for a canvas. Walks visible layers in z-order,
 * collects each {@link SvgExportableLayer.toSVG} fragment, and wraps them in an
 * `<svg>` sized to the capture region with an optional background rect.
 *
 * Throws when the capture region is empty (nothing to export).
 */
export function exportSVG(canvas: Canvas, opts: ExportSvgOptions = {}): string {
  const area = opts.area ?? 'viewport';
  const rect = captureRect(canvas, area, opts.padding ?? 24, opts.aspectRatio);
  if (!(rect.width > 0) || !(rect.height > 0)) {
    throw new Error('Canvas.exportSVG: nothing to export (empty capture region).');
  }

  const body: string[] = [];
  for (const layer of canvas.layers.byZOrder()) {
    if (!layer.visible) continue;
    const fn = (layer as unknown as Partial<SvgExportableLayer>).toSVG;
    if (typeof fn === 'function') {
      const frag = fn.call(layer);
      if (frag) body.push(frag);
    }
  }

  const bg = resolveExportBackground(canvas, opts.background ?? 'canvas');
  const bgRect = bg
    ? `<rect ${attrs({ x: rect.x, y: rect.y, width: rect.width, height: rect.height, fill: bg })}/>`
    : '';

  // viewBox is world units; pixel width/height reproduce on-screen size for the
  // viewport area (× camera zoom), native size for content.
  const pxScale = (area === 'viewport' ? canvas.camera.scale : 1) * (opts.scale ?? 1);
  const header = attrs({
    xmlns: 'http://www.w3.org/2000/svg',
    width: rect.width * pxScale,
    height: rect.height * pxScale,
    viewBox: `${n(rect.x)} ${n(rect.y)} ${n(rect.width)} ${n(rect.height)}`,
  });
  return `<svg ${header}>${bgRect}${body.join('')}</svg>`;
}
