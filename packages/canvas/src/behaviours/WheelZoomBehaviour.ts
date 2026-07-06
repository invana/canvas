/**
 * `WheelZoomBehaviour` — scroll-wheel zooming via the pixi-viewport `wheel` plugin.
 *
 * By default, any scroll wheel event zooms. Set `requireCtrl: true` to
 * restrict to Ctrl+scroll (frees plain scroll for page scrolling — good
 * for accessibility contexts where the canvas is inline on a scrollable page).
 *
 * `trackpadPinch: true` is enabled so two-finger trackpad pinches zoom
 * instead of scroll. Pair with `PinchZoomBehaviour` for touch devices.
 */

import { Behaviour, type BehaviourOptions } from './Behaviour';
import type { CanvasContext } from '../context/CanvasContext';

export interface WheelZoomBehaviourOptions extends BehaviourOptions {
  /**
   * If `true`, only Ctrl+scroll triggers zoom; plain scroll falls through
   * to the browser. Good for inline canvas embeds. Default `false`.
   */
  requireCtrl?: boolean;
  /** Zoom speed per wheel tick, as a fraction. Default `0.1` (10%). */
  percent?: number;
  /**
   * Smooth-scroll frame count. `false` = instant snap. Default `false`.
   * Set to e.g. `8` for an ease-out feel.
   */
  smooth?: false | number;
}

export class WheelZoomBehaviour extends Behaviour<WheelZoomBehaviourOptions> {
  constructor(opts: WheelZoomBehaviourOptions) {
    const requireCtrl = opts.requireCtrl ?? false;
    const gesture = requireCtrl ? 'ctrl+wheel' : 'wheel';
    super({ ...opts, shortcuts: opts.shortcuts ?? [gesture] });
  }

  protected onRegister(_ctx: CanvasContext): void { /* wired on enable */ }

  protected onEnable(): void {
    this.ctx!.camera.viewport.wheel({
      percent: this._options.percent ?? 0.1,
      smooth: this._options.smooth ?? false,
      keyToPress: (this._options.requireCtrl ?? false) ? ['ControlLeft', 'ControlRight'] : undefined,
      trackpadPinch: true,
    });
  }

  protected onDisable(): void {
    this.ctx!.camera.viewport.plugins.remove('wheel');
  }

  /**
   * The pixi-viewport `wheel` plugin reads its config only at install time, so a
   * live edit means remove-then-reinstall. Re-arm picks up the merged
   * `this._options`. (`setOptions` / `getOptions` come from the base.)
   */
  protected override onOptionsChanged(): void {
    this.reArm();
  }

  /** Include the wheel options (beyond the base `enabled`) in a state snapshot. */
  override serializeDefinition(): Record<string, unknown> {
    return {
      ...super.serializeDefinition(),
      requireCtrl: this._options.requireCtrl ?? false,
      percent: this._options.percent ?? 0.1,
      smooth: this._options.smooth ?? false,
    };
  }
}
