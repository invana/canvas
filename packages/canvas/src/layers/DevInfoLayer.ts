/**
 * `DevInfoLayer` — developer overlay that continuously displays:
 *   - Canvas display size
 *   - Camera position (x, y) and zoom scale
 *   - Visible world bounds
 *   - Pointer position (screen and world coords)
 *   - Frame rate (FPS)
 *
 * Implemented as a `ScreenLayer` whose visible artifact is a plain
 * absolutely-positioned HTML `<div>` layered above the canvas (so it never
 * interferes with pointer events on the scene). The pixi `container` from
 * `ScreenLayer` is unused — overlay rendering is pure DOM.
 *
 * Headless / offscreen mode: when `ctx.canvasElement` is undefined (i.e.
 * `Canvas.initWithStage`), the layer mounts cleanly but renders nothing.
 *
 * @example
 * ```ts
 * import { DevInfoLayer } from '@invana/canvas/toolkit';
 *
 * const devInfo = new DevInfoLayer({ corner: 'top-right' });
 * canvas.layers.add(devInfo);
 *
 * // Toggle at runtime
 * devInfo.setEnabled(false);
 * ```
 */

import { ScreenLayer, type ScreenLayerHit } from './ScreenLayer';

// ─── Public types ────────────────────────────────────────────────────────────

export type DevInfoCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface DevInfoLayerOptions {
  /** Which corner to anchor the overlay. Default: 'bottom-left' */
  corner?: DevInfoCorner;
  /** Show the overlay. Can be toggled at runtime via setEnabled(). Default: true */
  enabled?: boolean;
  /** Font size in px. Default: 11 */
  fontSize?: number;
  /** Panel opacity 0–1. Default: 0.92 */
  opacity?: number;
  /** Overlay background CSS color. Default: 'rgba(10,10,10,0.82)' */
  backgroundColor?: string;
  /** Text color. Default: '#c8d3e0' */
  textColor?: string;
  /** Accent / header color. Default: '#4fc3f7' */
  accentColor?: string;
}

export interface DevInfoLayerCtorOptions extends DevInfoLayerOptions {
  /** Layer id. Default: 'dev-info'. */
  id?: string;
  /** Pixi z-index inside the screen stage. Default: 9999 (top). */
  zIndex?: number;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_OPTIONS: Required<DevInfoLayerOptions> = {
  corner: 'bottom-left',
  enabled: true,
  fontSize: 11,
  opacity: 0.92,
  backgroundColor: 'rgba(10,10,10,0.82)',
  textColor: '#c8d3e0',
  accentColor: '#4fc3f7',
};

// ─── Implementation ──────────────────────────────────────────────────────────

interface DevInfoState {
  enabled: boolean;
}

export class DevInfoLayer extends ScreenLayer<DevInfoLayerOptions, DevInfoState> {
  private _opts: Required<DevInfoLayerOptions>;
  private _overlay: HTMLDivElement | null = null;

  // Tracked state — updated by events
  private _pointerScreen = { x: 0, y: 0 };
  private _pointerWorld = { x: 0, y: 0 };
  private _onPointerMove: ((e: PointerEvent) => void) | null = null;

  // Unsubscribers for ctx.events listeners
  private _unsubs: Array<() => void> = [];

  // FPS tracking
  private _rafId: number | null = null;
  private _fps = 0;
  private _frameCount = 0;
  private _lastFpsTimestamp = 0;

  constructor(opts: DevInfoLayerCtorOptions = {}) {
    const { id, zIndex, ...rest } = opts;
    super({
      id: id ?? 'dev-info',
      options: rest,
      zIndex: zIndex ?? 9999,
      hittable: false,
      cullable: false,
    });
    this._opts = { ...DEFAULT_OPTIONS, ...rest };
  }

  protected override createState(): DevInfoState {
    return { enabled: true };
  }

  // ── ScreenLayer hit-testing ────────────────────────────────────────────────

  /** Overlay is DOM with `pointer-events:none` — never participates in hit-testing. */
  override hitTest(_screenX: number, _screenY: number): ScreenLayerHit | null {
    return null;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  protected override onMount(): void {
    if (this._opts.enabled) {
      this._mountOverlay();
    }
  }

  protected override onUnmount(): void {
    this._stopFpsTicker();
    this._unmountOverlay();
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Show or hide the overlay at runtime without removing the layer. */
  setEnabled(enabled: boolean): void {
    if (enabled) this.enable();
    else this.disable();
  }

  enable(): void {
    this._opts.enabled = true;
    if (this.mounted && !this._overlay) this._mountOverlay();
  }

  disable(): void {
    this._opts.enabled = false;
    this._stopFpsTicker();
    this._unmountOverlay();
  }

  /** Update display options (corner, colors, font size, …) at runtime. */
  setOptions(partial: Partial<DevInfoLayerOptions>): void {
    this._opts = { ...this._opts, ...partial };
    if (this._overlay) {
      this._applyStyles();
      this._update();
    }
  }

  // ── Mount / unmount the DOM overlay ────────────────────────────────────────

  private _mountOverlay(): void {
    const ctx = this.context;
    const canvasEl = ctx.canvasElement;
    if (!canvasEl) return; // headless / initWithStage

    const parent = canvasEl.parentElement;
    if (!parent) return;

    // Ensure the parent is a positioning context for absolute children.
    if (window.getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }

    const div = document.createElement('div');
    div.dataset['devInfoLayer'] = this.id;
    this._overlay = div;
    this._applyStyles();
    parent.appendChild(div);

    // Camera updates → repaint overlay.
    this._unsubs.push(ctx.events.on('camera:pan', () => this._update()));
    this._unsubs.push(ctx.events.on('camera:zoom', () => this._update()));

    // Native pointermove — engine doesn't emit a typed `pointermove` event,
    // so read DOM coords directly and convert via camera.
    this._onPointerMove = (e: PointerEvent) => {
      const rect = canvasEl.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      this._pointerScreen = { x: sx, y: sy };
      this._pointerWorld = ctx.camera.toWorld(sx, sy);
      this._update();
    };
    canvasEl.addEventListener('pointermove', this._onPointerMove);

    // FPS counter — 500ms bucket.
    this._lastFpsTimestamp = performance.now();
    this._startFpsTicker();

    this._update();
  }

  private _unmountOverlay(): void {
    for (const unsub of this._unsubs) unsub();
    this._unsubs = [];

    if (this._onPointerMove && this.ctx?.canvasElement) {
      this.ctx.canvasElement.removeEventListener('pointermove', this._onPointerMove);
    }
    this._onPointerMove = null;

    this._overlay?.remove();
    this._overlay = null;
  }

  // ── Styles ─────────────────────────────────────────────────────────────────

  private _applyStyles(): void {
    if (!this._overlay) return;
    const { corner, fontSize, opacity, backgroundColor, textColor } = this._opts;

    const position: Record<DevInfoCorner, string> = {
      'top-left': 'top:10px; left:10px;',
      'top-right': 'top:10px; right:10px;',
      'bottom-left': 'bottom:10px; left:10px;',
      'bottom-right': 'bottom:10px; right:10px;',
    };

    this._overlay.style.cssText = [
      'position:absolute;',
      position[corner],
      `font-size:${fontSize}px;`,
      `opacity:${opacity};`,
      `background:${backgroundColor};`,
      `color:${textColor};`,
      'font-family:"SF Mono","Fira Code","Cascadia Code","Courier New",monospace;',
      'padding:8px 12px;',
      'border-radius:6px;',
      'line-height:1.65;',
      'pointer-events:none;',
      'z-index:9999;',
      'white-space:pre;',
      'min-width:230px;',
      'border:1px solid rgba(255,255,255,0.08);',
      'box-shadow:0 4px 16px rgba(0,0,0,0.5);',
      'user-select:none;',
    ].join('');
  }

  // ── FPS ticker ─────────────────────────────────────────────────────────────

  private _startFpsTicker(): void {
    const tick = (now: number) => {
      this._frameCount++;
      const elapsed = now - this._lastFpsTimestamp;
      if (elapsed >= 500) {
        this._fps = Math.round((this._frameCount / elapsed) * 1000);
        this._frameCount = 0;
        this._lastFpsTimestamp = now;
        this._update();
      }
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  }

  private _stopFpsTicker(): void {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  private _update(): void {
    if (!this._overlay || !this.ctx) return;
    const ctx = this.ctx;
    const canvasEl = ctx.canvasElement;
    if (!canvasEl) return;

    const { accentColor } = this._opts;
    const cam = ctx.camera;
    const bounds = cam.getVisibleBounds();

    const w = canvasEl.clientWidth || canvasEl.width;
    const h = canvasEl.clientHeight || canvasEl.height;

    const sep = `<span style="color:${accentColor};opacity:0.5">${'─'.repeat(28)}</span>`;
    const header = (label: string) =>
      `<span style="color:${accentColor};font-weight:bold"> ${label}</span>`;
    const row = (label: string, value: string) =>
      `  <span style="opacity:0.6">${label.padEnd(12)}</span>${value}`;

    const lines = [
      header('DEV INFO'),
      sep,
      header('Canvas'),
      row('size', `${w} × ${h} px`),
      sep,
      header('Camera'),
      row('x', n(cam.x)),
      row('y', n(cam.y)),
      row('zoom', `${cam.scale.toFixed(3)}×`),
      sep,
      header('World Bounds'),
      row('x (left)', n(bounds.x)),
      row('y (top)', n(bounds.y)),
      row('right', n(bounds.x + bounds.width)),
      row('bottom', n(bounds.y + bounds.height)),
      row('width', n(bounds.width)),
      row('height', n(bounds.height)),
      sep,
      header('Pointer'),
      row('screen', `${n(this._pointerScreen.x)}, ${n(this._pointerScreen.y)}`),
      row('world', `${n(this._pointerWorld.x)}, ${n(this._pointerWorld.y)}`),
      sep,
      header('Performance'),
      row('fps', String(this._fps)),
    ];

    this._overlay.innerHTML = lines.join('\n');
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Format a number to 1 decimal place, right-aligned in 9 chars. */
function n(value: number): string {
  return value.toFixed(1).padStart(9);
}
