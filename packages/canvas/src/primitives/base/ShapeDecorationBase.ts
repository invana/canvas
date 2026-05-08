import { PrimitiveBase } from './PrimitiveBase';
import type { IShapeDecoration, ShapeDecorationHostInfo } from '../types';

/**
 * Base for decorations that target shape primitives. Subclass implements
 * `repaint`; this base handles the `mount` / `update` lifecycle (attach gfx
 * to the host's surface, set the slot z-index, cache the host, repaint).
 *
 * Animation: subclass adds `tick(deltaMs)` if it wants to be advanced per
 * frame. The renderer registers any decoration with a `tick` method into
 * its animation set; a falsy return retires the decoration.
 */
export abstract class ShapeDecorationBase<TStyle>
  extends PrimitiveBase
  implements IShapeDecoration<TStyle>
{
  readonly style: TStyle;
  protected host: ShapeDecorationHostInfo | null = null;

  constructor(style: TStyle) {
    super();
    this.style = style;
    this.gfx.label = `deco:${this.constructor.name}`;
  }

  mount(host: ShapeDecorationHostInfo): void {
    this.host = host;
    this.gfx.zIndex = host.slotZIndex;
    host.surface.addChild(this.gfx);
    this.repaint();
  }

  update(host: ShapeDecorationHostInfo): void {
    this.host = host;
    this.repaint();
  }

  /** Render the decoration based on the current `host`. */
  protected abstract repaint(): void;
}
