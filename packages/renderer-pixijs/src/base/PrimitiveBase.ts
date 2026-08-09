import { Container } from 'pixi.js';

/**
 * Common base for every rendered primitive — shapes, connectors, decorations.
 * Owns the root `gfx` Container and a default `destroy` that tears it down
 * along with all children (Pixi removes the destroyed container from its
 * parent automatically).
 *
 * Subclasses add Graphics or other display objects as children of `gfx`.
 */
export abstract class PrimitiveBase {
  readonly gfx: Container;

  constructor() {
    this.gfx = new Container();
  }

  destroy(): void {
    this.gfx.destroy({ children: true });
  }
}
