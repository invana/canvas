/**
 * `BackgroundLayer` — solid colour or tiled pattern fill behind the world.
 *
 * Architecture: see `architecture-proposal.md` §2.1.
 *
 * Implemented as a `ScreenLayer` for two practical reasons:
 *
 * 1. The pattern needs to cover the *viewport*, not the world bounds. A
 *    WorldLayer would require sizing an infinite rectangle.
 * 2. `TilingSprite` lets us mimic camera-following cheaply by adjusting
 *    `tileScale` + `tilePosition` on each pan/zoom — no per-frame geometry
 *    rebuild needed.
 *
 * When `followCamera` is `true` (default), the pattern shifts and scales with
 * the camera so the background feels like part of the world ("graph paper").
 * When `false`, the pattern is fixed to the screen.
 *
 * @example
 * ```ts
 * canvas.layers.add(new BackgroundLayer({
 *   id: 'bg',
 *   options: { type: 'pattern', patternType: 'dots', backgroundColor: 0x0f172a },
 * }));
 * ```
 */

import { Graphics, Texture, TilingSprite } from 'pixi.js';

import type { CanvasContext } from '../context/CanvasContext';
import { ScreenLayer, type ScreenLayerHit } from './ScreenLayer';
import type { LayerOptions } from './Layer';

/** Top-level background style. `'solid'` skips the pattern texture entirely. */
export type BackgroundType = 'solid' | 'pattern';

/** Pattern texture kind. */
export type BackgroundPatternType = 'dots' | 'grid' | 'lines';

/** Construction-time options for `BackgroundLayer`. */
export interface BackgroundLayerOptions {
  /** `'solid'` paints a flat fill; `'pattern'` overlays a tiled texture. Default `'solid'`. */
  type?: BackgroundType;
  /** Tile texture kind when `type === 'pattern'`. Default `'dots'`. */
  patternType?: BackgroundPatternType;
  /** Pattern foreground colour (dot / line / grid colour). Accepts `0xRRGGBB` or a CSS string. */
  color?: number | string;
  /** Solid-fill colour painted behind the pattern. Same accepted forms as `color`. */
  backgroundColor?: number | string;
  /** Dot radius / line thickness, in *texture pixels*. Default `1.5`. */
  size?: number;
  /** Tile cell spacing, in *texture pixels*. Default `30`. */
  spacing?: number;
  /** Pattern alpha 0–1. Default `0.6`. */
  alpha?: number;
  /**
   * `true` (default): pattern shifts + scales with the camera. `false`: pattern
   * stays fixed to the screen regardless of camera state.
   */
  followCamera?: boolean;
}

const DEFAULTS: Required<BackgroundLayerOptions> = {
  type: 'solid',
  patternType: 'dots',
  color: '#94a3b8',
  backgroundColor: '#f8fafc',
  size: 1.5,
  spacing: 30,
  alpha: 0.6,
  followCamera: true,
};

interface BackgroundLayerState {
  readonly _placeholder?: never;
}

/** Normalise a colour input into a hex string suitable for the canvas 2D ctx. */
function colorToCss(c: number | string): string {
  if (typeof c === 'number') return `#${c.toString(16).padStart(6, '0')}`;
  return c;
}

export class BackgroundLayer extends ScreenLayer<
  BackgroundLayerOptions,
  BackgroundLayerState,
  Record<string, never>,
  never,
  ScreenLayerHit
> {
  private opts: Required<BackgroundLayerOptions>;
  private tiling: TilingSprite | null = null;
  private patternTexture: Texture | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private offCameraPan: (() => void) | null = null;
  private offCameraZoom: (() => void) | null = null;

  // Cached camera state used by tile-transform sync.
  private camX = 0;
  private camY = 0;
  private camScale = 1;

  constructor(opts: LayerOptions<BackgroundLayerOptions>) {
    super({
      ...opts,
      // Background sits below everything by default. Caller can override.
      zIndex: opts.zIndex ?? -1000,
      // Always render — viewport-culling is meaningless for a full-screen background.
      cullable: opts.cullable ?? false,
      // Not hittable by default; the world's `background:click` already covers it.
      hittable: opts.hittable ?? false,
    });
    this.opts = { ...DEFAULTS, ...opts.options };
  }

  protected createState(): BackgroundLayerState {
    return {};
  }

  protected override onMount(ctx: CanvasContext): void {
    this.render();

    this.offCameraPan = ctx.events.on('camera:pan', ({ x, y }) => {
      this.camX = x;
      this.camY = y;
      this.syncTileTransform();
    });
    this.offCameraZoom = ctx.events.on('camera:zoom', ({ scale, centerX, centerY }) => {
      this.camScale = scale;
      this.camX = centerX;
      this.camY = centerY;
      this.syncTileTransform();
    });

    if (typeof ResizeObserver !== 'undefined' && ctx.canvasElement) {
      this.resizeObserver = new ResizeObserver(() => this.render());
      this.resizeObserver.observe(ctx.canvasElement);
    }
  }

  protected override onUnmount(): void {
    this.offCameraPan?.();
    this.offCameraZoom?.();
    this.offCameraPan = null;
    this.offCameraZoom = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.patternTexture?.destroy(true);
    this.patternTexture = null;
    this.tiling = null;
  }

  /**
   * Hit tests on the background always miss — clicks fall through to the
   * world layer beneath, which is what users expect for a bg.
   */
  hitTest(): ScreenLayerHit | null {
    return null;
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  /** Merge-update options + re-render. */
  setOptions(changes: Partial<BackgroundLayerOptions>): void {
    this.opts = { ...this.opts, ...changes };
    if (this.mounted) this.render();
  }

  /** Snapshot of the resolved options. */
  getOptions(): Required<BackgroundLayerOptions> {
    return { ...this.opts };
  }

  // ─── Internals ──────────────────────────────────────────────────────────

  private viewportSize(): { width: number; height: number } {
    const el = this.context.canvasElement;
    if (el) return { width: el.clientWidth || 800, height: el.clientHeight || 600 };
    return { width: 800, height: 600 };
  }

  private render(): void {
    // Drop previous render contents.
    this.container.removeChildren();
    this.tiling = null;
    this.patternTexture?.destroy(true);
    this.patternTexture = null;

    const { width, height } = this.viewportSize();

    const bg = new Graphics();
    bg.rect(0, 0, width, height).fill(this.opts.backgroundColor);
    this.container.addChild(bg);

    if (this.opts.type === 'solid') return;

    const texture = this.createPatternTexture();
    const tiling = new TilingSprite({ texture, width, height });
    tiling.alpha = this.opts.alpha;
    this.container.addChild(tiling);
    this.patternTexture = texture;
    this.tiling = tiling;
    this.syncTileTransform();
  }

  private syncTileTransform(): void {
    if (!this.tiling) return;
    if (!this.opts.followCamera) {
      this.tiling.tileScale.set(1, 1);
      this.tiling.tilePosition.set(0, 0);
      return;
    }
    const s = this.camScale;
    this.tiling.tileScale.set(s, s);
    // Modulo keeps the offset small so we don't accumulate float drift over
    // long pans. The pattern is periodic at `spacing * scale` px.
    const period = this.opts.spacing * s;
    this.tiling.tilePosition.set(this.camX % period, this.camY % period);
  }

  private createPatternTexture(): Texture {
    const { patternType, color, size, spacing } = this.opts;
    const off = document.createElement('canvas');
    off.width = spacing;
    off.height = spacing;
    const ctx2d = off.getContext('2d')!;
    ctx2d.fillStyle = colorToCss(color);

    switch (patternType) {
      case 'dots':
        ctx2d.beginPath();
        ctx2d.arc(spacing / 2, spacing / 2, size, 0, Math.PI * 2);
        ctx2d.fill();
        break;
      case 'grid':
        ctx2d.fillRect(0, 0, spacing, size);
        ctx2d.fillRect(0, 0, size, spacing);
        break;
      case 'lines':
        ctx2d.fillRect(0, 0, spacing, size);
        break;
    }

    return Texture.from(off);
  }
}
