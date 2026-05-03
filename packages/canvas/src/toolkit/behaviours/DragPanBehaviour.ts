/**
 * `DragPanBehaviour` — pointer-drag panning via the pixi-viewport `drag` plugin.
 *
 * An optional `modifier` key restricts the gesture so you can reserve plain
 * drag for other behaviours (e.g. lasso, rubber-band select):
 *
 *   - `'none'`  (default) — any left-button drag pans.
 *   - `'space'`            — Space + drag (Figma / Sketch style).
 *   - `'shift'`            — Shift + drag.
 *   - `'alt'`              — Alt/Option + drag.
 *
 * A decelerate plugin is added alongside by default, giving momentum after
 * the pointer lifts. Disable with `decelerate: false`.
 */

import { Behaviour, type BehaviourOptions } from '../../lifecycle/Behaviour';
import type { CanvasContext } from '../../context/CanvasContext';

export type DragModifier = 'none' | 'space' | 'shift' | 'alt';

export interface DragPanBehaviourOptions extends BehaviourOptions {
  /** Which modifier key must be held during drag. Default `'none'`. */
  modifier?: DragModifier;
  /** Allowed mouse buttons. Default `'left'`. Forwarded to pixi-viewport. */
  mouseButtons?: 'all' | 'left' | 'right' | 'middle';
  /** Add momentum deceleration after pointer lift. Default `true`. */
  decelerate?: boolean;
}

function modifierToKeys(modifier: DragModifier): string[] | null {
  switch (modifier) {
    case 'space': return ['Space'];
    case 'shift': return ['ShiftLeft', 'ShiftRight'];
    case 'alt':   return ['AltLeft', 'AltRight'];
    default:      return null;
  }
}

export class DragPanBehaviour extends Behaviour {
  private readonly modifier: DragModifier;
  private readonly mouseButtons: string;
  private readonly withDecelerate: boolean;

  constructor(opts: DragPanBehaviourOptions) {
    const modifier = opts.modifier ?? 'none';
    const gesture = modifier === 'none' ? 'drag' : `${modifier}+drag`;
    super({ ...opts, shortcuts: opts.shortcuts ?? [gesture] });
    this.modifier = modifier;
    this.mouseButtons = opts.mouseButtons ?? 'left';
    this.withDecelerate = opts.decelerate ?? true;
  }

  protected onRegister(_ctx: CanvasContext): void { /* wired on enable */ }

  protected onEnable(): void {
    const vp = this.ctx!.camera.viewport;
    vp.drag({ mouseButtons: this.mouseButtons, keyToPress: modifierToKeys(this.modifier) ?? undefined });
    if (this.withDecelerate) vp.decelerate();
  }

  protected onDisable(): void {
    const vp = this.ctx!.camera.viewport;
    vp.plugins.remove('drag');
    if (this.withDecelerate) vp.plugins.remove('decelerate');
  }
}
