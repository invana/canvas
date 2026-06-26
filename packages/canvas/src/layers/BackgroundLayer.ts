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
import type { ResolvedTheme } from '../theme/types';
import { ScreenLayer, type ScreenLayerHit } from './ScreenLayer';
import type { LayerOptions } from './Layer';

/** Top-level background style. `'solid'` skips the pattern texture entirely. */
export type BackgroundType = 'solid' | 'pattern';

/** Pattern texture kind. */
export type BackgroundPatternType = 'dots' | 'grid' | 'lines';

/**
 * Mode selector for light/dark colour resolution. `'auto'` follows the active
 * theme published on `ctx.theme` (the canvas no longer reads
 * `prefers-color-scheme` itself — the domain `ThemeBehaviour` is the sole
 * publisher); `'light'` / `'dark'` pin explicitly regardless of the theme.
 */
export type BackgroundMode = 'auto' | 'light' | 'dark';

/** The concrete kind currently being rendered after mode resolution. */
export type BackgroundKind = 'light' | 'dark';

/**
 * A colour input. Pass a `number` / CSS string for a single colour, or a
 * `{ light, dark }` pair to swap based on the layer's `mode`.
 */
export type BackgroundColor =
  | number
  | string
  | { light: number | string; dark: number | string };

/** Construction-time options for `BackgroundLayer`. */
export interface BackgroundLayerOptions {
  /** `'solid'` paints a flat fill; `'pattern'` overlays a tiled texture. Default `'solid'`. */
  type?: BackgroundType;
  /** Tile texture kind when `type === 'pattern'`. Default `'dots'`. */
  patternType?: BackgroundPatternType;
  /**
   * Pattern foreground colour (dot / line / grid colour). Accepts `0xRRGGBB`,
   * a CSS string, or a `{ light, dark }` pair resolved against `mode`.
   */
  color?: BackgroundColor;
  /** Solid-fill colour painted behind the pattern. Same accepted forms as `color`. */
  backgroundColor?: BackgroundColor;
  /** Dot radius / line thickness, in *texture pixels*. Default `1`. */
  size?: number;
  /** Tile cell spacing, in *texture pixels*. Default `12`. */
  spacing?: number;
  /** Pattern alpha 0–1. Default `0.6`. */
  alpha?: number;
  /**
   * `true` (default): pattern shifts + scales with the camera. `false`: pattern
   * stays fixed to the screen regardless of camera state.
   */
  followCamera?: boolean;
  /**
   * How `{ light, dark }` colour variants are resolved. `'auto'` (default)
   * follows the active theme on `ctx.theme`; `'light'` / `'dark'` pin
   * explicitly. Has no effect when both colours are plain scalars.
   */
  mode?: BackgroundMode;
  /**
   * Palette role read for the solid backdrop colour on `'theme:change'`. When
   * the published theme's palette carries this role, it overrides
   * {@link backgroundColor}; otherwise the option stands. Default `'surface'`.
   */
  surfaceRole?: string;
  /**
   * Palette role read for the pattern (dots / grid / lines) colour on
   * `'theme:change'`. Falls back to `'stroke'` when the role is absent but
   * `'stroke'` is present; otherwise {@link color} stands. Default `'divider'`.
   */
  patternRole?: string;
}

const DEFAULTS: Required<BackgroundLayerOptions> = {
  type: 'solid',
  patternType: 'dots',
  color: '#6f7b8b',
  backgroundColor: '#f8fafc',
  size: 1,
  spacing: 12,
  alpha: 0.6,
  followCamera: true,
  mode: 'auto',
  surfaceRole: 'surface',
  patternRole: 'divider',
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
  /** DPR baked into the current pattern texture — used to compensate `tileScale`. */
  private textureDpr = window.devicePixelRatio || 1;
  private resizeObserver: ResizeObserver | null = null;
  private offCameraPan: (() => void) | null = null;
  private offCameraZoom: (() => void) | null = null;
  private offTheme: (() => void) | null = null;

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
    // Seed cached camera state — events may not have fired yet if the camera
    // is at a non-default initial position when this layer mounts.
    this.camX = ctx.camera.x;
    this.camY = ctx.camera.y;
    this.camScale = ctx.camera.scale;

    // Adopt any theme already published before this layer mounted, then paint.
    this.adoptTheme(ctx.theme.current());
    this.render();

    // Recolour on every theme switch. The `ThemeBehaviour` is the sole
    // publisher; we read the resolved kind (for `{ light, dark }` pairs) and
    // the palette roles for the backdrop / pattern colours.
    this.offTheme = ctx.events.on('theme:change', (theme) => {
      this.adoptTheme(theme);
      if (this.mounted) this.render();
    });

    this.offCameraPan = ctx.events.on('camera:pan', ({ x, y }) => {
      this.camX = x;
      this.camY = y;
      this.syncTileTransform();
    });
    this.offCameraZoom = ctx.events.on('camera:zoom', ({ scale }) => {
      // `centerX/centerY` is the screen-space zoom anchor — *not* the
      // world-origin screen position — so we only consume the new scale here.
      // The accompanying `camera:pan` emission (always paired with zoom)
      // updates `camX/camY` to the post-zoom origin offset.
      this.camScale = scale;
      this.syncTileTransform();
    });

    if (typeof ResizeObserver !== 'undefined' && ctx.canvasElement) {
      this.resizeObserver = new ResizeObserver(() => this.render());
      this.resizeObserver.observe(ctx.canvasElement);
    }
  }

  protected override onUnmount(): void {
    this.offTheme?.();
    this.offTheme = null;
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

  /**
   * Set the colour-resolution mode. `'auto'` re-arms the system listener;
   * `'light'` / `'dark'` pin explicitly. No-op when mode is unchanged.
   */
  setMode(mode: BackgroundMode): void {
    if (this.opts.mode === mode) return;
    this.opts = { ...this.opts, mode };
    if (this.mounted) this.render();
  }

  /** Current mode setting. */
  getMode(): BackgroundMode {
    return this.opts.mode;
  }

  /**
   * Concrete kind currently being rendered. A pinned `mode` wins; otherwise
   * `'auto'` follows the active theme on `ctx.theme` (defaulting to `'light'`
   * when no theme has been published yet).
   */
  getResolvedKind(): BackgroundKind {
    if (this.opts.mode === 'light' || this.opts.mode === 'dark') return this.opts.mode;
    return this.ctx?.theme.current()?.kind ?? 'light';
  }

  /**
   * The resolved (mode-applied) solid colour currently painted behind the
   * pattern. Layers that want to match the canvas backdrop read this instead of
   * re-implementing `{ light, dark }` resolution — e.g. {@link MiniMapLayer}
   * pointed here via its `backgroundLayerId` mirrors the canvas background so
   * its chrome never drifts from the real one. Returns a `number` or CSS string
   * (whichever form the option carried), suitable for any pixi fill.
   */
  getResolvedBackgroundColor(): number | string {
    return this.resolveColor(this.opts.backgroundColor);
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
    bg.rect(0, 0, width, height).fill(this.resolveColor(this.opts.backgroundColor));
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
    // Texture is rasterised at `textureDpr` device pixels per CSS pixel; we
    // divide `tileScale` by it so on-screen pattern size stays in CSS-pixel
    // units regardless of display density.
    const dpr = this.textureDpr;
    if (!this.opts.followCamera) {
      this.tiling.tileScale.set(1 / dpr, 1 / dpr);
      this.tiling.tilePosition.set(0, 0);
      return;
    }
    const s = this.camScale;
    this.tiling.tileScale.set(s / dpr, s / dpr);
    // Modulo keeps the offset small so we don't accumulate float drift over
    // long pans. The pattern is periodic at `spacing * scale` px (in screen
    // pixels — independent of DPR, since the period is texture_size * tileScale).
    const period = this.opts.spacing * s;
    this.tiling.tilePosition.set(this.camX % period, this.camY % period);
  }

  private createPatternTexture(): Texture {
    const { patternType, color, size, spacing } = this.opts;
    // Rasterise the tile at device-pixel density so dots / lines stay crisp on
    // retina / scaled displays. `tileScale` compensates so the on-screen size
    // is still expressed in CSS pixels.
    const dpr =
      typeof window !== 'undefined' && typeof window.devicePixelRatio === 'number'
        ? Math.max(1, window.devicePixelRatio)
        : 1;
    this.textureDpr = dpr;

    const off = document.createElement('canvas');
    off.width = Math.round(spacing * dpr);
    off.height = Math.round(spacing * dpr);
    const ctx2d = off.getContext('2d')!;
    ctx2d.scale(dpr, dpr);
    ctx2d.fillStyle = colorToCss(this.resolveColor(color));

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

  private resolveColor(c: BackgroundColor): number | string {
    if (typeof c === 'number' || typeof c === 'string') return c;
    return this.getResolvedKind() === 'dark' ? c.dark : c.light;
  }

  /**
   * Pull the backdrop / pattern colours out of a published theme's palette
   * (when the configured roles are present). A `null` theme — or a palette that
   * omits the roles, as the single-layer `{ light, dark }` shorthand does —
   * leaves the current options untouched, so explicitly-set colours stand. The
   * resolved `kind` is read live in `getResolvedKind()`, so `{ light, dark }`
   * colour pairs follow the theme without any copy here.
   */
  private adoptTheme(theme: ResolvedTheme | null): void {
    if (!theme) return;
    const { palette } = theme;
    const surface = palette[this.opts.surfaceRole];
    if (surface !== undefined) this.opts = { ...this.opts, backgroundColor: surface };
    const pattern = palette[this.opts.patternRole] ?? palette['stroke'];
    if (pattern !== undefined) this.opts = { ...this.opts, color: pattern };
  }
}
