/**
 * `PinchZoomBehaviour` — two-finger pinch-to-zoom via the pixi-viewport `pinch` plugin.
 *
 * Designed for touch screens and trackpads. Works alongside
 * `WheelZoomBehaviour` (which handles trackpad pinch-as-scroll separately via
 * its `trackpadPinch` flag); this behaviour handles native touch pinch events.
 *
 * Set `noDrag: true` if you want pinch to only zoom, not also pan (useful
 * when you have a separate `DragPanBehaviour` and don't want conflicts).
 */

import { Behaviour, type BehaviourOptions } from './Behaviour';
import type { CanvasContext } from '../context/CanvasContext';

export interface PinchZoomBehaviourOptions extends BehaviourOptions {
  /**
   * If `true`, suppress the implicit pan that accompanies a pinch gesture.
   * Default `false` — pinch both zooms and centres the viewport on the
   * midpoint between the two fingers.
   */
  noDrag?: boolean;
  /** Zoom speed multiplier. Default `0.1`. */
  percent?: number;
}

export class PinchZoomBehaviour extends Behaviour {
  private readonly noDrag: boolean;
  private readonly percent: number;

  constructor(opts: PinchZoomBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ['pinch'] });
    this.noDrag = opts.noDrag ?? false;
    this.percent = opts.percent ?? 0.1;
  }

  protected onRegister(_ctx: CanvasContext): void { /* wired on enable */ }

  protected onEnable(): void {
    this.ctx!.camera.viewport.pinch({ noDrag: this.noDrag, percent: this.percent });
  }

  protected onDisable(): void {
    this.ctx!.camera.viewport.plugins.remove('pinch');
  }
}
