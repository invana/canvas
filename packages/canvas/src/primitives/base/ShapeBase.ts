import { Graphics } from 'pixi.js';
import { PrimitiveBase } from './PrimitiveBase';
import type {
  BaseShapeSpec,
  IShape,
  Point,
  Rect,
  ShapeFill,
  ShapeFillLayer,
  ShapeHostInfo,
  ShapePaintStyle,
} from '../types';
import {
  destroyInsetContent,
  isInsetLayer,
  mountInsetContent,
  updateInsetContent,
  type InsetLayer,
  type InsetContentView,
} from '../paint/insetContentLayer';

/**
 * Base for shapes whose `draw` and `paintInto` share a single silhouette
 * trace. Subclasses implement `drawGeometry` (trace path + apply fill +
 * apply stroke) and `bounds`. They get `draw` and `paintInto` for free.
 *
 * The shape's root `gfx` Container holds:
 *   - `bodyGfx`     — Graphics drawing the silhouette + silhouette-filler
 *                     fill layers (`solid` / `image`) + border.
 *   - inset views   — sibling Containers, one per inset-content fill layer
 *                     (`glyph` / `svg` / `image-inset`), keyed by layer
 *                     index in `spec.fill`.
 *
 * Decorations operate against `paintInto` — a callback into the silhouette
 * only, never into inset content. This means a glow on a shape with an icon
 * halos the silhouette but leaves the glyph alone.
 */
export abstract class ShapeBase<TSpec extends BaseShapeSpec>
  extends PrimitiveBase
  implements IShape<TSpec>
{
  protected readonly bodyGfx: Graphics;
  protected readonly insetViews = new Map<number, InsetContentView>();
  protected spec!: TSpec;

  constructor(protected readonly host: ShapeHostInfo) {
    super();
    this.gfx.sortableChildren = true;
    this.bodyGfx = new Graphics();
    this.bodyGfx.zIndex = 0;
    this.gfx.addChild(this.bodyGfx);
  }

  /**
   * Trace the silhouette into `g`, then apply fill + stroke. When `style`
   * is supplied, it overrides the spec's fill/stroke (decoration use).
   */
  protected abstract drawGeometry(
    g: Graphics,
    spec: TSpec,
    style?: ShapePaintStyle,
  ): void;

  abstract bounds(): Rect;

  draw(spec: TSpec): void {
    this.spec = spec;
    this.gfx.position.set(spec.x, spec.y);
    this.gfx.alpha = spec.alpha ?? 1;
    this.gfx.visible = spec.visible ?? true;
    this.gfx.zIndex = spec.zIndex ?? 0;
    this.bodyGfx.clear();
    this.drawGeometry(this.bodyGfx, spec);
    this.syncInsetLayers(spec);
  }

  paintInto(g: Graphics, style?: ShapePaintStyle): void {
    this.drawGeometry(g, this.spec, style);
  }

  /**
   * Default boundary intersection: ray from the shape's geometric centre
   * `(0, 0)` toward `localFromCenter`, intersected with a centred AABB
   * derived from `this.bounds()`. Correct for `RectShape` (anchored
   * top-left) and any shape whose silhouette can be approximated by its
   * bounding box.
   *
   * Geometric shapes with non-rectangular silhouettes (`CircleShape`,
   * `EllipseShape`, `PolygonShape`) should override this for pixel-accurate
   * perimeter snapping. Input and output are both centre-relative.
   */
  boundaryIntersect(localFromCenter: Point): Point | null {
    const b = this.bounds();
    const centred: Rect = {
      x: -b.width / 2,
      y: -b.height / 2,
      width: b.width,
      height: b.height,
    };
    return aabbRayExit(localFromCenter, centred);
  }

  override destroy(): void {
    for (const view of this.insetViews.values()) destroyInsetContent(view);
    this.insetViews.clear();
    super.destroy();
  }

  /**
   * Visual centre — the point inset content with `anchor: 'center'` snaps
   * to. Default is the AABB midpoint of `bounds()`, which is correct for
   * `CircleShape` (bounds is centred on origin) and `RectShape` (bounds is
   * the rect itself). Shapes whose silhouette doesn't fill its AABB —
   * triangle, hexagon, star, free-form polygon — override to return the
   * geometric centroid so a glyph drawn on a triangle sits on the visual
   * centroid instead of floating above it.
   */
  visualCenter(): Point {
    const b = this.bounds();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  }

  /**
   * Diff the spec's inset-content fill layers (`glyph` / `svg` /
   * `image-inset`) against the current `insetViews` map, keyed by layer
   * index. Mounts new layers, updates existing ones, destroys removed ones.
   */
  private syncInsetLayers(spec: TSpec): void {
    const layers = insetLayersByIndex(spec.fill);
    const bounds = this.bounds();
    const centre = this.visualCenter();

    // Mount or update layers present in the new spec.
    for (const [index, layer] of layers) {
      const existing = this.insetViews.get(index);
      if (existing) {
        updateInsetContent(existing, layer, bounds, this.host, centre);
      } else {
        const view = mountInsetContent(this.gfx, layer, bounds, this.host, centre);
        this.insetViews.set(index, view);
      }
    }

    // Destroy layers that the new spec no longer has at those indices.
    for (const [index, view] of this.insetViews) {
      if (!layers.has(index)) {
        destroyInsetContent(view);
        this.insetViews.delete(index);
      }
    }
  }
}

/**
 * Ray from `(0, 0)` toward `localFrom`, parametrised `P(t) = t * localFrom`
 * for `t ≥ 0`. Returns the smallest positive `t` at which `P(t)` exits the
 * AABB `bounds`. When `localFrom` is at the origin the ray is degenerate and
 * we return the bounds origin as a sentinel; callers using this as a
 * `boundary` anchor should ensure the two endpoints differ.
 */
function aabbRayExit(localFrom: Point, bounds: Rect): Point {
  const x = localFrom.x;
  const y = localFrom.y;
  if (x === 0 && y === 0) return { x: bounds.x, y: bounds.y };
  let tMin = Infinity;
  if (x !== 0) {
    const tx = (x > 0 ? bounds.x + bounds.width : bounds.x) / x;
    if (tx > 0 && tx < tMin) tMin = tx;
  }
  if (y !== 0) {
    const ty = (y > 0 ? bounds.y + bounds.height : bounds.y) / y;
    if (ty > 0 && ty < tMin) tMin = ty;
  }
  if (!isFinite(tMin)) return { x: 0, y: 0 };
  return { x: x * tMin, y: y * tMin };
}

/** Walk a `ShapeFill` and return inset-content layers keyed by their index. */
function insetLayersByIndex(fill: ShapeFill | undefined): Map<number, InsetLayer> {
  const out = new Map<number, InsetLayer>();
  if (fill === undefined || typeof fill === 'number') return out;
  const arr: ReadonlyArray<ShapeFillLayer> = Array.isArray(fill)
    ? fill
    : [fill as ShapeFillLayer];
  for (let i = 0; i < arr.length; i++) {
    const layer = arr[i]!;
    if (isInsetLayer(layer)) out.set(i, layer);
  }
  return out;
}
