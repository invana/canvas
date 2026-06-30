import { describe, expect, it } from 'vitest';

import { CanvasEventBus, CanvasThemeState, createCanvasStore, type ResolvedTheme } from '../../src/index';

const THEME: ResolvedTheme = {
  kind: 'dark',
  name: 'forest',
  palette: { surface: 0x0b0f0a, foreground: 0xe6f0e6 },
  categorical: [0x2e7d32, 0x66bb6a],
};

describe('CanvasThemeState — resolved-theme channel', () => {
  it('starts null, holds current, broadcasts theme:change on set', () => {
    const bus = new CanvasEventBus();
    const theme = new CanvasThemeState(bus);
    expect(theme.current()).toBeNull();

    const seen: ResolvedTheme[] = [];
    bus.on('theme:change', (t) => seen.push(t));

    theme.set(THEME);
    expect(theme.current()).toEqual(THEME);
    expect(seen).toEqual([THEME]);
  });

  it('the kernel exposes theme; the broadcast rides the tap with source store:theme', () => {
    const store = createCanvasStore();
    const tapped: { type: string; source: { kind: string; id: string } }[] = [];
    store.events.tap((e) => tapped.push({ type: e.type, source: e.source }));

    store.theme.set(THEME);

    expect(store.theme.current()).toEqual(THEME);
    expect(tapped).toEqual([{ type: 'theme:change', source: { kind: 'store', id: 'theme' } }]);
  });
});
