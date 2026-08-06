/**
 * `ISurface` — a layer's slice of the renderer.
 *
 * A layer asks the renderer for a surface at mount and draws through it. It
 * never sees a display object, a scene graph, or anything else backend-shaped:
 * a surface hands back a **drawing device** for durable content, an **overlay
 * device** for transient gesture visuals, and the three knobs a layer genuinely
 * needs (visibility, paint order, teardown).
 *
 * This is what replaces `new Container()` in `WorldLayer.mount()` — the last
 * place the orchestrator constructed a pixi object for a layer to fill.
 *
 * The two spaces mirror the two layer bases: `'world'` is camera-affected and
 * pans/zooms with the diagram, `'screen'` stays glued to the viewport.
 *
 * See `docs/renderer-split-design.md` §4.
 */

import type { IOverlayDevice } from './IOverlayDevice';
import type { SpecProjectionTarget } from './SpecProjector';

/** Which space a surface's contents live in. */
export type SurfaceSpace = 'world' | 'screen';

export interface ISurface {
  /** Stable id — the owning layer's id. Names the surface in a scene tree. */
  readonly id: string;
  readonly space: SurfaceSpace;

  /**
   * The drawing device for this layer's **durable** content — the target a
   * `SpecProjector` drives from the store.
   */
  readonly primitives: SpecProjectionTarget;

  /**
   * An immediate-mode device for **transient** visuals owned by this layer
   * (a minimap's viewport box, a hover outline). Anything durable is a spec.
   */
  overlay(label: string): IOverlayDevice;

  setVisible(visible: boolean): void;
  setZIndex(z: number): void;
  destroy(): void;
}

/**
 * The lifecycle half of the renderer contract: how surfaces come into being.
 * The drawing half is {@link SpecProjectionTarget}, reached through a surface.
 */
export interface ISurfaceHost {
  createSurface(space: SurfaceSpace, id: string): ISurface;
}
