import type { CanvasEventBus } from '../events/CanvasEventBus';
import type { ResolvedTheme, ThemeState } from './types';

/**
 * The default {@link ThemeState} — holds the current {@link ResolvedTheme} and
 * broadcasts `theme:change` on the bus whenever it is {@link set}. Renderer-free;
 * a single publisher (the domain `ThemeBehaviour`) resolves authored config →
 * `ResolvedTheme` and calls {@link set}. Theme-aware layers subscribe to
 * `theme:change` (or read {@link current}) and recolour.
 */
export class CanvasThemeState implements ThemeState {
  private _current: ResolvedTheme | null = null;

  constructor(private readonly bus: CanvasEventBus) {}

  current(): ResolvedTheme | null {
    return this._current;
  }

  set(theme: ResolvedTheme): void {
    this._current = theme;
    this.bus.emit('theme:change', theme, { kind: 'store', id: 'theme' });
  }
}
