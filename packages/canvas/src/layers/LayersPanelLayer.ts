/**
 * `LayersPanelLayer` — developer overlay that lists every layer currently
 * mounted on the canvas and exposes a checkbox per row to toggle that
 * layer's `visible` flag.
 *
 * Implemented as a `ScreenLayer` whose visible artifact is a plain
 * absolutely-positioned HTML `<div>` layered above the canvas — same pattern
 * as `DevInfoLayer`. Unlike `DevInfoLayer`, the overlay receives pointer
 * events (so the checkboxes are clickable); the layer itself still opts out
 * of engine hit-testing via `hittable: false`.
 *
 * The panel re-renders on `'layer:added'` / `'layer:removed'`. The panel's
 * own row is filtered out so the user can't hide it via itself.
 *
 * Headless / offscreen mode: when `ctx.canvasElement` is undefined (i.e.
 * `Canvas.initWithStage`), the layer mounts cleanly but renders nothing.
 *
 * @example
 * ```ts
 * import { LayersPanelLayer } from '@invana/canvas';
 *
 * const panel = new LayersPanelLayer({ corner: 'top-right' });
 * canvas.layers.add(panel);
 *
 * // Toggle the panel itself at runtime
 * panel.setEnabled(false);
 * ```
 */

import { ScreenLayer, type ScreenLayerHit } from './ScreenLayer';

// ─── Public types ────────────────────────────────────────────────────────────

export type LayersPanelCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface LayersPanelLayerOptions {
  /** Which corner to anchor the overlay. Default: 'top-right' */
  corner?: LayersPanelCorner;
  /** Show the overlay. Toggle at runtime via setEnabled(). Default: true */
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
  /**
   * Layer ids to hide from the list. The panel's own id is always hidden
   * regardless of this option.
   */
  hideIds?: readonly string[];
}

export interface LayersPanelLayerCtorOptions extends LayersPanelLayerOptions {
  /** Layer id. Default: 'layers-panel'. */
  id?: string;
  /** Pixi z-index inside the screen stage. Default: 9998 (just below DevInfoLayer). */
  zIndex?: number;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_OPTIONS: Required<Omit<LayersPanelLayerOptions, 'hideIds'>> & {
  hideIds: readonly string[];
} = {
  corner: 'top-right',
  enabled: true,
  fontSize: 11,
  opacity: 0.92,
  backgroundColor: 'rgba(10,10,10,0.82)',
  textColor: '#c8d3e0',
  accentColor: '#4fc3f7',
  hideIds: [],
};

// ─── Implementation ──────────────────────────────────────────────────────────

interface LayersPanelState {
  enabled: boolean;
}

export class LayersPanelLayer extends ScreenLayer<LayersPanelLayerOptions, LayersPanelState> {
  private _opts: typeof DEFAULT_OPTIONS;
  private _overlay: HTMLDivElement | null = null;
  private _onChange: ((e: Event) => void) | null = null;

  // Unsubscribers for ctx.events listeners.
  private _unsubs: Array<() => void> = [];

  constructor(opts: LayersPanelLayerCtorOptions = {}) {
    const { id, zIndex, ...rest } = opts;
    super({
      id: id ?? 'layers-panel',
      options: rest,
      zIndex: zIndex ?? 9998,
      hittable: false,
      cullable: false,
    });
    this._opts = { ...DEFAULT_OPTIONS, ...rest };
  }

  protected override createState(): LayersPanelState {
    return { enabled: true };
  }

  // ── ScreenLayer hit-testing ────────────────────────────────────────────────

  /** Overlay is DOM — never participates in the engine's hit-testing. */
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
    this._unmountOverlay();
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Show or hide the panel at runtime without removing the layer. */
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
    this._unmountOverlay();
  }

  /** Update display options (corner, colors, font size, …) at runtime. */
  setOptions(partial: Partial<LayersPanelLayerOptions>): void {
    this._opts = { ...this._opts, ...partial };
    if (this._overlay) {
      this._applyStyles();
      this._render();
    }
  }

  /**
   * Force a re-render of the panel. Call this if external code mutates
   * `layer.visible` on a registered layer and you want the checkboxes to
   * reflect the new state. (The engine does not emit an event for visibility
   * mutations.)
   */
  refresh(): void {
    if (this._overlay) this._render();
  }

  // ── Mount / unmount the DOM overlay ────────────────────────────────────────

  private _mountOverlay(): void {
    const ctx = this.context;
    const canvasEl = ctx.canvasElement;
    if (!canvasEl) return; // headless / initWithStage

    const parent = canvasEl.parentElement;
    if (!parent) return;

    if (window.getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }

    const div = document.createElement('div');
    div.dataset['layersPanelLayer'] = this.id;
    this._overlay = div;
    this._applyStyles();
    parent.appendChild(div);

    // Re-render when the layer set changes.
    this._unsubs.push(ctx.events.on('layer:added', () => this._render()));
    this._unsubs.push(ctx.events.on('layer:removed', () => this._render()));

    // Single delegated change listener for all checkboxes.
    this._onChange = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target || target.tagName !== 'INPUT') return;
      const input = target as HTMLInputElement;
      const layerId = input.dataset['layerId'];
      if (!layerId || !this.ctx) return;
      const layer = this.ctx.layers.get(layerId);
      if (layer) layer.visible = input.checked;
    };
    div.addEventListener('change', this._onChange);

    this._render();
  }

  private _unmountOverlay(): void {
    for (const unsub of this._unsubs) unsub();
    this._unsubs = [];

    if (this._onChange && this._overlay) {
      this._overlay.removeEventListener('change', this._onChange);
    }
    this._onChange = null;

    this._overlay?.remove();
    this._overlay = null;
  }

  // ── Styles ─────────────────────────────────────────────────────────────────

  private _applyStyles(): void {
    if (!this._overlay) return;
    const { corner, fontSize, opacity, backgroundColor, textColor } = this._opts;

    const position: Record<LayersPanelCorner, string> = {
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
      'line-height:1.5;',
      'pointer-events:auto;',
      'z-index:9998;',
      'min-width:200px;',
      'border:1px solid rgba(255,255,255,0.08);',
      'box-shadow:0 4px 16px rgba(0,0,0,0.5);',
      'user-select:none;',
    ].join('');
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  private _render(): void {
    if (!this._overlay || !this.ctx) return;
    const { accentColor, hideIds } = this._opts;

    const all = this.ctx.layers.list().filter((l) => {
      if (l.id === this.id) return false;
      if (hideIds.includes(l.id)) return false;
      return true;
    });

    const headerHtml =
      `<div style="color:${accentColor};font-weight:bold;margin-bottom:6px;">` +
      ` LAYERS (${all.length})` +
      `</div>` +
      `<div style="color:${accentColor};opacity:0.5;margin-bottom:4px;">` +
      '─'.repeat(28) +
      `</div>`;

    if (all.length === 0) {
      this._overlay.innerHTML =
        headerHtml +
        `<div style="opacity:0.5;font-style:italic;padding:2px 0;">no other layers</div>`;
      return;
    }

    const rows = all
      .map((l) => {
        const checked = l.visible ? 'checked' : '';
        return (
          `<label style="display:flex;align-items:center;gap:6px;padding:2px 0;cursor:pointer;">` +
          `<input type="checkbox" data-layer-id="${escapeAttr(l.id)}" ${checked}` +
          ` style="cursor:pointer;margin:0;" />` +
          `<span>${escapeHtml(l.id)}</span>` +
          `</label>`
        );
      })
      .join('');

    this._overlay.innerHTML = headerHtml + rows;
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
