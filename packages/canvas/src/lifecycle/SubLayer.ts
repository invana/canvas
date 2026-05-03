/**
 * `SubLayer` — a named pixi `Container` wrapper used to subdivide a Layer's
 * rendering. Created via `WorldLayer.createSubLayer(id)` /
 * `ScreenLayer.createSubLayer(id)` or, for nesting, via
 * `SubLayer.createSubLayer(id)`.
 *
 * Architecture: see `architecture-proposal.md` §2.1.
 *
 * **Not a `Layer`.** A `SubLayer` carries no state, events, dirty batcher,
 * or hit-testing — it is purely a draw-order slot with a hierarchical id.
 * The prefix conveys "child of a layer, not a peer."
 *
 * **Hierarchical ids.** The root `SubLayer` of a `WorldLayer` shares the
 * layer's id; each child is `${parent.id}:${subId}`. Depth is unlimited.
 * IDs surface as pixi `Container.label` values, so they're directly visible
 * in pixi devtools.
 */

import { Container } from 'pixi.js';

export class SubLayer {
  readonly id: string;

  /**
   * The underlying pixi `Container`. Renderers inside `packages/canvas/src`
   * attach pixi children to this container. Domain packages should not
   * manipulate it directly — pass the `SubLayer` to a renderer instead.
   */
  readonly container: Container;

  constructor(id: string, container: Container) {
    this.id = id;
    this.container = container;
  }

  /**
   * Create a child `SubLayer`. The child's id becomes `${this.id}:${subId}`
   * and its underlying `Container` is a pixi RenderGroup (independent batch
   * unit).
   *
   * Z-order between siblings: later `createSubLayer` calls draw above earlier
   * ones (pixi's default). Pass an explicit `zIndex` to override; that flips
   * the parent into sorted mode so subsequent reorderings take effect too.
   */
  createSubLayer(subId: string, options?: { zIndex?: number }): SubLayer {
    const fullId = `${this.id}:${subId}`;
    const child = new Container({ isRenderGroup: true });
    child.label = fullId;
    this.container.addChild(child);
    if (options?.zIndex !== undefined) {
      child.zIndex = options.zIndex;
      this.container.sortableChildren = true;
    }
    return new SubLayer(fullId, child);
  }

  /**
   * Update this sub-layer's z-order relative to its siblings. Higher draws
   * on top. Flips the parent container into sorted mode so the change takes
   * effect on the next render.
   */
  setZIndex(z: number): void {
    this.container.zIndex = z;
    const parent = this.container.parent;
    if (parent) parent.sortableChildren = true;
  }
}
