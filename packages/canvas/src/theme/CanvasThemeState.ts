import type { CanvasEventBus } from '../events/CanvasEventBus';
import type { ResolvedTheme, ThemeState } from './types';

/**
 * Default {@link ThemeState} implementation owned by {@link Canvas}. Holds the
 * last-published {@link ResolvedTheme} and re-broadcasts it on the canvas bus
 * as `'theme:change'` so theme-aware layers can recolour without polling.
 *
 * Constructed once in the `Canvas` constructor (the bus already exists there),
 * then handed to layers/behaviours via `ctx.theme`.
 */
export class CanvasThemeState implements ThemeState {
  private _current: ResolvedTheme | null = null;

  constructor(private readonly bus: CanvasEventBus) {}

  current(): ResolvedTheme | null {
    return this._current;
  }

  set(theme: ResolvedTheme): void {
    this._current = theme;
    this.bus.emit('theme:change', theme);
  }
}
