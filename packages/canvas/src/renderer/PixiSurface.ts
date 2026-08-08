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

import { Container, Graphics, Texture, TilingSprite } from 'pixi.js';
import type { Camera } from '../camera/Camera';
import { PrimitivesRenderer } from '../primitives/PrimitivesRenderer';
import type { TextureRegistry } from '../textures/TextureRegistry';
import type { IOverlayDevice } from './IOverlayDevice';
import { PixiOverlayDevice } from './PixiOverlayDevice';
import type { ISurface, SurfaceBackdrop, SurfaceSpace } from './ISurface';

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
   * The pixi root. Renderer-side only; nothing outside this package reaches for
   * it, and it moves to `@invana/renderer-pixijs` whole.
   */
  readonly root: Container;
  private readonly overlays: IOverlayDevice[] = [];

  /** Backdrop objects, kept so a per-frame transform update costs no rebuild. */
  private backdropSolid: Graphics | null = null;
  private backdropTile: TilingSprite | null = null;
  private backdropTexture: Texture | null = null;
  /** The image the current tile texture was built from — the cache key. */
  private backdropSource: CanvasImageSource | null = null;

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

  setBackdrop(backdrop: SurfaceBackdrop | null): void {
    if (!backdrop) {
      this.clearBackdrop();
      return;
    }

    // Solid fill — redrawn in place; `Graphics.clear()` keeps the object (and
    // its position at the bottom of the surface) rather than churning children.
    if (!this.backdropSolid) {
      const g = new Graphics();
      g.label = 'background:solid';
      this.backdropSolid = g;
      this.root.addChildAt(g, 0);
    }
    this.backdropSolid
      .clear()
      .rect(0, 0, backdrop.width, backdrop.height)
      .fill(backdrop.color);

    const tile = backdrop.tile;
    if (!tile) {
      this.disposeBackdropTile();
      return;
    }

    // Rebuild the texture only when the engine hands over a different image —
    // a camera-following pattern calls this every frame with the same source.
    if (this.backdropSource !== tile.source) {
      this.disposeBackdropTile();
      this.backdropTexture = Texture.from(tile.source as never);
      this.backdropSource = tile.source;
      const sprite = new TilingSprite({
        texture: this.backdropTexture,
        width: backdrop.width,
        height: backdrop.height,
      });
      sprite.label = 'background:pattern';
      this.backdropTile = sprite;
      this.root.addChildAt(sprite, 1);
    } else if (this.backdropTile) {
      this.backdropTile.width = backdrop.width;
      this.backdropTile.height = backdrop.height;
    }

    const sprite = this.backdropTile;
    if (!sprite) return;
    sprite.alpha = tile.alpha ?? 1;
    sprite.visible = tile.visible ?? true;
    sprite.tileScale.set(tile.scale, tile.scale);
    sprite.tilePosition.set(tile.offsetX, tile.offsetY);
  }

  private disposeBackdropTile(): void {
    this.backdropTile?.destroy();
    this.backdropTile = null;
    this.backdropTexture?.destroy(true);
    this.backdropTexture = null;
    this.backdropSource = null;
  }

  private clearBackdrop(): void {
    this.backdropSolid?.destroy();
    this.backdropSolid = null;
    this.disposeBackdropTile();
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
    this.clearBackdrop();
    this.primitives.destroy();
    this.root.destroy({ children: true });
  }
}
