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


import { INHERIT, resolveThemed, type CanvasContext, type Themed } from '@invana/canvas-core';
import { ScreenLayer, type ScreenLayerHit } from './ScreenLayer';
import type { LayerOptions } from '@invana/canvas-core';

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
 * A colour input. Pass a `number` / CSS string to **pin** a colour, `'inherit'`
 * to follow the active theme's palette role, or a `{ light, dark }` pair to
 * swap on the layer's `mode` — each half of which may itself be `'inherit'`.
 *
 * `'inherit'` is the default for both colour options, and it is what makes the
 * background themeable *and* overridable: an author-set colour wins over the
 * theme and keeps winning across every theme switch, while an untouched one
 * tracks the palette. See {@link INHERIT}.
 *
 * @example
 * ```ts
 * backgroundColor: 'inherit'                      // follows `surfaceRole`
 * backgroundColor: '#0f172a'                      // pinned; the theme never touches it
 * backgroundColor: { light: 'inherit', dark: '#000' }  // themed in light, pinned in dark
 * ```
 */
export type BackgroundColor =
  | Themed<number | string>
  | { light: Themed<number | string>; dark: Themed<number | string> };

/** Construction-time options for `BackgroundLayer`. */
export interface BackgroundLayerOptions {
  /** `'solid'` paints a flat fill; `'pattern'` overlays a tiled texture. Default `'solid'`. */
  type?: BackgroundType;
  /** Tile texture kind when `type === 'pattern'`. Default `'dots'`. */
  patternType?: BackgroundPatternType;
  /**
   * Pattern foreground colour (dot / line / grid colour). Accepts `0xRRGGBB`,
   * a CSS string, `'inherit'`, or a `{ light, dark }` pair resolved against
   * `mode`. Default `'inherit'` — follows {@link patternRole}.
   */
  color?: BackgroundColor;
  /**
   * Solid-fill colour painted behind the pattern. Same accepted forms as
   * {@link color}. Default `'inherit'` — follows {@link surfaceRole}.
   */
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
   * Hide the tiled pattern once the camera scale drops below this value — zoomed
   * far out the tiles collapse into visual noise, so the backdrop reads better
   * on its own. Set `0` to disable the cutoff and always show the pattern.
   *
   * Only affects `type: 'pattern'`; the solid backdrop always paints. Applies to
   * *any* camera change (wheel / pinch / keyboard / programmatic), since it's
   * evaluated from the cached camera scale rather than in a zoom behaviour.
   *
   * Default `0.5` (hidden below 50% zoom).
   */
  hidePatternBelowZoom?: number;
  /**
   * Which half of a `{ light, dark }` colour pair is used, and which built-in
   * fallback paints before any theme is published. `'auto'` (default) follows
   * the active theme on `ctx.theme`; `'light'` / `'dark'` pin explicitly.
   *
   * It does **not** select a palette variant: the published `ResolvedTheme`
   * carries one kind's palette, so an `'inherit'` colour always resolves to the
   * theme's own kind regardless of this setting. Has no effect on plain
   * scalars.
   */
  mode?: BackgroundMode;
  /**
   * Palette role the solid backdrop reads when {@link backgroundColor} is
   * `'inherit'` (the default). Default `'surface'`.
   *
   * The role is only consulted for an `'inherit'` value — a pinned colour is
   * never overridden, and no role name can reach past it.
   */
  surfaceRole?: string;
  /**
   * Palette role the pattern (dots / grid / lines) reads when {@link color} is
   * `'inherit'` (the default), falling back to `'stroke'` when the role is
   * absent from the palette. Default `'divider'`.
   */
  patternRole?: string;
}

/**
 * Colours painted for an `'inherit'` option when **no theme has been published**
 * — a canvas with no `ThemeBehaviour` registered, or one whose behaviour hasn't
 * been enabled yet. Chosen to match the `default` theme family's `surface` /
 * `divider` roles in each kind, so enabling a theme is not a visible jump.
 *
 * The light values are the layer's historical hardcoded defaults, so a canvas
 * with no theme looks exactly as it always has.
 */
const FALLBACK = {
  background: { light: '#f8fafc', dark: '#0f172a' },
  pattern: { light: '#6f7b8b', dark: '#475569' },
  // background: { light: 'inherit', dark: 'inherit' },
  // pattern: { light: 'inherit', dark: 'inherit' },
} as const;

const DEFAULTS: Required<BackgroundLayerOptions> = {
  type: 'solid',
  patternType: 'dots',
  color: INHERIT,
  backgroundColor: INHERIT,
  size: 1,
  spacing: 12,
  alpha: 0.6,
  followCamera: true,
  hidePatternBelowZoom: 0.5,
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
  override readonly kind = 'background-layer';

  private opts: Required<BackgroundLayerOptions>;
  /**
   * The rasterised pattern tile, kept so a camera-following repaint reuses it —
   * the surface caches its texture on this object's identity.
   */
  private patternTile: HTMLCanvasElement | null = null;
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

    // Colours are resolved at paint time (see `resolveColor`), so a theme
    // published before this layer mounted is picked up by the first render with
    // no adoption step.
    this.render();

    // Recolour on every theme switch — a full `render()` because the pattern
    // tile is rasterised with the resolved colour baked in. Nothing is written
    // back to `this.opts`: an author-set colour must survive every switch, and
    // the options are what `getOptions()` and the settings editor read.
    this.offTheme = ctx.events.on('theme:change', () => {
      if (this.mounted) this.render();
    });

    this.offCameraPan = ctx.events.on('input:camera:pan', ({ x, y }) => {
      this.camX = x;
      this.camY = y;
      this.paint();
    });
    this.offCameraZoom = ctx.events.on('input:camera:zoom', ({ scale }) => {
      // `centerX/centerY` is the screen-space zoom anchor — *not* the
      // world-origin screen position — so we only consume the new scale here.
      // The accompanying `camera:pan` emission (always paired with zoom)
      // updates `camX/camY` to the post-zoom origin offset.
      this.camScale = scale;
      this.paint();
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
    this.patternTile = null;
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
    return this.resolvedBackgroundColor();
  }

  // ─── Internals ──────────────────────────────────────────────────────────

  private viewportSize(): { width: number; height: number } {
    const el = this.context.canvasElement;
    if (el) return { width: el.clientWidth || 800, height: el.clientHeight || 600 };
    return { width: 800, height: 600 };
  }

  private render(): void {
    // A full rebuild: the pattern's own appearance changed, so drop the cached
    // tile and let `paint` rasterise a fresh one.
    this.patternTile = null;
    this.paint();
  }

  /**
   * Push the current backdrop to the surface. Cheap enough to call on every
   * camera move: the tile image is reused unless {@link render} dropped it, and
   * the surface rebuilds its texture only when that identity changes.
   */
  private paint(): void {
    const { width, height } = this.viewportSize();
    const color = this.resolvedBackgroundColor();

    if (this.opts.type === 'solid') {
      this.surface.setBackdrop({ color, width, height });
      return;
    }

    this.patternTile ??= this.createPatternTile();
    this.surface.setBackdrop({
      color,
      width,
      height,
      tile: { source: this.patternTile, ...this.tileTransform(), alpha: this.opts.alpha },
    });
  }

  /**
   * Scale, offset and visibility for the pattern tile.
   *
   * Low-zoom cutoff: below the threshold the tiles are too dense to read, so we
   * hide the pattern and leave the solid backdrop. Evaluated here (rather than
   * in a zoom behaviour) so every camera source — wheel, pinch, keyboard,
   * programmatic — goes through the same check.
   */
  private tileTransform(): {
    scale: number;
    offsetX: number;
    offsetY: number;
    visible: boolean;
  } {
    const visible =
      this.opts.hidePatternBelowZoom <= 0 || this.camScale >= this.opts.hidePatternBelowZoom;
    // The tile is rasterised at `textureDpr` device pixels per CSS pixel; we
    // divide the scale by it so on-screen pattern size stays in CSS-pixel units
    // regardless of display density.
    const dpr = this.textureDpr;
    if (!this.opts.followCamera) {
      return { scale: 1 / dpr, offsetX: 0, offsetY: 0, visible };
    }
    const s = this.camScale;
    // Modulo keeps the offset small so we don't accumulate float drift over
    // long pans. The pattern is periodic at `spacing * scale` px (in screen
    // pixels — independent of DPR, since the period is tile_size * scale).
    const period = this.opts.spacing * s;
    return {
      scale: s / dpr,
      offsetX: this.camX % period,
      offsetY: this.camY % period,
      visible,
    };
  }

  private createPatternTile(): HTMLCanvasElement {
    const { patternType, size, spacing } = this.opts;
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
    ctx2d.fillStyle = colorToCss(this.resolvedPatternColor());

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

    return off;
  }

  /** The solid backdrop colour as painted — {@link INHERIT} resolved, pins honoured. */
  private resolvedBackgroundColor(): number | string {
    return this.resolveColor(this.opts.backgroundColor, this.opts.surfaceRole, FALLBACK.background);
  }

  /**
   * The pattern colour as painted. Falls back to the `'stroke'` role when the
   * configured {@link BackgroundLayerOptions.patternRole} is absent from the
   * palette — a theme may carry one without the other.
   */
  private resolvedPatternColor(): number | string {
    return this.resolveColor(
      this.opts.color,
      [this.opts.patternRole, 'stroke'],
      FALLBACK.pattern,
    );
  }

  /**
   * Resolve a colour option to something paintable, in two stages:
   *
   * 1. **Pick the variant** — a `{ light, dark }` pair collapses to one half via
   *    {@link getResolvedKind} (the layer's `mode`, else the published theme's kind).
   * 2. **Resolve the sentinel** — `'inherit'` reads `roles` off the live palette;
   *    anything else is an author-set colour and passes through untouched.
   *
   * Called on every paint rather than adopted into `this.opts`, which is what
   * keeps a pinned colour pinned across theme switches and keeps `getOptions()`
   * reporting what the author wrote rather than what the theme last painted.
   */
  private resolveColor(
    c: BackgroundColor,
    roles: string | readonly string[],
    fallback: { readonly light: string; readonly dark: string },
  ): number | string {
    const kind = this.getResolvedKind();
    const picked = typeof c === 'object' && c !== null ? (kind === 'dark' ? c.dark : c.light) : c;
    return resolveThemed<number | string>(
      picked,
      this.ctx?.theme.current()?.palette,
      roles,
      kind === 'dark' ? fallback.dark : fallback.light,
    );
  }
}
