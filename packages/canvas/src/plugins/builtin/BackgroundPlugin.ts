import { Graphics, Container, Texture, TilingSprite } from 'pixi.js';
import type { CanvasPlugin, PluginContext } from '../types.js';
import { BackgroundUpdatedEvent } from './BackgroundEvents.js';

export type BackgroundType = 'solid' | 'pattern';
export type PatternType = 'dots' | 'grid' | 'lines';

export interface BackgroundOptions {
  type?: BackgroundType;
  patternType?: PatternType;
  color?: string | number;
  backgroundColor?: string | number;
  size?: number;
  spacing?: number;
  alpha?: number;
  /**
   * When true the tiling pattern shifts and scales with the camera so the
   * background feels like part of the world. When false (default) the pattern
   * is fixed to the screen.
   */
  followCamera?: boolean;
}

const DEFAULT_OPTIONS: Required<BackgroundOptions> = {
  type: 'solid',
  patternType: 'dots',
  color: '#595959',
  backgroundColor: '#1a1a2e',
  size: 1.5,
  spacing: 30,
  alpha: 0.6,
  followCamera: false,
};

/**
 * BackgroundPlugin — renders a solid color or tiled pattern background.
 *
 * Screen-space: unaffected by camera pan/zoom (unless `followCamera=true`).
 *
 * This plugin is intentionally lightweight: it knows about a single set of
 * options and re-renders when they change. Theming, mode switching, and
 * responsive system-preference handling live in `ThemedBackgroundPlugin`,
 * which composes this plugin under the hood.
 *
 * Emits `'background:updated'` whenever `setOptions()` is called.
 */
export class BackgroundPlugin implements CanvasPlugin {
  readonly id: string;

  private _options: Required<BackgroundOptions>;
  private _layer: Container | null = null;
  private _ctx: PluginContext | null = null;
  private _tilingSprite: TilingSprite | null = null;
  private _onResize: (() => void) | null = null;

  // Camera state for followCamera mode
  private _camX = 0;
  private _camY = 0;
  private _camScale = 1;

  constructor(options: BackgroundOptions & { key?: string } = {}) {
    const { key, ...style } = options;
    this.id = key ?? 'background';
    this._options = { ...DEFAULT_OPTIONS, ...style };
  }

  register(ctx: PluginContext): void {
    this._ctx = ctx;
    this._layer = ctx.createScreenLayer({ id: `${this.id}-layer`, zIndex: -1000 });
    this._render();
    this._wireCamera(ctx);

    this._onResize = () => this._render();
    ctx.events.on('canvas:resize', this._onResize);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Update style options (color, size, spacing, etc). Emits `'background:updated'`.
   */
  setOptions(changes: Partial<BackgroundOptions>): void {
    this._options = { ...this._options, ...changes };
    this._render();
    if (!this._ctx) return;
    this._ctx.events.emit(
      'background:updated',
      new BackgroundUpdatedEvent({
        pluginId: this.id,
        options: { ...this._options },
        changes: { ...changes },
      }),
    );
  }

  /** Snapshot of the current resolved options. */
  getOptions(): Required<BackgroundOptions> {
    return { ...this._options };
  }

  destroy(): void {
    if (this._onResize && this._ctx) {
      this._ctx.events.off('canvas:resize', this._onResize);
    }
    this._onResize = null;
    if (this._layer) this._layer.removeChildren();
    this._tilingSprite = null;
  }

  // ── Internal: camera & rendering ─────────────────────────────────────────

  private _wireCamera(ctx: PluginContext): void {
    ctx.events.on('camera:pan', ({ x, y }) => {
      this._camX = x;
      this._camY = y;
      this._syncTileTransform();
    });
    ctx.events.on('camera:zoom', ({ scale, center }) => {
      this._camScale = scale;
      this._camX = center.x;
      this._camY = center.y;
      this._syncTileTransform();
    });
  }

  private _syncTileTransform(): void {
    if (!this._tilingSprite || !this._options.followCamera) return;
    const s = this._camScale;
    this._tilingSprite.tileScale.set(s, s);
    this._tilingSprite.tilePosition.set(
      this._camX % (this._options.spacing * s),
      this._camY % (this._options.spacing * s),
    );
  }

  private _render(): void {
    if (!this._layer || !this._ctx) return;
    this._layer.removeChildren();
    this._tilingSprite = null;

    const canvas = this._ctx.canvasElement;
    const w = canvas.clientWidth || 800;
    const h = canvas.clientHeight || 600;

    const bg = new Graphics();
    bg.rect(0, 0, w, h).fill(this._options.backgroundColor);
    this._layer.addChild(bg);

    if (this._options.type === 'solid') return;

    const patternTexture = this._createPatternTexture();
    const tiling = new TilingSprite({ texture: patternTexture, width: w, height: h });
    tiling.alpha = this._options.alpha;
    this._tilingSprite = tiling;
    this._layer.addChild(tiling);
    this._syncTileTransform();
  }

  private _createPatternTexture(): Texture {
    const { patternType, color, size, spacing } = this._options;

    const offscreen = document.createElement('canvas');
    offscreen.width = spacing;
    offscreen.height = spacing;
    const ctx = offscreen.getContext('2d')!;

    const colorStr =
      typeof color === 'number'
        ? `#${color.toString(16).padStart(6, '0')}`
        : (color as string);

    ctx.fillStyle = colorStr;

    if (patternType === 'dots') {
      ctx.beginPath();
      ctx.arc(spacing / 2, spacing / 2, size, 0, Math.PI * 2);
      ctx.fill();
    } else if (patternType === 'grid') {
      ctx.fillRect(0, 0, spacing, 1);
      ctx.fillRect(0, 0, 1, spacing);
    } else {
      ctx.fillRect(0, 0, spacing, 1);
    }

    return Texture.from(offscreen);
  }
}
