import type { CanvasPlugin, PluginContext } from '../types.js';

// ─── Public types ────────────────────────────────────────────────────────────

export type DevInfoCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface DevInfoPluginOptions {
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

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_OPTIONS: Required<DevInfoPluginOptions> = {
  corner: 'bottom-left',
  enabled: true,
  fontSize: 11,
  opacity: 0.92,
  backgroundColor: 'rgba(10,10,10,0.82)',
  textColor: '#c8d3e0',
  accentColor: '#4fc3f7',
};

// ─── Implementation ───────────────────────────────────────────────────────────

/**
 * DevInfoPlugin — developer overlay that continuously displays:
 *   - Canvas display size
 *   - Camera position (x, y) and zoom scale
 *   - Visible world bounds
 *   - Pointer position (screen and world coords)
 *   - Frame rate (FPS)
 *
 * The overlay is a plain HTML element layered above the canvas, so it
 * never interferes with pointer events on the scene.
 *
 * @example
 * ```ts
 * const devInfo = new DevInfoPlugin({ corner: 'top-right', enabled: true });
 * await canvas.plugins.register(devInfo);
 *
 * // Toggle at runtime
 * devInfo.setEnabled(false);
 * ```
 */
export class DevInfoPlugin implements CanvasPlugin {
  readonly id: string;

  private _options: Required<DevInfoPluginOptions>;
  private _ctx: PluginContext | null = null;
  private _overlay: HTMLDivElement | null = null;

  // Tracked state — updated by events
  private _pointerScreen = { x: 0, y: 0 };
  private _pointerWorld = { x: 0, y: 0 };
  private _onPointerMove: ((e: PointerEvent) => void) | null = null;

  // FPS tracking
  private _rafId: number | null = null;
  private _fps = 0;
  private _frameCount = 0;
  private _lastFpsTimestamp = 0;

  constructor(options: DevInfoPluginOptions & { key?: string } = {}) {
    const { key, ...rest } = options;
    this.id = key ?? 'dev-info';
    this._options = { ...DEFAULT_OPTIONS, ...rest };
  }

  // ── CanvasPlugin ────────────────────────────────────────────────────────────

  register(ctx: PluginContext): void {
    this._ctx = ctx;

    if (this._options.enabled) {
      this._mount(ctx);
    }
  }

  destroy(): void {
    this._stopFpsTicker();
    if (this._onPointerMove && this._ctx) {
      this._ctx.canvasElement.removeEventListener('pointermove', this._onPointerMove);
    }
    this._unmount();
    this._ctx = null;
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Show or hide the overlay at runtime without destroying the plugin. */
  setEnabled(enabled: boolean): void {
    if (enabled) this.enable(); else this.disable();
  }

  enable(): void {
    this._options.enabled = true;
    if (this._ctx && !this._overlay) this._mount(this._ctx);
  }

  disable(): void {
    this._options.enabled = false;
    this._stopFpsTicker();
    this._unmount();
  }

  /** Update display options (corner, colors, font size, …) at runtime. */
  setOptions(partial: Partial<DevInfoPluginOptions>): void {
    this._options = { ...this._options, ...partial };
    if (this._overlay) {
      this._applyStyles();
      this._update();
    }
  }

  // ── Mount / unmount ─────────────────────────────────────────────────────────

  private _mount(ctx: PluginContext): void {
    const parent = ctx.canvasElement.parentElement;
    if (!parent) return;

    // Ensure the parent is a positioning context
    if (window.getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }

    const div = document.createElement('div');
    div.dataset['devInfoPlugin'] = this.id;
    this._overlay = div;
    this._applyStyles();

    parent.appendChild(div);

    // Wire events
    ctx.events.on('camera:pan', () => {
      this._update();
    });

    ctx.events.on('camera:zoom', () => {
      this._update();
    });

    // Native pointermove — canvas:pointermove is not emitted by the engine,
    // so we read coords directly from the DOM event and convert via camera.
    this._onPointerMove = (e: PointerEvent) => {
      const rect = ctx.canvasElement.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      this._pointerScreen = { x: sx, y: sy };
      this._pointerWorld = ctx.camera.toWorld(sx, sy);
      this._update();
    };
    ctx.canvasElement.addEventListener('pointermove', this._onPointerMove);

    // FPS counter
    this._lastFpsTimestamp = performance.now();
    this._startFpsTicker();

    this._update();
  }

  private _unmount(): void {
    this._overlay?.remove();
    this._overlay = null;
  }

  // ── Styles ──────────────────────────────────────────────────────────────────

  private _applyStyles(): void {
    if (!this._overlay) return;
    const { corner, fontSize, opacity, backgroundColor, textColor } = this._options;

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

  // ── FPS ticker ──────────────────────────────────────────────────────────────

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

  // ── Render ──────────────────────────────────────────────────────────────────

  private _update(): void {
    if (!this._overlay || !this._ctx) return;

    const { accentColor } = this._options;
    const cam = this._ctx.camera;
    const el = this._ctx.canvasElement;
    const bounds = cam.getBounds();

    const w = el.clientWidth || el.width;
    const h = el.clientHeight || el.height;

    // Build lines with inner HTML so the header can be colored
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
