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
import type { IElementRenderer } from './IElementRenderer';

/** Which space a surface's contents live in. */
export type SurfaceSpace = 'world' | 'screen';

/**
 * Per-layer knobs for the device a surface builds. These are *engine policy a
 * layer owns*, not device config — a graph layer with tiny nodes wants a larger
 * hit floor than a layer of big cards, and only the layer knows that.
 */
export interface SurfaceOptions {
  /**
   * Minimum hover/click target in screen pixels, used as a fallback when no
   * silhouette contains the cursor. See `PrimitivesRendererOptions.hitFloorPx`.
   */
  hitFloorPx?: number;
}

/**
 * A full-surface backdrop: a solid fill, optionally overlaid with a repeating
 * tile that can be offset and scaled to follow the camera.
 *
 * The split of responsibility is the point. The **engine** decides what the
 * pattern looks like — dots, grid, lines, spacing, colour, DPR — and rasterises
 * one tile with a 2D canvas, which needs no backend at all. The **backend**
 * decides how that tile is repeated across the surface, which is the only part
 * that touches the GPU.
 *
 * This is deliberately not a spec and not an overlay. A backdrop is neither
 * durable content (it is derived from theme + camera, never authored) nor a
 * transient gesture visual — it is a property of the surface itself.
 */
export interface SurfaceBackdrop {
  /** Solid fill painted behind everything on the surface. */
  readonly color: number | string;
  /** Surface size in CSS pixels. */
  readonly width: number;
  readonly height: number;
  /** Optional repeating tile drawn over the solid fill. */
  readonly tile?: {
    /**
     * One tile, already rasterised by the engine. A plain DOM image source, so
     * a backend wraps it in whatever texture type it uses.
     *
     * Identity matters: a backend may cache its texture and rebuild only when
     * this changes, so pass the *same* object when only the transform moves.
     */
    readonly source: CanvasImageSource;
    /** Uniform scale applied to the tile. */
    readonly scale: number;
    /** Tile offset in surface pixels — how the pattern tracks the camera. */
    readonly offsetX: number;
    readonly offsetY: number;
    readonly alpha?: number;
    /** `false` hides the tile while keeping the solid fill. */
    readonly visible?: boolean;
  };
}

export interface ISurface {
  /** Stable id — the owning layer's id. Names the surface in a scene tree. */
  readonly id: string;
  readonly space: SurfaceSpace;

  /**
   * This layer's drawing device: the target a `SpecProjector` drives from the
   * store, plus the per-frame commands and geometry answers a domain layer
   * still calls directly. Pixi-free, so `@invana/graph` drives a backend it
   * never imports.
   */
  readonly primitives: IElementRenderer;

  /**
   * An immediate-mode device for **transient** visuals owned by this layer
   * (a minimap's viewport box, a hover outline). Anything durable is a spec.
   */
  overlay(label: string): IOverlayDevice;

  /**
   * Paint (or clear, with `null`) this surface's backdrop. Cheap to call every
   * frame: a backend rebuilds its tile texture only when `tile.source` changes
   * identity, so a camera-following pattern costs a transform write.
   */
  setBackdrop(backdrop: SurfaceBackdrop | null): void;

  setVisible(visible: boolean): void;
  setZIndex(z: number): void;
  destroy(): void;
}

/**
 * The lifecycle half of the renderer contract: how surfaces come into being.
 * The drawing half is {@link IElementRenderer}, reached through a surface.
 */
export interface ISurfaceHost {
  createSurface(space: SurfaceSpace, id: string, opts?: SurfaceOptions): ISurface;
}
