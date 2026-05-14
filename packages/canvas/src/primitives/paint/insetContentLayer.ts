/**
 * Inset-content mount / update / destroy for `glyph`, `svg`, `svg-url`, and
 * `image-inset` fill layers. Each inset layer becomes a sibling Container
 * parented to the shape's `gfx`, sized as a fraction of the shape's bounds
 * and positioned by the layer's `anchor`.
 *
 * Text labels are NOT handled here. Multi-character labels (centred-inside,
 * outside-side, or along-path) are rendered by `LabelDecoration` /
 * `LabelConnectorDecoration` via `setDecoration(id, 'label', ...)` — they
 * support backgrounds, wrap / ellipsis, rich (HTML) text, and 13 placements
 * including the inside-centre case the legacy `kind: 'text'` fill layer used
 * to cover.
 *
 * Decorations operate on the silhouette only (via `paintInto`) — they never
 * see inset content. Animated decorations like glow / pulse paint a halo
 * around the silhouette; the inset content sits unaffected on top.
 *
 * `svg-url` layers fetch their SVG asynchronously. The Graphics child is
 * created empty and added to the scene immediately; once the fetch resolves,
 * the path is populated and `positionAndScale` is re-run so the now-non-empty
 * bounds drive the correct scale. Results are cached globally per URL.
 */

import {
  Container,
  Graphics,
  GraphicsPath,
  Sprite,
  Text,
  type TextStyleOptions,
} from 'pixi.js';
import type {
  InsetAnchor,
  Point,
  Rect,
  ShapeFillLayer,
  ShapeHostInfo,
} from '../types';

export type InsetLayer = Extract<
  ShapeFillLayer,
  { kind: 'glyph' | 'svg' | 'svg-url' | 'image-inset' }
>;

export interface InsetContentView {
  readonly gfx: Container;
  child: Text | Graphics | Sprite;
  key: string;
}

export function isInsetLayer(layer: ShapeFillLayer): layer is InsetLayer {
  return (
    layer.kind === 'glyph' ||
    layer.kind === 'svg' ||
    layer.kind === 'svg-url' ||
    layer.kind === 'image-inset'
  );
}

export function mountInsetContent(
  parent: Container,
  layer: InsetLayer,
  bounds: Rect,
  host: ShapeHostInfo,
  visualCenter?: Point,
): InsetContentView {
  const gfx = new Container();
  gfx.label = `inset:${layer.kind}`;
  gfx.zIndex = 10;
  const reposition = () => positionAndScale(gfx, view.child, layer, bounds, visualCenter);
  const child = renderChild(layer, host, reposition);
  gfx.addChild(child);
  parent.addChild(gfx);
  const view: InsetContentView = { gfx, child, key: layerKey(layer) };
  positionAndScale(gfx, child, layer, bounds, visualCenter);
  return view;
}

export function updateInsetContent(
  view: InsetContentView,
  layer: InsetLayer,
  bounds: Rect,
  host: ShapeHostInfo,
  visualCenter?: Point,
): void {
  const key = layerKey(layer);
  if (key !== view.key) {
    view.child.destroy();
    const reposition = () => positionAndScale(view.gfx, view.child, layer, bounds, visualCenter);
    const fresh = renderChild(layer, host, reposition);
    view.gfx.removeChildren();
    view.gfx.addChild(fresh);
    view.child = fresh;
    view.key = key;
  }
  positionAndScale(view.gfx, view.child, layer, bounds, visualCenter);
}

export function destroyInsetContent(view: InsetContentView): void {
  view.gfx.destroy({ children: true });
}

// ─── Internals ─────────────────────────────────────────────────────────────

function renderChild(
  layer: InsetLayer,
  host: ShapeHostInfo,
  onAsyncReady: () => void,
): Text | Graphics | Sprite {
  const color = layer.kind === 'image-inset' ? 0xffffff : layer.color ?? 0xffffff;
  const alpha = layer.alpha ?? 1;

  if (layer.kind === 'glyph') {
    const style: TextStyleOptions = {
      fontFamily: layer.fontFamily ?? 'sans-serif',
      fontSize: 100,                      // baseline; positionAndScale rescales
      fill: color,
      align: 'center',
    };
    if (layer.fontWeight !== undefined) style.fontWeight = layer.fontWeight as never;
    if (layer.fontStyle !== undefined) style.fontStyle = layer.fontStyle;
    const t = new Text({ text: layer.char, style });
    t.alpha = alpha;
    return t;
  }

  if (layer.kind === 'svg') {
    const g = new Graphics();
    g.path(new GraphicsPath(layer.pathD));
    g.stroke({
      color,
      alpha,
      width: layer.strokeWidth ?? 2,
    });
    return g;
  }

  if (layer.kind === 'svg-url') {
    const g = new Graphics();
    void fetchSvgPathD(layer.url)
      .then((pathD) => {
        if (g.destroyed) return;
        g.path(new GraphicsPath(pathD));
        g.stroke({
          color,
          alpha,
          width: layer.strokeWidth ?? 2,
        });
        onAsyncReady();
      })
      .catch((err: unknown) => {
        // Stay quiet on programmatic destroys; surface real errors.
        if (g.destroyed) return;
        // eslint-disable-next-line no-console
        console.warn(`[insetContentLayer] svg-url fetch failed for ${layer.url}:`, err);
      });
    return g;
  }

  // layer.kind === 'image-inset'
  const sprite = new Sprite();
  sprite.alpha = alpha;
  const cached = host.textureRegistry.get(layer.url);
  if (cached) {
    sprite.texture = cached;
  } else {
    void host.textureRegistry
      .load(layer.url)
      .then((loaded) => {
        if (sprite.destroyed) return;
        sprite.texture = loaded;
        onAsyncReady();
      })
      .catch((err: unknown) => {
        if (sprite.destroyed) return;
        // eslint-disable-next-line no-console
        console.warn(`[insetContentLayer] image-inset load failed for ${layer.url}:`, err);
      });
  }
  return sprite;
}

function positionAndScale(
  host: Container,
  child: Text | Graphics | Sprite,
  layer: InsetLayer,
  bounds: Rect,
  visualCenter?: Point,
): void {
  // Sprites need their texture to determine natural size; defer until ready.
  if (child instanceof Sprite && (!child.texture || !child.texture.width)) {
    return;
  }
  // svg-url Graphics start out empty until the fetch resolves.
  if (child instanceof Graphics && layer.kind === 'svg-url') {
    const lb = child.getLocalBounds();
    if (lb.width === 0 && lb.height === 0) return;
  }

  const local = child.getLocalBounds();
  const scale = resolveScale(layer, bounds, local);
  child.scale.set(scale);

  // Position the host container at the anchor point on the shape's bounds.
  // `visualCenter` overrides the AABB midpoint for the `center` anchor only
  // — corner anchors stay bounds-relative.
  const anchor = layer.anchor ?? 'center';
  const [ax, ay] = anchorPoint(anchor, bounds, visualCenter);
  host.position.set(ax, ay);

  // Centre the child within the host container — `getLocalBounds` may not be
  // origin-aligned (Text / Graphics path-d / Sprite all have offsets).
  child.position.set(
    -(local.x + local.width / 2) * scale,
    -(local.y + local.height / 2) * scale,
  );
  host.alpha = layer.alpha ?? 1;
}

/**
 * Inset kinds (`glyph`, `svg`, `svg-url`, `image-inset`) all scale to fit a
 * fraction (`sizeRatio`) of the shape's smaller bounds dimension — the
 * bounds-fraction-square rule. Text labels live on `LabelDecoration` and
 * handle their own sizing.
 */
function resolveScale(layer: InsetLayer, bounds: Rect, local: Rect): number {
  const ratio = (layer as { sizeRatio?: number }).sizeRatio ?? 0.6;
  const targetSize = Math.min(bounds.width, bounds.height) * ratio;
  const naturalSize = Math.max(local.width, local.height) || 1;
  return targetSize / naturalSize;
}

function anchorPoint(
  anchor: InsetAnchor,
  b: Rect,
  visualCenter?: Point,
): [number, number] {
  const inset = Math.min(b.width, b.height) * 0.15;
  switch (anchor) {
    case 'top-left':     return [b.x + inset, b.y + inset];
    case 'top-right':    return [b.x + b.width - inset, b.y + inset];
    case 'bottom-left':  return [b.x + inset, b.y + b.height - inset];
    case 'bottom-right': return [b.x + b.width - inset, b.y + b.height - inset];
    case 'center':
    default:
      return visualCenter
        ? [visualCenter.x, visualCenter.y]
        : [b.x + b.width / 2, b.y + b.height / 2];
  }
}

/**
 * Identity key for change detection — same shape ⇒ same key. Field-by-field
 * concatenation keeps it cheap; SVG `pathD` is hashed because it can be
 * arbitrarily long.
 */
function layerKey(layer: InsetLayer): string {
  if (layer.kind === 'glyph') {
    return `g:${layer.char}:${layer.fontFamily ?? ''}:${layer.fontWeight ?? ''}:${layer.fontStyle ?? ''}:${layer.color ?? 0xffffff}:${layer.alpha ?? 1}`;
  }
  if (layer.kind === 'svg') {
    return `s:${layer.pathD.length}:${hashString(layer.pathD)}:${layer.strokeWidth ?? 2}:${layer.color ?? 0xffffff}:${layer.alpha ?? 1}`;
  }
  if (layer.kind === 'svg-url') {
    return `u:${layer.url}:${layer.strokeWidth ?? 2}:${layer.color ?? 0xffffff}:${layer.alpha ?? 1}`;
  }
  return `i:${layer.url}:${layer.alpha ?? 1}`;
}

function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return h;
}

// ─── svg-url fetch + parse ─────────────────────────────────────────────────

/**
 * Module-level promise cache keyed by URL. Subsequent shapes using the same
 * URL get the cached path-d immediately (no repeat fetch).
 */
const svgCache = new Map<string, Promise<string>>();

function fetchSvgPathD(url: string): Promise<string> {
  let pending = svgCache.get(url);
  if (!pending) {
    pending = (async () => {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`svg-url HTTP ${res.status}: ${url}`);
      }
      const text = await res.text();
      return svgMarkupToPathD(text);
    })();
    svgCache.set(url, pending);
  }
  return pending;
}

/**
 * Walk an SVG document and concatenate every drawing primitive into a single
 * `pathD` string. Handles `path`, `ellipse`, `circle`, `rect`, `line`,
 * `polyline`, `polygon`. Stroke / fill attributes are dropped — colour and
 * stroke width come from the fill-layer spec.
 */
function svgMarkupToPathD(svg: string): string {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const num = (el: Element, attr: string) => Number(el.getAttribute(attr) ?? 0);
  const pointsToPath = (pts: string, close: boolean): string => {
    const c = pts.trim().split(/[\s,]+/).map(Number);
    if (c.length < 4) return '';
    let d = `M${c[0]},${c[1]}`;
    for (let i = 2; i < c.length; i += 2) d += ` L${c[i]},${c[i + 1]}`;
    return close ? `${d} Z` : d;
  };
  const ds: string[] = [];
  for (const el of doc.querySelectorAll(
    'path, ellipse, circle, rect, line, polyline, polygon',
  )) {
    switch (el.tagName.toLowerCase()) {
      case 'path': {
        const d = el.getAttribute('d');
        if (d) ds.push(d);
        break;
      }
      case 'ellipse': {
        const cx = num(el, 'cx'), cy = num(el, 'cy');
        const rx = num(el, 'rx'), ry = num(el, 'ry');
        ds.push(`M${cx - rx},${cy} a${rx},${ry} 0 1,0 ${rx * 2},0 a${rx},${ry} 0 1,0 ${-rx * 2},0 Z`);
        break;
      }
      case 'circle': {
        const cx = num(el, 'cx'), cy = num(el, 'cy'), r = num(el, 'r');
        ds.push(`M${cx - r},${cy} a${r},${r} 0 1,0 ${r * 2},0 a${r},${r} 0 1,0 ${-r * 2},0 Z`);
        break;
      }
      case 'rect': {
        const x = num(el, 'x'), y = num(el, 'y');
        const w = num(el, 'width'), h = num(el, 'height');
        ds.push(`M${x},${y} h${w} v${h} h${-w} Z`);
        break;
      }
      case 'line': {
        ds.push(`M${num(el, 'x1')},${num(el, 'y1')} L${num(el, 'x2')},${num(el, 'y2')}`);
        break;
      }
      case 'polyline': {
        const d = pointsToPath(el.getAttribute('points') ?? '', false);
        if (d) ds.push(d);
        break;
      }
      case 'polygon': {
        const d = pointsToPath(el.getAttribute('points') ?? '', true);
        if (d) ds.push(d);
        break;
      }
    }
  }
  return ds.join(' ');
}
