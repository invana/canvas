/**
 * `KeyboardCameraInputBehaviour` — keyboard pan and zoom for accessibility.
 *
 * Default keymap (all configurable via `keymap` option):
 *
 *   Pan up/down/left/right  →  Arrow keys
 *   Zoom in                 →  `+` / `=` / `NumpadAdd`
 *   Zoom out                →  `-` / `NumpadSubtract`
 *   Reset zoom to 1:1       →  `0` / `Numpad0`
 *
 * Events attach to `document` so the canvas does not need to be
 * individually focused. Input fields, textareas, and selects are
 * excluded automatically — keyboard events whose `target` is an editable
 * element fall through unhandled.
 *
 * Arrow key direction follows the "scroll" metaphor: ArrowUp pans the
 * viewport so you see content *above* the current view.
 */

import { Behaviour, type BehaviourOptions } from './Behaviour';
import type { CanvasContext } from '../context/CanvasContext';

export interface KeyboardCameraKeymap {
  panUp: string[];
  panDown: string[];
  panLeft: string[];
  panRight: string[];
  zoomIn: string[];
  zoomOut: string[];
  resetZoom: string[];
}

const DEFAULT_KEYMAP: KeyboardCameraKeymap = {
  panUp:    ['ArrowUp'],
  panDown:  ['ArrowDown'],
  panLeft:  ['ArrowLeft'],
  panRight: ['ArrowRight'],
  zoomIn:   ['+', '=', 'NumpadAdd'],
  zoomOut:  ['-', 'NumpadSubtract'],
  resetZoom: ['0', 'Numpad0'],
};

export interface KeyboardCameraInputBehaviourOptions extends BehaviourOptions {
  /** Pan distance per key press in screen pixels. Default `40`. */
  panStep?: number;
  /**
   * Zoom multiplier per key press. `1.1` = 10% in/out per press.
   * Default `1.1`.
   */
  zoomFactor?: number;
  /** Override individual key groups. Merged with the defaults. */
  keymap?: Partial<KeyboardCameraKeymap>;
}

export class KeyboardCameraInputBehaviour extends Behaviour<KeyboardCameraInputBehaviourOptions> {
  // Live-read from `_options` so `setOptions` takes effect. The keydown handler
  // is bound once in onEnable but reads these per-event, so no re-arm is needed.
  private get panStep(): number { return this._options.panStep ?? 40; }
  private get zoomFactor(): number { return this._options.zoomFactor ?? 1.1; }
  private get keymap(): KeyboardCameraKeymap { return { ...DEFAULT_KEYMAP, ...this._options.keymap }; }
  private _handler?: (e: KeyboardEvent) => void;

  constructor(opts: KeyboardCameraInputBehaviourOptions) {
    const keymap: KeyboardCameraKeymap = { ...DEFAULT_KEYMAP, ...opts.keymap };
    const allKeys = [...new Set(Object.values(keymap).flat())];
    super({ ...opts, shortcuts: opts.shortcuts ?? allKeys });
  }

  protected onRegister(_ctx: CanvasContext): void { /* wired on enable */ }

  protected onEnable(): void {
    this._handler = (e: KeyboardEvent) => this._onKeyDown(e);
    document.addEventListener('keydown', this._handler);
  }

  protected onDisable(): void {
    if (this._handler) {
      document.removeEventListener('keydown', this._handler);
      this._handler = undefined;
    }
  }

  private _onKeyDown(e: KeyboardEvent): void {
    const tag = (e.target as HTMLElement | null)?.tagName?.toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    const camera = this.ctx!.camera;
    const key = e.key;
    const code = e.code;

    // ArrowUp/Down/Left/Right use scroll metaphor: ArrowUp = see content above.
    if (this._match(key, code, this.keymap.panUp)) {
      e.preventDefault();
      camera.pan(0, this.panStep);
    } else if (this._match(key, code, this.keymap.panDown)) {
      e.preventDefault();
      camera.pan(0, -this.panStep);
    } else if (this._match(key, code, this.keymap.panLeft)) {
      e.preventDefault();
      camera.pan(this.panStep, 0);
    } else if (this._match(key, code, this.keymap.panRight)) {
      e.preventDefault();
      camera.pan(-this.panStep, 0);
    } else if (this._match(key, code, this.keymap.zoomIn)) {
      e.preventDefault();
      camera.zoomAt(this.zoomFactor);
    } else if (this._match(key, code, this.keymap.zoomOut)) {
      e.preventDefault();
      camera.zoomAt(1 / this.zoomFactor);
    } else if (this._match(key, code, this.keymap.resetZoom)) {
      e.preventDefault();
      camera.setZoom(1);
    }
  }

  private _match(key: string, code: string, candidates: string[]): boolean {
    return candidates.includes(key) || candidates.includes(code);
  }
}
