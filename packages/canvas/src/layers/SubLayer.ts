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

import { Container, Graphics } from 'pixi.js';

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

  /**
   * Create a new pixi `Graphics` and attach it as a child of this sub-layer's
   * container. Returns the `Graphics` so the caller can paint into it via the
   * `@invana/canvas/draw` primitives (or any pixi Graphics method).
   *
   * This is the sanctioned way for layers and user code to obtain a `Graphics`
   * — direct `new Graphics()` outside `packages/canvas/src` is prohibited so
   * pixi stays an internal dependency.
   *
   * The returned `Graphics` is owned by the caller for subsequent draws. The
   * SubLayer does not retain a reference; if the caller wants to clear/redraw
   * later, they hold the reference themselves. On layer destroy the pixi
   * scene-graph teardown destroys all descendants, including any `Graphics`
   * created via this method.
   */
  createGraphics(label?: string): Graphics {
    const g = new Graphics();
    if (label) g.label = label;
    this.container.addChild(g);
    return g;
  }

  /**
   * Create a new pixi `Container` and attach it as a child of this sub-layer's
   * container. Returns the raw `Container` (not a `SubLayer` wrapper) — use
   * `createSubLayer` instead when you want hierarchical id management or an
   * independent render-group batch unit.
   *
   * Same rationale as `createGraphics`: keeps pixi internal, gives layer
   * authors a sanctioned construction path.
   */
  createContainer(label?: string): Container {
    const c = new Container();
    if (label) c.label = label;
    this.container.addChild(c);
    return c;
  }
}
