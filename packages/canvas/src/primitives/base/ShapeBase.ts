import { Graphics } from 'pixi.js';
import { PrimitiveBase } from './PrimitiveBase';
import type {
  BaseShapeSpec,
  IShape,
  Rect,
  ShapeFill,
  ShapeHostInfo,
  ShapePaintStyle,
} from '../types';
import {
  destroyIcon,
  mountIcon,
  updateIcon,
  type IconView,
} from '../paint/iconLayer';

/**
 * Base for shapes whose `draw` and `paintInto` share a single silhouette
 * trace. Subclasses implement `drawGeometry` (trace path + apply fill +
 * apply stroke) and `bounds`. They get `draw` and `paintInto` for free.
 *
 * The shape's root `gfx` Container holds two layers:
 *   - `bodyGfx`  — Graphics drawing the silhouette + body fill + border
 *   - `iconView` — sibling Container holding an icon glyph, when
 *                  `spec.fill.kind === 'icon'`. Wired in step 4 (paint
 *                  helpers), not here — at step 3 the iconView property is
 *                  declared but unused.
 *
 * Decorations operate against `paintInto` — a callback into the silhouette
 * only, never into the icon view. This means a glow on a shape with an icon
 * halos the silhouette but leaves the glyph alone.
 */
export abstract class ShapeBase<TSpec extends BaseShapeSpec>
  extends PrimitiveBase
  implements IShape<TSpec>
{
  protected readonly bodyGfx: Graphics;
  protected iconView: IconView | null = null;
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
    this.syncIconLayer(spec);
  }

  paintInto(g: Graphics, style?: ShapePaintStyle): void {
    this.drawGeometry(g, this.spec, style);
  }

  override destroy(): void {
    if (this.iconView) {
      destroyIcon(this.iconView);
      this.iconView = null;
    }
    super.destroy();
  }

  private syncIconLayer(spec: TSpec): void {
    const fill = spec.fill;
    const isIcon = isIconFill(fill);
    if (isIcon) {
      if (!this.iconView) {
        this.iconView = mountIcon(this.gfx, fill, this.bounds(), this.host.iconRegistry);
      } else {
        updateIcon(this.iconView, fill, this.bounds(), this.host.iconRegistry);
      }
    } else if (this.iconView) {
      destroyIcon(this.iconView);
      this.iconView = null;
    }
  }
}

function isIconFill(fill: ShapeFill | undefined): fill is Extract<ShapeFill, { kind: 'icon' }> {
  return typeof fill === 'object' && fill !== null && 'kind' in fill && fill.kind === 'icon';
}
