/**
 * Pixi implementation of {@link ISurface}.
 *
 * Owns the root `Container` a layer used to create for itself, plus the
 * `PrimitivesRenderer` that draws into it. Moves to `@invana/renderer-pixijs`
 * with the rest of the drawing code; the interface it satisfies stays in the
 * orchestrator.
 *
 * World surfaces are RenderGroups — a GPU batch boundary, not an ordering
 * concept — because world content is the heavy, camera-transformed half.
 * Screen surfaces are plain containers: HUD-style content is light and rarely
 * benefits from its own batch.
 */

import { Container } from 'pixi.js';
import type { Camera } from '../camera/Camera';
import { PrimitivesRenderer } from '../primitives/PrimitivesRenderer';
import type { TextureRegistry } from '../textures/TextureRegistry';
import type { IOverlayDevice } from './IOverlayDevice';
import { PixiOverlayDevice } from './PixiOverlayDevice';
import type { ISurface, SurfaceSpace } from './ISurface';

export interface PixiSurfaceOptions {
  readonly id: string;
  readonly space: SurfaceSpace;
  /** `ctx.world` for world space, `ctx.stage` for screen space. */
  readonly parent: Container;
  readonly camera: Camera;
  readonly textureRegistry?: TextureRegistry;
  readonly canvasElement?: HTMLCanvasElement | null;
  readonly hitFloorPx?: number;
}

export class PixiSurface implements ISurface {
  readonly id: string;
  readonly space: SurfaceSpace;
  readonly primitives: PrimitivesRenderer;

  /**
   * The pixi root. **Escape hatch for renderer-side code inside this package
   * only** — `BackgroundLayer` paints a `TilingSprite`, which the overlay
   * device's eleven operations deliberately do not cover. Both that body and
   * this accessor move to `@invana/renderer-pixijs` in P6; nothing outside the
   * package should reach for it.
   */
  readonly root: Container;
  private readonly overlays: IOverlayDevice[] = [];

  constructor(opts: PixiSurfaceOptions) {
    this.id = opts.id;
    this.space = opts.space;

    this.root = new Container(opts.space === 'world' ? { isRenderGroup: true } : {});
    this.root.label = opts.id;
    opts.parent.addChild(this.root);

    this.primitives = new PrimitivesRenderer({
      container: this.root,
      camera: opts.camera,
      ...(opts.textureRegistry ? { textureRegistry: opts.textureRegistry } : {}),
      ...(opts.canvasElement ? { canvasElement: opts.canvasElement } : {}),
      ...(opts.hitFloorPx !== undefined ? { hitFloorPx: opts.hitFloorPx } : {}),
    });
  }

  overlay(label: string): IOverlayDevice {
    const device = new PixiOverlayDevice(this.root, label);
    this.overlays.push(device);
    return device;
  }

  setVisible(visible: boolean): void {
    this.root.visible = visible;
  }

  setZIndex(z: number): void {
    this.root.zIndex = z;
    // Sorting is opt-in per parent in pixi; a surface asking for an explicit
    // order is what flips its parent into sorted mode.
    const parent = this.root.parent;
    if (parent) parent.sortableChildren = true;
  }

  destroy(): void {
    for (const overlay of this.overlays) overlay.destroy();
    this.overlays.length = 0;
    this.primitives.destroy();
    this.root.destroy({ children: true });
  }
}
