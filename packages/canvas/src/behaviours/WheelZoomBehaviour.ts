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

export class WheelZoomBehaviour extends Behaviour {
  private readonly requireCtrl: boolean;
  private readonly percent: number;
  private readonly smooth: false | number;

  constructor(opts: WheelZoomBehaviourOptions) {
    const requireCtrl = opts.requireCtrl ?? false;
    const gesture = requireCtrl ? 'ctrl+wheel' : 'wheel';
    super({ ...opts, shortcuts: opts.shortcuts ?? [gesture] });
    this.requireCtrl = requireCtrl;
    this.percent = opts.percent ?? 0.1;
    this.smooth = opts.smooth ?? false;
  }

  protected onRegister(_ctx: CanvasContext): void { /* wired on enable */ }

  protected onEnable(): void {
    this.ctx!.camera.viewport.wheel({
      percent: this.percent,
      smooth: this.smooth,
      keyToPress: this.requireCtrl ? ['ControlLeft', 'ControlRight'] : undefined,
      trackpadPinch: true,
    });
  }

  protected onDisable(): void {
    this.ctx!.camera.viewport.plugins.remove('wheel');
  }
}
