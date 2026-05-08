import { Graphics } from 'pixi.js';
import { PrimitiveBase } from './PrimitiveBase';
import type {
  BaseShapeSpec,
  IShape,
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

  override destroy(): void {
    for (const view of this.insetViews.values()) destroyInsetContent(view);
    this.insetViews.clear();
    super.destroy();
  }

  /**
   * Diff the spec's inset-content fill layers (`glyph` / `svg` /
   * `image-inset`) against the current `insetViews` map, keyed by layer
   * index. Mounts new layers, updates existing ones, destroys removed ones.
   */
  private syncInsetLayers(spec: TSpec): void {
    const layers = insetLayersByIndex(spec.fill);
    const bounds = this.bounds();

    // Mount or update layers present in the new spec.
    for (const [index, layer] of layers) {
      const existing = this.insetViews.get(index);
      if (existing) {
        updateInsetContent(existing, layer, bounds, this.host);
      } else {
        const view = mountInsetContent(this.gfx, layer, bounds, this.host);
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
